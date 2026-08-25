import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { HelpTooltip } from '@/components/prof/HelpTooltip';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getAllDemoProcessos } from '@/data/demoStore';
import { listarCadastros } from '@/data/cadastroStore';
import type { Processo } from '@/integrations/supabase/types';
import { Search } from 'lucide-react';

function formatDate(iso: string) { return new Date(iso).toLocaleDateString('pt-BR'); }

interface ProcessoComAluno extends Processo {
  nome_aluno?: string;
}

interface StatusInfo { label: string; bg: string; color: string; }

function statusInfo(s: string): StatusInfo {
  const map: Record<string, StatusInfo> = {
    em_andamento:       { label: 'Aguardando correção',  bg: '#fef3c7', color: '#92400e' },
    aguardando_resposta:{ label: 'Aguardando resposta',  bg: '#dbeafe', color: '#1e40af' },
    com_despacho:       { label: 'Corrigido',            bg: '#dcfce7', color: '#166534' },
    encerrado:          { label: 'Encerrado',            bg: '#f3f4f6', color: '#374151' },
    devolvido:          { label: 'Devolvido p/ ajuste',  bg: '#fee2e2', color: '#991b1b' },
  };
  return map[s] ?? { label: s, bg: '#f3f4f6', color: '#374151' };
}

const FILTER_BTNS = [
  { val: '',               label: 'Todas as petições'            },
  { val: 'em_andamento',   label: 'Aguardando minha correção'    },
  { val: 'com_despacho',   label: 'Já corrigidas'                },
  { val: 'encerrado',      label: 'Encerradas'                   },
];

export default function FilaPeticoesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<ProcessoComAluno[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (DEMO_MODE) {
      const cadastros = listarCadastros();
      const nomeMap = new Map(cadastros.map(c => [c.id, c.nome]));
      setProcessos(getAllDemoProcessos().map(p => ({ ...p, nome_aluno: nomeMap.get(p.aluno_id) ?? 'Aluno' })));
      setLoading(false);
      return;
    }
    supabase!
      .from('processos')
      .select('*, profiles!processos_aluno_id_fkey(nome_completo)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProcessos(data.map((p: any) => ({
          ...p, nome_aluno: p.profiles?.nome_completo ?? 'Aluno',
        })));
        setLoading(false);
      });
  }, [user]);

  const filtered = processos.filter(p => {
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchSearch = !filter || (
      p.numero_processo.toLowerCase().includes(filter.toLowerCase()) ||
      p.nome_aluno?.toLowerCase().includes(filter.toLowerCase()) ||
      p.classe_processual.toLowerCase().includes(filter.toLowerCase())
    );
    return matchStatus && matchSearch;
  });

  const pendentes = processos.filter(p => p.status === 'em_andamento').length;

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1200 }}>

        {/* ── 5.1 Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span className="prof-page-title" style={{ marginBottom: 0 }}>
              Petições Recebidas dos Alunos
            </span>
            <HelpTooltip text={'Aqui ficam todas as petições que os alunos enviaram.\nClique em "Corrigir esta petição" para abrir, escrever seu\nfeedback e dar uma nota.'} />
          </div>
          <div style={{ fontSize: 15, color: '#6b7280', marginTop: 4 }}>
            {pendentes > 0
              ? `${pendentes} petição(ões) aguardando sua correção.`
              : 'Nenhuma petição aguardando correção no momento.'}
          </div>
        </div>

        <div className="prof-card" style={{ padding: 0 }}>

          {/* ── 5.2 Filters ── */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  className="prof-input"
                  style={{ paddingLeft: 40, fontSize: 15 }}
                  placeholder="Buscar por aluno, número de processo, classe..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
              </div>

              {/* Status filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FILTER_BTNS.map(b => {
                  const active = statusFilter === b.val;
                  const count = b.val === 'em_andamento' ? pendentes : undefined;
                  return (
                    <button
                      key={b.val}
                      onClick={() => setStatusFilter(b.val)}
                      style={{
                        height: 40, padding: '0 16px', fontSize: 14, fontWeight: 600,
                        border: '2px solid', borderRadius: 6, cursor: 'pointer',
                        borderColor: active ? '#1e40af' : '#d1d5db',
                        background: active ? '#1e40af' : '#fff',
                        color: active ? '#fff' : '#374151',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.12s',
                      }}
                    >
                      {b.label}
                      {count != null && count > 0 && (
                        <span style={{
                          background: active ? '#fff' : '#f59e0b',
                          color: active ? '#1e40af' : '#fff',
                          borderRadius: 10, padding: '1px 7px',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', fontSize: 15 }}>
              Carregando...
            </div>
          )}

          {/* ── 5.3 Table ── */}
          {!loading && (
            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Número do Processo</th>
                    <th>Classe</th>
                    <th>Vara</th>
                    <th>Data Envio</th>
                    <th style={{ textAlign: 'center' }}>Nota</th>
                    <th>Situação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 15 }}>
                        Nenhuma petição encontrada.
                      </td>
                    </tr>
                  )}
                  {filtered.map(p => {
                    const st = statusInfo(p.status);
                    const isPendente = p.status === 'em_andamento';
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.nome_aluno}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.numero_processo}</td>
                        <td>{p.classe_processual}</td>
                        <td>{p.vara}</td>
                        <td>{formatDate(p.created_at)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {p.nota != null ? (
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 16 }}>
                              {Number(p.nota).toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px', borderRadius: 4,
                            background: st.bg, color: st.color,
                            fontSize: 13, fontWeight: 600,
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/prof/correcao/${p.id}`)}
                            style={{
                              height: 44, padding: '0 16px', fontSize: 14, fontWeight: 600,
                              border: '2px solid', borderRadius: 6, cursor: 'pointer',
                              background: isPendente ? '#1e40af' : 'transparent',
                              color: isPendente ? '#fff' : '#16a34a',
                              borderColor: isPendente ? '#1e40af' : '#16a34a',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isPendente ? 'Corrigir esta petição' : 'Ver correção'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProfLayout>
  );
}
