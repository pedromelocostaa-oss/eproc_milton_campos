import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
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
import { ChevronLeft, ChevronRight, Loader2, Upload, X, AlertTriangle, Send, Check } from 'lucide-react';
import { SUBTIPO_CONFIG } from '@/lib/eventos/subtipoConfig';
import { sanitizeStorageSegment } from '@/lib/downloadDoc';
import type { EventoSubtipo, Processo } from '@/integrations/supabase/types';

type SubtipoJuiz = 'despacho' | 'decisao' | 'sentenca';
const SUBTIPOS_JUIZ: SubtipoJuiz[] = ['despacho', 'decisao', 'sentenca'];

const DESCRICAO: Record<SubtipoJuiz, string> = {
  despacho: 'Ato de mero expediente. Não resolve mérito nem encerra o processo.',
  decisao:  'Resolve questão incidente sem encerrar o processo.',
  sentenca: 'Encerra o processo em primeiro grau. O aluno não poderá mais peticionar.',
};

type EtapaId = 1 | 2 | 3 | 4 | 5;
const ETAPAS: { id: EtapaId; label: string }[] = [
  { id: 1, label: 'Tipo do ato' },
  { id: 2, label: 'Título' },
  { id: 3, label: 'Conteúdo' },
  { id: 4, label: 'PDF anexo' },
  { id: 5, label: 'Revisar' },
];

export default function ProfessorAtoPage() {
  const { id: processoId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [processo, setProcesso] = useState<Processo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [etapa, setEtapa] = useState<EtapaId>(1);
  const [confirmSair, setConfirmSair] = useState(false);
  const [confirmSentenca, setConfirmSentenca] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const tipoInicial = searchParams.get('tipo') as SubtipoJuiz | null;
  const subtipoBloqueado = tipoInicial === 'sentenca';
  const [subtipo, setSubtipo] = useState<SubtipoJuiz | ''>(tipoInicial ?? '');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);

  useEffect(() => {
    if (!processoId) return;
    (async () => {
      const { data } = await supabase.from('processos').select('*').eq('id', processoId).single();
      if (data) setProcesso(data as Processo);
      setCarregando(false);
    })();
  }, [processoId]);

  const podeAvancar = useMemo(() => {
    if (etapa === 1) return !!subtipo;
    if (etapa === 2) return titulo.trim().length > 0;
    if (etapa === 3) return corpo.trim().length > 0;
    return true;
  }, [etapa, subtipo, titulo, corpo]);

  function selecionarSubtipo(v: SubtipoJuiz) {
    setSubtipo(v);
    if (!titulo) setTitulo(SUBTIPO_CONFIG[v].label);
  }

  function adicionarArquivos(files: FileList | null) {
    if (!files) return;
    const MAX = 10 * 1024 * 1024;
    const validos = Array.from(files).filter(f => {
      if (f.size > MAX) { toast.error(`"${f.name}" excede 10 MB.`); return false; }
      return true;
    });
    setArquivos(prev => [...prev, ...validos]);
  }

  async function emitirAto() {
    if (!processoId || !subtipo || !user) return;
    if (subtipo === 'sentenca' && !confirmSentenca) {
      setConfirmSentenca(true);
      return;
    }
    setEnviando(true);
    try {
      const { data: ev, error: evErr } = await supabase
        .from('eventos')
        .insert({
          processo_id: processoId,
          subtipo: subtipo as EventoSubtipo,
          autor_papel: 'professor_juiz',
          autor_id: user.id,
          titulo: titulo.trim(),
          corpo: corpo.trim() || null,
        })
        .select('id, numero')
        .single();
      if (evErr || !ev) throw evErr ?? new Error('Falha ao criar evento');

      const eventoId = ev.id as string;
      const rows: Array<{ evento_id: string; nome: string; storage_path: string; mime_type: string | null; tamanho_bytes: number; ordem: number }> = [];
      for (let i = 0; i < arquivos.length; i++) {
        const f = arquivos[i];
        const path = `processos/${processoId}/eventos/${eventoId}/${i}-${sanitizeStorageSegment(f.name)}`;
        const up = await supabase.storage.from('evento-documentos').upload(path, f, { upsert: true });
        if (up.error) throw new Error(`Falha ao enviar "${f.name}": ${up.error.message}`);
        rows.push({ evento_id: eventoId, nome: f.name, storage_path: path, mime_type: f.type || null, tamanho_bytes: f.size, ordem: i });
      }
      if (rows.length > 0) {
        const { error } = await supabase.from('evento_documentos').insert(rows);
        if (error) throw error;
      }

      const toastMsg = subtipo === 'despacho' ? 'Despacho publicado.'
        : subtipo === 'decisao' ? 'Decisão publicada.'
        : 'Sentença publicada. Processo encerrado.';
      toast.success(toastMsg);
      navigate(`/professor/processos/${processoId}?destaque=${ev.numero}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao emitir ato.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <ProfLayout><div className="p-6">Carregando...</div></ProfLayout>;
  if (!processo) return <ProfLayout><div className="p-6">Processo não encontrado.</div></ProfLayout>;

  const isSentenca = subtipo === 'sentenca';

  return (
    <ProfLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          {ETAPAS.map((e, i) => (
            <div key={e.id} className="flex items-center flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                etapa > e.id ? 'bg-primary text-primary-foreground'
                  : etapa === e.id ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {etapa > e.id ? <Check className="h-4 w-4" /> : e.id}
              </div>
              {i < ETAPAS.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${etapa > e.id ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm min-h-[440px] flex flex-col">
          <header className="mb-4">
            <h1 className="text-xl font-semibold">Emitir Ato Judicial</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Etapa {etapa} de 5 · {ETAPAS[etapa - 1].label} · Processo <span className="font-mono">{processo.numero_processo}</span>
            </p>
          </header>

          <div className="flex-1 transition-opacity duration-150" key={etapa}>
            {etapa === 1 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Tipo do ato</label>
                <p className="text-sm text-muted-foreground">
                  Escolha o tipo. Um despacho é um ato de mero expediente. Uma decisão resolve
                  questão sem encerrar o processo. A sentença encerra o processo em primeiro grau.
                </p>
                <Select value={subtipo} onValueChange={v => selecionarSubtipo(v as SubtipoJuiz)} disabled={subtipoBloqueado}>
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBTIPOS_JUIZ.map(s => {
                      const cfg = SUBTIPO_CONFIG[s];
                      const Icone = cfg.icon;
                      return (
                        <SelectItem key={s} value={s}>
                          <span className="inline-flex items-center gap-2">
                            <Icone className="h-4 w-4" /> {cfg.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {subtipo && <p className="text-xs text-muted-foreground italic">{DESCRICAO[subtipo]}</p>}
              </div>
            )}

            {etapa === 2 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Título</label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Despacho — Cite-se" className="max-w-md" />
              </div>
            )}

            {etapa === 3 && (
              <div className="space-y-3 flex-1 flex flex-col">
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  value={corpo}
                  onChange={e => setCorpo(e.target.value)}
                  placeholder="Redija o texto do despacho / decisão / sentença aqui."
                  className="min-h-[320px] flex-1"
                />
              </div>
            )}

            {etapa === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">PDF anexo (opcional)</label>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline cursor-pointer">
                    <Upload className="h-4 w-4" /> Anexar arquivo
                    <input type="file" multiple accept=".pdf,.docx" className="hidden"
                      onChange={e => { adicionarArquivos(e.target.files); e.target.value = ''; }} />
                  </label>
                </div>
                {arquivos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
                ) : (
                  <ul className="border rounded divide-y">
                    {arquivos.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={() => setArquivos(prev => prev.filter((_, j) => j !== i))} className="text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {etapa === 5 && subtipo && (
              <div className="space-y-3 text-sm">
                {isSentenca && (
                  <div className="border border-ato-sentenca bg-ato-sentenca-bg p-3 rounded flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-ato-sentenca mt-0.5 shrink-0" />
                    <div>
                      Ao confirmar, o processo <span className="font-mono">{processo.numero_processo}</span> será sentenciado.
                      Verifique o texto e o PDF anexo antes de continuar.
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Tipo</div>
                  <div className="font-semibold">{SUBTIPO_CONFIG[subtipo].label}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Título</div>
                  <div>{titulo}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Conteúdo</div>
                  <div className="whitespace-pre-line border rounded p-3 max-h-56 overflow-auto bg-muted/40">{corpo}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Anexos ({arquivos.length})</div>
                  {arquivos.length === 0 ? <div className="italic text-muted-foreground">Nenhum</div> : (
                    <ul className="list-decimal list-inside">
                      {arquivos.map((f, i) => <li key={i}>{f.name}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => setConfirmSair(true)} disabled={enviando}>Cancelar</Button>
            <div className="flex items-center gap-2">
              {etapa > 1 && !subtipoBloqueado && (
                <Button variant="outline" onClick={() => setEtapa(e => (e - 1) as EtapaId)} disabled={enviando}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              )}
              {etapa > 1 && subtipoBloqueado && etapa > 2 && (
                <Button variant="outline" onClick={() => setEtapa(e => (e - 1) as EtapaId)} disabled={enviando}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              )}
              {etapa < 5 ? (
                <Button onClick={() => setEtapa(e => (e + 1) as EtapaId)} disabled={!podeAvancar}>
                  Próximo <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={emitirAto}
                  disabled={enviando}
                  variant={isSentenca ? 'destructive' : 'default'}
                >
                  {enviando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  {enviando ? 'Emitindo...' : isSentenca ? 'Sentenciar processo' : `Emitir ${SUBTIPO_CONFIG[subtipo || 'despacho'].label}`}
                </Button>
              )}
            </div>
          </footer>
        </div>
      </div>

      <AlertDialog open={confirmSair} onOpenChange={setConfirmSair}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da emissão de ato?</AlertDialogTitle>
            <AlertDialogDescription>Você perderá o rascunho não enviado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/professor/processos/${processoId}`)}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSentenca} onOpenChange={setConfirmSentenca}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Encerrar este processo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao emitir a sentença, o aluno <strong>não poderá mais peticionar</strong> neste processo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setConfirmSentenca(false); void emitirAto(); }}
            >
              Sim, quero sentenciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfLayout>
  );
}
