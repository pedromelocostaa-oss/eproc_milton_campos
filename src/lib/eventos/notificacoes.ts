import { supabase } from '@/integrations/supabase/client';
import type { EventoAutorPapel, EventoSubtipo } from '@/integrations/supabase/types';

/**
 * Sistema de notificações para o aluno — sem alterar o banco.
 *
 * Cada notificação corresponde a um evento gravado num processo onde o aluno
 * é dono ou já atuou. A "visualização" é persistida no localStorage, chave
 * eproc.notif.visto.<userId> contendo um array de IDs de eventos já vistos.
 *
 * Regra adicional: ao primeiro login, o sistema registra um timestamp de
 * baseline. Qualquer evento criado antes desse baseline é considerado visto
 * — evita que o aluno veja uma lista enorme de notificações no primeiro
 * acesso.
 */

export interface NotificacaoEvento {
  eventoId: string;
  processoId: string;
  numeroProcesso: string;
  subtipo: EventoSubtipo;
  autorPapel: EventoAutorPapel;
  autorId: string | null;
  autorNome: string | null;
  titulo: string;
  dataEvento: string;
}

const PREFIX_VISTOS = 'eproc.notif.visto.';
const PREFIX_BASELINE = 'eproc.notif.baseline.';

function keyVistos(userId: string): string { return `${PREFIX_VISTOS}${userId}`; }
function keyBaseline(userId: string): string { return `${PREFIX_BASELINE}${userId}`; }

export function getVistos(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(keyVistos(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}

export function marcarComoVisto(userId: string, eventoId: string): void {
  try {
    const vistos = getVistos(userId);
    if (vistos.has(eventoId)) return;
    vistos.add(eventoId);
    localStorage.setItem(keyVistos(userId), JSON.stringify(Array.from(vistos)));
  } catch { /* noop */ }
}

export function marcarVariosComoVistos(userId: string, eventoIds: string[]): void {
  try {
    const vistos = getVistos(userId);
    eventoIds.forEach(id => vistos.add(id));
    localStorage.setItem(keyVistos(userId), JSON.stringify(Array.from(vistos)));
  } catch { /* noop */ }
}

function getBaseline(userId: string): string {
  try {
    const existente = localStorage.getItem(keyBaseline(userId));
    if (existente) return existente;
    const agora = new Date().toISOString();
    localStorage.setItem(keyBaseline(userId), agora);
    return agora;
  } catch { return new Date(0).toISOString(); }
}

/**
 * Busca eventos NOVOS (criados depois do baseline, por outro autor,
 * e ainda não vistos) nos processos onde o aluno é dono ou já atuou.
 */
export async function buscarNotificacoes(userId: string): Promise<NotificacaoEvento[]> {
  const baseline = getBaseline(userId);
  const vistos = getVistos(userId);

  // 1) processos onde o aluno é dono
  const [proprios, atuacao] = await Promise.all([
    supabase.from('processos').select('id, numero_processo').eq('aluno_id', userId),
    supabase.from('eventos').select('processo_id').eq('autor_id', userId),
  ]);

  const idsDonos = (proprios.data ?? []).map(p => p.id as string);
  const idsAtuacao = Array.from(new Set((atuacao.data ?? []).map(e => e.processo_id as string)));
  const todosIds = Array.from(new Set([...idsDonos, ...idsAtuacao]));
  if (todosIds.length === 0) return [];

  // 2) metadados dos processos (número)
  const numProcs = new Map<string, string>();
  (proprios.data ?? []).forEach(p => numProcs.set(p.id as string, p.numero_processo as string));
  const faltamNum = todosIds.filter(id => !numProcs.has(id));
  if (faltamNum.length > 0) {
    const extras = await supabase.from('processos').select('id, numero_processo').in('id', faltamNum);
    (extras.data ?? []).forEach(p => numProcs.set(p.id as string, p.numero_processo as string));
  }

  // 3) eventos novos nesses processos, não meus
  const eventosRes = await supabase
    .from('eventos')
    .select('id, processo_id, subtipo, autor_papel, autor_id, titulo, data_evento')
    .in('processo_id', todosIds)
    .gt('data_evento', baseline)
    .order('data_evento', { ascending: false })
    .limit(50);

  const linhas = (eventosRes.data ?? []) as Array<{
    id: string; processo_id: string; subtipo: EventoSubtipo;
    autor_papel: EventoAutorPapel; autor_id: string | null;
    titulo: string; data_evento: string;
  }>;

  const naoMeus = linhas.filter(e => e.autor_id !== userId && !vistos.has(e.id));
  if (naoMeus.length === 0) return [];

  // 4) nomes dos autores (batch)
  const autorIds = Array.from(new Set(naoMeus.map(e => e.autor_id).filter(Boolean) as string[]));
  const nomesMap = new Map<string, string>();
  if (autorIds.length > 0) {
    const [cad, prof] = await Promise.all([
      supabase.from('cadastros_alunos').select('id, nome').in('id', autorIds),
      supabase.from('profiles').select('id, nome_completo').in('id', autorIds),
    ]);
    (cad.data ?? []).forEach(r => {
      if (r.id && r.nome) nomesMap.set(r.id as string, r.nome as string);
    });
    (prof.data ?? []).forEach(r => {
      if (r.id && r.nome_completo && !nomesMap.has(r.id as string)) {
        nomesMap.set(r.id as string, r.nome_completo as string);
      }
    });
  }

  return naoMeus.map<NotificacaoEvento>(e => ({
    eventoId: e.id,
    processoId: e.processo_id,
    numeroProcesso: numProcs.get(e.processo_id) ?? e.processo_id,
    subtipo: e.subtipo,
    autorPapel: e.autor_papel,
    autorId: e.autor_id,
    autorNome: e.autor_id ? nomesMap.get(e.autor_id) ?? null : null,
    titulo: e.titulo,
    dataEvento: e.data_evento,
  }));
}
