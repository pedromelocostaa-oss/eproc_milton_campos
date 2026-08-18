// Cadastro de alunos por auto-registro + aprovação do professor.
// O aluno cria login (CPF) e senha, escolhe a matéria (turma) e envia a
// solicitação. Ela cai para o professor dono daquela turma, que aceita ou
// recusa. Persistido em localStorage (modo demo).

import { demoTurmas } from './demoStore';
import { formatCpf } from '@/lib/masks';
import type { Turma } from '@/integrations/supabase/types';

export type StatusCadastro = 'pendente' | 'aprovado' | 'recusado';

export interface AlunoCadastro {
  id: string;
  cpf: string;         // formatado (000.000.000-00)
  nome: string;
  senha: string;       // texto puro — apenas simulação educacional
  turmaId: string;
  status: StatusCadastro;
  createdAt: string;
}

const KEY = 'demo-cadastros-alunos-v1';
const CHANNEL = 'cadastro-store-sync';

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `cad-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

// ---- sincronização entre abas ----
type Listener = () => void;
const listeners = new Set<Listener>();
const bc: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL) : null;
function notify() { listeners.forEach(l => { try { l(); } catch { /* noop */ } }); }
if (bc) bc.onmessage = () => notify();
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => { if (e.key === KEY) notify(); });
}
export function subscribeCadastros(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function readAll(): AlunoCadastro[] {
  try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : []; }
  catch { return []; }
}
function writeAll(list: AlunoCadastro[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  notify();
  if (bc) { try { bc.postMessage({ t: 'change' }); } catch { /* noop */ } }
}

// ---- consultas ----
export function listarCadastros(): AlunoCadastro[] { return readAll(); }

export function cadastroPorCpf(cpf: string): AlunoCadastro | null {
  const f = formatCpf(cpf.replace(/\D/g, ''));
  return readAll().find(c => c.cpf === f) ?? null;
}

function professorDaTurma(turmaId: string): string | undefined {
  return demoTurmas.find(t => t.id === turmaId)?.professor_id;
}

export function turmasDoProfessor(professorId: string): Turma[] {
  return demoTurmas.filter(t => t.professor_id === professorId);
}

/** Solicitações pendentes das turmas de um professor. */
export function solicitacoesDoProfessor(professorId: string): AlunoCadastro[] {
  return readAll()
    .filter(c => c.status === 'pendente' && professorDaTurma(c.turmaId) === professorId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Alunos de um professor por status (ex.: aprovados). */
export function alunosDoProfessor(professorId: string, status?: StatusCadastro): AlunoCadastro[] {
  return readAll()
    .filter(c => professorDaTurma(c.turmaId) === professorId && (!status || c.status === status))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

// ---- ações ----
export function registrarAluno(dados: { cpf: string; nome: string; senha: string; turmaId: string }): { ok: boolean; erro?: string } {
  const cpf = formatCpf(dados.cpf.replace(/\D/g, ''));
  if (dados.cpf.replace(/\D/g, '').length !== 11) return { ok: false, erro: 'Informe um CPF válido (11 dígitos).' };
  if (!dados.nome.trim()) return { ok: false, erro: 'Informe seu nome completo.' };
  if (dados.senha.length < 4) return { ok: false, erro: 'A senha deve ter ao menos 4 caracteres.' };
  if (!dados.turmaId) return { ok: false, erro: 'Selecione a matéria que você está cursando.' };
  // CPF reservado dos usuários demo
  if (cpf === '121.572.976-69' || cpf === '000.000.000-01') return { ok: false, erro: 'Este CPF já está em uso.' };
  const existente = cadastroPorCpf(cpf);
  if (existente) {
    if (existente.status === 'recusado') {
      // permite reenviar após recusa
      salvar({ ...existente, nome: dados.nome.trim(), senha: dados.senha, turmaId: dados.turmaId, status: 'pendente', createdAt: new Date().toISOString() });
      return { ok: true };
    }
    return { ok: false, erro: 'Já existe um cadastro com este CPF.' };
  }
  salvar({ id: uid(), cpf, nome: dados.nome.trim(), senha: dados.senha, turmaId: dados.turmaId, status: 'pendente', createdAt: new Date().toISOString() });
  return { ok: true };
}

function salvar(c: AlunoCadastro) {
  const list = readAll();
  const idx = list.findIndex(x => x.id === c.id);
  if (idx >= 0) list[idx] = c; else list.push(c);
  writeAll(list);
}

export function aprovarCadastro(id: string) {
  const list = readAll();
  const c = list.find(x => x.id === id);
  if (c) { c.status = 'aprovado'; writeAll(list); }
}
export function recusarCadastro(id: string) {
  const list = readAll();
  const c = list.find(x => x.id === id);
  if (c) { c.status = 'recusado'; writeAll(list); }
}

/** Autentica um aluno auto-cadastrado (retorna qualquer status; o gate cuida do pendente/recusado). */
export function autenticarCadastro(cpf: string, senha: string): AlunoCadastro | null {
  const c = cadastroPorCpf(cpf);
  return c && c.senha === senha ? c : null;
}

export function statusCadastroPorId(id: string): StatusCadastro | null {
  return readAll().find(c => c.id === id)?.status ?? null;
}

// ---- seed: solicitações de exemplo para o professor testar ----
const SEED: AlunoCadastro[] = [
  { id: 'cad-seed-1', cpf: '101.202.303-40', nome: 'Rafael Augusto Teixeira', senha: 'aluno123', turmaId: 'demo-turma-1', status: 'pendente', createdAt: '2026-08-18T09:00:00Z' },
  { id: 'cad-seed-2', cpf: '202.303.404-51', nome: 'Juliana Ferreira Campos', senha: 'aluno123', turmaId: 'demo-turma-1', status: 'pendente', createdAt: '2026-08-18T10:30:00Z' },
  { id: 'cad-seed-3', cpf: '303.404.505-62', nome: 'Marcos Vinícius Andrade', senha: 'aluno123', turmaId: 'demo-turma-1', status: 'pendente', createdAt: '2026-08-18T08:15:00Z' },
];

export function garantirSeedCadastros(): void {
  try {
    if (localStorage.getItem(KEY) !== null) return;
    writeAll(SEED);
  } catch { /* noop */ }
}
