import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeCadastros, statusCadastroPorId } from '@/data/cadastroStore';
import { Clock, XCircle, LogOut } from 'lucide-react';

export default function AguardandoAprovacaoPage() {
  const { user, logout, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const recusado = user?.statusCadastro === 'recusado';

  // Reage à aprovação/recusa do professor (mesmo navegador) em tempo real.
  useEffect(() => {
    if (!user) return;
    const check = () => {
      const status = statusCadastroPorId(user.id);
      if (status === 'aprovado') {
        atualizarUsuario({ statusCadastro: 'aprovado', ativo: true });
        navigate('/dashboard');
      } else if (status === 'recusado') {
        atualizarUsuario({ statusCadastro: 'recusado' });
      }
    };
    check();
    return subscribeCadastros(check);
  }, [user, atualizarUsuario, navigate]);

  const sair = async () => { await logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(213, 30%, 92%)' }}>
      <header style={{ background: 'hsl(210, 100%, 20%)' }} className="text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <span className="text-[11px] font-bold">JF</span>
            </div>
            <div>
              <div className="text-[14px] font-bold">e-Proc</div>
              <div className="text-[10px] opacity-70">Peticionamento Eletrônico — 1º Grau</div>
            </div>
          </div>
          <button className="text-white text-[12px] flex items-center gap-1.5 hover:opacity-80" onClick={sair}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white border border-border shadow-sm w-full max-w-[460px] p-8 text-center">
          {recusado ? (
            <>
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <div className="text-[18px] font-bold text-foreground mb-2">Cadastro não aprovado</div>
              <p className="text-[13px] text-muted-foreground mb-1">
                Olá, <strong>{user?.nome_completo}</strong>. Seu cadastro na matéria
                {user?.turmaNome ? <> <strong>{user.turmaNome}</strong></> : ''} não foi aprovado pelo professor responsável.
              </p>
              <p className="text-[12px] text-muted-foreground">
                Em caso de dúvida, procure o professor da disciplina ou faça um novo cadastro.
              </p>
            </>
          ) : (
            <>
              <div className="relative mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-100" />
                <Clock size={40} className="relative text-amber-500" />
              </div>
              <div className="text-[18px] font-bold text-foreground mb-2">Aguardando aprovação</div>
              <p className="text-[13px] text-muted-foreground mb-1">
                Olá, <strong>{user?.nome_completo}</strong>! Seu cadastro
                {user?.turmaNome ? <> na matéria <strong>{user.turmaNome}</strong></> : ''} foi enviado e está
                aguardando a aprovação do professor responsável.
              </p>
              <p className="text-[12px] text-muted-foreground">
                Assim que o professor liberar seu acesso, esta página abrirá o sistema automaticamente.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Aguardando liberação...
              </div>
            </>
          )}

          <button className="btn-secondary w-full mt-6" onClick={sair}>Sair</button>
        </div>
      </div>

      <footer className="edu-footer py-3">
        Simulador Educacional e-Proc — Faculdade Milton Campos / Grupo Anima Educação
      </footer>
    </div>
  );
}
