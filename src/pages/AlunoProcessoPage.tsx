import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import { supabase } from '@/integrations/supabase/client';
import { CabecalhoProcesso } from '@/components/eventos/CabecalhoProcesso';
import { ArvoreDeEventos } from '@/components/eventos/ArvoreDeEventos';
import { EventoDetalheDialog } from '@/components/eventos/EventoDetalheDialog';
import type { EventoUnificado } from '@/lib/eventos/adapter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, Send } from 'lucide-react';
import { fetchEventosUnificados } from '@/lib/eventos/adapter';
import { habilitados } from '@/lib/eventos/habilitacao';
import type { Processo, Parte } from '@/integrations/supabase/types';

export default function AlunoProcessoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destaque = Number(searchParams.get('destaque')) || null;
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ehHabilitado, setEhHabilitado] = useState(false);
  const [detalhando, setDetalhando] = useState<EventoUnificado | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      // SEMPRE busca no BD (o DEMO_MODE só afeta o wizard antigo de criação).
      // Assim qualquer aluno pode abrir processos de outros grupos da sua turma.
      const [pRes, partRes] = await Promise.all([
        supabase.from('processos').select('*').eq('id', id).single(),
        supabase.from('partes').select('*').eq('processo_id', id),
      ]);
      if (pRes.data) setProcesso(pRes.data as Processo);
      if (partRes.data) setPartes(partRes.data);
      if (pRes.data) {
        const evs = await fetchEventosUnificados({
          processoId: (pRes.data as Processo).id,
          dataDistribuicao: (pRes.data as Processo).created_at,
        });
        setEhHabilitado(habilitados(evs).has(user.id));
      }
      setCarregando(false);
    })();
  }, [id, user]);

  if (carregando) return <EprocLayout><div className="p-6 text-[12px]">Carregando...</div></EprocLayout>;
  if (!processo) return <EprocLayout><div className="p-6 text-[12px]">Processo não encontrado.</div></EprocLayout>;

  const estado = processo.estado ?? (processo.status === 'encerrado' ? 'sentenciado' : 'ativo');
  const ehDono = user?.id === processo.aluno_id;
  const podePeticionar = estado !== 'sentenciado' && estado !== 'baixado' && (ehDono || ehHabilitado);
  const razaoBloqueio = estado === 'sentenciado'
    ? 'Este processo foi sentenciado. Não é possível peticionar.'
    : (!ehDono && !ehHabilitado)
    ? 'Você não é parte deste processo. Solicite habilitação nos autos pela Consulta Pública.'
    : null;

  return (
    <EprocLayout>
      <div className="p-3">
        <nav className="text-[12px] text-eproc-texto-secundario mb-2">
          <button onClick={() => navigate('/meus-processos')} className="text-eproc-link hover:underline inline-flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" /> Meus Processos
          </button>
          <span className="mx-1">›</span>
          <span className="font-mono">{processo.numero_processo}</span>
        </nav>

        <CabecalhoProcesso
          processo={processo}
          partes={partes}
          viewMode="aluno"
          extra={
            <div className="flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/aluno/processos/${id}/peticionar`)}
                        disabled={!podePeticionar}
                        className="bg-eproc-header hover:bg-primary text-white h-8 text-[12px]"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Peticionar
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!podePeticionar && razaoBloqueio && (
                    <TooltipContent>
                      <p className="text-xs">{razaoBloqueio}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          }
        />

        <ArvoreDeEventos
          processoId={processo.id}
          dataDistribuicao={processo.created_at}
          viewMode="aluno"
          destacarNumero={destaque}
          onAbrirDetalhes={setDetalhando}
        />
      </div>

      <EventoDetalheDialog
        evento={detalhando}
        aberto={detalhando != null}
        onFechar={() => setDetalhando(null)}
      />
    </EprocLayout>
  );
}
