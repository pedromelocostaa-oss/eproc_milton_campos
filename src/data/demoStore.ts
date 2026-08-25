import type { Processo, Intimacao, Movimentacao, Parte, Documento, Tarefa, Turma } from '@/integrations/supabase/types';

// ---- Persistent demo store using localStorage ----

// v2 keys — força início limpo (dados antigos das chaves sem sufixo são ignorados)
const KEYS = {
  processos: 'demo-processos-v2',
  movimentacoes: 'demo-movimentacoes-v2',
  intimacoes: 'demo-intimacoes-v2',
  partes: 'demo-partes-v2',
  documentos: 'demo-documentos-v2',
  tarefas: 'demo-tarefas-v2',
  turmas: 'demo-turmas',
};

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

// ---- Cross-tab sync via BroadcastChannel ----
const CHANNEL_NAME = 'demo-store-sync';
const bc: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

type StoreListener = (key: string) => void;
const listeners = new Set<StoreListener>();

function notify(key: string) {
  listeners.forEach(l => {
    try { l(key); } catch { /* noop */ }
  });
}

if (bc) {
  bc.onmessage = (ev) => {
    const key = ev?.data?.key;
    if (typeof key === 'string') notify(key);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(KEYS).includes(e.key)) notify(e.key);
  });
}

export function subscribeDemoStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  // Notify listeners in this tab immediately
  notify(key);
  // Notify other tabs instantly
  if (bc) {
    try { bc.postMessage({ key }); } catch { /* noop */ }
  }
}

// ---------- TURMAS ----------
export const demoTurmas: Turma[] = [
  { id: 'demo-turma-1', nome: 'Processo judicial eletrônico aplicado', professor_id: 'demo-prof-1', semestre: '2025.2', ano: 2025, created_at: '2025-02-01T00:00:00Z' },
];

export const professoresPorTurma: Record<string, string[]> = {
  'demo-turma-1': ['demo-prof-1', 'demo-prof-2', 'demo-prof-3', 'demo-prof-4'],
};

// ---------- ALUNOS (lista para exibição na Área do Professor) ----------
// Alunos reais se cadastram via auto-registro e são aprovados pelo professor.
export const demoAlunosLista: { id: string; cpf: string; nome: string; matricula: string; turma: string }[] = [];

// ---------- TAREFAS ----------
const PETICAO_REFERENCIA_DEMO = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL DA _ª VARA FEDERAL DE BELO HORIZONTE — MG

ROBERTO FERREIRA DOS SANTOS, brasileiro, casado, empresário, portador do CPF nº 987.654.321-00 e RG nº 7.654.321 SSP/MG, residente e domiciliado na Rua dos Andradas, nº 250, Bairro Centro, Belo Horizonte/MG, CEP 30.120-010, por seu advogado que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, propor a presente

AÇÃO DE INDENIZAÇÃO POR DANOS MORAIS E MATERIAIS

em face de TRANSPORTADORA RÁPIDO SUL LTDA., pessoa jurídica de direito privado, inscrita no CNPJ nº 12.345.678/0001-99, com sede na Avenida do Contorno, nº 1.500, Bairro Funcionários, Belo Horizonte/MG, CEP 30.110-090, pelos fatos e fundamentos a seguir expostos:

I — DOS FATOS

No dia 15 de março de 2025, o autor conduzia seu veículo (Ford Ka, 2022, placas ABC-1234) pela Avenida do Contorno, sentido Centro-Bairro, quando foi violentamente abalroado por caminhão da empresa requerida, conduzido por seu preposto em evidente excesso de velocidade e sem respeitar a preferencial.

O acidente resultou em: (a) danos materiais ao veículo estimados em R$ 12.500,00 (doze mil e quinhentos reais), conforme laudo de avaliação em anexo; (b) lesões corporais que exigiram 15 dias de afastamento do trabalho, com perda de rendimentos no valor de R$ 4.800,00; e (c) graves danos morais decorrentes do abalo psicológico, constrangimento e sofrimento vivenciados pelo autor e sua família.

II — DO DIREITO

A responsabilidade civil da requerida decorre do art. 932, III, c/c art. 933 do Código Civil (responsabilidade objetiva por ato de preposto), bem como dos princípios gerais da responsabilidade aquiliana (art. 186 e 927 do CC). O dano moral é presumido (in re ipsa) em situações de acidente com lesão corporal, conforme consolidada jurisprudência do Superior Tribunal de Justiça.

III — DOS PEDIDOS

Ante o exposto, requer a Vossa Excelência:
a) A condenação da requerida ao pagamento de R$ 12.500,00 a título de danos materiais (reparação do veículo);
b) A condenação ao pagamento de R$ 15.000,00 a título de danos morais;
c) O pagamento de lucros cessantes no valor de R$ 4.800,00;
d) A concessão de tutela de urgência para bloqueio de ativos da requerida, dado o periculum in mora.

Valor da causa: R$ 32.300,00 (trinta e dois mil e trezentos reais).

Belo Horizonte, 01 de abril de 2025.

Dr(a). Advogado(a) Simulado(a)
OAB/MG nº Sim.00001`;

// Padrão vazio — o professor cria as tarefas via interface
const defaultTarefas: Tarefa[] = [];

const _unusedTarefas: Tarefa[] = [
  {
    id: 'demo-tarefa-1',
    titulo: 'Petição Inicial — Responsabilidade Civil',
    descricao: `**Objetivo:** Elabore e protocole uma petição inicial de ação de responsabilidade civil por danos morais e materiais.\n\n**Enunciado:** Seu cliente, João da Silva, foi vítima de um acidente de trânsito causado por negligência do réu Carlos Pereira. João sofreu danos materiais (R$ 8.000,00 no veículo) e danos morais. Redija e protocole a petição inicial no e-Proc.\n\n**Documentos obrigatórios:** Petição inicial, procuração, boletim de ocorrência, orçamento de reparo.`,
    turma_id: 'demo-turma-1',
    professor_id: 'demo-prof-1',
    data_inicio: '2025-03-01T00:00:00Z',
    prazo: '2025-03-20T23:59:59Z',
    documentos_obrigatorios: ['Petição Inicial', 'Procuração', 'Documento de Identidade'],
    ativa: true,
    created_at: '2025-02-28T00:00:00Z',
    tipo_atividade: 'peticao_inicial',
    peticao_referencia: null,
    peticao_referencia_arquivo_nome: null,
  },
  {
    id: 'demo-tarefa-2',
    titulo: 'Mandado de Segurança — Direito Administrativo',
    descricao: `**Objetivo:** Elabore e protocole um mandado de segurança.\n\n**Enunciado:** Sua cliente Maria Costa foi preterida em concurso público por ato ilegal da autoridade coatora. Protocole o mandado de segurança com pedido liminar.`,
    turma_id: 'demo-turma-1',
    professor_id: 'demo-prof-1',
    data_inicio: '2025-04-01T00:00:00Z',
    prazo: '2025-04-30T23:59:59Z',
    documentos_obrigatorios: ['Petição Inicial', 'Procuração', 'Comprovante de Residência'],
    ativa: true,
    created_at: '2025-03-25T00:00:00Z',
    tipo_atividade: 'peticao_inicial',
    peticao_referencia: null,
    peticao_referencia_arquivo_nome: null,
  },
  {
    id: 'demo-tarefa-3',
    titulo: 'Defesa — Responsabilidade Civil (Transportadora)',
    descricao: `**Objetivo:** Você foi citado(a) em ação de responsabilidade civil. Elabore e protocole a contestação em defesa da TRANSPORTADORA RÁPIDO SUL LTDA.\n\n**Enunciado:** A transportadora foi acionada por danos decorrentes de acidente de trânsito envolvendo seu preposto. Redija contestação arguindo excludentes de responsabilidade, culpa concorrente e impugnando os valores pleiteados.\n\n**Documentos obrigatórios:** Contestação, procuração, documentos do veículo.`,
    turma_id: 'demo-turma-1',
    professor_id: 'demo-prof-1',
    data_inicio: '2025-04-15T00:00:00Z',
    prazo: '2025-05-30T23:59:59Z',
    documentos_obrigatorios: ['Contestação', 'Procuração'],
    ativa: true,
    created_at: '2025-04-14T00:00:00Z',
    tipo_atividade: 'defesa',
    peticao_referencia: PETICAO_REFERENCIA_DEMO,
    peticao_referencia_arquivo_nome: 'Peticao_Inicial_Responsabilidade_Civil.pdf',
  },
];

export function getDemoTarefas(): Tarefa[] {
  return get<Tarefa[]>(KEYS.tarefas, defaultTarefas);
}

export function saveDemoTarefa(tarefa: Tarefa) {
  const list = getDemoTarefas();
  const idx = list.findIndex(t => t.id === tarefa.id);
  if (idx >= 0) list[idx] = tarefa;
  else list.push(tarefa);
  set(KEYS.tarefas, list);
}

export function deleteDemoTarefa(id: string) {
  set(KEYS.tarefas, getDemoTarefas().filter(t => t.id !== id));
}

export function getDemoTarefasDefesa(turmaId: string): Tarefa[] {
  return getDemoTarefas().filter(t =>
    t.turma_id === turmaId &&
    t.ativa &&
    t.tipo_atividade === 'defesa' &&
    t.peticao_referencia != null
  );
}

// ---------- PROCESSOS ----------
const defaultProcessos: Processo[] = [];

export function getDemoProcessos(alunoId: string): Processo[] {
  return get<Processo[]>(KEYS.processos, defaultProcessos).filter(p => p.aluno_id === alunoId);
}

export function getAllDemoProcessos(): Processo[] {
  return get<Processo[]>(KEYS.processos, defaultProcessos);
}

export function saveDemoProcesso(processo: Processo) {
  const list = get<Processo[]>(KEYS.processos, defaultProcessos);
  const idx = list.findIndex(p => p.id === processo.id);
  if (idx >= 0) list[idx] = processo;
  else list.push(processo);
  set(KEYS.processos, list);
}

// ---------- PARTES ----------
const defaultPartes: Parte[] = [];

export function getDemoPartes(processoId: string): Parte[] {
  return get<Parte[]>(KEYS.partes, defaultPartes).filter(p => p.processo_id === processoId);
}

export function saveDemoPartes(partes: Parte[]) {
  const all = get<Parte[]>(KEYS.partes, defaultPartes);
  partes.forEach(p => {
    const idx = all.findIndex(a => a.id === p.id);
    if (idx >= 0) all[idx] = p; else all.push(p);
  });
  set(KEYS.partes, all);
}

// ---------- MOVIMENTAÇÕES ----------
const defaultMovimentacoes: Movimentacao[] = [];

export function getDemoMovimentacoes(processoId: string): Movimentacao[] {
  return get<Movimentacao[]>(KEYS.movimentacoes, defaultMovimentacoes)
    .filter(m => m.processo_id === processoId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function saveDemoMovimentacao(mov: Movimentacao) {
  const all = get<Movimentacao[]>(KEYS.movimentacoes, defaultMovimentacoes);
  all.push(mov);
  set(KEYS.movimentacoes, all);
}

// ---------- INTIMAÇÕES ----------
const defaultIntimacoesAluno: Intimacao[] = [];

export function getDemoIntimacoesAluno(alunoId: string): Intimacao[] {
  return get<Intimacao[]>(KEYS.intimacoes, defaultIntimacoesAluno)
    .filter(i => i.destinatario_id === alunoId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getDemoIntimacoesNaoLidas(alunoId: string): number {
  return getDemoIntimacoesAluno(alunoId).filter(i => !i.lida).length;
}

export function marcarIntimacoesLida(id: string) {
  const all = get<Intimacao[]>(KEYS.intimacoes, defaultIntimacoesAluno);
  const idx = all.findIndex(i => i.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lida: true, data_ciencia: new Date().toISOString() };
    set(KEYS.intimacoes, all);
  }
}

export function saveDemoIntimacao(intim: Intimacao) {
  const all = get<Intimacao[]>(KEYS.intimacoes, defaultIntimacoesAluno);
  all.push(intim);
  set(KEYS.intimacoes, all);
}

// ---------- DOCUMENTOS ----------
export function getDemoDocumentos(processoId: string): Documento[] {
  return get<Documento[]>(KEYS.documentos, []).filter(d => d.processo_id === processoId);
}

export function saveDemoDocumento(doc: Documento) {
  const all = get<Documento[]>(KEYS.documentos, []);
  all.push(doc);
  set(KEYS.documentos, all);
}
