import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

// Pages
import LoginPage from './pages/LoginPage';
import TrocarSenhaPage from './pages/TrocarSenhaPage';
import DashboardAlunoPage from './pages/DashboardAlunoPage';
import PeticaoInicialPage from './pages/PeticaoInicialPage';
import MeusProcessosPage from './pages/MeusProcessosPage';
import ProcessoDetalhesPage from './pages/ProcessoDetalhesPage';
import PeticaoIncidentalPage from './pages/PeticaoIncidentalPage';
import IntimacoesPage from './pages/IntimacoesPage';
import ConsultaPublicaPage from './pages/ConsultaPublicaPage';
import DashboardProfessoraPage from './pages/DashboardProfessoraPage';
import GerenciarTarefasPage from './pages/GerenciarTarefasPage';
import FilaPeticoesPage from './pages/FilaPeticoesPage';
import CorrecaoPage from './pages/CorrecaoPage';
import GerenciarAlunosPage from './pages/GerenciarAlunosPage';
import PeticaoReferenciaPage from './pages/PeticaoReferenciaPage';
import ConsultaProcessualPage from './pages/ConsultaProcessualPage';
import DisponibilizarProcessosPage from './pages/DisponibilizarProcessosPage';
import AcessibilidadePage from './pages/AcessibilidadePage';
import CadastreSePage from './pages/CadastreSePage';
import ConsultaAutenticidadePage from './pages/ConsultaAutenticidadePage';
import GuiaCustasPage from './pages/GuiaCustasPage';
import AudienciasPage from './pages/AudienciasPage';
import ConsultaDocumentoChavePage from './pages/ConsultaDocumentoChavePage';
import FaleConoscoPage from './pages/FaleConoscoPage';
import ForumConciliacaoPage from './pages/ForumConciliacaoPage';
import LegislacaoPage from './pages/LegislacaoPage';
import SessoesJulgamentoPage from './pages/SessoesJulgamentoPage';
import TutoriaisPage from './pages/TutoriaisPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// ── Protected route ──
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.primeiro_acesso) return <Navigate to="/trocar-senha" replace />;
  return <>{children}</>;
}

function RequireAluno({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.perfil !== 'aluno') return <Navigate to="/prof/dashboard" replace />;
  return <>{children}</>;
}

function RequireProfessor({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.perfil !== 'professor' && user.perfil !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/consulta-publica" element={<ConsultaPublicaPage />} />

      {/* First access */}
      <Route
        path="/trocar-senha"
        element={
          loading ? null : user ? <TrocarSenhaPage /> : <Navigate to="/" replace />
        }
      />

      {/* Aluno routes */}
      <Route path="/dashboard" element={<RequireAluno><DashboardAlunoPage /></RequireAluno>} />
      <Route path="/peticao-inicial" element={<RequireAluno><PeticaoInicialPage /></RequireAluno>} />
      <Route path="/meus-processos" element={<RequireAluno><MeusProcessosPage /></RequireAluno>} />
      <Route path="/processo/:id" element={<RequireAuth><ProcessoDetalhesPage /></RequireAuth>} />
      <Route path="/peticao-incidental" element={<RequireAluno><PeticaoIncidentalPage /></RequireAluno>} />
      <Route path="/intimacoes" element={<RequireAluno><IntimacoesPage /></RequireAluno>} />
      <Route path="/peticao-referencia/:tarefaId" element={<RequireAluno><PeticaoReferenciaPage /></RequireAluno>} />
      <Route path="/meus-dados" element={<RequireAluno><MeusProcessosPage /></RequireAluno>} />

      {/* Professor routes */}
      <Route path="/prof/dashboard" element={<RequireProfessor><DashboardProfessoraPage /></RequireProfessor>} />
      <Route path="/prof/tarefas" element={<RequireProfessor><GerenciarTarefasPage /></RequireProfessor>} />
      <Route path="/prof/tarefas/nova" element={<RequireProfessor><GerenciarTarefasPage /></RequireProfessor>} />
      <Route path="/prof/peticoes" element={<RequireProfessor><FilaPeticoesPage /></RequireProfessor>} />
      <Route path="/prof/correcao/:id" element={<RequireProfessor><CorrecaoPage /></RequireProfessor>} />
      <Route path="/prof/alunos" element={<RequireProfessor><GerenciarAlunosPage /></RequireProfessor>} />
      <Route path="/prof/acervo" element={<RequireProfessor><DisponibilizarProcessosPage /></RequireProfessor>} />
      <Route path="/prof/processos" element={<RequireProfessor><FilaPeticoesPage /></RequireProfessor>} />

      {/* Acesso Público — rotas acessíveis a qualquer usuário logado */}
      <Route path="/consulta-processual" element={<RequireAuth><ConsultaProcessualPage /></RequireAuth>} />
      <Route path="/acessibilidade" element={<RequireAuth><AcessibilidadePage /></RequireAuth>} />
      <Route path="/cadastre-se" element={<RequireAuth><CadastreSePage /></RequireAuth>} />
      <Route path="/cadastre-se/:tipo" element={<RequireAuth><CadastreSePage /></RequireAuth>} />
      <Route path="/consulta-autenticidade" element={<RequireAuth><ConsultaAutenticidadePage /></RequireAuth>} />
      <Route path="/consulta-autenticidade/:modo" element={<RequireAuth><ConsultaAutenticidadePage /></RequireAuth>} />
      <Route path="/guia-custas" element={<RequireAuth><GuiaCustasPage /></RequireAuth>} />
      <Route path="/audiencias" element={<RequireAuth><AudienciasPage /></RequireAuth>} />
      <Route path="/consulta-documento-chave" element={<RequireAuth><ConsultaDocumentoChavePage /></RequireAuth>} />
      <Route path="/fale-conosco" element={<RequireAuth><FaleConoscoPage /></RequireAuth>} />
      <Route path="/forum-conciliacao" element={<RequireAuth><ForumConciliacaoPage /></RequireAuth>} />
      <Route path="/legislacao" element={<RequireAuth><LegislacaoPage /></RequireAuth>} />
      <Route path="/sessoes-julgamento" element={<RequireAuth><SessoesJulgamentoPage /></RequireAuth>} />
      <Route path="/tutoriais" element={<RequireAuth><TutoriaisPage /></RequireAuth>} />

      {/* Legacy redirects */}
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="/processo" element={<Navigate to="/peticao-inicial" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
