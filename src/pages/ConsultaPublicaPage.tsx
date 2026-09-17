import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getAllDemoProcessos, getDemoPartes } from '@/data/demoStore';
import { ArvoreDeEventos } from '@/components/eventos/ArvoreDeEventos';
import { SolicitarHabilitacaoDialog } from '@/components/eventos/SolicitarHabilitacaoDialog';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEventosUnificados } from '@/lib/eventos/adapter';
import { habilitados, jaSolicitou } from '@/lib/eventos/habilitacao';
import type { Processo, Parte } from '@/integrations/supabase/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function statusLabel(s: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    em_andamento: { label: 'Em Andamento', cls: 'badge-info' },
    aguardando_resposta: { label: 'Aguardando Resposta', cls: 'badge-warning' },
    com_despacho: { label: 'Com Despacho', cls: 'badge-warning' },
    encerrado: { label: 'Encerrado', cls: 'badge-neutral' },
    devolvido: { label: 'Devolvido p/ Ajuste', cls: 'badge-danger' },
  };
  return map[s] ?? { label: s, cls: 'badge-neutral' };
}

export default function ConsultaPublicaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Processo | null>(null);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [jaHabilitado, setJaHabilitado] = useState(false);
  const [jaPediu, setJaPediu] = useState(false);
  const [ehDono, setEhDono] = useState(false);

  useEffect(() => {
    if (!result || !user) { setJaHabilitado(false); setJaPediu(false); setEhDono(false); return; }
    setEhDono(result.aluno_id === user.id);
    (async () => {
      const evs = await fetchEventosUnificados({ processoId: result.id, dataDistribuicao: result.created_at });
      setJaHabilitado(habilitados(evs).has(user.id));
      setJaPediu(jaSolicitou(evs, user.id));
    })();
  }, [result, user, refreshKey]);

  const buscar = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setPartes([]);

    if (DEMO_MODE) {
      const processos = getAllDemoProcessos();
      const found = processos.find(p =>
        !p.segredo_justica && (
          p.numero_processo.toLowerCase().includes(query.toLowerCase()) ||
          getDemoPartes(p.id).some(pt => pt.nome.toLowerCase().includes(query.toLowerCase()) || (pt.cpf_cnpj ?? '').includes(query))
        )
      );
      if (found) {
        setResult(found);
        setPartes(getDemoPartes(found.id));
      } else {
        setNotFound(true);
      }
      setLoading(false);
      return;
    }

    const { data: procs } = await supabase!
      .from('processos')
      .select('*')
      .eq('segredo_justica', false)
      .or(`numero_processo.ilike.%${query}%`)
      .limit(1)
      .single();

    if (procs) {
      setResult(procs);
      const { data: partesData } = await supabase!.from('partes').select('*').eq('processo_id', procs.id);
      setPartes(partesData ?? []);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(213, 30%, 92%)' }}>
      {/* Header */}
      <header style={{ background: 'hsl(210, 100%, 20%)' }} className="text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="text-[22px]">⚖</div>
            <div>
              <div className="text-[14px] font-bold">e-Proc — Simulador Educacional</div>
              <div className="text-[10px] opacity-70">Consulta Processual Pública</div>
            </div>
          </div>
          <button
            className="text-white text-[11px] underline hover:opacity-80"
            onClick={() => navigate('/')}
          >
            ← Acessar Sistema
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-1 text-[11px]" style={{ background: 'hsl(213, 100%, 28%)' }}>
          <button className="opacity-50">Entrar</button>
          <span className="font-bold">Consulta processual</span>
          <span className="opacity-50">Manuais</span>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-[18px] font-bold mb-1">Consulta Processual Pública</div>
            <div className="text-[12px] text-muted-foreground">
              Busque por número do processo, nome da parte ou CPF/CNPJ.
              Processos em segredo de justiça não aparecem nesta consulta.
            </div>
          </div>

          <div className="bg-white border border-border p-4 mb-4">
            <div className="panel-header mb-3">PESQUISAR PROCESSO</div>
            <div className="flex gap-2">
              <input
                type="text"
                className="form-field flex-1"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Número do processo, nome da parte ou CPF..."
              />
              <button className="btn-primary flex items-center gap-2" onClick={buscar} disabled={loading}>
                <Search size={14} />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {notFound && (
            <div className="alert-error">
              Nenhum processo público encontrado para "<strong>{query}</strong>".
            </div>
          )}

          {result && (
            <div className="bg-white border border-border">
              <div className="panel-header">RESULTADO DA CONSULTA</div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCell label="Número do Processo" value={result.numero_processo} mono />
                  <InfoCell label="Situação" value={statusLabel(result.status).label} />
                  <InfoCell label="Classe" value={result.classe_processual} />
                  <InfoCell label="Assunto" value={result.assunto} />
                  <InfoCell label="Vara" value={result.vara} />
                  <InfoCell label="Distribuído em" value={formatDate(result.created_at)} />
                  <InfoCell label="Valor da Causa" value={`R$ ${(result.valor_causa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <InfoCell label="Última atualização" value={formatDate(result.updated_at)} />
                </div>

                {partes.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Partes do Processo</div>
                    <div className="divide-y divide-border border border-border">
                      {partes.map(p => (
                        <div key={p.id} className="px-3 py-1.5 text-[12px] flex justify-between">
                          <span>{p.nome}</span>
                          <span className="text-muted-foreground capitalize">Polo {p.polo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="alert-warning text-[11px]">
                  ⚠️ Este é um sistema de simulação educacional. Os dados exibidos são fictícios, produzidos por alunos da Faculdade Milton Campos.
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">
                  Linha do tempo do processo (eventos públicos)
                </div>
                {user && !ehDono && !jaHabilitado && !jaPediu && (
                  <button
                    onClick={() => setDialogAberto(true)}
                    className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm border border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus size={13} /> Solicitar habilitação
                  </button>
                )}
                {user && !ehDono && jaPediu && !jaHabilitado && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm border border-warning bg-warning-bg text-warning">
                    Habilitação pendente de deferimento
                  </span>
                )}
                {user && !ehDono && jaHabilitado && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm border border-success bg-sucesso-bg text-sucesso">
                    Habilitado nos autos ✓
                  </span>
                )}
              </div>
              <ArvoreDeEventos
                processoId={result.id}
                dataDistribuicao={result.created_at}
                viewMode="aluno"
                atualizarKey={refreshKey}
              />
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                Para peticionar neste processo é necessário ser parte ou estar habilitado nos autos.
              </p>
              {user && jaHabilitado && (
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/aluno/processos/${result.id}`)}
                    className="btn-primary text-[12px]"
                  >
                    Abrir processo para peticionar
                  </button>
                </div>
              )}
            </div>
          )}

          {result && user && (
            <SolicitarHabilitacaoDialog
              processoId={result.id}
              numeroProcesso={result.numero_processo}
              aberto={dialogAberto}
              onFechar={() => setDialogAberto(false)}
              onEnviou={() => setRefreshKey(k => k + 1)}
            />
          )}

          {/* Tip */}
          {!result && !notFound && (
            <div className="bg-white border border-border p-4">
              <div className="panel-header mb-2">COMO USAR</div>
              <ul className="text-[12px] text-muted-foreground space-y-1 list-disc list-inside">
                <li>Busque pelo número completo do processo (ex: 1000042-33.2025.4.01.3800)</li>
                <li>Busque pelo nome de uma das partes</li>
                <li>Busque pelo CPF ou CNPJ da parte</li>
                <li>Processos em segredo de justiça não aparecem aqui</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className="edu-footer py-3">
        Simulador Educacional — Não possui vínculo com a Justiça Federal ou TRF1. Desenvolvido para fins acadêmicos.
      </footer>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase">{label}</div>
      <div className={`text-[12px] ${mono ? 'font-mono font-semibold' : ''}`}>{value}</div>
    </div>
  );
}
