import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getDemoProcessos, getDemoPartes } from '@/data/demoStore';
import { CabecalhoProcesso } from '@/components/eventos/CabecalhoProcesso';
import { ArvoreDeEventos } from '@/components/eventos/ArvoreDeEventos';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, Send } from 'lucide-react';
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

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      if (DEMO_MODE) {
        const p = getDemoProcessos(user.id).find(x => x.id === id) ?? null;
        setProcesso(p);
        if (p) setPartes(getDemoPartes(id));
        setCarregando(false);
        return;
      }
      const [pRes, partRes] = await Promise.all([
        supabase!.from('processos').select('*').eq('id', id).single(),
        supabase!.from('partes').select('*').eq('processo_id', id),
      ]);
      if (pRes.data) setProcesso(pRes.data as Processo);
      if (partRes.data) setPartes(partRes.data);
      setCarregando(false);
    })();
  }, [id, user]);

  if (carregando) return <EprocLayout><div className="p-6 text-[12px]">Carregando...</div></EprocLayout>;
  if (!processo) return <EprocLayout><div className="p-6 text-[12px]">Processo não encontrado.</div></EprocLayout>;

  const estado = processo.estado ?? (processo.status === 'encerrado' ? 'sentenciado' : 'ativo');
  const podePeticionar = estado !== 'sentenciado' && estado !== 'baixado';

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
                  {!podePeticionar && (
                    <TooltipContent>
                      <p className="text-xs">Este processo foi sentenciado. Não é possível peticionar.</p>
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
        />
      </div>
    </EprocLayout>
  );
}
