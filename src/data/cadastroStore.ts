// Cadastro de alunos por auto-registro + aprovação do professor.
// Persistido no Supabase (tabela cadastros_alunos).

import { getDemoTurmas, professoresPorTurma } from './demoStore';
import { supabase } from '@/integrations/supabase/client';
import { formatCpf } from '@/lib/masks';
import type { Turma } from '@/integrations/supabase/types';

export type StatusCadastro = 'pendente' | 'aprovado' | 'recusado';

export interface AlunoCadastro {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  endereco: string;
  telefone: string;
  senha: string;
  turmaId: string;
  status: StatusCadastro;
  createdAt: string;
}

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `cad-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

// ---- In-memory cache backed by Supabase ----
let _cadastrosCache: AlunoCadastro[] = [];
let _cacheInitialized = false;

export async function initCadastroStore(): Promise<void> {
  if (_cacheInitialized) return;
  const { data } = await supabase.from('cadastros_alunos').select('*');
  _cadastrosCache = (data || []).map(dbToLocal);
  _cacheInitialized = true;
}

function dbToLocal(row: any): AlunoCadastro {
  return {
    id: row.id,
    cpf: row.cpf,
    nome: row.nome,
    email: row.email || '',
    endereco: row.endereco || '',
    telefone: row.telefone || '',
    senha: row.senha,
    turmaId: row.turma_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

function localToDb(c: AlunoCadastro): any {
  return {
    id: c.id,
    cpf: c.cpf,
    nome: c.nome,
    email: c.email,
    endereco: c.endereco,
    telefone: c.telefone,
    senha: c.senha,
    turma_id: c.turmaId,
    status: c.status,
    created_at: c.createdAt,
  };
}

// ---- Listeners for reactivity ----
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach(l => { try { l(); } catch { /* noop */ } }); }

export function subscribeCadastros(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function readAll(): AlunoCadastro[] {
  return _cadastrosCache;
}

function writeAll(list: AlunoCadastro[]) {
  _cadastrosCache = list;
  notify();
}

// ---- consultas ----
export function listarCadastros(): AlunoCadastro[] { return readAll(); }

export function cadastroPorCpf(cpf: string): AlunoCadastro | null {
  const f = formatCpf(cpf.replace(/\D/g, ''));
  return readAll().find(c => c.cpf === f) ?? null;
}

function professoresDaTurma(turmaId: string): string[] {
  const extra = professoresPorTurma[turmaId];
  if (extra && extra.length > 0) return extra;
  const turmas = getDemoTurmas();
  const turma = turmas.find(t => t.id === turmaId);
  return turma ? [turma.professor_id] : [];
}

export function turmasDoProfessor(professorId: string): Turma[] {
  const turmas = getDemoTurmas();
  return turmas.filter(t => professoresPorTurma[t.id]?.includes(professorId) || t.professor_id === professorId);
}

export function solicitacoesDoProfessor(professorId: string): AlunoCadastro[] {
  return readAll()
    .filter(c => c.status === 'pendente' && professoresDaTurma(c.turmaId).includes(professorId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function alunosDoProfessor(professorId: string, status?: StatusCadastro): AlunoCadastro[] {
  return readAll()
    .filter(c => professoresDaTurma(c.turmaId).includes(professorId) && (!status || c.status === status))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

const PROFESSOR_CPFS = ['000.000.000-01', '150.665.876-83', '097.446.776-60', '149.534.096-12'];

export function isProfessorCpf(cpf: string): boolean {
  const f = formatCpf(cpf.replace(/\D/g, ''));
  return PROFESSOR_CPFS.includes(f);
}

// ---- ações ----
export function registrarAluno(dados: { cpf: string; nome: string; email: string; endereco: string; telefone: string; senha: string; turmaId: string }): { ok: boolean; erro?: string; autoAprovado?: boolean } {
  const cpf = formatCpf(dados.cpf.replace(/\D/g, ''));
  if (dados.cpf.replace(/\D/g, '').length !== 11) return { ok: false, erro: 'Informe um CPF válido (11 dígitos).' };
  if (!dados.nome.trim()) return { ok: false, erro: 'Informe seu nome completo.' };
  if (!dados.email.trim()) return { ok: false, erro: 'Informe seu e-mail.' };
  if (dados.senha.length < 4) return { ok: false, erro: 'A senha deve ter ao menos 4 caracteres.' };
  if (!dados.turmaId) return { ok: false, erro: 'Selecione a matéria que você está cursando.' };
  const isProf = PROFESSOR_CPFS.includes(cpf);
  const existente = cadastroPorCpf(cpf);
  if (existente) {
    if (existente.status === 'recusado') {
      const status: StatusCadastro = isProf ? 'aprovado' : 'pendente';
      const updated = { ...existente, nome: dados.nome.trim(), email: dados.email.trim(), endereco: dados.endereco.trim(), telefone: dados.telefone.trim(), senha: dados.senha, turmaId: dados.turmaId, status, createdAt: new Date().toISOString() };
      salvar(updated);
      return { ok: true, autoAprovado: isProf };
    }
    return { ok: false, erro: 'Já existe um cadastro com este CPF.' };
  }
  const status: StatusCadastro = isProf ? 'aprovado' : 'pendente';
  const novo: AlunoCadastro = { id: uid(), cpf, nome: dados.nome.trim(), email: dados.email.trim(), endereco: dados.endereco.trim(), telefone: dados.telefone.trim(), senha: dados.senha, turmaId: dados.turmaId, status, createdAt: new Date().toISOString() };
  salvar(novo);
  return { ok: true, autoAprovado: isProf };
}

function salvar(c: AlunoCadastro) {
  const list = readAll().slice();
  const idx = list.findIndex(x => x.id === c.id);
  if (idx >= 0) list[idx] = c; else list.push(c);
  writeAll(list);
  supabase.from('cadastros_alunos').upsert(localToDb(c), { onConflict: 'id' }).then();
}

export function aprovarCadastro(id: string) {
  const list = readAll().slice();
  const c = list.find(x => x.id === id);
  if (c) {
    c.status = 'aprovado';
    writeAll(list);
    supabase.from('cadastros_alunos').update({ status: 'aprovado' }).eq('id', id).then();
  }
}

export function recusarCadastro(id: string) {
  const list = readAll().slice();
  const c = list.find(x => x.id === id);
  if (c) {
    c.status = 'recusado';
    writeAll(list);
    supabase.from('cadastros_alunos').update({ status: 'recusado' }).eq('id', id).then();
  }
}

export function excluirCadastros(ids: string[]) {
  const idSet = new Set(ids);
  writeAll(readAll().filter(c => !idSet.has(c.id)));
  ids.forEach(id => supabase.from('cadastros_alunos').delete().eq('id', id).then());
}

export function autenticarCadastro(cpf: string, senha: string): AlunoCadastro | null {
  const c = cadastroPorCpf(cpf);
  return c && c.senha === senha ? c : null;
}

export function statusCadastroPorId(id: string): StatusCadastro | null {
  return readAll().find(c => c.id === id)?.status ?? null;
}

export function garantirSeedCadastros(): void {
  // noop
}

export async function refreshCadastrosFromSupabase(): Promise<void> {
  _cacheInitialized = false;
  await initCadastroStore();
  notify();
}
