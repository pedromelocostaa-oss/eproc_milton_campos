import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import {
  buscarNotificacoes, marcarComoVisto, marcarVariosComoVistos,
  type NotificacaoEvento,
} from '@/lib/eventos/notificacoes';
import { SUBTIPO_CONFIG, labelAutorPapel } from '@/lib/eventos/subtipoConfig';

interface Props {
  compact?: boolean;
}

export function NotificacoesAluno({ compact }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<NotificacaoEvento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const data = await buscarNotificacoes(user.id);
    setNotificacoes(data);
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    void carregar();
    const onFocus = () => void carregar();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [carregar]);

  function abrir(n: NotificacaoEvento) {
    if (!user) return;
    marcarComoVisto(user.id, n.eventoId);
    setNotificacoes(prev => prev.filter(x => x.eventoId !== n.eventoId));
    navigate(`/aluno/processos/${n.processoId}`);
  }

  function marcarTodasVistas() {
    if (!user) return;
    marcarVariosComoVistos(user.id, notificacoes.map(n => n.eventoId));
    setNotificacoes([]);
  }

  if (carregando) {
    return (
      <div className="bg-white border border-eproc-borda p-3 flex items-center gap-2 text-[12px] text-eproc-texto-secundario">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando novidades...
      </div>
    );
  }

  if (notificacoes.length === 0) {
    return (
      <div className="bg-white border border-eproc-borda p-3 text-[12px] text-eproc-texto-secundario italic">
        Nenhuma novidade pendente. Quando alguém despachar, decidir ou peticionar em algum processo seu (ou onde você está atuando), uma notificação aparece aqui.
      </div>
    );
  }

  return (
    <div className="bg-white border border-eproc-borda">
      <div className="flex items-center justify-between px-3 py-2 bg-eproc-tabela-header border-b border-eproc-borda">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-eproc-texto uppercase tracking-wide">
          <Bell className="h-3.5 w-3.5" />
          Novidades nos seus processos
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {notificacoes.length}
          </span>
        </div>
        <button
          type="button"
          onClick={marcarTodasVistas}
          className="inline-flex items-center gap-1 text-[11px] text-eproc-link hover:underline"
        >
          <CheckCheck className="h-3 w-3" /> Marcar todas como vistas
        </button>
      </div>

      <ul className="divide-y divide-eproc-borda">
        {notificacoes.slice(0, compact ? 5 : 20).map(n => {
          const cfg = SUBTIPO_CONFIG[n.subtipo];
          const Icone = cfg.icon;
          const quando = formatDistanceToNow(new Date(n.dataEvento), { locale: ptBR, addSuffix: true });
          const quandoAbs = format(new Date(n.dataEvento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
          return (
            <li key={n.eventoId}>
              <button
                type="button"
                onClick={() => abrir(n)}
                className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-eproc-tabela-row-hover"
              >
                <div className={`h-7 w-7 shrink-0 rounded-sm flex items-center justify-center border ${cfg.borderClass} ${cfg.bgClass}`}>
                  <Icone className={`h-3.5 w-3.5 ${cfg.textClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px]">
                    <span className={`font-semibold ${cfg.textClass}`}>{cfg.label}</span>
                    {' '}no processo{' '}
                    <span className="font-mono font-semibold">{n.numeroProcesso}</span>
                  </div>
                  <div className="text-[11px] text-eproc-texto-secundario mt-0.5">
                    {n.autorNome
                      ? <>Enviado por <strong>{n.autorNome}</strong> ({labelAutorPapel(n.autorPapel)})</>
                      : labelAutorPapel(n.autorPapel)}
                    {' · '}<span title={quandoAbs}>{quando}</span>
                  </div>
                </div>
                <span className="text-[10px] text-eproc-link shrink-0 self-center">abrir →</span>
              </button>
            </li>
          );
        })}
      </ul>
      {compact && notificacoes.length > 5 && (
        <div className="px-3 py-1.5 text-[11px] text-eproc-texto-secundario border-t border-eproc-borda text-center">
          + {notificacoes.length - 5} outras novidades
        </div>
      )}
    </div>
  );
}
