import type { Processo, Intimacao, Movimentacao, Parte, Documento, Tarefa, Turma } from '@/integrations/supabase/types';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';

// ---- Persistent store: localStorage (demo) or Supabase (production) ----

const KEYS = {
  processos: 'demo-processos-v2',
  movimentacoes: 'demo-movimentacoes-v2',
  intimacoes: 'demo-intimacoes-v2',
  partes: 'demo-partes-v2',
  documentos: 'demo-documentos-v2',
  tarefas: 'demo-tarefas-v2',
  turmas: 'demo-turmas',
};

// ---- In-memory cache (used when Supabase is active) ----
const cache = new Map<string, any>();
let _initialized = false;

export async function initSupabaseStore(): Promise<void> {
  if (DEMO_MODE || !supabase || _initialized) return;
  const [turmas, tarefas, processos, partes, docs, movs, intims] = await Promise.all([
    supabase.from('turmas').select('*'),
    supabase.from('tarefas').select('*'),
    supabase.from('processos').select('*'),
    supabase.from('partes').select('*'),
    supabase.from('documentos').select('*'),
    supabase.from('movimentacoes').select('*'),
    supabase.from('intimacoes').select('*'),
  ]);
  cache.set(KEYS.turmas, turmas.data || []);
  cache.set(KEYS.tarefas, tarefas.data || []);
  cache.set(KEYS.processos, processos.data || []);
  cache.set(KEYS.partes, partes.data || []);
  cache.set(KEYS.documentos, docs.data || []);
  cache.set(KEYS.movimentacoes, movs.data || []);
  cache.set(KEYS.intimacoes, intims.data || []);

  // Load professores_turmas into the mapping
  const { data: pt } = await supabase.from('professores_turmas').select('*');
  if (pt) {
    const map: Record<string, string[]> = {};
    pt.forEach((row: any) => {
      if (!map[row.turma_id]) map[row.turma_id] = [];
      map[row.turma_id].push(row.professor_id);
    });
    _professoresPorTurmaDb = map;
  }

  _initialized = true;
}

export function isStoreReady(): boolean {
  return DEMO_MODE || _initialized;
}

function get<T>(key: string, fallback: T): T {
  if (DEMO_MODE) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  const cached = cache.get(key);
  return cached !== undefined ? (cached as T) : fallback;
}

// ---- Cross-tab sync via BroadcastChannel (demo mode only) ----
const CHANNEL_NAME = 'demo-store-sync';
const bc: BroadcastChannel | null =
  DEMO_MODE && typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
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

if (DEMO_MODE && typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(KEYS).includes(e.key)) notify(e.key);
  });
}

export function subscribeDemoStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set<T>(key: string, value: T) {
  if (DEMO_MODE) {
    localStorage.setItem(key, JSON.stringify(value));
    notify(key);
    if (bc) {
      try { bc.postMessage({ key }); } catch { /* noop */ }
    }
    return;
  }
  cache.set(key, value);
  notify(key);
}

// ---- Supabase write helpers (fire-and-forget) ----
function sbUpsert(table: string, row: any) {
  if (DEMO_MODE || !supabase) return;
  supabase.from(table).upsert(row, { onConflict: 'id' }).then();
}

function sbInsert(table: string, row: any) {
  if (DEMO_MODE || !supabase) return;
  supabase.from(table).insert(row).then();
}

function sbDelete(table: string, id: string) {
  if (DEMO_MODE || !supabase) return;
  supabase.from(table).delete().eq('id', id).then();
}

// ---------- TURMAS ----------
const localDemoTurmas: Turma[] = [
  { id: 'demo-turma-1', nome: 'Processo judicial eletrônico aplicado', professor_id: 'demo-prof-1', semestre: '2025.2', ano: 2025, created_at: '2025-02-01T00:00:00Z' },
];

const localProfessoresPorTurma: Record<string, string[]> = {
  'demo-turma-1': ['demo-prof-1', 'demo-prof-2', 'demo-prof-3', 'demo-prof-4'],
};

let _professoresPorTurmaDb: Record<string, string[]> = {};

export function getDemoTurmas(): Turma[] {
  if (DEMO_MODE) return localDemoTurmas;
  return get<Turma[]>(KEYS.turmas, []);
}

// Keep backward compat — many files import these as a live-binding array
export const demoTurmas = DEMO_MODE ? localDemoTurmas : new Proxy([] as Turma[], {
  get(_target, prop) {
    const real = getDemoTurmas();
    const value = (real as any)[prop];
    if (typeof value === 'function') return value.bind(real);
    if (prop === 'length') return real.length;
    if (prop === Symbol.iterator) return real[Symbol.iterator].bind(real);
    return value;
  },
});

export const professoresPorTurma: Record<string, string[]> = DEMO_MODE
  ? localProfessoresPorTurma
  : new Proxy({} as Record<string, string[]>, {
      get(_target, prop: string) {
        return _professoresPorTurmaDb[prop] || [];
      },
      ownKeys() {
        return Object.keys(_professoresPorTurmaDb);
      },
      getOwnPropertyDescriptor(_target, prop: string) {
        if (prop in _professoresPorTurmaDb) {
          return { configurable: true, enumerable: true, value: _professoresPorTurmaDb[prop] };
        }
        return undefined;
      },
    });

// ---------- ALUNOS (lista para exibição na Área do Professor) ----------
export const demoAlunosLista: { id: string; cpf: string; nome: string; matricula: string; turma: string }[] = [];

// ---------- TAREFAS ----------
const defaultTarefas: Tarefa[] = [];

export function getDemoTarefas(): Tarefa[] {
  return get<Tarefa[]>(KEYS.tarefas, defaultTarefas);
}

export function saveDemoTarefa(tarefa: Tarefa) {
  const list = getDemoTarefas();
  const idx = list.findIndex(t => t.id === tarefa.id);
  if (idx >= 0) list[idx] = tarefa;
  else list.push(tarefa);
  set(KEYS.tarefas, list);
  sbUpsert('tarefas', tarefa);
}

export function deleteDemoTarefa(id: string) {
  set(KEYS.tarefas, getDemoTarefas().filter(t => t.id !== id));
  sbDelete('tarefas', id);
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
  sbUpsert('processos', processo);
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
  if (!DEMO_MODE && supabase) {
    partes.forEach(p => sbUpsert('partes', p));
  }
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
  sbInsert('movimentacoes', mov);
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
    if (!DEMO_MODE && supabase) {
      supabase.from('intimacoes').update({ lida: true, data_ciencia: new Date().toISOString() }).eq('id', id).then();
    }
  }
}

export function saveDemoIntimacao(intim: Intimacao) {
  const all = get<Intimacao[]>(KEYS.intimacoes, defaultIntimacoesAluno);
  all.push(intim);
  set(KEYS.intimacoes, all);
  sbInsert('intimacoes', intim);
}

// ---------- DOCUMENTOS ----------
export function getDemoDocumentos(processoId: string): Documento[] {
  return get<Documento[]>(KEYS.documentos, []).filter(d => d.processo_id === processoId);
}

export function saveDemoDocumento(doc: Documento) {
  const all = get<Documento[]>(KEYS.documentos, []);
  all.push(doc);
  set(KEYS.documentos, all);
  sbInsert('documentos', doc);
}

// ---------- REFRESH (recarregar do Supabase) ----------
export async function refreshFromSupabase(): Promise<void> {
  if (DEMO_MODE || !supabase) return;
  _initialized = false;
  await initSupabaseStore();
  Object.values(KEYS).forEach(k => notify(k));
}
