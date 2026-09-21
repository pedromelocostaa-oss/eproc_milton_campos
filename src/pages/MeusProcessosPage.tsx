import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import { Search } from 'lucide-react';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getDemoProcessos } from '@/data/demoStore';
import type { Processo } from '@/integrations/supabase/types';

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

const PER_PAGE = 10;

export default function MeusProcessosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const statusFilter = searchParams.get('status');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    if (DEMO_MODE) {
      setProcessos(getDemoProcessos(user.id));
      setLoading(false);
      return;
    }

    (async () => {
      const own = await supabase!
        .from('processos')
        .select('*')
        .eq('aluno_id', user.id)
        .order('created_at', { ascending: false });

      // Processos onde o aluno já peticionou (mesmo sendo de outro grupo)
      const meusEventos = await supabase!
        .from('eventos')
        .select('processo_id')
        .eq('autor_id', user.id);

      let atuandoProcessos: Processo[] = [];
      const ownIds = new Set((own.data ?? []).map(p => p.id));
      const atuandoIds = Array.from(new Set((meusEventos.data ?? []).map(e => e.processo_id as string)))
        .filter(id => !ownIds.has(id));
      if (atuandoIds.length > 0) {
        const alheios = await supabase!
          .from('processos')
          .select('*')
          .in('id', atuandoIds);
        atuandoProcessos = (alheios.data ?? []).map(p => ({ ...p, _habilitado: true } as Processo & { _habilitado?: boolean }));
      }

      const todos = [...(own.data ?? []), ...atuandoProcessos]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProcessos(todos);
      setLoading(false);
    })();
  }, [user]);

  const filtered = processos.filter(p => {
    const matchesStatus = statusFilter === 'ativo'
      ? p.status !== 'encerrado'
      : statusFilter === 'encerrado'
        ? p.status === 'encerrado'
        : true;
    const matchesSearch = !filter || (
      p.numero_processo.toLowerCase().includes(filter.toLowerCase()) ||
      p.classe_processual.toLowerCase().includes(filter.toLowerCase()) ||
      p.assunto.toLowerCase().includes(filter.toLowerCase()) ||
      p.vara.toLowerCase().includes(filter.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Meus Processos</span>
          {statusFilter && <span>› {statusFilter === 'ativo' ? 'Ativos' : 'Encerrados'}</span>}
        </div>

        <div className="bg-white border border-border">
          <div className="panel-header flex items-center justify-between">
            <span>MEUS PROCESSOS ({filtered.length})</span>
            <button className="btn-success text-[10px] py-0.5 px-2" onClick={() => navigate('/peticao-inicial')}>
              + Nova Petição
            </button>
          </div>

          <div className="p-3 border-b border-border">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  className="form-field pl-7"
                  placeholder="Buscar por número, classe, assunto..."
                  value={filter}
                  onChange={e => { setFilter(e.target.value); setPage(1); }}
                />
              </div>
              <div className="flex gap-1">
                {[
                  { label: 'Todos', val: '' },
                  { label: 'Ativos', val: 'ativo' },
                  { label: 'Encerrados', val: 'encerrado' },
                ].map(btn => (
                  <button
                    key={btn.val}
                    className={(statusFilter ?? '') === btn.val ? 'btn-primary text-[11px] py-1 px-2' : 'btn-secondary text-[11px] py-1 px-2'}
                    onClick={() => {
                      if (btn.val) navigate(`/meus-processos?status=${btn.val}`);
                      else navigate('/meus-processos');
                      setPage(1);
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-8 text-center text-[12px] text-muted-foreground">Carregando processos...</div>
          )}

          {!loading && (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nº Processo</th>
                      <th>Classe Processual</th>
                      <th>Vara</th>
                      <th>Situação</th>
                      <th>Valor da Causa</th>
                      <th>Data Distribuição</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          {processos.length === 0
                            ? 'Nenhum processo protocolado. Clique em "Nova Petição" para começar.'
                            : 'Nenhum resultado encontrado.'}
                        </td>
                      </tr>
                    )}
                    {paginated.map(p => {
                      const st = statusLabel(p.status);
                      return (
                        <tr
                          key={p.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/processo/${p.id}`)}
                        >
                          <td className="font-mono text-[11px] font-semibold">
                            {p.numero_processo}
                            {(p as Processo & { _habilitado?: boolean })._habilitado && (
                              <span className="ml-1 text-[9px] font-normal align-middle inline-flex items-center gap-0.5 px-1 py-0.5 border border-success text-success bg-sucesso-bg rounded-sm">
                                atuando
                              </span>
                            )}
                          </td>
                          <td>{p.classe_processual}</td>
                          <td>{p.vara}</td>
                          <td><span className={st.cls}>{st.label}</span></td>
                          <td>R$ {(p.valor_causa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td>{formatDate(p.created_at)}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2 items-center">
                              <button
                                className="text-[11px] hover:underline cursor-pointer"
                                style={{ color: 'hsl(210,100%,20%)' }}
                                onClick={() => navigate(`/processo/${p.id}`)}
                              >
                                [Ver Autos]
                              </button>
                              <button
                                className="text-[11px] hover:underline cursor-pointer"
                                style={{ color: 'hsl(210,100%,20%)' }}
                                onClick={() => navigate(`/aluno/processos/${p.id}`)}
                                title="Nova interface — árvore de eventos"
                              >
                                [Árvore de eventos]
                              </button>
                              {p.status !== 'encerrado' && (
                                <button
                                  className="text-[11px] hover:underline cursor-pointer"
                                  style={{ color: 'hsl(210,100%,20%)' }}
                                  onClick={() => navigate(`/peticao-incidental?processo=${p.id}`)}
                                >
                                  [Peticionar]
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border text-[11px]">
                  <span className="text-muted-foreground">
                    {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
                  </span>
                  <div className="flex gap-1">
                    <button className="btn-secondary px-2 py-0.5 text-[10px]" disabled={page === 1} onClick={() => setPage(prev => prev - 1)}>← Ant.</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        className={page === i + 1 ? 'btn-primary px-2 py-0.5 text-[10px]' : 'btn-secondary px-2 py-0.5 text-[10px]'}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button className="btn-secondary px-2 py-0.5 text-[10px]" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)}>Próx. →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </EprocLayout>
  );
}
