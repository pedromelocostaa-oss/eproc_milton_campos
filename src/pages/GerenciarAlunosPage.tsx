import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { Users, UserCheck, UserX, Clock, Check, X, GraduationCap, Trash2 } from 'lucide-react';
import { demoTurmas, demoAlunosLista, saveDemoIntimacao } from '@/data/demoStore';
import { enviarEmailAprovacao } from '@/lib/emailService';
import {
  solicitacoesDoProfessor, alunosDoProfessor, aprovarCadastro, recusarCadastro,
  excluirCadastros, subscribeCadastros, type AlunoCadastro,
} from '@/data/cadastroStore';

function turmaNome(turmaId: string) {
  return demoTurmas.find(t => t.id === turmaId)?.nome ?? '—';
}
function fmtData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

interface AlunoAprovado { id: string | null; nome: string; cpf: string; materia: string; isDemo: boolean; }

export default function GerenciarAlunosPage() {
  const { user } = useAuth();
  const professorId = user?.id ?? '';

  const [pendentes, setPendentes] = useState<AlunoCadastro[]>([]);
  const [aprovadosCad, setAprovadosCad] = useState<AlunoCadastro[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const recarregar = () => {
    setPendentes(solicitacoesDoProfessor(professorId));
    setAprovadosCad(alunosDoProfessor(professorId, 'aprovado'));
    setSelecionados(new Set());
  };
  useEffect(() => {
    if (!professorId) return;
    recarregar();
    return subscribeCadastros(recarregar);
  }, [professorId]);

  const aceitar = (c: AlunoCadastro) => {
    aprovarCadastro(c.id);
    const materia = turmaNome(c.turmaId);
    saveDemoIntimacao({
      id: crypto.randomUUID(),
      processo_id: null as any,
      destinatario_id: c.id,
      remetente_id: professorId,
      texto: `Parabéns, ${c.nome}! Seu cadastro na matéria "${materia}" foi aprovado pelo professor. Você já pode acessar o sistema e utilizar todas as funcionalidades disponíveis.`,
      prazo_resposta: null,
      lida: false,
      data_ciencia: null,
      created_at: new Date().toISOString(),
    });
    if (c.email) {
      enviarEmailAprovacao({ toName: c.nome, toEmail: c.email, materia })
        .then(r => { if (!r.ok) console.warn('E-mail não enviado:', r.erro); });
    }
    recarregar();
  };
  const recusar = (c: AlunoCadastro) => {
    if (!confirm(`Recusar o cadastro de ${c.nome}?`)) return;
    recusarCadastro(c.id); recarregar();
  };

  const aprovados: AlunoAprovado[] = [
    ...demoAlunosLista.map(a => ({ id: null, nome: a.nome, cpf: a.cpf, materia: a.turma, isDemo: true })),
    ...aprovadosCad.map(c => ({ id: c.id, nome: c.nome, cpf: c.cpf, materia: turmaNome(c.turmaId), isDemo: false })),
  ];

  const excluiveis = aprovados.filter(a => !a.isDemo && a.id);
  const todosExcluiveisSelecionados = excluiveis.length > 0 && excluiveis.every(a => selecionados.has(a.id!));

  const toggleSelecao = (id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (todosExcluiveisSelecionados) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(excluiveis.map(a => a.id!)));
    }
  };

  const excluirSelecionados = () => {
    if (selecionados.size === 0) return;
    const nomes = aprovados.filter(a => a.id && selecionados.has(a.id)).map(a => a.nome);
    if (!confirm(`Excluir ${nomes.length} aluno(s)?\n\n${nomes.join('\n')}`)) return;
    excluirCadastros([...selecionados]);
    recarregar();
  };

  const excluirUm = (a: AlunoAprovado) => {
    if (!a.id) return;
    if (!confirm(`Excluir o aluno ${a.nome}?`)) return;
    excluirCadastros([a.id]);
    recarregar();
  };

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1100 }}>
        <div className="prof-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={24} color="#1e40af" /> Alunos e Turmas
        </div>
        <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 20 }}>
          Aprove os alunos que solicitaram acesso às suas matérias e acompanhe sua lista de alunos.
        </div>

        {/* ===== SOLICITAÇÕES (em destaque) ===== */}
        <div
          className="prof-card"
          style={{
            padding: 0, marginBottom: 24,
            border: pendentes.length > 0 ? '2px solid #f59e0b' : '1px solid #e5e7eb',
            boxShadow: pendentes.length > 0 ? '0 0 0 4px rgba(245,158,11,0.12)' : undefined,
          }}
        >
          <div
            className="prof-card-header"
            style={{ background: pendentes.length > 0 ? '#fffbeb' : '#f8fafc', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: pendentes.length > 0 ? '#92400e' : '#1e3a5f' }}>
              <Clock size={18} color={pendentes.length > 0 ? '#f59e0b' : '#94a3b8'} />
              Solicitações de acesso aguardando aprovação
            </span>
            {pendentes.length > 0 && (
              <span style={{ background: '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 999, padding: '2px 12px' }}>
                {pendentes.length}
              </span>
            )}
          </div>

          {pendentes.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
              <UserCheck size={30} color="#22c55e" style={{ margin: '0 auto 8px' }} />
              Nenhuma solicitação pendente no momento.
            </div>
          ) : (
            <div>
              {pendentes.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {c.nome.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e3a5f' }}>{c.nome}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>CPF: {c.cpf}</div>
                      <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <GraduationCap size={14} color="#1e40af" /> <strong>{turmaNome(c.turmaId)}</strong>
                        <span style={{ color: '#9ca3af', marginLeft: 6 }}>· solicitado em {fmtData(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <button
                      onClick={() => aceitar(c)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px', border: 'none', borderRadius: 6, background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Check size={17} /> Aceitar
                    </button>
                    <button
                      onClick={() => recusar(c)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', border: '2px solid #dc2626', borderRadius: 6, background: 'transparent', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <X size={17} /> Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== ALUNOS APROVADOS ===== */}
        <div className="prof-card" style={{ padding: 0 }}>
          <div className="prof-card-header" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserCheck size={18} color="#1e40af" /> Alunos aprovados</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {selecionados.size > 0 && (
                <button
                  onClick={excluirSelecionados}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', border: '2px solid #dc2626', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Trash2 size={15} /> Excluir selecionados ({selecionados.size})
                </button>
              )}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>{aprovados.length} aluno(s)</span>
            </div>
          </div>
          {aprovados.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Nenhum aluno aprovado ainda.</div>
          ) : (
            <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    {excluiveis.length > 0 && (
                      <input
                        type="checkbox"
                        checked={todosExcluiveisSelecionados}
                        onChange={toggleTodos}
                        title="Selecionar todos"
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                    )}
                  </th>
                  <th style={{ width: '35%' }}>Nome</th>
                  <th style={{ width: '20%' }}>CPF</th>
                  <th>Matéria</th>
                  <th style={{ width: 60, textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {aprovados.map((a, i) => (
                  <tr key={`${a.cpf}-${i}`} style={{ background: a.id && selecionados.has(a.id) ? '#eff6ff' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      {!a.isDemo && a.id ? (
                        <input
                          type="checkbox"
                          checked={selecionados.has(a.id)}
                          onChange={() => toggleSelecao(a.id!)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      ) : (
                        <span style={{ color: '#d1d5db' }} title="Aluno pré-cadastrado (não pode ser excluído)">—</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e3a5f' }}>{a.nome}</td>
                    <td>{a.cpf}</td>
                    <td>{a.materia}</td>
                    <td style={{ textAlign: 'center' }}>
                      {!a.isDemo && a.id ? (
                        <button
                          onClick={() => excluirUm(a)}
                          title={`Excluir ${a.nome}`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProfLayout>
  );
}
