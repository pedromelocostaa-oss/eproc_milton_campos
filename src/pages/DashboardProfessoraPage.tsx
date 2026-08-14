import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { HelpTooltip } from '@/components/prof/HelpTooltip';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import {
  getDemoTarefas, getAllDemoProcessos, demoTurmas, demoAlunosLista,
} from '@/data/demoStore';
import { solicitacoesDoProfessor, subscribeCadastros } from '@/data/cadastroStore';
import { UserPlus } from 'lucide-react';
import type { Processo, Tarefa } from '@/integrations/supabase/types';
import {
  ClipboardList, CheckCircle2, BookOpen, Users, AlertTriangle,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

interface ProcessoComAluno extends Processo {
  nome_aluno?: string;
}

const DEMO_ALUNOS_LISTA = demoAlunosLista.map(a => ({ id: a.id, nome: a.nome, cpf: a.cpf }));

export default function DashboardProfessoraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<ProcessoComAluno[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [tarefaSelecionada, setTarefaSelecionada] = useState('');

  useEffect(() => {
    if (!user) return;

    if (DEMO_MODE) {
      const allProc = getAllDemoProcessos();
      setProcessos(allProc.map(p => ({ ...p, nome_aluno: 'Luiz Cordeiro' })));
      const tarefasProf = getDemoTarefas().filter(t => t.professor_id === user.id);
      setTarefas(tarefasProf);
      if (tarefasProf.length > 0) setTarefaSelecionada(tarefasProf[0].id);
      setLoading(false);
      return;
    }

    Promise.all([
      supabase!
        .from('processos')
        .select('*, profiles!processos_aluno_id_fkey(nome_completo)')
        .order('created_at', { ascending: false }),
      supabase!
        .from('tarefas')
        .select('*')
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([pRes, tRes]) => {
      if (pRes.data) {
        setProcessos(pRes.data.map((p: any) => ({
          ...p,
          nome_aluno: p.profiles?.nome_completo ?? 'Aluno',
        })));
      }
      if (tRes.data) {
        setTarefas(tRes.data);
        if (tRes.data.length > 0) setTarefaSelecionada(tRes.data[0].id);
      }
      setLoading(false);
    });
  }, [user]);

  // Solicitações de cadastro de alunos aguardando aprovação
  const [solicitacoes, setSolicitacoes] = useState(0);
  useEffect(() => {
    if (!user) return;
    const load = () => setSolicitacoes(solicitacoesDoProfessor(user.id).length);
    load();
    return subscribeCadastros(load);
  }, [user]);

  const pendentes = processos.filter(p => p.status === 'em_andamento');
  const corrigidos = processos.filter(p => p.status === 'com_despacho' || p.status === 'encerrado');
  const tarefasAtivas = tarefas.filter(t => t.ativa);

  // Student status per selected task
  const alunosStatus = DEMO_ALUNOS_LISTA.map(aluno => {
    const proc = processos.find(p => p.aluno_id === aluno.id && p.tarefa_id === tarefaSelecionada);
    return { ...aluno, processo: proc ?? null };
  });

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = user?.nome_completo?.split(' ')[0] ?? 'Professora';

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1200 }}>

        {/* ── 3.1 Welcome header ── */}
        <div
          className="prof-card"
          style={{
            borderBottom: '3px solid #1e40af',
            marginBottom: 24,
            padding: '20px 24px',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>
            {saudacao}, Prof.ª {primeiroNome}
          </div>
          <div style={{ fontSize: 15, color: '#6b7280', marginTop: 4 }}>
            Turmas ativas: {demoTurmas.map(t => t.nome).join(' · ')}
          </div>
        </div>

        {/* ── Solicitações de alunos (destaque) ── */}
        {solicitacoes > 0 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
              background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: 8,
              padding: '16px 20px', boxShadow: '0 0 0 4px rgba(245,158,11,0.12)',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserPlus size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>
                {solicitacoes} aluno(s) aguardando sua aprovação
              </div>
              <div style={{ fontSize: 13, color: '#78350f' }}>
                Novos alunos se cadastraram nas suas matérias e precisam da sua liberação para acessar o sistema.
              </div>
            </div>
            <button className="prof-btn-primary" style={{ background: '#d97706', flexShrink: 0 }} onClick={() => navigate('/prof/alunos')}>
              Revisar solicitações →
            </button>
          </div>
        )}

        {/* ── 3.2 Summary cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <BigCard
            label="Petições aguardando correção"
            value={pendentes.length}
            color="#f59e0b"
            Icon={ClipboardList}
            tooltip="Petições que os alunos enviaram e você ainda não corrigiu."
            onClick={() => navigate('/prof/peticoes')}
          />
          <BigCard
            label="Petições já corrigidas"
            value={corrigidos.length}
            color="#22c55e"
            Icon={CheckCircle2}
            tooltip="Petições que você já avaliou e devolveu com nota e comentário."
            onClick={() => navigate('/prof/peticoes')}
          />
          <BigCard
            label="Atividades abertas para alunos"
            value={tarefasAtivas.length}
            color="#1e40af"
            Icon={BookOpen}
            tooltip="Atividades que estão visíveis e abertas para os alunos enviarem."
            onClick={() => navigate('/prof/tarefas')}
          />
          <BigCard
            label="Total de alunos cadastrados"
            value={DEMO_ALUNOS_LISTA.length}
            color="#1e40af"
            Icon={Users}
            tooltip="Número de alunos cadastrados no sistema."
            onClick={() => navigate('/prof/alunos')}
          />
        </div>

        {/* ── 3.3 Call to action ── */}
        {pendentes.length > 0 ? (
          <div className="prof-alert-pending" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>
                Você tem {pendentes.length} petição(ões) aguardando sua correção
              </span>
            </div>
            <div style={{ fontSize: 15, color: '#78350f', marginBottom: 14 }}>
              Os alunos estão esperando o seu feedback.
            </div>
            <button
              className="prof-btn-primary"
              style={{ fontSize: 15 }}
              onClick={() => navigate('/prof/peticoes')}
            >
              Ir para as Petições Pendentes →
            </button>
          </div>
        ) : (
          <div className="prof-alert-ok" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} color="#22c55e" />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#166534' }}>
                Tudo em dia! Nenhuma petição aguardando correção.
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
          className="lg:grid-cols-2 grid-cols-1"
        >
          {/* ── 3.4 Student status per task ── */}
          <div className="prof-card" style={{ padding: 0 }}>
            <div className="prof-card-header">
              <span className="prof-section-title" style={{ fontSize: 16, marginBottom: 0 }}>
                Status dos Alunos por Atividade
                <HelpTooltip text="Veja aqui se cada aluno já enviou a atividade selecionada, qual nota recebeu e qual é o status atual." />
              </span>
            </div>
            <div style={{ padding: '16px 20px 8px 20px' }}>
              <label className="prof-label" style={{ fontSize: 14, marginBottom: 6 }}>
                Selecionar atividade:
              </label>
              <select
                className="prof-input"
                style={{ width: 'auto', minWidth: 280 }}
                value={tarefaSelecionada}
                onChange={e => setTarefaSelecionada(e.target.value)}
              >
                {tarefas.length === 0 && <option value="">Nenhuma atividade criada</option>}
                {tarefas.map(t => (
                  <option key={t.id} value={t.id}>{t.titulo}</option>
                ))}
              </select>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                Carregando...
              </div>
            ) : (
              <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th style={{ textAlign: 'center' }}>Nota</th>
                    <th>Situação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosStatus.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.nome}</td>
                      <td style={{ textAlign: 'center' }}>
                        {a.processo?.nota != null ? (
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                            {Number(a.processo.nota).toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td>
                        {!a.processo ? (
                          <span style={{
                            fontSize: 13, padding: '3px 10px', borderRadius: 4,
                            background: '#f3f4f6', color: '#6b7280', fontWeight: 600,
                          }}>
                            Não enviou
                          </span>
                        ) : a.processo.status === 'em_andamento' ? (
                          <span style={{
                            fontSize: 13, padding: '3px 10px', borderRadius: 4,
                            background: '#fef3c7', color: '#92400e', fontWeight: 600,
                          }}>
                            Aguardando correção
                          </span>
                        ) : a.processo.status === 'encerrado' ? (
                          <span style={{
                            fontSize: 13, padding: '3px 10px', borderRadius: 4,
                            background: '#dcfce7', color: '#166534', fontWeight: 600,
                          }}>
                            Encerrado
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 13, padding: '3px 10px', borderRadius: 4,
                            background: '#dbeafe', color: '#1e40af', fontWeight: 600,
                          }}>
                            Corrigido
                          </span>
                        )}
                      </td>
                      <td>
                        {!a.processo ? (
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>Aguardando aluno</span>
                        ) : a.processo.status === 'em_andamento' ? (
                          <button
                            className="prof-btn-primary"
                            style={{ height: 36, padding: '0 14px', fontSize: 13, fontWeight: 700 }}
                            onClick={() => navigate(`/prof/correcao/${a.processo!.id}`)}
                          >
                            Corrigir agora
                          </button>
                        ) : (
                          <button
                            className="prof-btn-secondary"
                            style={{ height: 36, padding: '0 14px', fontSize: 13, color: '#16a34a', borderColor: '#16a34a' }}
                            onClick={() => navigate(`/prof/correcao/${a.processo!.id}`)}
                          >
                            Ver correção feita
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {alunosStatus.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: 20, fontSize: 14 }}>
                        Nenhum aluno cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ── 3.5 Active tasks ── */}
          <div className="prof-card" style={{ padding: 0 }}>
            <div className="prof-card-header">
              <span className="prof-section-title" style={{ fontSize: 16, marginBottom: 0 }}>
                Atividades Ativas
              </span>
            </div>

            {loading && (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                Carregando...
              </div>
            )}

            {!loading && tarefasAtivas.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                Nenhuma atividade ativa.{' '}
                <button
                  style={{ color: '#1e40af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => navigate('/prof/tarefas')}
                >
                  Criar primeira atividade
                </button>
              </div>
            )}

            <div>
              {tarefasAtivas.map(t => {
                const prazoDate = t.prazo ? new Date(t.prazo) : null;
                const vencido = prazoDate && prazoDate < new Date();
                const enviadas = processos.filter(p => p.tarefa_id === t.id).length;
                const total = DEMO_ALUNOS_LISTA.length;
                return (
                  <div
                    key={t.id}
                    style={{
                      padding: '18px 20px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', marginBottom: 6 }}>
                      {t.titulo}
                    </div>
                    <div style={{ fontSize: 15, color: vencido ? '#dc2626' : '#6b7280', marginBottom: 8 }}>
                      Prazo: {t.prazo ? formatDate(t.prazo) : 'Sem prazo'}
                      {vencido && <span style={{ fontWeight: 700, marginLeft: 8 }}>VENCIDO</span>}
                    </div>
                    <div style={{ fontSize: 15, color: '#374151', marginBottom: 12 }}>
                      <span style={{
                        background: '#dbeafe', color: '#1e40af',
                        padding: '2px 10px', borderRadius: 4, fontWeight: 600, fontSize: 14,
                      }}>
                        {enviadas} de {total} alunos enviaram
                      </span>
                    </div>
                    <button
                      className="prof-btn-secondary"
                      style={{ height: 40, fontSize: 14 }}
                      onClick={() => navigate('/prof/tarefas')}
                    >
                      Gerenciar esta atividade
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ProfLayout>
  );
}

/* ── Sub-component: BigCard ── */
function BigCard({
  label, value, color, Icon, tooltip, onClick,
}: {
  label: string;
  value: number;
  color: string;
  Icon: React.ElementType;
  tooltip: string;
  onClick: () => void;
}) {
  const [tipVisible, setTipVisible] = useState(false);

  return (
    <div
      onClick={onClick}
      className="prof-card"
      style={{
        position: 'relative',
        minHeight: 110,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: 24,
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
        el.style.borderColor = color;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'none';
        el.style.borderColor = '#e5e7eb';
      }}
    >
      {/* ── Help button — canto superior direito, fora do fluxo flex ── */}
      <div
        style={{ position: 'absolute', top: 10, right: 10 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onMouseEnter={() => setTipVisible(true)}
          onMouseLeave={() => setTipVisible(false)}
          onFocus={() => setTipVisible(true)}
          onBlur={() => setTipVisible(false)}
          aria-label="Ajuda"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#e5e7eb', color: '#6b7280',
            border: 'none', cursor: 'help',
            fontSize: 12, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnterCapture={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#1e40af';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeaveCapture={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb';
            (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
          }}
        >
          ?
        </button>

        {tipVisible && (
          <span
            role="tooltip"
            style={{
              position: 'absolute',
              right: 26,
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#1e293b',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              maxWidth: 240,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            {tooltip}
          </span>
        )}
      </div>

      {/* ── Conteúdo do card — limpo, sem tooltip misturado ── */}
      <div
        style={{
          width: 52, height: 52, borderRadius: 8,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={28} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 15, color: '#6b7280', marginTop: 4, lineHeight: 1.4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
