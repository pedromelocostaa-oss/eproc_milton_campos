import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getAllDemoProcessos, getDemoPartes } from '@/data/demoStore';
import { CabecalhoProcesso } from '@/components/eventos/CabecalhoProcesso';
import { EventoLinha } from '@/components/eventos/EventoLinha';
import { CorrigirEventoSheet } from '@/components/eventos/CorrigirEventoSheet';
import { EventoDetalheDialog } from '@/components/eventos/EventoDetalheDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Eye, Feather, Scale, Gavel, ClipboardCheck, Loader2, RefreshCw, UserCheck } from 'lucide-react';
import { fetchEventosUnificados, type EventoUnificado } from '@/lib/eventos/adapter';
import { pedidosPendentes, textoDeferimento } from '@/lib/eventos/habilitacao';
import { garantirProfileParaAutor } from '@/lib/eventos/autor';
import { toast } from 'sonner';
import type { Processo, Parte } from '@/integrations/supabase/types';

export default function ProfessorProcessoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destaque = Number(searchParams.get('destaque')) || null;

  const [processo, setProcesso] = useState<Processo | null>(null);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [eventos, setEventos] = useState<EventoUnificado[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [corrigindo, setCorrigindo] = useState<EventoUnificado | null>(null);
  const [detalhando, setDetalhando] = useState<EventoUnificado | null>(null);

  const recarregarEventos = useCallback(async () => {
    if (!processo) return;
    setRefreshing(true);
    const data = await fetchEventosUnificados({ processoId: processo.id, dataDistribuicao: processo.created_at });
    setEventos(data);
    setRefreshing(false);
  }, [processo]);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      if (DEMO_MODE) {
        const p = getAllDemoProcessos().find(x => x.id === id) ?? null;
        setProcesso(p);
        if (p) setPartes(getDemoPartes(id));
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

  useEffect(() => { if (processo) recarregarEventos(); }, [processo, recarregarEventos]);

  const eventoAlunoPendente = useMemo(() => {
    if (!eventos) return null;
    return [...eventos]
      .filter(e => e.autorPapel === 'aluno' && !e.correcao)
      .sort((a, b) => b.numero - a.numero)[0] ?? null;
  }, [eventos]);

  const habilitacoesPendentes = useMemo(() => (eventos ? pedidosPendentes(eventos) : []), [eventos]);

  const [deferindo, setDeferindo] = useState<string | null>(null);
  async function deferirHabilitacao(eventoPedidoId: string, alunoId: string, polo: 'ativo' | 'passivo', nomeAluno: string) {
    if (!user || !processo) return;
    setDeferindo(eventoPedidoId);
    try {
      await garantirProfileParaAutor({ ...user, perfil: 'professor' });
      const corpo = textoDeferimento(nomeAluno, polo, alunoId);
      const { error } = await supabase.from('eventos').insert({
        processo_id: processo.id,
        subtipo: 'despacho',
        autor_papel: 'professor_juiz',
        autor_id: user.id,
        titulo: `Despacho — Deferimento de Habilitação (${nomeAluno})`,
        corpo,
        em_resposta_a: eventoPedidoId,
      });
      if (error) throw error;
      toast.success('Habilitação deferida.');
      recarregarEventos();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deferir habilitação.');
    } finally {
      setDeferindo(null);
    }
  }

  const estado = processo?.estado ?? (processo?.status === 'encerrado' ? 'sentenciado' : 'ativo');
  const jaSentenciado = estado === 'sentenciado';

  if (carregando || !processo) {
    return <ProfLayout><div className="p-6">Carregando...</div></ProfLayout>;
  }

  const ordenados = eventos ? [...eventos].sort((a, b) => b.numero - a.numero) : [];

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
            <Button variant="outline" size="sm" onClick={() => window.open(`/aluno/processos/${id}`, '_blank')}>
              <Eye className="h-4 w-4 mr-1.5" /> Ver como o aluno vê
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Eventos</h2>
              <button
                type="button"
                onClick={recarregarEventos}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Atualizar
              </button>
            </div>
            {ordenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento neste processo.</p>
            ) : (
              <div className="space-y-3">
                {ordenados.map(e => {
                  const pedidoHab = habilitacoesPendentes.find(p => p.evento.id === e.id);
                  return (
                    <div key={e.id} className="space-y-1">
                      <EventoLinha
                        evento={e}
                        viewMode="professor"
                        destacar={destaque === e.numero}
                        onAbrirDetalhes={setDetalhando}
                      />
                      <div className="flex justify-end gap-2">
                        {pedidoHab && !jaSentenciado && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={deferindo === e.id}
                            onClick={() => deferirHabilitacao(
                              e.id,
                              pedidoHab.marker.alunoId,
                              pedidoHab.marker.polo,
                              e.titulo.replace(/^Requerimento de Habilitação — /, '') || 'Requerente',
                            )}
                          >
                            <UserCheck className="h-4 w-4 mr-1.5" />
                            {deferindo === e.id ? 'Deferindo...' : 'Deferir habilitação'}
                          </Button>
                        )}
                        {e.autorPapel === 'aluno' && !e.legacy && !pedidoHab && (
                          <Button
                            variant={e.correcao ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => setCorrigindo(e)}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-1.5" />
                            {e.correcao ? 'Editar correção' : 'Corrigir'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="border rounded-md p-4 h-fit space-y-3 lg:sticky lg:top-4 bg-card shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Ações</h3>

            {habilitacoesPendentes.length > 0 && (
              <div className="border border-amber-300 bg-amber-50 rounded p-3 text-xs text-amber-900">
                <strong>{habilitacoesPendentes.length} requerimento(s) de habilitação</strong> aguardando deferimento.
                Use o botão "Deferir habilitação" no evento correspondente.
              </div>
            )}

            {eventoAlunoPendente && (
              <Button
                className="w-full justify-start"
                onClick={() => setCorrigindo(eventoAlunoPendente)}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" /> Corrigir petição pendente
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={jaSentenciado}
              onClick={() => navigate(`/professor/processos/${id}/ato?tipo=despacho`)}
            >
              <Feather className="h-4 w-4 mr-2" /> Emitir despacho
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={jaSentenciado}
              onClick={() => navigate(`/professor/processos/${id}/ato?tipo=decisao`)}
            >
              <Scale className="h-4 w-4 mr-2" /> Emitir decisão
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-start"
              disabled={jaSentenciado}
              onClick={() => navigate(`/professor/processos/${id}/ato?tipo=sentenca`)}
            >
              <Gavel className="h-4 w-4 mr-2" /> Sentenciar processo
            </Button>

            {jaSentenciado && (
              <p className="text-xs text-muted-foreground italic">
                Este processo já foi sentenciado.
              </p>
            )}

            <div className="pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => navigate(`/prof/correcao/${id}`)}
              >
                Correção no modo antigo
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <CorrigirEventoSheet
        evento={corrigindo}
        aberto={corrigindo != null}
        onFechar={() => setCorrigindo(null)}
        onSalvou={recarregarEventos}
      />

      <EventoDetalheDialog
        evento={detalhando}
        aberto={detalhando != null}
        onFechar={() => setDetalhando(null)}
      />
    </ProfLayout>
  );
}
