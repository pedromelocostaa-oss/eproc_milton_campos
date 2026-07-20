import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import {
  UploadCloud, Info, Plus, Trash2, FileText, Users, Paperclip,
  CheckCircle2, GraduationCap, Search, FolderPlus,
} from 'lucide-react';
import { formatCpf, formatCnpj } from '@/lib/masks';
import { saveArquivo, deleteArquivo } from '@/lib/fileStore';
import {
  getAcervoDoProfessor, saveAcervoProcesso, deleteAcervoProcesso,
  type AcervoProcesso, type AcervoParte, type AcervoDocumento,
} from '@/data/acervoStore';

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

type ParteForm = AcervoParte;
interface DocForm { id: string; nome: string; tipoPeca: string; file: File; }

const TIPOS_PECA = ['Petição Inicial', 'Procuração', 'Documento pessoal', 'Contestação', 'Decisão / Despacho', 'Sentença', 'Recurso', 'Laudo / Perícia', 'Outro'];

function novaParte(polo: 'ativo' | 'passivo'): ParteForm {
  return { id: uid(), nome: '', polo, tipoPessoa: 'fisica', cpfCnpj: '' };
}

export default function DisponibilizarProcessosPage() {
  const { user } = useAuth();
  const professorId = user?.id ?? '';

  const [lista, setLista] = useState<AcervoProcesso[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');

  const [numero, setNumero] = useState('');
  const [classe, setClasse] = useState('');
  const [assunto, setAssunto] = useState('');
  const [vara, setVara] = useState('');
  const [partes, setPartes] = useState<ParteForm[]>([novaParte('ativo'), novaParte('passivo')]);
  const [docs, setDocs] = useState<DocForm[]>([]);
  const [erro, setErro] = useState('');

  const recarregar = () => setLista(getAcervoDoProfessor(professorId));
  useEffect(() => { if (professorId) recarregar(); }, [professorId]);

  const limparForm = () => {
    setNumero(''); setClasse(''); setAssunto(''); setVara('');
    setPartes([novaParte('ativo'), novaParte('passivo')]); setDocs([]); setErro('');
  };

  const addParte = () => setPartes([...partes, novaParte('passivo')]);
  const removeParte = (id: string) => setPartes(partes.filter(p => p.id !== id));
  const updateParte = (id: string, patch: Partial<ParteForm>) =>
    setPartes(partes.map(p => p.id === id ? { ...p, ...patch } : p));

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const novos: DocForm[] = Array.from(files).map(f => ({ id: uid(), nome: f.name, tipoPeca: 'Petição Inicial', file: f }));
    setDocs(d => [...d, ...novos]);
  };
  const removeDoc = (id: string) => setDocs(docs.filter(d => d.id !== id));

  const salvar = async () => {
    setErro('');
    if (!numero.trim()) { setErro('Informe o número do processo.'); return; }
    const partesValidas = partes.filter(p => p.nome.trim());
    if (partesValidas.length === 0) { setErro('Cadastre ao menos uma parte (autor ou réu) com nome.'); return; }

    setSalvando(true);
    try {
      const documentos: AcervoDocumento[] = [];
      for (const d of docs) {
        await saveArquivo(d.id, d.file);
        documentos.push({ id: d.id, nome: d.nome, tipoPeca: d.tipoPeca, mime: d.file.type || 'application/octet-stream', tamanho: d.file.size });
      }
      const proc: AcervoProcesso = {
        id: uid(), professorId, numeroProcesso: numero.trim(),
        classe: classe.trim(), assunto: assunto.trim(), vara: vara.trim(),
        valorCausa: null, segredoJustica: false,
        partes: partesValidas.map(({ ...p }) => p), documentos,
        createdAt: new Date().toISOString(),
      };
      saveAcervoProcesso(proc);
      recarregar(); limparForm(); setMostrarForm(false);
      setSucesso(`Processo ${proc.numeroProcesso} disponibilizado para seus alunos!`);
      setTimeout(() => setSucesso(''), 6000);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (proc: AcervoProcesso) => {
    if (!confirm(`Remover o processo ${proc.numeroProcesso}? Os alunos deixarão de vê-lo.`)) return;
    for (const d of proc.documentos) { try { await deleteArquivo(d.id); } catch { /* noop */ } }
    deleteAcervoProcesso(proc.id); recarregar();
  };

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1100 }}>
        <div className="prof-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderPlus size={24} color="#1e40af" /> Banco de Processos
        </div>
        <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 20 }}>
          Cadastre processos e anexe seus documentos para que seus alunos possam consultá-los.
        </div>

        {/* Explicação */}
        <div className="prof-card" style={{ marginBottom: 20, background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Info size={22} color="#1e40af" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e3a5f', marginBottom: 6 }}>Para que serve esta página?</div>
              <p style={{ marginBottom: 10 }}>
                Aqui você cadastra processos e anexa os documentos deles. Esses processos ficam disponíveis
                para os seus alunos <strong>pesquisarem na tela "Consulta Processual"</strong>, exatamente
                como um advogado pesquisa processos no sistema real.
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <GraduationCap size={17} color="#1e40af" style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Quem vê:</strong> apenas os <strong>seus alunos</strong> (matriculados nas suas turmas). Alunos de outros professores não têm acesso.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Search size={17} color="#1e40af" style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Como o aluno encontra:</strong> pesquisando pelo número do processo, nome da parte, CPF/CNPJ ou OAB. Por isso, preencha bem esses dados.</span>
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

        {!mostrarForm && (
          <button className="prof-btn-primary" style={{ marginBottom: 20 }} onClick={() => { limparForm(); setMostrarForm(true); }}>
            <Plus size={18} /> Adicionar processo
          </button>
        )}

        {/* Formulário */}
        {mostrarForm && (
          <div className="prof-card" style={{ marginBottom: 20, padding: 0 }}>
            <div className="prof-card-header"><FolderPlus size={18} color="#1e40af" /> Novo processo</div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Passo 1 */}
              <section>
                <StepTitle n={1} icon={FileText} titulo="Dados do processo" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 14 }}>
                  <div style={{ gridColumn: '1 / -1', maxWidth: 460 }}>
                    <label className="prof-label">Número do processo: *</label>
                    <input className="prof-input" value={numero} onChange={e => setNumero(e.target.value)} placeholder="0000000-00.0000.8.13.0000" />
                  </div>
                  <div>
                    <label className="prof-label">Classe processual:</label>
                    <input className="prof-input" value={classe} onChange={e => setClasse(e.target.value)} placeholder="Ex.: Procedimento Comum Cível" />
                  </div>
                  <div>
                    <label className="prof-label">Assunto:</label>
                    <input className="prof-input" value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Ex.: Indenização por Dano Moral" />
                  </div>
                  <div>
                    <label className="prof-label">Vara / Órgão julgador:</label>
                    <input className="prof-input" value={vara} onChange={e => setVara(e.target.value)} placeholder="Ex.: 2ª Vara Cível de BH" />
                  </div>
                </div>
              </section>

              {/* Passo 2 */}
              <section>
                <StepTitle n={2} icon={Users} titulo="Partes do processo" />
                <div style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 14px' }}>
                  Cadastre as partes (autor e réu). O nome e o CPF/CNPJ são o que o aluno usa para pesquisar.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {partes.map(p => (
                    <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, background: '#f9fafb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr)) 44px', gap: 10, alignItems: 'end' }}>
                        <div>
                          <label className="prof-label">Polo:</label>
                          <select className="prof-input" value={p.polo} onChange={e => updateParte(p.id, { polo: e.target.value as 'ativo' | 'passivo' })}>
                            <option value="ativo">Autor (polo ativo)</option>
                            <option value="passivo">Réu (polo passivo)</option>
                          </select>
                        </div>
                        <div>
                          <label className="prof-label">Tipo:</label>
                          <select className="prof-input" value={p.tipoPessoa} onChange={e => updateParte(p.id, { tipoPessoa: e.target.value as 'fisica' | 'juridica', cpfCnpj: '' })}>
                            <option value="fisica">Pessoa Física</option>
                            <option value="juridica">Pessoa Jurídica</option>
                          </select>
                        </div>
                        <div>
                          <label className="prof-label">Nome / Razão social:</label>
                          <input className="prof-input" value={p.nome} onChange={e => updateParte(p.id, { nome: e.target.value })} />
                        </div>
                        <div>
                          <label className="prof-label">{p.tipoPessoa === 'fisica' ? 'CPF:' : 'CNPJ:'}</label>
                          <input className="prof-input" value={p.tipoPessoa === 'fisica' ? formatCpf(p.cpfCnpj) : formatCnpj(p.cpfCnpj)} onChange={e => updateParte(p.id, { cpfCnpj: e.target.value.replace(/\D/g, '') })} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
                          {partes.length > 1 && (
                            <button title="Remover parte" onClick={() => removeParte(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 8 }}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="prof-btn-secondary" style={{ height: 38, marginTop: 12, fontSize: 14 }} onClick={addParte}>
                  <Plus size={16} /> Adicionar outra parte
                </button>
              </section>

              {/* Passo 3 */}
              <section>
                <StepTitle n={3} icon={Paperclip} titulo="Documentos do processo" />
                <div style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 14px' }}>
                  Anexe os documentos (peças) deste processo. O aluno poderá abri-los ao consultar o processo.
                </div>

                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, border: '2px dashed #93c5fd', borderRadius: 8, padding: 28,
                  background: '#eff6ff', cursor: 'pointer',
                }}>
                  <UploadCloud size={34} color="#3b82f6" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>Clique aqui para selecionar os arquivos</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Você pode selecionar vários de uma vez (PDF, imagens, documentos)</span>
                  <input type="file" multiple style={{ display: 'none' }} onChange={e => onFiles(e.target.files)} />
                </label>

                {docs.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {docs.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, background: '#fff' }}>
                        <FileText size={18} color="#64748b" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nome}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{(d.file.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <select className="prof-input" style={{ width: 210, height: 38, fontSize: 13 }} value={d.tipoPeca} onChange={e => setDocs(docs.map(x => x.id === d.id ? { ...x, tipoPeca: e.target.value } : x))}>
                          {TIPOS_PECA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button title="Remover" onClick={() => removeDoc(d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, flexShrink: 0 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {erro && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 6, padding: '10px 14px', fontSize: 14 }}>{erro}</div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <button className="prof-btn-primary" onClick={salvar} disabled={salvando}>
                  <CheckCircle2 size={18} /> {salvando ? 'Salvando...' : 'Salvar e disponibilizar'}
                </button>
                <button className="prof-btn-secondary" onClick={() => { setMostrarForm(false); limparForm(); }} disabled={salvando}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="prof-card" style={{ padding: 0 }}>
          <div className="prof-card-header" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color="#1e40af" /> Processos disponibilizados</span>
            <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>{lista.length} processo(s)</span>
          </div>
          {lista.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
              Você ainda não disponibilizou nenhum processo.<br />
              Clique em <strong>“Adicionar processo”</strong> para começar.
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

function StepTitle({ n, icon: Icon, titulo }: { n: number; icon: typeof FileText; titulo: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e40af', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <Icon size={18} color="#64748b" />
      <span style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>{titulo}</span>
    </div>
  );
}
