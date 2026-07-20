// Acervo de processos disponibilizados pelos professores.
// O professor cadastra processos (com partes e documentos anexados) e eles ficam
// pesquisáveis, na Consulta Processual, apenas para os alunos das suas turmas.
//
// Metadados (processo, partes, documentos) ficam no localStorage.
// O conteúdo dos arquivos fica no IndexedDB (ver src/lib/fileStore.ts).

import { demoTurmas } from '@/data/demoStore';
import type { Turma } from '@/integrations/supabase/types';

const KEY = 'demo-acervo-processos-v1';
const CHANNEL_NAME = 'acervo-store-sync';

export interface AcervoParte {
  id: string;
  nome: string;
  polo: 'ativo' | 'passivo';
  tipoPessoa: 'fisica' | 'juridica';
  cpfCnpj: string; // apenas dígitos (pode ser vazio)
}

export interface AcervoDocumento {
  id: string;          // chave usada no IndexedDB
  nome: string;        // ex.: "Petição Inicial.pdf"
  tipoPeca: string;    // ex.: "Petição Inicial", "Procuração"
  mime: string;
  tamanho: number;     // bytes
}

export interface AcervoProcesso {
  id: string;
  professorId: string;
  numeroProcesso: string;
  classe: string;
  assunto: string;
  vara: string;
  valorCausa: number | null;
  segredoJustica: boolean;
  partes: AcervoParte[];
  documentos: AcervoDocumento[];
  createdAt: string;
}

// ---- persistência + sincronização entre abas ----
type Listener = () => void;
const listeners = new Set<Listener>();
const bc: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

function notify() {
  listeners.forEach(l => { try { l(); } catch { /* noop */ } });
}

if (bc) bc.onmessage = () => notify();
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => { if (e.key === KEY) notify(); });
}

export function subscribeAcervo(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function readAll(): AcervoProcesso[] {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as AcervoProcesso[]) : [];
  } catch { return []; }
}

function writeAll(list: AcervoProcesso[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  notify();
  if (bc) { try { bc.postMessage({ t: 'change' }); } catch { /* noop */ } }
}

// ---- CRUD ----

/** Todos os processos cadastrados por um professor. */
export function getAcervoDoProfessor(professorId: string): AcervoProcesso[] {
  return readAll()
    .filter(p => p.professorId === professorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveAcervoProcesso(proc: AcervoProcesso) {
  const list = readAll();
  const idx = list.findIndex(p => p.id === proc.id);
  if (idx >= 0) list[idx] = proc;
  else list.push(proc);
  writeAll(list);
}

export function deleteAcervoProcesso(id: string) {
  writeAll(readAll().filter(p => p.id !== id));
}

// ---- Visibilidade para o aluno ----

/** IDs dos professores das turmas em que o aluno está matriculado. */
export function getProfessoresDoAluno(turmaIds: (string | null | undefined)[]): string[] {
  const ids = turmaIds.filter((t): t is string => !!t);
  const profs = demoTurmas
    .filter((t: Turma) => ids.includes(t.id))
    .map(t => t.professor_id);
  return [...new Set(profs)];
}

/**
 * Processos visíveis para um aluno: os cadastrados por qualquer professor
 * das turmas em que o aluno está. Aceita uma ou várias turmas.
 */
export function getAcervoParaAluno(turmaIds: (string | null | undefined)[]): AcervoProcesso[] {
  const professores = new Set(getProfessoresDoAluno(turmaIds));
  if (professores.size === 0) return [];
  return readAll()
    .filter(p => professores.has(p.professorId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
