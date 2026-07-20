import { Menu, LogOut, Settings, Contrast, Hand } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface EprocHeaderProps {
  onToggleSidebar: () => void;
  intimacoesNaoLidas?: number;
}

export default function EprocHeader({ onToggleSidebar }: EprocHeaderProps) {
  const { user, logout, demoMode } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const changeFont = (delta: number) => {
    const root = document.documentElement;
    const current = parseFloat(getComputedStyle(root).fontSize) || 16;
    const next = Math.min(22, Math.max(12, current + delta));
    root.style.fontSize = `${next}px`;
  };

  const toggleContrast = () => {
    document.documentElement.classList.toggle('high-contrast');
  };

  return (
    <div>
      {demoMode && (
        <div className="demo-banner">
          ⚠️ MODO DEMONSTRAÇÃO — CPF: 121.572.976-69 | Senha: Milton@2025 (aluno) · CPF: 000.000.000-01 (professor)
        </div>
      )}

      {/* ── Barra de acessibilidade ── */}
      <div className="tjmg-access-bar">
        <button onClick={() => { const el = document.querySelector('main'); el?.scrollIntoView(); }}>
          Ir para conteúdo
        </button>
        <button onClick={onToggleSidebar}>Ir para menu</button>
        <button title="Aumentar fonte" onClick={() => changeFont(1)} className="font-bold">A+</button>
        <button title="Diminuir fonte" onClick={() => changeFont(-1)} className="font-bold">A-</button>
        <button title="Alto contraste" onClick={toggleContrast} className="flex items-center">
          <Contrast size={14} />
        </button>
        <button className="flex items-center gap-1" title="Libras">
          <Hand size={14} /> Libras
        </button>
        <button onClick={() => navigate('/acessibilidade')}>Acessibilidade</button>
      </div>

      {/* ── Header TJMG (teal com degradê) ── */}
      <header className="tjmg-header">
        <button className="tjmg-header-btn" onClick={onToggleSidebar} title="Menu">
          <Menu size={22} />
        </button>
        <span className="tjmg-header-title">Tribunal de Justiça do Estado de Minas Gerais</span>

        {/* Usuário / sair */}
        {user && (
          <div className="ml-auto relative">
            <button
              className="tjmg-header-avatar"
              onClick={() => setShowMenu(!showMenu)}
              title={user.nome_completo}
            >
              {user.nome_completo?.charAt(0) ?? 'U'}
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-11 bg-white border border-border shadow-lg z-50 min-w-56"
                onMouseLeave={() => setShowMenu(false)}
              >
                <div className="px-4 py-2 border-b border-border">
                  <div className="text-[12px] font-bold text-foreground">{user.nome_completo}</div>
                  <div className="text-[11px] text-muted-foreground">CPF: {user.cpf}</div>
                  {user.perfil === 'aluno' && user.oab_simulado && (
                    <div className="text-[11px] text-muted-foreground">OAB: {user.oab_simulado}</div>
                  )}
                </div>
                {user.perfil === 'aluno' && (
                  <button
                    className="w-full text-left px-4 py-2 text-[12px] hover:bg-muted flex items-center gap-2 text-foreground"
                    onClick={() => { setShowMenu(false); navigate('/meus-dados'); }}
                  >
                    <Settings size={13} /> Meus Dados
                  </button>
                )}
                <button
                  className="w-full text-left px-4 py-2 text-[12px] hover:bg-muted flex items-center gap-2 text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut size={13} /> Sair
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
