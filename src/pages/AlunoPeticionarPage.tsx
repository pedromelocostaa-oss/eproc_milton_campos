import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Loader2, Upload, X, Send, Check } from 'lucide-react';
import { SUBTIPO_CONFIG, SUBTIPOS_ALUNO } from '@/lib/eventos/subtipoConfig';
import { sanitizeStorageSegment } from '@/lib/downloadDoc';
import type { EventoSubtipo, Processo } from '@/integrations/supabase/types';

type EtapaId = 1 | 2 | 3 | 4 | 5;
const ETAPAS: { id: EtapaId; label: string }[] = [
  { id: 1, label: 'Tipo de Petição' },
  { id: 2, label: 'Título' },
  { id: 3, label: 'Conteúdo' },
  { id: 4, label: 'Documentos' },
  { id: 5, label: 'Revisar' },
];

interface DocSelecionado { file: File; nomeExibicao: string; }

export default function AlunoPeticionarPage() {
  const { id: processoId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [processo, setProcesso] = useState<Processo | null>(null);
  const [temPeticaoInicial, setTemPeticaoInicial] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [etapa, setEtapa] = useState<EtapaId>(1);
  const [confirmSair, setConfirmSair] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [subtipo, setSubtipo] = useState<EventoSubtipo | ''>('');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [docs, setDocs] = useState<DocSelecionado[]>([]);

  useEffect(() => {
    if (!processoId) return;
    (async () => {
      const [pRes, evRes] = await Promise.all([
        supabase.from('processos').select('*').eq('id', processoId).single(),
        supabase.from('eventos').select('id').eq('processo_id', processoId).eq('subtipo', 'peticao_inicial').limit(1),
      ]);
      if (pRes.data) setProcesso(pRes.data as Processo);
      setTemPeticaoInicial((evRes.data ?? []).length > 0);
      setCarregando(false);
    })();
  }, [processoId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmSair(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const subtiposDisponiveis = useMemo(
    () => SUBTIPOS_ALUNO.filter(s => temPeticaoInicial ? s !== 'peticao_inicial' : true),
    [temPeticaoInicial],
  );

  const podeAvancar = useMemo(() => {
    if (etapa === 1) return !!subtipo;
    if (etapa === 2) return titulo.trim().length > 0;
    if (etapa === 3) return corpo.trim().length > 0;
    if (etapa === 4) return docs.length > 0; // documento obrigatório
    return docs.length > 0;
  }, [etapa, subtipo, titulo, corpo, docs.length]);

  function selecionarSubtipo(v: EventoSubtipo) {
    setSubtipo(v);
    if (!titulo) setTitulo(SUBTIPO_CONFIG[v].label);
  }

  function adicionarArquivos(files: FileList | null) {
    if (!files) return;
    const MAX = 10 * 1024 * 1024;
    const validos = Array.from(files).filter(f => {
      if (f.size > MAX) { toast.error(`"${f.name}" excede 10 MB e foi ignorado.`); return false; }
      return true;
    });
    setDocs(prev => [...prev, ...validos.map(f => ({ file: f, nomeExibicao: f.name }))]);
  }

  function removerDoc(idx: number) {
    setDocs(prev => prev.filter((_, i) => i !== idx));
  }

  function moverDoc(idx: number, dir: -1 | 1) {
    setDocs(prev => {
      const nova = [...prev];
      const alvo = idx + dir;
      if (alvo < 0 || alvo >= nova.length) return prev;
      [nova[idx], nova[alvo]] = [nova[alvo], nova[idx]];
      return nova;
    });
  }

  async function enviarPeticao() {
    if (!processoId || !subtipo || !user) return;
    setEnviando(true);
    try {
      const nomeAutor = (user as { nome_completo?: string; nome?: string }).nome_completo
        ?? (user as { nome?: string }).nome
        ?? 'Requerente';
      const tituloComAutor = /—\s*/.test(titulo) ? titulo.trim() : `${titulo.trim()} — ${nomeAutor}`;

      const { data: eventoInserido, error: evErr } = await supabase
        .from('eventos')
        .insert({
          processo_id: processoId,
          subtipo,
          autor_papel: 'aluno',
          autor_id: user.id,
          titulo: tituloComAutor,
          corpo: corpo.trim() || null,
        })
        .select('id, numero')
        .single();
      if (evErr || !eventoInserido) throw evErr ?? new Error('Falha ao criar evento');

      const eventoId = eventoInserido.id as string;
      const uploadsRows: Array<{ evento_id: string; nome: string; storage_path: string; mime_type: string | null; tamanho_bytes: number; ordem: number }> = [];

      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        const path = `processos/${processoId}/eventos/${eventoId}/${i}-${sanitizeStorageSegment(d.file.name)}`;
        const up = await supabase.storage.from('evento-documentos').upload(path, d.file, { upsert: true });
        if (up.error) throw new Error(`Falha ao enviar "${d.file.name}": ${up.error.message}`);
        uploadsRows.push({
          evento_id: eventoId,
          nome: d.file.name,
          storage_path: path,
          mime_type: d.file.type || null,
          tamanho_bytes: d.file.size,
          ordem: i,
        });
      }

      if (uploadsRows.length > 0) {
        const { error: docsErr } = await supabase.from('evento_documentos').insert(uploadsRows);
        if (docsErr) throw docsErr;
      }

      toast.success('Petição juntada aos autos.');
      navigate(`/aluno/processos/${processoId}?destaque=${eventoInserido.numero}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar petição.';
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <EprocLayout><div className="p-6 text-[12px]">Carregando...</div></EprocLayout>;
  if (!processo) return <EprocLayout><div className="p-6 text-[12px]">Processo não encontrado.</div></EprocLayout>;

  return (
    <EprocLayout>
      <div className="p-4 max-w-3xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-4">
          {ETAPAS.map((e, i) => (
            <div key={e.id} className="flex items-center flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                  etapa > e.id
                    ? 'bg-eproc-header text-white'
                    : etapa === e.id
                    ? 'bg-eproc-header text-white ring-4 ring-eproc-header/20'
                    : 'bg-white border border-eproc-borda text-eproc-texto-secundario'
                }`}
              >
                {etapa > e.id ? <Check className="h-3.5 w-3.5" /> : e.id}
              </div>
              {i < ETAPAS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${etapa > e.id ? 'bg-eproc-header' : 'bg-eproc-borda'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="border border-eproc-borda bg-white p-5 min-h-[420px] flex flex-col">
          <header className="mb-4">
            <h1 className="text-[15px] font-semibold text-eproc-texto">Nova Petição</h1>
            <p className="text-[12px] text-eproc-texto-secundario mt-0.5">
              Etapa {etapa} de 5 · {ETAPAS[etapa - 1].label} · Processo{' '}
              <span className="font-mono">{processo.numero_processo}</span>
            </p>
          </header>

          <div className="flex-1 transition-opacity duration-150" key={etapa}>
            {etapa === 1 && (
              <div className="space-y-3">
                <label className="text-[12px] font-semibold text-eproc-texto">
                  Tipo de Petição <span className="text-destructive">*</span>
                </label>
                <select
                  value={subtipo}
                  onChange={e => selecionarSubtipo(e.target.value as EventoSubtipo)}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 460,
                    height: 40,
                    padding: '0 12px',
                    fontSize: 13,
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    background: '#fff',
                    color: '#333',
                  }}
                >
                  <option value="">— Selecione o tipo —</option>
                  {subtiposDisponiveis.map(s => (
                    <option key={s} value={s}>{SUBTIPO_CONFIG[s].label}</option>
                  ))}
                </select>
                {subtipo && (
                  <div className="text-[11px] text-eproc-texto-secundario italic">
                    Tipo selecionado: <strong>{SUBTIPO_CONFIG[subtipo].label}</strong>. Clique em Próximo para continuar.
                  </div>
                )}
                {temPeticaoInicial && (
                  <p className="text-[11px] text-eproc-texto-secundario">
                    Este processo já tem petição inicial protocolada.
                  </p>
                )}
              </div>
            )}

            {etapa === 2 && (
              <div className="space-y-3">
                <label className="text-[12px] font-semibold text-eproc-texto">Título</label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Petição de Juntada de Documentos" className="max-w-md" />
              </div>
            )}

            {etapa === 3 && (
              <div className="space-y-3 flex-1 flex flex-col">
                <label className="text-[12px] font-semibold text-eproc-texto">Conteúdo</label>
                <Textarea
                  value={corpo}
                  onChange={e => setCorpo(e.target.value)}
                  placeholder="Digite o conteúdo da petição, ou cole de um editor externo (Word, Google Docs)."
                  className="font-mono text-[13px] min-h-[320px] flex-1"
                />
              </div>
            )}

            {etapa === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-eproc-texto">
                    Documentos anexos <span className="text-destructive">*</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-[12px] font-medium text-eproc-link hover:underline cursor-pointer">
                    <Upload className="h-3.5 w-3.5" /> Adicionar arquivo(s)
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={e => { adicionarArquivos(e.target.files); e.target.value = ''; }}
                    />
                  </label>
                </div>
                {docs.length === 0 ? (
                  <p className="text-[12px] text-destructive">É obrigatório anexar ao menos um documento (PDF ou DOCX) para peticionar.</p>
                ) : (
                  <ul className="border border-eproc-borda divide-y divide-eproc-borda">
                    {docs.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 px-3 py-2 text-[12px]">
                        <span className="font-mono text-eproc-texto-secundario w-6">{i + 1}.</span>
                        <span className="flex-1 truncate">{d.nomeExibicao}</span>
                        <span className="text-[11px] text-eproc-texto-secundario">{(d.file.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={() => moverDoc(i, -1)} disabled={i === 0} className="px-1 text-[11px] disabled:opacity-30">▲</button>
                        <button type="button" onClick={() => moverDoc(i, 1)} disabled={i === docs.length - 1} className="px-1 text-[11px] disabled:opacity-30">▼</button>
                        <button type="button" onClick={() => removerDoc(i)} className="text-destructive"><X className="h-3.5 w-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {etapa === 5 && subtipo && (
              <div className="space-y-3 text-[12px]">
                <div>
                  <div className="text-eproc-texto-secundario">Tipo</div>
                  <div className="font-semibold">{SUBTIPO_CONFIG[subtipo].label}</div>
                </div>
                <div>
                  <div className="text-eproc-texto-secundario">Título</div>
                  <div>{titulo}</div>
                </div>
                <div>
                  <div className="text-eproc-texto-secundario">Conteúdo</div>
                  <div className="whitespace-pre-line font-mono border border-eproc-borda p-3 max-h-56 overflow-auto bg-eproc-tabela-row-alt">
                    {corpo}
                  </div>
                </div>
                <div>
                  <div className="text-eproc-texto-secundario">Documentos ({docs.length})</div>
                  {docs.length === 0 ? (
                    <div className="italic text-eproc-texto-secundario">Nenhum</div>
                  ) : (
                    <ul className="list-decimal list-inside">
                      {docs.map((d, i) => <li key={i}>{d.nomeExibicao}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 16,
              marginTop: 16,
              borderTop: '1px solid #d1d5db',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setConfirmSair(true)}
              disabled={enviando}
              style={{
                height: 36, padding: '0 16px', fontSize: 13,
                border: '1px solid #d1d5db', borderRadius: 4,
                background: '#fff', color: '#333', cursor: enviando ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {etapa > 1 && (
                <button
                  type="button"
                  onClick={() => setEtapa(e => (e - 1) as EtapaId)}
                  disabled={enviando}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    height: 36, padding: '0 16px', fontSize: 13,
                    border: '1px solid #d1d5db', borderRadius: 4,
                    background: '#fff', color: '#333', cursor: enviando ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={14} /> Voltar
                </button>
              )}
              {etapa < 5 ? (
                <button
                  type="button"
                  onClick={() => setEtapa(e => (e + 1) as EtapaId)}
                  disabled={!podeAvancar}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    height: 36, padding: '0 18px', fontSize: 13, fontWeight: 700,
                    border: 'none', borderRadius: 4,
                    background: podeAvancar ? '#1a5276' : '#9ca3af',
                    color: '#fff',
                    cursor: podeAvancar ? 'pointer' : 'not-allowed',
                  }}
                >
                  Próximo <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enviarPeticao}
                  disabled={enviando || !podeAvancar}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    height: 36, padding: '0 18px', fontSize: 13, fontWeight: 700,
                    border: 'none', borderRadius: 4,
                    background: (!enviando && podeAvancar) ? '#1a5276' : '#9ca3af',
                    color: '#fff',
                    cursor: (enviando || !podeAvancar) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {enviando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {enviando ? 'Enviando...' : 'Enviar Petição'}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      <AlertDialog open={confirmSair} onOpenChange={setConfirmSair}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do peticionamento?</AlertDialogTitle>
            <AlertDialogDescription>Você perderá o rascunho não enviado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar peticionando</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/aluno/processos/${processoId}`)}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EprocLayout>
  );
}
