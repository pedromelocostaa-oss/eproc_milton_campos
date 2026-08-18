import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { HelpTooltip } from '@/components/prof/HelpTooltip';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import {
  getAllDemoProcessos, getDemoPartes, getDemoDocumentos,
  saveDemoProcesso, saveDemoMovimentacao, saveDemoIntimacao,
} from '@/data/demoStore';
import type { Processo, Parte, Documento } from '@/integrations/supabase/types';
import { CheckCircle } from 'lucide-react';

function formatDate(iso: string) { return new Date(iso).toLocaleString('pt-BR'); }

type Acao = 'despacho' | 'emenda' | 'encerrar';

const ACOES: { val: Acao; title: string; desc: string; icon: string }[] = [
  {
    val: 'despacho',
    title: 'Enviar Despacho',
    desc: 'Dou feedback e nota. O processo continua ativo.',
    icon: '📋',
  },
  {
    val: 'emenda',
    title: 'Solicitar Correção ao Aluno',
    desc: 'Devolvo para o aluno ajustar, com prazo e orientação.',
    icon: '🔄',
  },
  {
    val: 'encerrar',
    title: 'Encerrar e Finalizar',
    desc: 'Encerro o processo com nota final e comentário.',
    icon: '✅',
  },
];

export default function CorrecaoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [processo, setProcesso] = useState<Processo | null>(null);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [nomeAluno, setNomeAluno] = useState('Aluno');
  const [loading, setLoading] = useState(true);

  const [feedback, setFeedback] = useState('');
  const [nota, setNota] = useState('');
  const [prazoResposta, setPrazoResposta] = useState('');
  const [acao, setAcao] = useState<Acao>('despacho');
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    if (DEMO_MODE) {
      const p = getAllDemoProcessos().find(p => p.id === id);
      if (p) {
        setProcesso(p);
        setFeedback(p.feedback_professor ?? '');
        setNota(p.nota != null ? String(p.nota) : '');
        setPartes(getDemoPartes(id));
        setDocumentos(getDemoDocumentos(id));
        setNomeAluno('Luiz Cordeiro');
      }
      setLoading(false);
      return;
    }
    Promise.all([
      supabase!.from('processos').select('*, profiles!processos_aluno_id_fkey(nome_completo)').eq('id', id).single(),
      supabase!.from('partes').select('*').eq('processo_id', id),
      supabase!.from('documentos').select('*').eq('processo_id', id),
    ]).then((res) => {
      const [pRes, partRes, docRes] = res as any[];
      if (pRes.data) {
        setProcesso(pRes.data);
        setFeedback((pRes.data as any).feedback_professor ?? '');
        setNota(pRes.data.nota != null ? String(pRes.data.nota) : '');
        setNomeAluno((pRes.data as any).profiles?.nome_completo ?? 'Aluno');
      }
      if (partRes.data) setPartes(partRes.data);
      if (docRes.data) setDocumentos(docRes.data);
      setLoading(false);
    });
  }, [id, user]);

  const salvar = async () => {
    if (!feedback.trim()) {
      alert('Por favor, escreva seu comentário para o aluno antes de continuar.');
      return;
    }
    if (!nota) {
      alert('Por favor, informe a nota do aluno (de 0 a 10).');
      return;
    }
    const notaNum = parseFloat(nota.replace(',', '.'));
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      alert('A nota deve ser um número entre 0 e 10. Você pode usar decimais (ex: 7,5).');
      return;
    }

    if (acao === 'encerrar') {
      const ok = confirm(
        `Você está encerrando definitivamente esta atividade.\n\nO aluno ${nomeAluno} receberá a nota final: ${notaNum.toFixed(1)}.\n\nDeseja continuar?`
      );
      if (!ok) return;
    }

    setSalvando(true);
    const now = new Date().toISOString();
    const novoStatus = acao === 'encerrar' ? 'encerrado' : acao === 'emenda' ? 'devolvido' : 'com_despacho';
    const tipoMov = acao === 'despacho' ? 'despacho' : acao === 'emenda' ? 'solicitacao_emenda' : 'encerramento';

    try {
      if (DEMO_MODE) {
        saveDemoProcesso({
          ...processo!,
          status: novoStatus,
          nota: notaNum,
          feedback_professor: feedback,
          updated_at: now,
        });
        saveDemoMovimentacao({
          id: crypto.randomUUID(),
          processo_id: id!,
          tipo: tipoMov,
          descricao: feedback,
          autor_id: user!.id,
          created_at: now,
        });

        const textoIntimacao =
          acao === 'encerrar'
            ? `Processo encerrado pela professora.\n\nFeedback final:\n${feedback}\n\nNota atribuída: ${notaNum.toFixed(1)}`
            : acao === 'emenda'
            ? `Solicitação de Correção:\n\n${feedback}\n\nPrazo para ajuste: ${prazoResposta ? new Date(`${prazoResposta}T00:00:00Z`).toLocaleDateString('pt-BR') : 'a definir'}`
            : `Despacho da Professora:\n\n${feedback}\n\nNota atribuída: ${notaNum.toFixed(1)}`;

        saveDemoIntimacao({
          id: crypto.randomUUID(),
          processo_id: id!,
          destinatario_id: processo!.aluno_id,
          remetente_id: user!.id,
          texto: textoIntimacao,
          prazo_resposta: prazoResposta ? `${prazoResposta}T23:59:59Z` : null,
          lida: false,
          data_ciencia: null,
          created_at: now,
        });
      } else {
        await supabase!.from('processos').update({
          status: novoStatus, nota: notaNum, feedback_professor: feedback, updated_at: now,
        }).eq('id', id);
        await supabase!.from('movimentacoes').insert({
          processo_id: id, tipo: tipoMov, descricao: feedback, autor_id: user!.id,
        });
        await supabase!.from('intimacoes').insert({
          processo_id: id, destinatario_id: processo!.aluno_id, remetente_id: user!.id,
          texto: `${acao === 'despacho' ? 'Despacho' : acao === 'emenda' ? 'Solicitação de Correção' : 'Processo Encerrado'}:\n\n${feedback}${notaNum ? `\n\nNota: ${notaNum.toFixed(1)}` : ''}`,
          prazo_resposta: prazoResposta ? `${prazoResposta}T23:59:59Z` : null,
        });
      }
      setSalvo(true);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao salvar. Por favor, tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <ProfLayout>
        <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', fontSize: 15 }}>
          Carregando...
        </div>
      </ProfLayout>
    );
  }

  if (!processo) {
    return (
      <ProfLayout>
        <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', fontSize: 15 }}>
          Processo não encontrado.
        </div>
      </ProfLayout>
    );
  }

  /* ── Success screen ── */
  if (salvo) {
    return (
      <ProfLayout>
        <div style={{ padding: 24, maxWidth: 600, margin: '40px auto' }}>
          <div className="prof-card" style={{ textAlign: 'center', padding: 48 }}>
            <CheckCircle size={56} color="#22c55e" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 12 }}>
              Avaliação enviada com sucesso!
            </div>
            <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
              O aluno <strong>{nomeAluno}</strong> foi notificado e pode ver seu comentário e nota agora.
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                className="prof-btn-secondary"
                style={{ height: 52, padding: '0 28px', fontSize: 15 }}
                onClick={() => navigate('/prof/peticoes')}
              >
                Ver outras petições
              </button>
              <button
                className="prof-btn-primary"
                style={{ height: 52, padding: '0 28px', fontSize: 15 }}
                onClick={() => navigate('/prof/dashboard')}
              >
                Voltar ao painel
              </button>
            </div>
          </div>
        </div>
      </ProfLayout>
    );
  }

  const poloAtivo = partes.filter(p => p.polo === 'ativo');
  const poloPassivo = partes.filter(p => p.polo === 'passivo');

  const submitLabel =
    acao === 'despacho' ? 'Enviar Avaliação para o Aluno'
    : acao === 'emenda'  ? 'Solicitar Correção ao Aluno'
    : 'Finalizar e Encerrar';

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1200 }}>

        {/* ── 6.1 Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span className="prof-page-title" style={{ marginBottom: 0 }}>
              Corrigir Petição do Aluno
            </span>
            <HelpTooltip text={'Analise a petição enviada pelo aluno, escolha uma ação e escreva seu\nfeedback detalhado. O aluno receberá automaticamente uma notificação\ncom seu comentário e nota.'} />
          </div>
          <div style={{ fontSize: 16, color: '#6b7280', marginTop: 4 }}>
            Aluno: <strong>{nomeAluno}</strong> — Processo: <strong style={{ fontFamily: 'monospace' }}>{processo.numero_processo}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* ── 6.2 Left: Process data ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="prof-card" style={{ padding: 0 }}>
              <div className="prof-card-header">Dados do Processo</div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <InfoRow label="Aluno" value={nomeAluno} />
                <InfoRow label="Número" value={processo.numero_processo} mono />
                <InfoRow label="Classe" value={processo.classe_processual} />
                <InfoRow label="Assunto" value={processo.assunto} />
                <InfoRow label="Vara" value={processo.vara} />
                <InfoRow label="Valor da Causa" value={`R$ ${(processo.valor_causa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <InfoRow label="Distribuído em" value={formatDate(processo.created_at)} />
              </div>
            </div>

            <div className="prof-card" style={{ padding: 0 }}>
              <div className="prof-card-header">Partes do Processo</div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>
                  Quem move a ação (Polo Ativo)
                </div>
                {poloAtivo.length === 0
                  ? <div style={{ fontSize: 15, color: '#9ca3af' }}>—</div>
                  : poloAtivo.map(p => (
                      <div key={p.id} style={{ fontSize: 15, marginBottom: 2 }}>{p.nome} — {p.cpf_cnpj}</div>
                    ))}
                <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginTop: 14, marginBottom: 6 }}>
                  Quem é o réu (Polo Passivo)
                </div>
                {poloPassivo.length === 0
                  ? <div style={{ fontSize: 15, color: '#9ca3af' }}>—</div>
                  : poloPassivo.map(p => (
                      <div key={p.id} style={{ fontSize: 15, marginBottom: 2 }}>{p.nome} — {p.cpf_cnpj}</div>
                    ))}
              </div>
            </div>

            {documentos.length > 0 && (
              <div className="prof-card" style={{ padding: 0 }}>
                <div className="prof-card-header">Documentos Juntados</div>
                <div>
                  {documentos.map(d => (
                    <div
                      key={d.id}
                      style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{d.tipo}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{d.nome_arquivo}</div>
                      </div>
                      <button className="prof-btn-secondary" style={{ height: 36, padding: '0 14px', fontSize: 13 }} disabled>
                        Baixar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── 6.3 Right: Correction panel ── */}
          <div className="prof-card" style={{ padding: 0 }}>
            <div className="prof-card-header">
              Sua Avaliação
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Action selector cards */}
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1e3a5f', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                  Tipo de Ação
                  <HelpTooltip text={'Escolha o que deseja fazer com esta petição.\nVocê pode enviar um comentário, pedir que o aluno corrija,\nou finalizar a atividade com nota.'} />
                </div>
                {ACOES.map(opt => (
                  <div
                    key={opt.val}
                    className={'prof-action-card' + (acao === opt.val ? ' selected' : '')}
                    onClick={() => setAcao(opt.val)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setAcao(opt.val); }}
                    style={{ minHeight: 72 }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div className="prof-action-card-title">{opt.title}</div>
                      <div className="prof-action-card-desc">{opt.desc}</div>
                    </div>
                    {acao === opt.val && (
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: '#1e40af', background: '#dbeafe',
                        padding: '3px 10px', borderRadius: 4, flexShrink: 0,
                      }}>
                        SELECIONADO
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Prazo (emenda only) */}
              {acao === 'emenda' && (
                <div>
                  <label className="prof-label" style={{ fontSize: 17 }}>
                    Prazo para o aluno fazer a correção
                    <HelpTooltip text="O aluno verá esta data como prazo para reenviar a petição corrigida." />
                  </label>
                  <input
                    type="date"
                    className="prof-input"
                    style={{ width: 200 }}
                    value={prazoResposta}
                    onChange={e => setPrazoResposta(e.target.value)}
                  />
                </div>
              )}

              {/* Feedback textarea */}
              <div>
                <label className="prof-label" style={{ fontSize: 17 }}>
                  Seu comentário para o aluno <span style={{ color: '#dc2626' }}>*</span>
                  <HelpTooltip text={'Escreva aqui sua análise da petição. O aluno lerá\nexatamente o que você escrever. Seja claro e específico.'} />
                </label>
                <textarea
                  className="prof-textarea"
                  rows={8}
                  style={{ minHeight: 180, fontSize: 15 }}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder={'Ex: Boa petição! A causa de pedir está bem estruturada. Atenção para o pedido de tutela antecipada — especifique melhor o periculum in mora.'}
                />
              </div>

              {/* Nota */}
              <div>
                <label className="prof-label" style={{ fontSize: 17 }}>
                  Nota do aluno (de 0 a 10) <span style={{ color: '#dc2626' }}>*</span>
                  <HelpTooltip text={'Dê uma nota de 0 a 10. Você pode usar decimais (ex: 7,5).\nEsta nota ficará registrada no sistema e será visível para o aluno.'} />
                </label>
                <input
                  type="number"
                  className="prof-input"
                  style={{ width: 120, height: 48, fontSize: 18, textAlign: 'center' }}
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  min={0}
                  max={10}
                  step={0.5}
                  placeholder="0–10"
                />
              </div>

              {/* Submit button */}
              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  className="prof-btn-secondary"
                  style={{ height: 52, padding: '0 24px', fontSize: 15 }}
                  onClick={() => navigate('/prof/peticoes')}
                >
                  Cancelar
                </button>
                <button
                  className="prof-btn-primary"
                  style={{ height: 52, padding: '0 28px', fontSize: 16, fontWeight: 700, flex: 1 }}
                  onClick={salvar}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfLayout>
  );
}

/* ── InfoRow helper ── */
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', gap: 12, paddingTop: 12, paddingBottom: 12,
      borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#6b7280', width: 130, flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{ fontSize: 15, fontFamily: mono ? 'monospace' : undefined, color: '#1e293b' }}>
        {value}
      </span>
    </div>
  );
}
