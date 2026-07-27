import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import {
  UploadCloud, Info, Plus, Trash2, FileText, Users, Paperclip,
  CheckCircle2, GraduationCap, Search, FolderPlus, Loader2, AlertTriangle, Pencil,
} from 'lucide-react';
import { formatCpf, formatCnpj } from '@/lib/masks';
import { saveArquivo, deleteArquivo } from '@/lib/fileStore';
import { extrairProcessoDoPdf } from '@/lib/pdfExtract';
import {
  getAcervoDoProfessor, saveAcervoProcesso, deleteAcervoProcesso,
  type AcervoProcesso, type AcervoParte, type AcervoDocumento,
} from '@/data/acervoStore';

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

type CardParte = AcervoParte;

interface CardProcesso {
  id: string;
  file: File;
  status: 'processando' | 'lido' | 'nao_lido';
  numero: string;
  classe: string;
  assunto: string;
  vara: string;
  partes: CardParte[];
}

function novaParte(polo: 'ativo' | 'passivo'): CardParte {
  return { id: uid(), nome: '', polo, tipoPessoa: 'fisica', cpfCnpj: '' };
}

export default function DisponibilizarProcessosPage() {
  const { user } = useAuth();
  const professorId = user?.id ?? '';

  const [lista, setLista] = useState<AcervoProcesso[]>([]);
  const [cards, setCards] = useState<CardProcesso[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const recarregar = () => setLista(getAcervoDoProfessor(professorId));
  useEffect(() => { if (professorId) recarregar(); }, [professorId]);

  // ---- Anexar PDFs e extrair automaticamente ----
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErro('');
    const novos: CardProcesso[] = Array.from(files).map(f => ({
      id: uid(), file: f, status: 'processando',
      numero: '', classe: '', assunto: '', vara: '',
      partes: [novaParte('ativo'), novaParte('passivo')],
    }));
    setCards(prev => [...prev, ...novos]);

    for (const card of novos) {
      const dados = await extrairProcessoDoPdf(card.file);
      setCards(prev => prev.map(c => {
        if (c.id !== card.id) return c;
        const partesExtraidas = dados.partes.length
          ? dados.partes.map(p => ({ id: uid(), ...p }))
          : [novaParte('ativo'), novaParte('passivo')];
        // garante pelo menos um autor e um réu visíveis
        if (!partesExtraidas.some(p => p.polo === 'ativo')) partesExtraidas.unshift(novaParte('ativo'));
        if (!partesExtraidas.some(p => p.polo === 'passivo')) partesExtraidas.push(novaParte('passivo'));
        return {
          ...c,
          status: dados.textoLido ? 'lido' : 'nao_lido',
          numero: dados.numero,
          classe: dados.classe,
          assunto: dados.assunto,
          vara: dados.vara,
          partes: partesExtraidas,
        };
      }));
    }
  };

  const updateCard = (id: string, patch: Partial<CardProcesso>) =>
    setCards(cards.map(c => c.id === id ? { ...c, ...patch } : c));
  const removeCard = (id: string) => setCards(cards.filter(c => c.id !== id));

  const updateParte = (cardId: string, parteId: string, patch: Partial<CardParte>) =>
    setCards(cards.map(c => c.id === cardId
      ? { ...c, partes: c.partes.map(p => p.id === parteId ? { ...p, ...patch } : p) }
      : c));
  const addParte = (cardId: string) =>
    setCards(cards.map(c => c.id === cardId ? { ...c, partes: [...c.partes, novaParte('passivo')] } : c));
  const removeParte = (cardId: string, parteId: string) =>
    setCards(cards.map(c => c.id === cardId ? { ...c, partes: c.partes.filter(p => p.id !== parteId) } : c));

  const cardValido = (c: CardProcesso) => c.numero.trim() && c.partes.some(p => p.nome.trim());

  const salvarTodos = async () => {
    setErro('');
    const validos = cards.filter(cardValido);
    if (validos.length === 0) {
      setErro('Cada processo precisa ter ao menos o número e uma parte com nome. Complete os campos em vermelho.');
      return;
    }
    setSalvando(true);
    try {
      for (const c of validos) {
        const docId = uid();
        await saveArquivo(docId, c.file);
        const documentos: AcervoDocumento[] = [{
          id: docId, nome: c.file.name, tipoPeca: 'Processo (PDF)',
          mime: c.file.type || 'application/pdf', tamanho: c.file.size,
        }];
        const proc: AcervoProcesso = {
          id: uid(), professorId, numeroProcesso: c.numero.trim(),
          classe: c.classe.trim(), assunto: c.assunto.trim(), vara: c.vara.trim(),
          valorCausa: null, segredoJustica: false,
          partes: c.partes.filter(p => p.nome.trim()).map(p => ({
            id: p.id, nome: p.nome.trim().toUpperCase(), polo: p.polo,
            tipoPessoa: p.tipoPessoa, cpfCnpj: p.cpfCnpj.replace(/\D/g, ''),
          })),
          documentos, createdAt: new Date().toISOString(),
        };
        saveAcervoProcesso(proc);
      }
      recarregar();
      setCards([]);
      setSucesso(`${validos.length} processo(s) disponibilizado(s) para seus alunos!`);
      setTimeout(() => setSucesso(''), 7000);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (proc: AcervoProcesso) => {
    if (!confirm(`Remover o processo ${proc.numeroProcesso}? Os alunos deixarão de vê-lo.`)) return;
    for (const d of proc.documentos) { try { await deleteArquivo(d.id); } catch { /* noop */ } }
    deleteAcervoProcesso(proc.id); recarregar();
  };

  const processando = cards.some(c => c.status === 'processando');
  const qtdValidos = cards.filter(cardValido).length;

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1100 }}>
        <div className="prof-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderPlus size={24} color="#1e40af" /> Banco de Processos
        </div>
        <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 20 }}>
          Anexe os PDFs dos processos — o sistema lê e preenche os dados sozinho. Você só confere e salva.
        </div>

        {/* Explicação */}
        <div className="prof-card" style={{ marginBottom: 20, background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Info size={22} color="#1e40af" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e3a5f', marginBottom: 6 }}>Como funciona</div>
              <p style={{ marginBottom: 10 }}>
                Anexe os arquivos PDF dos processos (pode ser vários de uma vez). O sistema lê cada PDF e
                preenche automaticamente o número, as partes, o assunto e a vara. Confira o que foi lido,
                ajuste se precisar, e clique em salvar.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <GraduationCap size={17} color="#1e40af" style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Quem vê:</strong> apenas os <strong>seus alunos</strong> (das suas turmas). Alunos de outros professores não têm acesso.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Search size={17} color="#1e40af" style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Como o aluno encontra:</strong> pesquisando por número, nome da parte, CPF/CNPJ ou OAB, e abre o PDF do processo.</span>
              </div>
            </div>
          </div>
        </div>

        {sucesso && (
          <div className="prof-alert-ok" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#22c55e" />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#166534' }}>{sucesso}</span>
          </div>
        )}

        {/* Dropzone principal */}
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, border: '2px dashed #93c5fd', borderRadius: 10, padding: 36,
          background: '#f0f7ff', cursor: 'pointer', marginBottom: 20,
        }}>
          <UploadCloud size={44} color="#3b82f6" />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1e3a5f' }}>Anexe os PDFs dos processos</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Clique aqui e selecione um ou vários arquivos PDF de uma vez</span>
          <input type="file" accept="application/pdf,.pdf" multiple style={{ display: 'none' }} onChange={e => { onFiles(e.target.files); e.currentTarget.value = ''; }} />
        </label>

        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 6, padding: '10px 14px', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> {erro}
          </div>
        )}

        {/* Cartões de revisão (um por PDF) */}
        {cards.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="prof-section-title"><Pencil size={18} color="#1e40af" /> Confira os processos lidos ({cards.length})</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="prof-btn-primary" onClick={salvarTodos} disabled={salvando || processando || qtdValidos === 0}>
                  <CheckCircle2 size={18} /> {salvando ? 'Salvando...' : `Salvar todos (${qtdValidos})`}
                </button>
                <button className="prof-btn-secondary" onClick={() => setCards([])} disabled={salvando}>Limpar</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cards.map(c => (
                <CardRevisao
                  key={c.id}
                  card={c}
                  onUpdate={patch => updateCard(c.id, patch)}
                  onRemove={() => removeCard(c.id)}
                  onUpdateParte={(pid, patch) => updateParte(c.id, pid, patch)}
                  onAddParte={() => addParte(c.id)}
                  onRemoveParte={pid => removeParte(c.id, pid)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lista de processos já disponibilizados */}
        <div className="prof-card" style={{ padding: 0 }}>
          <div className="prof-card-header" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color="#1e40af" /> Processos disponibilizados</span>
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>{lista.length} processo(s)</span>
          </div>
          {lista.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
              Você ainda não disponibilizou nenhum processo.<br />
              Anexe os PDFs acima para começar.
            </div>
          ) : (
            <div>
              {lista.map((p, i) => {
                const autor = p.partes.find(x => x.polo === 'ativo');
                const reu = p.partes.find(x => x.polo === 'passivo');
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', fontFamily: 'monospace' }}>{p.numeroProcesso}</div>
                      <div style={{ fontSize: 14, color: '#334155', marginTop: 2 }}>{autor?.nome || '—'} <span style={{ color: '#9ca3af' }}>×</span> {reu?.nome || '—'}</div>
                      {p.assunto && <div style={{ fontSize: 12, color: '#6b7280' }}>{p.assunto}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        <Paperclip size={12} /> {p.documentos.length} documento(s) · {p.partes.length} parte(s)
                      </div>
                    </div>
                    <button title="Remover processo" onClick={() => excluir(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 8, flexShrink: 0 }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProfLayout>
  );
}

// ---- Cartão de revisão de um PDF ----
function CardRevisao({ card, onUpdate, onRemove, onUpdateParte, onAddParte, onRemoveParte }: {
  card: CardProcesso;
  onUpdate: (patch: Partial<CardProcesso>) => void;
  onRemove: () => void;
  onUpdateParte: (parteId: string, patch: Partial<CardParte>) => void;
  onAddParte: () => void;
  onRemoveParte: (parteId: string) => void;
}) {
  const semNumero = !card.numero.trim();
  return (
    <div className="prof-card" style={{ padding: 0 }}>
      {/* Cabeçalho do cartão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', borderRadius: '8px 8px 0 0' }}>
        <FileText size={18} color="#64748b" />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1e3a5f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.file.name}</span>
        {card.status === 'processando' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1e40af' }}>
            <Loader2 size={14} className="animate-spin" /> Lendo o PDF...
          </span>
        )}
        {card.status === 'lido' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#166534', background: '#dcfce7', padding: '3px 10px', borderRadius: 999 }}>
            <CheckCircle2 size={13} /> Preenchido automaticamente
          </span>
        )}
        {card.status === 'nao_lido' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '3px 10px', borderRadius: 999 }}>
            <AlertTriangle size={13} /> Não foi possível ler — preencha manualmente
          </span>
        )}
        <button title="Remover este arquivo" onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 6 }}>
          <Trash2 size={16} />
        </button>
      </div>

      {card.status !== 'processando' && (
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dados */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1', maxWidth: 460 }}>
              <label className="prof-label">Número do processo: *</label>
              <input className="prof-input" style={semNumero ? { borderColor: '#dc2626', background: '#fff5f5' } : undefined}
                value={card.numero} onChange={e => onUpdate({ numero: e.target.value })} placeholder="0000000-00.0000.8.13.0000" />
            </div>
            <div>
              <label className="prof-label">Classe processual:</label>
              <input className="prof-input" value={card.classe} onChange={e => onUpdate({ classe: e.target.value })} />
            </div>
            <div>
              <label className="prof-label">Assunto:</label>
              <input className="prof-input" value={card.assunto} onChange={e => onUpdate({ assunto: e.target.value })} />
            </div>
            <div>
              <label className="prof-label">Vara / Órgão:</label>
              <input className="prof-input" value={card.vara} onChange={e => onUpdate({ vara: e.target.value })} />
            </div>
          </div>

          {/* Partes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>
              <Users size={16} color="#64748b" /> Partes
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {card.partes.map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1fr) minmax(100px,0.8fr) minmax(160px,1.6fr) minmax(120px,1fr) 36px', gap: 8, alignItems: 'center' }}>
                  <select className="prof-input" style={{ height: 38 }} value={p.polo} onChange={e => onUpdateParte(p.id, { polo: e.target.value as 'ativo' | 'passivo' })}>
                    <option value="ativo">Autor</option>
                    <option value="passivo">Réu</option>
                  </select>
                  <select className="prof-input" style={{ height: 38 }} value={p.tipoPessoa} onChange={e => onUpdateParte(p.id, { tipoPessoa: e.target.value as 'fisica' | 'juridica', cpfCnpj: '' })}>
                    <option value="fisica">Física</option>
                    <option value="juridica">Jurídica</option>
                  </select>
                  <input className="prof-input" style={{ height: 38 }} placeholder="Nome / Razão social" value={p.nome} onChange={e => onUpdateParte(p.id, { nome: e.target.value })} />
                  <input className="prof-input" style={{ height: 38 }} placeholder={p.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                    value={p.tipoPessoa === 'fisica' ? formatCpf(p.cpfCnpj) : formatCnpj(p.cpfCnpj)}
                    onChange={e => onUpdateParte(p.id, { cpfCnpj: e.target.value.replace(/\D/g, '') })} />
                  <button title="Remover parte" onClick={() => onRemoveParte(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 6 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button className="prof-btn-secondary" style={{ height: 34, marginTop: 8, fontSize: 13 }} onClick={onAddParte}>
              <Plus size={14} /> Adicionar parte
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Paperclip size={13} /> O arquivo <strong>{card.file.name}</strong> será anexado como documento do processo.
          </div>
        </div>
      )}
    </div>
  );
}
