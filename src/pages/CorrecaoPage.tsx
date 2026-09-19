import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { HelpTooltip } from '@/components/prof/HelpTooltip';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import {
  getAllDemoProcessos, getDemoPartes, getDemoDocumentos,
  saveDemoProcesso, saveDemoMovimentacao, saveDemoIntimacao, saveDemoDocumento,
} from '@/data/demoStore';
import { listarCadastros } from '@/data/cadastroStore';
import type { Processo, Parte, Documento } from '@/integrations/supabase/types';
import { baixarDocumento, sanitizeStorageSegment } from '@/lib/downloadDoc';
import { CheckCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { ArvoreDeEventos } from '@/components/eventos/ArvoreDeEventos';
import { EventoDetalheDialog } from '@/components/eventos/EventoDetalheDialog';
import type { EventoUnificado } from '@/lib/eventos/adapter';

function formatDate(iso: string) { return new Date(iso).toLocaleString('pt-BR'); }

function parseFeedbackWithValor(raw: string): { valorProva: number | null; feedback: string } {
  const m = /^\[VP=([\d.]+)\]\s*\n?/.exec(raw);
  if (m) return { valorProva: parseFloat(m[1]), feedback: raw.slice(m[0].length) };
  return { valorProva: null, feedback: raw };
}

function formatNota(n: number | null | undefined, valor: number): string {
  const nn = typeof n === 'number' ? n : 0;
  const casas = Number.isInteger(nn) && Number.isInteger(valor) ? 0 : 1;
  return `${nn.toFixed(casas).replace('.', ',')} / ${valor.toFixed(Number.isInteger(valor) ? 0 : 1).replace('.', ',')}`;
}

type Acao = 'despacho' | 'emenda' | 'encerrar';

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
  const [valorProva, setValorProva] = useState('10');
  const prazoResposta = ''; // reservado (não mais editável na UI)
  const acao: Acao = 'despacho'; // simplificado: única ação
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [arquivoDespacho, setArquivoDespacho] = useState<File | null>(null);
  const [detalhando, setDetalhando] = useState<EventoUnificado | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    if (DEMO_MODE) {
      const p = getAllDemoProcessos().find(p => p.id === id);
      if (p) {
        setProcesso(p);
        const { valorProva: vpExist, feedback: fbExist } = parseFeedbackWithValor(p.feedback_professor ?? '');
        setFeedback(fbExist);
        if (vpExist) setValorProva(String(vpExist));
        setNota(p.nota != null ? String(p.nota) : '');
        setPartes(getDemoPartes(id));
        setDocumentos(getDemoDocumentos(id));
        const cadastros = listarCadastros();
        const cadAluno = cadastros.find(c => c.id === p.aluno_id);
        setNomeAluno(cadAluno?.nome ?? 'Aluno');
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
        const { valorProva: vpExist, feedback: fbExist } = parseFeedbackWithValor((pRes.data as any).feedback_professor ?? '');
        setFeedback(fbExist);
        if (vpExist) setValorProva(String(vpExist));
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
    const valorProvaNum = parseFloat(valorProva.replace(',', '.'));
    if (isNaN(valorProvaNum) || valorProvaNum <= 0) {
      alert('Informe o valor total da prova (número maior que zero, ex: 30).');
      return;
    }
    if (!nota) {
      alert(`Por favor, informe a nota do aluno (de 0 a ${valorProvaNum}).`);
      return;
    }
    const notaNum = parseFloat(nota.replace(',', '.'));
    if (isNaN(notaNum) || notaNum < 0 || notaNum > valorProvaNum) {
      alert(`A nota deve ser um número entre 0 e ${valorProvaNum}. Você pode usar decimais (ex: 7,5).`);
      return;
    }

    const notaFmt = formatNota(notaNum, valorProvaNum);

    if (acao === 'encerrar') {
      const ok = confirm(
        `Você está encerrando definitivamente esta atividade.\n\nO aluno ${nomeAluno} receberá a nota final: ${notaFmt}.\n\nDeseja continuar?`
      );
      if (!ok) return;
    }

    setSalvando(true);
    const now = new Date().toISOString();
    const novoStatus = acao === 'encerrar' ? 'encerrado' : acao === 'emenda' ? 'devolvido' : 'com_despacho';
    const tipoMov = acao === 'despacho' ? 'despacho' : acao === 'emenda' ? 'solicitacao_emenda' : 'encerramento';

    try {
      const feedbackStored = `[VP=${valorProvaNum}]\n${feedback}`;
      if (DEMO_MODE) {
        saveDemoProcesso({
          ...processo!,
          status: novoStatus,
          nota: notaNum,
          feedback_professor: feedbackStored,
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
            ? `Processo encerrado pela professora.\n\nFeedback final:\n${feedback}\n\nNota atribuída: ${notaFmt}`
            : acao === 'emenda'
            ? `Solicitação de Correção:\n\n${feedback}\n\nPrazo para ajuste: ${prazoResposta ? new Date(`${prazoResposta}T00:00:00Z`).toLocaleDateString('pt-BR') : 'a definir'}`
            : `Despacho da Professora:\n\n${feedback}\n\nNota atribuída: ${notaFmt}`;

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

        if (arquivoDespacho) {
          const storagePath = `processos/${id}/despacho/${sanitizeStorageSegment(arquivoDespacho.name)}`;
          const up = await supabase.storage
            .from('documentos')
            .upload(storagePath, arquivoDespacho, { upsert: true });
          if (up.error) {
            alert(`Falha ao anexar o despacho ao Storage:\n${up.error.message}`);
            setSalvando(false);
            return;
          }
          saveDemoDocumento({
            id: crypto.randomUUID(),
            processo_id: id!,
            aluno_id: processo!.aluno_id,
            tipo: 'Despacho do Professor',
            nome_arquivo: arquivoDespacho.name,
            storage_path: storagePath,
            tamanho_bytes: arquivoDespacho.size,
            created_at: now,
          });
        }
      } else {
        await supabase!.from('processos').update({
          status: novoStatus, nota: notaNum, feedback_professor: feedbackStored, updated_at: now,
        }).eq('id', id);
        await supabase!.from('movimentacoes').insert({
          processo_id: id, tipo: tipoMov, descricao: feedback, autor_id: user!.id,
        });
        await supabase!.from('intimacoes').insert({
          processo_id: id, destinatario_id: processo!.aluno_id, remetente_id: user!.id,
          texto: `${acao === 'despacho' ? 'Despacho' : acao === 'emenda' ? 'Solicitação de Correção' : 'Processo Encerrado'}:\n\n${feedback}${notaNum ? `\n\nNota: ${notaFmt}` : ''}`,
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
              Avaliação salva.
            </div>
            <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
              A nota e a observação para <strong>{nomeAluno}</strong> foram registradas.
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="prof-btn-secondary"
                style={{ height: 52, padding: '0 28px', fontSize: 15 }}
                onClick={() => navigate('/prof/peticoes')}
              >
                Ver outros processos
              </button>
              <button
                className="prof-btn-primary"
                style={{ height: 52, padding: '0 28px', fontSize: 15 }}
                onClick={() => navigate(`/professor/processos/${processo?.id}`)}
              >
                Abrir processo completo
              </button>
            </div>
          </div>
        </div>
      </ProfLayout>
    );
  }

  const poloAtivo = partes.filter(p => p.polo === 'ativo');
  const poloPassivo = partes.filter(p => p.polo === 'passivo');

  const submitLabel = 'Salvar avaliação';

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1200 }}>

        {/* ── 6.1 Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span className="prof-page-title" style={{ marginBottom: 0 }}>
              Avaliação da Atividade
            </span>
            <HelpTooltip text={'Analise a atividade do aluno acessando o processo completo,\nescreva sua observação e atribua a nota.'} />
          </div>
          <div style={{ fontSize: 16, color: '#6b7280', marginTop: 4 }}>
            Aluno: <strong>{nomeAluno}</strong> — Processo:{' '}
            <a
              href={`/professor/processos/${processo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'monospace', fontWeight: 700,
                color: '#1e40af', textDecoration: 'underline',
                fontSize: 16,
              }}
              title="Abrir painel completo do processo em nova aba"
            >
              {processo.numero_processo}
            </a>
            <span style={{ marginLeft: 6, color: '#9ca3af', fontSize: 13 }}>
              (clique para ver todos os eventos do processo)
            </span>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              href={`/professor/processos/${processo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="prof-btn-secondary"
              style={{
                height: 40, padding: '0 16px', fontSize: 14,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={16} /> Abrir processo completo em nova aba
              <ArrowRight size={14} />
            </a>
            <button
              type="button"
              onClick={() => navigate(`/professor/processos/${processo.id}`)}
              className="prof-btn-secondary"
              style={{ height: 40, padding: '0 16px', fontSize: 14 }}
            >
              Ir para o processo (mesma aba)
            </button>
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
                      <button
                        className="prof-btn-secondary"
                        style={{ height: 36, padding: '0 14px', fontSize: 13 }}
                        onClick={() => baixarDocumento(d.storage_path, d.nome_arquivo)}
                      >
                        Baixar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="prof-card" style={{ padding: 0 }}>
              <div className="prof-card-header">Linha do Tempo do Processo</div>
              <div style={{ padding: 12 }}>
                <ArvoreDeEventos
                  processoId={processo.id}
                  dataDistribuicao={processo.created_at}
                  viewMode="aluno"
                  onAbrirDetalhes={setDetalhando}
                />
                <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Todos os eventos do processo (incluindo petições posteriores do aluno).
                  Para emitir despacho, decisão ou sentença, use o painel do processo completo.
                </p>
              </div>
            </div>
          </div>

          {/* ── 6.3 Right: Correction panel ── */}
          <div className="prof-card" style={{ padding: 0 }}>
            <div className="prof-card-header">
              Sua Avaliação
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div style={{
                padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: 4, fontSize: 13, color: '#0c4a6e', lineHeight: 1.5,
              }}>
                <strong>Como funciona:</strong> abra o processo completo pelo botão acima
                para ver a linha do tempo e os documentos. Volte aqui, escreva sua observação
                e atribua a nota. Despachos, decisões e sentenças são emitidos dentro do próprio
                processo, e não por esta tela.
              </div>

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

              {/* Anexar documento de despacho (opcional) */}
              <div>
                <label className="prof-label" style={{ fontSize: 17 }}>
                  Anexar documento de despacho (PDF ou DOCX) — opcional
                  <HelpTooltip text="Se quiser, anexe um documento formal (ex: modelo de despacho assinado). O aluno poderá baixá-lo junto com seu parecer." />
                </label>
                <label
                  htmlFor="arquivo-despacho-input"
                  className="prof-btn-secondary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 40, padding: '0 16px', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Escolher arquivo
                </label>
                <input
                  id="arquivo-despacho-input"
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 10 * 1024 * 1024) {
                      alert('Arquivo muito grande (máx 10 MB).');
                      e.target.value = '';
                      return;
                    }
                    setArquivoDespacho(file);
                  }}
                />
                {arquivoDespacho && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#166534' }}>
                    <CheckCircle size={16} color="#22c55e" />
                    <span>{arquivoDespacho.name}</span>
                  </div>
                )}
              </div>

              {/* Valor total da prova */}
              <div>
                <label className="prof-label" style={{ fontSize: 17 }}>
                  Valor total da prova <span style={{ color: '#dc2626' }}>*</span>
                  <HelpTooltip text={'Quantos pontos vale esta prova/atividade no total?\nEx: 10, 30, 100. A nota do aluno é lançada dentro desse valor.'} />
                </label>
                <input
                  type="number"
                  className="prof-input"
                  style={{ width: 120, height: 48, fontSize: 18, textAlign: 'center' }}
                  value={valorProva}
                  onChange={e => setValorProva(e.target.value)}
                  min={0.1}
                  step={1}
                  placeholder="10"
                />
              </div>

              {/* Nota */}
              <div>
                <label className="prof-label" style={{ fontSize: 17 }}>
                  Nota do aluno (de 0 a {valorProva || '?'}) <span style={{ color: '#dc2626' }}>*</span>
                  <HelpTooltip text={'Dê a nota do aluno dentro do valor total da prova (ex: 25 de 30).\nVocê pode usar decimais (ex: 7,5).\nEsta nota ficará registrada no sistema e será visível para o aluno.'} />
                </label>
                <input
                  type="number"
                  className="prof-input"
                  style={{ width: 120, height: 48, fontSize: 18, textAlign: 'center' }}
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  min={0}
                  max={parseFloat(valorProva) || undefined}
                  step={0.5}
                  placeholder={`0–${valorProva || '?'}`}
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

      <EventoDetalheDialog
        evento={detalhando}
        aberto={detalhando != null}
        onFechar={() => setDetalhando(null)}
      />
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
