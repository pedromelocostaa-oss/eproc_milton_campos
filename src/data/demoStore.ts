import type { Processo, Intimacao, Movimentacao, Parte, Documento, Tarefa, Turma } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

// ---- In-memory cache backed by Supabase ----

const KEYS = {
  processos: 'processos',
  movimentacoes: 'movimentacoes',
  intimacoes: 'intimacoes',
  partes: 'partes',
  documentos: 'documentos',
  tarefas: 'tarefas',
  turmas: 'turmas',
};

const cache = new Map<string, any>();
let _initialized = false;

export async function initSupabaseStore(): Promise<void> {
  if (_initialized) return;
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
  return _initialized;
}

function get<T>(key: string, fallback: T): T {
  const cached = cache.get(key);
  return cached !== undefined ? (cached as T) : fallback;
}

// ---- Listeners for reactivity ----
type StoreListener = (key: string) => void;
const listeners = new Set<StoreListener>();

function notify(key: string) {
  listeners.forEach(l => {
    try { l(key); } catch { /* noop */ }
  });
}

export function subscribeDemoStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set<T>(key: string, value: T) {
  cache.set(key, value);
  notify(key);
}

// ---------- TURMAS ----------
let _professoresPorTurmaDb: Record<string, string[]> = {};

export function getDemoTurmas(): Turma[] {
  return get<Turma[]>(KEYS.turmas, []);
}

export const demoTurmas: Turma[] = new Proxy([] as Turma[], {
  get(_target, prop) {
    const real = getDemoTurmas();
    const value = (real as any)[prop];
    if (typeof value === 'function') return value.bind(real);
    if (prop === 'length') return real.length;
    if (prop === Symbol.iterator) return real[Symbol.iterator].bind(real);
    return value;
  },
});

export const professoresPorTurma: Record<string, string[]> = new Proxy({} as Record<string, string[]>, {
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

// ---------- ALUNOS ----------
export const demoAlunosLista: { id: string; cpf: string; nome: string; matricula: string; turma: string }[] = [];

// ---------- TAREFAS ----------
export function getDemoTarefas(): Tarefa[] {
  return get<Tarefa[]>(KEYS.tarefas, []);
}

export function saveDemoTarefa(tarefa: Tarefa) {
  const list = getDemoTarefas();
  const idx = list.findIndex(t => t.id === tarefa.id);
  if (idx >= 0) list[idx] = tarefa;
  else list.push(tarefa);
  set(KEYS.tarefas, list);
  supabase.from('tarefas').upsert(tarefa, { onConflict: 'id' }).then();
}

export function deleteDemoTarefa(id: string) {
  set(KEYS.tarefas, getDemoTarefas().filter(t => t.id !== id));
  supabase.from('tarefas').delete().eq('id', id).then();
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
export function getDemoProcessos(alunoId: string): Processo[] {
  return get<Processo[]>(KEYS.processos, []).filter(p => p.aluno_id === alunoId);
}

export function getAllDemoProcessos(): Processo[] {
  return get<Processo[]>(KEYS.processos, []);
}

export function saveDemoProcesso(processo: Processo) {
  const list = get<Processo[]>(KEYS.processos, []);
  const idx = list.findIndex(p => p.id === processo.id);
  if (idx >= 0) list[idx] = processo;
  else list.push(processo);
  set(KEYS.processos, list);
  supabase.from('processos').upsert(processo, { onConflict: 'id' }).then();
}

// ---------- PARTES ----------
export function getDemoPartes(processoId: string): Parte[] {
  return get<Parte[]>(KEYS.partes, []).filter(p => p.processo_id === processoId);
}

export function saveDemoPartes(partes: Parte[]) {
  const all = get<Parte[]>(KEYS.partes, []);
  partes.forEach(p => {
    const idx = all.findIndex(a => a.id === p.id);
    if (idx >= 0) all[idx] = p; else all.push(p);
  });
  set(KEYS.partes, all);
  partes.forEach(p => supabase.from('partes').upsert(p, { onConflict: 'id' }).then());
}

// ---------- MOVIMENTAÇÕES ----------
export function getDemoMovimentacoes(processoId: string): Movimentacao[] {
  return get<Movimentacao[]>(KEYS.movimentacoes, [])
    .filter(m => m.processo_id === processoId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function saveDemoMovimentacao(mov: Movimentacao) {
  const all = get<Movimentacao[]>(KEYS.movimentacoes, []);
  all.push(mov);
  set(KEYS.movimentacoes, all);
  supabase.from('movimentacoes').insert(mov).then();
}

// ---------- INTIMAÇÕES ----------
export function getDemoIntimacoesAluno(alunoId: string): Intimacao[] {
  return get<Intimacao[]>(KEYS.intimacoes, [])
    .filter(i => i.destinatario_id === alunoId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getDemoIntimacoesNaoLidas(alunoId: string): number {
  return getDemoIntimacoesAluno(alunoId).filter(i => !i.lida).length;
}

export function marcarIntimacoesLida(id: string) {
  const all = get<Intimacao[]>(KEYS.intimacoes, []);
  const idx = all.findIndex(i => i.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], lida: true, data_ciencia: new Date().toISOString() };
    set(KEYS.intimacoes, all);
    supabase.from('intimacoes').update({ lida: true, data_ciencia: new Date().toISOString() }).eq('id', id).then();
  }
}

export function saveDemoIntimacao(intim: Intimacao) {
  const all = get<Intimacao[]>(KEYS.intimacoes, []);
  all.push(intim);
  set(KEYS.intimacoes, all);
  supabase.from('intimacoes').insert(intim).then();
}

// ---------- DOCUMENTOS ----------
export function getDemoDocumentos(processoId: string): Documento[] {
  return get<Documento[]>(KEYS.documentos, []).filter(d => d.processo_id === processoId);
}

export function saveDemoDocumento(doc: Documento) {
  const all = get<Documento[]>(KEYS.documentos, []);
  all.push(doc);
  set(KEYS.documentos, all);
  supabase.from('documentos').insert(doc).then();
}

// ---------- REFRESH ----------
export async function refreshFromSupabase(): Promise<void> {
  _initialized = false;
  await initSupabaseStore();
  Object.values(KEYS).forEach(k => notify(k));
}
