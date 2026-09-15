import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getAllDemoProcessos, getDemoPartes } from '@/data/demoStore';
import { CabecalhoProcesso } from '@/components/eventos/CabecalhoProcesso';
import { ArvoreDeEventos } from '@/components/eventos/ArvoreDeEventos';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Eye } from 'lucide-react';
import type { Processo, Parte } from '@/integrations/supabase/types';

export default function ProfessorProcessoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      if (DEMO_MODE) {
        const p = getAllDemoProcessos().find(x => x.id === id) ?? null;
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

  if (carregando) return <ProfLayout><div className="p-6">Carregando...</div></ProfLayout>;
  if (!processo) return <ProfLayout><div className="p-6">Processo não encontrado.</div></ProfLayout>;

  return (
    <ProfLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <nav className="text-sm text-muted-foreground mb-3">
          <button onClick={() => navigate('/prof/peticoes')} className="text-primary hover:underline inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Petições
          </button>
          <span className="mx-2">›</span>
          <span className="font-mono">{processo.numero_processo}</span>
        </nav>

        <CabecalhoProcesso
          processo={processo}
          partes={partes}
          viewMode="professor"
          extra={
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/aluno/processos/${id}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-1.5" /> Ver como o aluno vê
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          <div>
            <ArvoreDeEventos
              processoId={processo.id}
              dataDistribuicao={processo.created_at}
              viewMode="professor"
            />
          </div>
          <aside className="border rounded-md p-4 h-fit space-y-2 lg:sticky lg:top-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Ações</h3>
            <p className="text-xs text-muted-foreground">
              Painel de ações do processo (corrigir petição, emitir despacho, decisão, sentenciar)
              será habilitado na Fase 4.
            </p>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(`/prof/correcao/${id}`)}
            >
              Abrir correção (modo antigo)
            </Button>
          </aside>
        </div>
      </div>
    </ProfLayout>
  );
}
