import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/integrations/supabase/types';
import { formatCpf } from '@/lib/masks';
import { autenticarCadastro, cadastroPorCpf, initCadastroStore, type StatusCadastro } from '@/data/cadastroStore';
import { getDemoTurmas, initSupabaseStore } from '@/data/demoStore';

interface AuthUser extends Profile {
  email?: string;
  name?: string;
  curso?: string;
  instituicao?: string;
  statusCadastro?: StatusCadastro;
  turmaNome?: string;
  perfilAtivo?: 'aluno' | 'professor';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  demoMode: boolean;
  login: (cpf: string, senha: string) => Promise<{ error: string | null; user?: AuthUser | null }>;
  loginComoAluno: (cpf: string, senha: string) => Promise<{ error: string | null; user?: AuthUser | null }>;
  trocarPerfil: (perfil: 'aluno' | 'professor') => void;
  logout: () => Promise<void>;
  trocarSenha: (novaSenha: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
  atualizarUsuario: (patch: Partial<AuthUser>) => void;
}

function usuarioDoCadastro(cad: { id: string; cpf: string; nome: string; turmaId: string; status: StatusCadastro; createdAt: string }): AuthUser {
  const turmas = getDemoTurmas();
  const turma = turmas.find(t => t.id === cad.turmaId);
  return {
    id: cad.id,
    cpf: cad.cpf,
    nome_completo: cad.nome,
    matricula: null,
    turma_id: cad.turmaId,
    perfil: 'aluno',
    oab_simulado: null,
    primeiro_acesso: false,
    ativo: cad.status === 'aprovado',
    created_at: cad.createdAt,
    statusCadastro: cad.status,
    turmaNome: turma?.nome,
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_PASSWORDS: Record<string, string> = {
  '150.665.876-83': 'Milton2026',
  '097.446.776-60': 'Prof@Pedro2026',
  '149.534.096-12': 'Milton2026',
};
const DEFAULT_PASSWORD = 'Milton@2025';

async function getUser(cpf: string, senha: string): Promise<AuthUser | null> {
  const normalized = formatCpf(cpf.replace(/\D/g, ''));

  // Check profiles table for professors
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('cpf', normalized)
    .single();

  if (profile && profile.perfil === 'professor') {
    const specificPwd = DEMO_PASSWORDS[normalized];
    if (specificPwd ? senha === specificPwd : (senha === DEFAULT_PASSWORD || senha === 'demo123')) {
      return profile as AuthUser;
    }
    return null;
  }

  // Check cadastros for students
  const cad = autenticarCadastro(normalized, senha);
  if (cad) return usuarioDoCadastro(cad);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await Promise.all([initSupabaseStore(), initCadastroStore()]);

      const stored = localStorage.getItem('eproc-demo-user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
      setLoading(false);
    }
    init();
  }, []);

  const login = async (cpf: string, senha: string): Promise<{ error: string | null; user?: AuthUser | null }> => {
    const authUser = await getUser(cpf, senha);
    if (!authUser) return { error: 'CPF ou senha inválidos.', user: null };
    setUser(authUser);
    localStorage.setItem('eproc-demo-user', JSON.stringify(authUser));
    return { error: null, user: authUser };
  };

  const loginComoAluno = async (cpf: string, senha: string): Promise<{ error: string | null; user?: AuthUser | null }> => {
    const normalized = formatCpf(cpf.replace(/\D/g, ''));
    const cad = autenticarCadastro(normalized, senha);
    if (cad) {
      const studentUser = usuarioDoCadastro(cad);
      studentUser.perfilAtivo = 'aluno';
      setUser(studentUser);
      localStorage.setItem('eproc-demo-user', JSON.stringify(studentUser));
      return { error: null, user: studentUser };
    }
    const authUser = await getUser(cpf, senha);
    if (authUser && (authUser.perfil === 'professor' || authUser.perfil === 'admin')) {
      const alunoUser = { ...authUser, perfilAtivo: 'aluno' as const };
      setUser(alunoUser);
      localStorage.setItem('eproc-demo-user', JSON.stringify(alunoUser));
      return { error: null, user: alunoUser };
    }
    if (authUser) {
      setUser(authUser);
      localStorage.setItem('eproc-demo-user', JSON.stringify(authUser));
      return { error: null, user: authUser };
    }
    return { error: 'CPF ou senha inválidos.', user: null };
  };

  const trocarPerfil = (perfil: 'aluno' | 'professor') => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, perfilAtivo: perfil };
      localStorage.setItem('eproc-demo-user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    localStorage.removeItem('eproc-demo-user');
    setUser(null);
  };

  const trocarSenha = async (novaSenha: string): Promise<{ error: string | null }> => {
    if (user) {
      const updated = { ...user, primeiro_acesso: false };
      setUser(updated);
      localStorage.setItem('eproc-demo-user', JSON.stringify(updated));
    }
    return { error: null };
  };

  const refreshUser = async () => {
    // no-op
  };

  const atualizarUsuario = (patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('eproc-demo-user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, demoMode: false, login, loginComoAluno, trocarPerfil, logout, trocarSenha, refreshUser, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
