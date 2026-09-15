import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { getSignedUrlFor, baixarBlobParaComputador } from '@/lib/eventos/storage';
import type { EventoDoc } from '@/lib/eventos/adapter';

interface Props {
  doc: EventoDoc;
  compact?: boolean;
}

export function DocumentoAnexoItem({ doc, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function abrirVisualizacao() {
    setOpen(true);
    if (signedUrl) return;
    setLoading(true);
    const url = await getSignedUrlFor(doc.bucket, doc.storagePath);
    setSignedUrl(url);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={abrirVisualizacao}
          className={`inline-flex items-center gap-1.5 text-eproc-link hover:underline ${compact ? 'text-[11px]' : 'text-[12px]'}`}
        >
          <FileText className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          <span className="truncate max-w-[280px]">{doc.nome}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-3 border-b">
          <DialogTitle className="text-sm font-semibold truncate">{doc.nome}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-neutral-100">
          {loading && (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando documento...
            </div>
          )}
          {!loading && signedUrl && (
            <iframe src={signedUrl} className="w-full h-full border-0" title={doc.nome} />
          )}
          {!loading && !signedUrl && (
            <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
              Não foi possível carregar o documento.
            </div>
          )}
        </div>
        <div className="border-t px-6 py-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => baixarBlobParaComputador(doc.bucket, doc.storagePath, doc.nome)}
          >
            <Download className="h-4 w-4 mr-1.5" /> Baixar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
