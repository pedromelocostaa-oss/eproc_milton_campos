import { supabase } from '@/integrations/supabase/client';
import type {
  EventoAutorPapel, EventoSubtipo,
  Documento, Movimentacao, Intimacao,
} from '@/integrations/supabase/types';

export interface EventoDoc {
  id: string;
  nome: string;
  storagePath: string;
  bucket: 'documentos' | 'evento-documentos';
  tamanhoBytes: number | null;
}

export interface EventoUnificado {
  id: string;
  processoId: string;
  numero: number;
  subtipo: EventoSubtipo;
  autorPapel: EventoAutorPapel;
  autorId: string | null;
  titulo: string;
  corpo: string | null;
  dataEvento: string;
  documentos: EventoDoc[];
  correcao: { nota: number | null; feedback: string | null; corrigidoPor: string | null; corrigidoEm: string } | null;
  legacy: boolean;
}

interface FetchArgs {
  processoId: string;
  dataDistribuicao: string;
}

/**
 * Busca eventos do processo. Se a tabela `eventos` já tem linhas, usa ela.
 * Caso contrário, sintetiza eventos virtuais a partir das tabelas antigas
 * (documentos + movimentacoes + intimacoes) para manter compatibilidade
 * com processos criados antes da Fase 1.
 */
export async function fetchEventosUnificados({ processoId, dataDistribuicao }: FetchArgs): Promise<EventoUnificado[]> {
  const [eventosRes, docsNovosRes, correcoesRes] = await Promise.all([
    supabase.from('eventos').select('*').eq('processo_id', processoId).order('numero', { ascending: true }),
    supabase.from('evento_documentos').select('*'),
    supabase.from('evento_correcoes').select('*'),
  ]);

  const eventos = (eventosRes.data ?? []) as Array<{
    id: string; processo_id: string; numero: number;
    subtipo: EventoSubtipo; autor_papel: EventoAutorPapel; autor_id: string | null;
    titulo: string; corpo: string | null; data_evento: string;
  }>;

  const docsNovos = (docsNovosRes.data ?? []) as Array<{
    id: string; evento_id: string; nome: string; storage_path: string; tamanho_bytes: number | null; ordem: number;
  }>;
  const correcoes = (correcoesRes.data ?? []) as Array<{
    evento_id: string; nota: number | null; feedback: string | null; corrigido_por: string | null; corrigido_em: string;
  }>;

  const novos: EventoUnificado[] = eventos.map(e => {
    const docs = docsNovos
      .filter(d => d.evento_id === e.id)
      .sort((a, b) => a.ordem - b.ordem)
      .map<EventoDoc>(d => ({
        id: d.id,
        nome: d.nome,
        storagePath: d.storage_path,
        bucket: 'evento-documentos',
        tamanhoBytes: d.tamanho_bytes,
      }));
    const c = correcoes.find(cc => cc.evento_id === e.id);
    return {
      id: e.id,
      processoId: e.processo_id,
      numero: e.numero,
      subtipo: e.subtipo,
      autorPapel: e.autor_papel,
      autorId: e.autor_id,
      titulo: e.titulo,
      corpo: e.corpo,
      dataEvento: e.data_evento,
      documentos: docs,
      correcao: c ? { nota: c.nota, feedback: c.feedback, corrigidoPor: c.corrigido_por, corrigidoEm: c.corrigido_em } : null,
      legacy: false,
    };
  });

  // SEMPRE inclui o histórico do modelo antigo (distribuição, petição inicial,
  // despachos gravados como intimações etc.) — se houver evento novo do tipo
  // peticao_inicial, remove o duplicado legacy pra não ficar redundante.
  const legacy = await sintetizarLegacy(processoId, dataDistribuicao);
  const temNovaPeticaoInicial = novos.some(e => e.subtipo === 'peticao_inicial');
  const legacyRelevante = temNovaPeticaoInicial
    ? legacy.filter(e => e.subtipo !== 'peticao_inicial')
    : legacy;

  const combinados = [...legacyRelevante, ...novos]
    .sort((a, b) => new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime());

  return combinados.map((e, i) => ({ ...e, numero: i + 1 }));
}

async function sintetizarLegacy(processoId: string, dataDistribuicao: string): Promise<EventoUnificado[]> {
  const [docsRes, movRes, intRes] = await Promise.all([
    supabase.from('documentos').select('*').eq('processo_id', processoId),
    supabase.from('movimentacoes').select('*').eq('processo_id', processoId).order('created_at', { ascending: true }),
    supabase.from('intimacoes').select('*').eq('processo_id', processoId).order('created_at', { ascending: true }),
  ]);

  const docs = (docsRes.data ?? []) as Documento[];
  const movs = (movRes.data ?? []) as Movimentacao[];
  const intims = (intRes.data ?? []) as Intimacao[];

  const legacy: Array<Omit<EventoUnificado, 'numero'> & { _order: number }> = [];

  legacy.push({
    id: `legacy-dist-${processoId}`,
    processoId,
    _order: new Date(dataDistribuicao).getTime(),
    subtipo: 'distribuicao',
    autorPapel: 'sistema',
    autorId: null,
    titulo: 'Distribuição do processo',
    corpo: 'Petição inicial distribuída automaticamente.',
    dataEvento: dataDistribuicao,
    documentos: [],
    correcao: null,
    legacy: true,
  });

  const peticao = docs.find(d => /peti[cç][ãa]o inicial/i.test(d.tipo));
  if (peticao) {
    const docsIniciais = docs.filter(d => !/despacho do professor/i.test(d.tipo));
    legacy.push({
      id: `legacy-peti-${processoId}`,
      processoId,
      _order: new Date(peticao.created_at).getTime() + 1,
      subtipo: 'peticao_inicial',
      autorPapel: 'aluno',
      autorId: peticao.aluno_id,
      titulo: 'Petição Inicial',
      corpo: null,
      dataEvento: peticao.created_at,
      documentos: docsIniciais.map<EventoDoc>(d => ({
        id: d.id, nome: d.nome_arquivo, storagePath: d.storage_path, bucket: 'documentos', tamanhoBytes: d.tamanho_bytes,
      })),
      correcao: null,
      legacy: true,
    });
  }

  const despachoDoc = docs.find(d => /despacho do professor/i.test(d.tipo));
  intims.forEach((i, idx) => {
    const isEncerramento = /encerrado|nota final/i.test(i.texto);
    const isEmenda = /solicita[cç][ãa]o de corre[cç][ãa]o/i.test(i.texto);
    const subtipo: EventoSubtipo = isEncerramento ? 'sentenca' : isEmenda ? 'decisao' : 'despacho';
    legacy.push({
      id: `legacy-int-${i.id}`,
      processoId,
      _order: new Date(i.created_at).getTime() + 100 + idx,
      subtipo,
      autorPapel: 'professor_juiz',
      autorId: i.remetente_id,
      titulo: subtipo === 'sentenca' ? 'Sentença' : subtipo === 'decisao' ? 'Decisão' : 'Despacho',
      corpo: i.texto,
      dataEvento: i.created_at,
      documentos: despachoDoc && idx === intims.length - 1 ? [{
        id: despachoDoc.id, nome: despachoDoc.nome_arquivo, storagePath: despachoDoc.storage_path,
        bucket: 'documentos', tamanhoBytes: despachoDoc.tamanho_bytes,
      }] : [],
      correcao: null,
      legacy: true,
    });
  });

  // Ignora movimentações que já foram cobertas por intimações (mesmo despacho/decisão/sentença)
  // Como CorrecaoPage grava mov + intim quase simultâneas, considera qualquer intimação
  // dentro de uma janela de 5s como cobertura.
  const timesIntim = intims.map(i => new Date(i.created_at).getTime());
  const jaCobertoPorIntim = (mtime: number) => timesIntim.some(t => Math.abs(t - mtime) <= 5000);

  const TIPOS_MOV_JA_COBERTOS = new Set(['despacho', 'solicitacao_emenda', 'encerramento', 'distribuicao']);

  movs.forEach((m, idx) => {
    const t = new Date(m.created_at).getTime();
    if (TIPOS_MOV_JA_COBERTOS.has(m.tipo) && jaCobertoPorIntim(t)) return;
    if (m.tipo === 'distribuicao') return;
    legacy.push({
      id: `legacy-mov-${m.id}`,
      processoId,
      _order: t + 50 + idx,
      subtipo: 'intimacao',
      autorPapel: 'sistema',
      autorId: m.autor_id,
      titulo: m.tipo,
      corpo: m.descricao,
      dataEvento: m.created_at,
      documentos: [],
      correcao: null,
      legacy: true,
    });
  });

  legacy.sort((a, b) => a._order - b._order);
  return legacy.map((e, i) => {
    const { _order: _, ...rest } = e;
    return { ...rest, numero: i + 1 };
  });
}
