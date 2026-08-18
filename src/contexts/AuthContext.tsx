import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import type { Profile } from '@/integrations/supabase/types';
import { formatCpf, cpfToEmail } from '@/lib/masks';
import { autenticarCadastro, cadastroPorCpf, type StatusCadastro } from '@/data/cadastroStore';
import { demoTurmas } from '@/data/demoStore';

interface AuthUser extends Profile {
  email?: string;
  name?: string;
  curso?: string;
  instituicao?: string;
  statusCadastro?: StatusCadastro; // para alunos auto-cadastrados
  turmaNome?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  demoMode: boolean;
  login: (cpf: string, senha: string) => Promise<{ error: string | null; user?: AuthUser | null }>;
  logout: () => Promise<void>;
  trocarSenha: (novaSenha: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
  atualizarUsuario: (patch: Partial<AuthUser>) => void;
}

/** Monta um AuthUser a partir de um cadastro de aluno auto-registrado. */
function usuarioDoCadastro(cad: { id: string; cpf: string; nome: string; turmaId: string; status: StatusCadastro; createdAt: string }): AuthUser {
  const turma = demoTurmas.find(t => t.id === cad.turmaId);
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

const DEMO_USERS: Record<string, AuthUser> = {
  '121.572.976-69': {
    id: 'demo-aluno-1',
    cpf: '121.572.976-69',
    nome_completo: 'Luiz Cordeiro',
    matricula: '2023.1.001234',
    turma_id: 'demo-turma-1',
    perfil: 'aluno',
    oab_simulado: 'MG 192.731',
    primeiro_acesso: false,
    ativo: true,
    created_at: new Date().toISOString(),
    email: 'luiz.cordeiro@miltoncampos.edu.br',
  },
  '000.000.000-01': {
    id: 'demo-prof-1',
    cpf: '000.000.000-01',
    nome_completo: 'Profa. Maria Helena Souza',
    matricula: null,
    turma_id: null,
    perfil: 'professor',
    oab_simulado: null,
    primeiro_acesso: false,
    ativo: true,
    created_at: new Date().toISOString(),
    email: 'maria.helena@miltoncampos.edu.br',
  },
  '150.665.876-83': {
    id: 'demo-prof-2',
    cpf: '150.665.876-83',
    nome_completo: 'Giulia Name Vieira',
    matricula: null,
    turma_id: null,
    perfil: 'professor',
    oab_simulado: null,
    primeiro_acesso: false,
    ativo: true,
    created_at: new Date().toISOString(),
  },
  '097.446.776-60': {
    id: 'demo-prof-3',
    cpf: '097.446.776-60',
    nome_completo: 'Pedro Luis Melo Correa da Costa',
    matricula: null,
    turma_id: null,
    perfil: 'professor',
    oab_simulado: null,
    primeiro_acesso: false,
    ativo: true,
    created_at: new Date().toISOString(),
  },
  '149.534.096-12': {
    id: 'demo-prof-4',
    cpf: '149.534.096-12',
    nome_completo: 'Henrique Vale Duarte',
    matricula: null,
    turma_id: null,
    perfil: 'professor',
    oab_simulado: null,
    primeiro_acesso: false,
    ativo: true,
    created_at: new Date().toISOString(),
  },
};

const DEMO_PASSWORDS: Record<string, string> = {
  '150.665.876-83': 'eproc2026',
  '097.446.776-60': 'eproc2026',
  '149.534.096-12': 'eproc2026',
};
const DEMO_PASSWORD = 'Milton@2025';

function getDemoUser(cpf: string, senha: string): AuthUser | null {
  const normalized = formatCpf(cpf.replace(/\D/g, ''));
  const user = DEMO_USERS[normalized];
  if (user) {
    const specificPwd = DEMO_PASSWORDS[normalized];
    if (specificPwd ? senha === specificPwd : (senha === DEMO_PASSWORD || senha === 'demo123')) return user;
    return null;
  }
  // Aluno auto-cadastrado
  const cad = autenticarCadastro(normalized, senha);
  if (cad) return usuarioDoCadastro(cad);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string): Promise<AuthUser | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return data as AuthUser;
  };

  useEffect(() => {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('eproc-demo-user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
      setLoading(false);
      return;
    }

    supabase!.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await loadProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const login = async (cpf: string, senha: string): Promise<{ error: string | null; user?: AuthUser | null }> => {
    if (DEMO_MODE) {
      const demoUser = getDemoUser(cpf, senha);
      if (!demoUser) return { error: 'CPF ou senha inválidos.', user: null };
      setUser(demoUser);
      localStorage.setItem('eproc-demo-user', JSON.stringify(demoUser));
      return { error: null, user: demoUser };
    }

    const email = cpfToEmail(cpf);
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password: senha });
    if (error) {
      const msg = error.message.includes('Invalid login')
        ? 'CPF ou senha inválidos.'
        : error.message;
      return { error: msg, user: null };
    }
    if (data.user) {
      const profile = await loadProfile(data.user.id);
      setUser(profile);
      return { error: null, user: profile };
    }
    return { error: null, user: null };
  };

  const logout = async () => {
    if (DEMO_MODE) {
      localStorage.removeItem('eproc-demo-user');
      setUser(null);
      return;
    }
    await supabase!.auth.signOut();
    setUser(null);
  };

  const trocarSenha = async (novaSenha: string): Promise<{ error: string | null }> => {
    if (DEMO_MODE) {
      if (user) {
        const updated = { ...user, primeiro_acesso: false };
        setUser(updated);
        localStorage.setItem('eproc-demo-user', JSON.stringify(updated));
      }
      return { error: null };
    }

    const { error } = await supabase!.auth.updateUser({ password: novaSenha });
    if (error) return { error: error.message };

    if (user) {
      await supabase!.from('profiles').update({ primeiro_acesso: false }).eq('id', user.id);
      setUser({ ...user, primeiro_acesso: false });
    }
    return { error: null };
  };

  const refreshUser = async () => {
    if (DEMO_MODE || !user) return;
    const profile = await loadProfile(user.id);
    if (profile) setUser(profile);
  };

  const atualizarUsuario = (patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      if (DEMO_MODE) localStorage.setItem('eproc-demo-user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, demoMode: DEMO_MODE, login, logout, trocarSenha, refreshUser, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
