import {
  LayoutDashboard, FolderOpen,
  Settings, Users, BookOpen, ClipboardList,
  List, Globe, Search,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode, useState } from 'react';

function SoonTag() {
  return (
    <span className="text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white/70 bg-white/10 border border-white/15 whitespace-nowrap">
      em breve
    </span>
  );
}

interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  soon?: boolean;
}

function SidebarItem({ icon, label, path, onClick, active, disabled, badge, soon }: SidebarItemProps) {
  const navigate = useNavigate();
  const handleClick = disabled ? undefined : (onClick ?? (path ? () => navigate(path) : undefined));
  return (
    <button
      className={`pje-sidebar-item w-full ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${soon ? 'pje-sidebar-item-soon' : ''} ${active ? 'pje-sidebar-item-active' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={soon ? 'Página ainda não disponível' : undefined}
    >
      {icon ?? <span className="text-[10px] opacity-60">▸</span>}
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white bg-red-500">{badge}</span>
      )}
      {soon && <SoonTag />}
      {!badge && !soon && <span className="text-[11px] opacity-30">›</span>}
    </button>
  );
}

interface ExpandableProps {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  active?: boolean;
  soon?: boolean;
}

function ExpandableItem({ icon, label, children, defaultOpen = false, active, soon }: ExpandableProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        className={`pje-sidebar-item w-full ${soon ? 'pje-sidebar-item-soon' : ''} ${active ? 'pje-sidebar-item-active' : ''}`}
        onClick={() => setOpen(!open)}
        title={soon ? 'Página ainda não disponível' : undefined}
      >
        {icon ?? <span className="text-[10px] opacity-60">▸</span>}
        <span className="flex-1 text-left font-semibold">{label}</span>
        {soon && <SoonTag />}
        {open ? <span className="text-[11px]">▾</span> : <span className="text-[11px]">›</span>}
      </button>
      {open && <div className="pje-sidebar-submenu">{children}</div>}
    </div>
  );
}

function SubItem({ label, path, active, disabled, soon }: { label: string; path?: string; active?: boolean; disabled?: boolean; soon?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      className={`pje-sidebar-subitem w-full flex items-center gap-2 ${active ? 'pje-sidebar-subitem-active' : ''} ${soon ? 'pje-sidebar-item-soon' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : (path ? () => navigate(path) : undefined)}
      disabled={disabled}
      title={soon ? 'Página ainda não disponível' : undefined}
    >
      <span className="flex-1 text-left">{label}</span>
      {soon && <SoonTag />}
    </button>
  );
}

interface EprocSidebarProps {
  collapsed: boolean;
  intimacoesCount?: number;
}

export default function EprocSidebar({ collapsed, intimacoesCount = 0 }: EprocSidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const at = (p: string) => location.pathname === p;
  const startsWith = (p: string) => location.pathname.startsWith(p);

  if (collapsed) return null;

  const isAluno = user?.perfil === 'aluno';
  const isProfessor = user?.perfil === 'professor';

  return (
    <aside className="pje-sidebar overflow-y-auto">
      {/* Busca no menu */}
      <div className="p-2 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            className="w-full text-[12px] pl-7 pr-2 py-1.5 bg-white text-foreground border-none outline-none"
            placeholder="Pesquisar no Menu (Alt + m)"
            aria-label="Pesquisar no menu"
          />
        </div>
      </div>

      {/* --- ALUNO --- */}
      {isAluno && (
        <>
          <SidebarItem label="Painel" path="/dashboard" active={at('/dashboard')} />

          <ExpandableItem
            label="Peticionar"
            defaultOpen={startsWith('/peticao') || startsWith('/processo')}
            active={startsWith('/peticao') || startsWith('/processo')}
          >
            <SubItem label="Petição Inicial (Nova Ação)" path="/peticao-inicial" active={at('/peticao-inicial')} />
          </ExpandableItem>

          <ExpandableItem
            label="Meus Processos"
            defaultOpen={startsWith('/meus-processos') || startsWith('/processo/')}
            active={startsWith('/meus-processos') || startsWith('/processo/')}
          >
            <SubItem label="Processos Ativos" path="/meus-processos?status=ativo" active={false} />
            <SubItem label="Processos Encerrados" path="/meus-processos?status=encerrado" active={false} />
            <SubItem label="Todos" path="/meus-processos" active={at('/meus-processos')} />
          </ExpandableItem>

          <SidebarItem
            label="Intimações e Citações"
            path="/intimacoes"
            active={at('/intimacoes')}
            badge={intimacoesCount}
          />

          <div className="pje-sidebar-section-label">ACESSO PÚBLICO</div>

          <SidebarItem label="Acessibilidade" path="/acessibilidade" active={at('/acessibilidade')} soon />

          <ExpandableItem
            label="Cadastre-se AQUI!"
            defaultOpen={startsWith('/cadastre-se')}
            active={startsWith('/cadastre-se')}
            soon
          >
            <SubItem label="Advogado / Procurador" path="/cadastre-se/advogado" active={at('/cadastre-se/advogado')} soon />
            <SubItem label="Pessoa Física sem OAB" path="/cadastre-se/pessoa-fisica" active={at('/cadastre-se/pessoa-fisica')} soon />
            <SubItem label="Pessoa Jurídica / Ente Gov." path="/cadastre-se/pessoa-juridica" active={at('/cadastre-se/pessoa-juridica')} soon />
          </ExpandableItem>

          <ExpandableItem
            label="Consulta Autenticidade"
            defaultOpen={startsWith('/consulta-autenticidade')}
            active={startsWith('/consulta-autenticidade')}
            soon
          >
            <SubItem label="Por Código de Verificação" path="/consulta-autenticidade/codigo" active={at('/consulta-autenticidade/codigo')} soon />
            <SubItem label="Por Hash do Documento" path="/consulta-autenticidade/hash" active={at('/consulta-autenticidade/hash')} soon />
          </ExpandableItem>

          <SidebarItem label="Consulta Guia de Custas" path="/guia-custas" active={at('/guia-custas')} soon />
          <SidebarItem label="Audiências" path="/audiencias" active={at('/audiencias')} soon />
          <SidebarItem label="Consulta Pública de Processos" path="/consulta-processual" active={at('/consulta-processual')} />
          <SidebarItem label="Consulta de Documento por Chave" path="/consulta-documento-chave" active={at('/consulta-documento-chave')} soon />
          <SidebarItem label="Fale Conosco" path="/fale-conosco" active={at('/fale-conosco')} soon />
          <SidebarItem label="Fórum de Conciliação" path="/forum-conciliacao" active={at('/forum-conciliacao')} soon />
          <SidebarItem label="Legislação" path="/legislacao" active={at('/legislacao')} soon />
          <SidebarItem label="Sessões de Julgamento" path="/sessoes-julgamento" active={at('/sessoes-julgamento')} />
          <SidebarItem label="Tutoriais" path="/tutoriais" active={at('/tutoriais')} soon />

        </>
      )}

      {/* --- PROFESSOR --- */}
      {isProfessor && (
        <>
          <SidebarItem icon={<LayoutDashboard size={14} />} label="Painel da Turma" path="/prof/dashboard" active={at('/prof/dashboard')} />

          <ExpandableItem
            icon={<BookOpen size={14} />}
            label="Tarefas"
            defaultOpen={startsWith('/prof/tarefas')}
            active={startsWith('/prof/tarefas')}
          >
            <SubItem label="Nova Tarefa" path="/prof/tarefas/nova" active={at('/prof/tarefas/nova')} />
            <SubItem label="Gerenciar Tarefas" path="/prof/tarefas" active={at('/prof/tarefas')} />
          </ExpandableItem>

          <SidebarItem
            icon={<ClipboardList size={14} />}
            label="Petições Recebidas"
            path="/prof/peticoes"
            active={at('/prof/peticoes')}
          />

          <SidebarItem
            icon={<Users size={14} />}
            label="Gerenciar Alunos"
            path="/prof/alunos"
            active={at('/prof/alunos')}
          />

          <ExpandableItem
            icon={<FolderOpen size={14} />}
            label="Processos"
            defaultOpen={startsWith('/prof/processos')}
            active={startsWith('/prof/processos')}
          >
            <SubItem label="Todos os Processos" path="/prof/processos" active={at('/prof/processos')} />
          </ExpandableItem>

          <SidebarItem
            icon={<Globe size={14} />}
            label="Consulta Processual"
            path="/consulta-publica"
            active={at('/consulta-publica')}
          />

          <SidebarItem
            icon={<List size={14} />}
            label="Gerenciar Turmas"
            path="/prof/turmas"
            active={at('/prof/turmas')}
            disabled
          />

          <SidebarItem icon={<Settings size={14} />} label="Configurações" disabled />
        </>
      )}

      {/* Educational disclaimer */}
      <div className="mt-auto p-2 border-t border-border">
        <div className="text-[9px] text-muted-foreground leading-tight">
          Simulador Educacional<br />
          Não possui vínculo com<br />
          o TJMG
        </div>
      </div>
    </aside>
  );
}
