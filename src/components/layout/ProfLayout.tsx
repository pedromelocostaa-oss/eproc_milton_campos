import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  FolderPlus,
  LogOut,
} from 'lucide-react';

interface ProfLayoutProps {
  children: ReactNode;
}

const NAV = [
  { label: 'Painel',                path: '/prof/dashboard',  Icon: LayoutDashboard },
  { label: 'Alunos e Turmas',       path: '/prof/alunos',     Icon: Users           },
  { label: 'Atividades',            path: '/prof/tarefas',    Icon: ClipboardList   },
  { label: 'Petições Recebidas',    path: '/prof/peticoes',   Icon: FileText        },
  { label: 'Banco de Processos',    path: '/prof/acervo',     Icon: FolderPlus      },
];

export default function ProfLayout({ children }: ProfLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f3f4f6' }}>

      {/* ── Header ── */}
      <header
        style={{
          minHeight: 64,
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40, height: 40, background: '#1e40af', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <path d="M11 1L1 5v8c0 6.5 4.3 11.8 10 13.5C16.7 24.8 21 19.5 21 13V5L11 1z"
                fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.2"/>
              <text x="11" y="15.5" textAnchor="middle" fill="white" fontSize="7.5"
                fontWeight="bold" fontFamily="Arial">JF</text>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', lineHeight: 1.2 }}>
              Simulador e-Proc — Área do Professor
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Faculdade Milton Campos / Grupo Anima</div>
          </div>
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>
            {user?.nome_completo ?? 'Professor(a)'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              height: 40, padding: '0 20px',
              border: '2px solid #1e40af', borderRadius: 6,
              background: 'transparent', color: '#1e40af',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <nav
          style={{
            width: 220, minWidth: 220,
            background: '#ffffff',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '12px 0 4px 0' }}>
            {NAV.map(item => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    minHeight: 52,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0 0 0 20px',
                    fontSize: 15,
                    fontWeight: active ? 700 : 400,
                    background: active ? '#1e40af' : 'transparent',
                    color: active ? '#ffffff' : '#374151',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s, color 0.12s',
                    borderLeft: active ? '4px solid #1e3a8a' : '4px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
                      (e.currentTarget as HTMLButtonElement).style.color = '#1e40af';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#374151';
                    }
                  }}
                >
                  <item.Icon size={18} style={{ flexShrink: 0 }} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Separador + Sair */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                minHeight: 52,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 0 0 20px',
                fontSize: 15,
                fontWeight: 600,
                background: 'transparent',
                color: '#dc2626',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <LogOut size={18} />
              Sair do Sistema
            </button>
          </div>
        </nav>

        {/* ── Conteúdo principal ── */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#f3f4f6',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          textAlign: 'center', padding: '6px',
          fontSize: 10, color: '#9ca3af',
          borderTop: '1px solid #e5e7eb',
          background: 'transparent', opacity: 0.5,
        }}
      >
        Simulador Educacional e-Proc — Não possui vínculo com a Justiça Federal ou TRF1 · Faculdade Milton Campos / Grupo Anima Educação
      </footer>
    </div>
  );
}
