import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatCpf } from '@/lib/masks';
import { Menu, Search, Eye, EyeOff, HelpCircle, Contrast, Hand, ChevronDown } from 'lucide-react';

// Logo "eproc" (aproximação — círculos azuis sobrepostos)
function EprocLogo() {
  return (
    <svg width="150" height="118" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-label="eproc">
      <circle cx="112" cy="55" r="50" fill="#5fa4dd" opacity="0.75" />
      <circle cx="70" cy="70" r="38" fill="#9cc6ea" opacity="0.8" />
      <circle cx="105" cy="108" r="34" fill="#7fb8e6" opacity="0.8" />
      <circle cx="140" cy="95" r="26" fill="#bcdcf5" opacity="0.75" />
      <text x="100" y="72" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="700" fontFamily="'Open Sans', Arial, sans-serif" letterSpacing="1">eproc</text>
    </svg>
  );
}

export default function LoginPage() {
  const { login, demoMode } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(demoMode ? '121.572.976-69' : '');
  const [senha, setSenha] = useState(demoMode ? 'Milton@2025' : '');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const changeFont = (delta: number) => {
    const root = document.documentElement;
    const cur = parseFloat(getComputedStyle(root).fontSize) || 16;
    root.style.fontSize = `${Math.min(22, Math.max(12, cur + delta))}px`;
  };
  const toggleContrast = () => document.documentElement.classList.toggle('high-contrast');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!usuario || !senha) { setError('Preencha usuário e senha.'); return; }
    setLoading(true);
    const { error: loginError, user } = await login(usuario, senha);
    setLoading(false);
    if (loginError) { setError(loginError); return; }
    navigate(user?.perfil === 'professor' || user?.perfil === 'admin' ? '/prof/dashboard' : '/dashboard');
  };

  const MENU: { label: string; expand?: boolean; onClick?: () => void }[] = [
    { label: 'Acessibilidade' },
    { label: 'Entrar no Sistema', onClick: () => document.getElementById('login-usuario')?.focus() },
    { label: 'Cadastre-se AQUI!', expand: true, onClick: () => navigate('/cadastro') },
    { label: 'Consulta Autenticidade', expand: true },
    { label: 'Consulta Guia de Custas' },
    { label: 'Audiências' },
    { label: 'Consulta Pública de Processos', onClick: () => navigate('/consulta-publica') },
    { label: 'Consulta de Documento por Chave' },
    { label: 'Fale Conosco' },
    { label: 'Fórum de Conciliação' },
    { label: 'Legislação' },
    { label: 'Precedentes Qualificados' },
    { label: 'Sessões de Julgamento' },
    { label: 'Tutoriais' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {demoMode && (
        <div className="demo-banner">
          ⚠️ MODO DEMONSTRAÇÃO — Usuário: 121.572.976-69 | Senha: Milton@2025 (aluno) · 000.000.000-01 (professor)
        </div>
      )}

      {/* Barra de acessibilidade */}
      <div className="tjmg-access-bar">
        <button>Ir para conteúdo</button>
        <button onClick={() => setSidebarOpen(o => !o)}>Ir para menu</button>
        <button className="font-bold" title="Aumentar fonte" onClick={() => changeFont(1)}>A+</button>
        <button className="font-bold" title="Diminuir fonte" onClick={() => changeFont(-1)}>A-</button>
        <button title="Alto contraste" onClick={toggleContrast} className="flex items-center"><Contrast size={14} /></button>
        <button className="flex items-center gap-1" title="Libras"><Hand size={14} /> Libras</button>
        <button>Acessibilidade</button>
      </div>

      {/* Header teal */}
      <header className="tjmg-header">
        <button className="tjmg-header-btn" onClick={() => setSidebarOpen(o => !o)} title="Menu"><Menu size={22} /></button>
        <span className="tjmg-header-title">Tribunal de Justiça do Estado de Minas Gerais</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu lateral público */}
        {sidebarOpen && (
          <aside className="pje-sidebar overflow-y-auto">
            <div className="p-2 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
              <div className="relative">
                <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />
                <input className="w-full text-[12px] pl-7 pr-2 py-1.5 bg-white text-foreground border-none outline-none" placeholder="Pesquisar no Menu (Alt + m)" aria-label="Pesquisar no menu" />
              </div>
            </div>
            {MENU.map(item => (
              <button key={item.label} className="pje-sidebar-item w-full" onClick={item.onClick}>
                <span className="flex-1 text-left">{item.label}</span>
                {item.expand && <ChevronDown size={13} className="opacity-70" />}
              </button>
            ))}
          </aside>
        )}

        {/* Conteúdo: card de login */}
        <main className="flex-1 overflow-y-auto flex justify-center items-start px-4 py-10" style={{ backgroundColor: 'hsl(var(--bg-page))' }}>
          <div className="bg-white border border-border w-full max-w-[520px] px-8 py-8 rounded" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex justify-center mb-6"><EprocLogo /></div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[14px] text-foreground mb-1">Usuário</label>
                <input
                  id="login-usuario"
                  type="text"
                  className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                  style={{ borderColor: '#c7ccd1' }}
                  value={usuario}
                  onChange={e => setUsuario(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-[14px] text-foreground mb-1">Senha</label>
                <div className="flex">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    className="flex-1 border rounded-l px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                    style={{ borderColor: '#c7ccd1' }}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(s => !s)}
                    className="px-3 border border-l-0 rounded-r flex items-center"
                    style={{ borderColor: '#c7ccd1', background: '#eef1f4', color: '#555' }}
                    title={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button
                type="submit"
                className="w-full text-white text-[15px] font-semibold py-2.5 rounded"
                style={{ background: '#2c77ba' }}
                disabled={loading}
              >
                {loading ? 'Aguarde...' : 'Entrar'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-5 mb-2">
              <span className="text-[14px] text-muted-foreground">Outras opções de acesso</span>
              <HelpCircle size={17} className="text-sky-600" />
            </div>

            <button
              type="button"
              className="w-full border rounded py-2.5 text-[14px] font-semibold"
              style={{ borderColor: '#c7ccd1', color: '#2c77ba' }}
              onClick={() => setError('Certificado Digital não disponível neste simulador educacional.')}
            >
              Certificado Digital
            </button>

            <div className="flex flex-col items-end gap-1 mt-3">
              <button type="button" className="text-[13px] text-sky-600 hover:underline">Esqueci minha senha</button>
              <button type="button" className="text-[13px] text-sky-600 hover:underline">Autenticação em dois fatores</button>
            </div>

            <div className="text-right text-[11px] text-muted-foreground italic mt-6">
              Simulador Educacional — Versão 2.8.1
            </div>
          </div>
        </main>
      </div>

      <footer className="edu-footer py-2">
        Simulador Educacional e-Proc — Não possui vínculo com a Justiça Federal, TRF1 ou TJMG · Faculdade Milton Campos / Grupo Anima Educação
      </footer>
    </div>
  );
}
