import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, ClipboardCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EventoUnificado, EventoDoc } from '@/lib/eventos/adapter';
import { SUBTIPO_CONFIG, labelAutorPapel } from '@/lib/eventos/subtipoConfig';
import { getSignedUrlFor, baixarBlobParaComputador } from '@/lib/eventos/storage';
import { limparCorpoHabilitacao } from '@/lib/eventos/habilitacao';

interface Props {
  evento: EventoUnificado | null;
  aberto: boolean;
  onFechar: () => void;
}

function tamanhoFormatado(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function DocumentoLinha({ doc }: { doc: EventoDoc }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function abrirPreview() {
    setPreviewOpen(v => !v);
    if (signedUrl) return;
    setCarregando(true);
    const url = await getSignedUrlFor(doc.bucket, doc.storagePath);
    setSignedUrl(url);
    setCarregando(false);
  }

  return (
    <div className="border rounded-md bg-white">
      <div className="flex items-center gap-2 p-3">
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{doc.nome}</div>
          {doc.tamanhoBytes != null && (
            <div className="text-xs text-muted-foreground">{tamanhoFormatado(doc.tamanhoBytes)}</div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={abrirPreview}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          {previewOpen ? 'Ocultar' : 'Visualizar'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => baixarBlobParaComputador(doc.bucket, doc.storagePath, doc.nome)}>
          <Download className="h-3.5 w-3.5 mr-1" /> Baixar
        </Button>
      </div>
      {previewOpen && (
        <div className="border-t bg-neutral-100 h-[520px]">
          {carregando && (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando documento...
            </div>
          )}
          {!carregando && signedUrl && (
            <iframe src={signedUrl} title={doc.nome} className="w-full h-full border-0" />
          )}
          {!carregando && !signedUrl && (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Não foi possível carregar o documento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EventoDetalheDialog({ evento, aberto, onFechar }: Props) {
  useEffect(() => {
    if (!aberto) return;
  }, [aberto]);

  if (!evento) return null;

  const cfg = SUBTIPO_CONFIG[evento.subtipo];
  const Icone = cfg.icon;
  const data = format(new Date(evento.dataEvento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const corpoLimpo = limparCorpoHabilitacao(evento.corpo);

  return (
    <Dialog open={aberto} onOpenChange={o => !o && onFechar()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle asChild>
            <div className={`flex items-center gap-3 ${cfg.textClass}`}>
              <div className={`h-10 w-10 rounded-md flex items-center justify-center border ${cfg.borderClass} ${cfg.bgClass}`}>
                <Icone className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">Evento {evento.numero} — {cfg.label}</div>
                <div className="text-xs font-normal text-muted-foreground mt-0.5">
                  {labelAutorPapel(evento.autorPapel)} · {data}
                  {evento.legacy && <span className="ml-2 italic">(histórico do modelo anterior)</span>}
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {evento.titulo && evento.titulo !== cfg.label && (
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Título</h3>
              <p className="text-base font-medium">{evento.titulo}</p>
            </section>
          )}

          {corpoLimpo && (
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Conteúdo do evento</h3>
              <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-line leading-relaxed">
                {corpoLimpo}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
              Documentos anexados ({evento.documentos.length})
            </h3>
            {evento.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Nenhum documento anexado a este evento.
              </p>
            ) : (
              <div className="space-y-2">
                {evento.documentos.map(d => <DocumentoLinha key={d.id} doc={d} />)}
              </div>
            )}
          </section>

          {evento.correcao && (
            <section className="rounded-md border border-emerald-300 bg-emerald-50 p-4">
              <h3 className="text-xs font-bold text-emerald-800 uppercase mb-2 flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" /> Correção do professor
              </h3>
              {evento.correcao.nota != null && (
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Nota atribuída: </span>
                  <span className="font-semibold text-emerald-900">
                    {evento.correcao.nota.toFixed(1).replace('.', ',')}
                  </span>
                </div>
              )}
              {evento.correcao.feedback && (
                <div className="text-sm whitespace-pre-line">
                  {evento.correcao.feedback}
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Identificação do evento</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <div><span className="font-semibold">ID:</span> <span className="font-mono">{evento.id}</span></div>
              <div><span className="font-semibold">Processo:</span> <span className="font-mono">{evento.processoId}</span></div>
              <div><span className="font-semibold">Subtipo:</span> {evento.subtipo}</div>
              <div><span className="font-semibold">Autor:</span> {labelAutorPapel(evento.autorPapel)}</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
