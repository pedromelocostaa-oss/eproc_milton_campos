import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { textoRequerimento, type PoloHabilitacao } from '@/lib/eventos/habilitacao';
import { garantirProfileParaAutor } from '@/lib/eventos/autor';

interface Props {
  processoId: string;
  numeroProcesso: string;
  aberto: boolean;
  onFechar: () => void;
  onEnviou: () => void;
}

export function SolicitarHabilitacaoDialog({ processoId, numeroProcesso, aberto, onFechar, onEnviou }: Props) {
  const { user } = useAuth();
  const [polo, setPolo] = useState<PoloHabilitacao>('passivo');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!user) return;
    setEnviando(true);
    try {
      await garantirProfileParaAutor(user);
      const corpo = textoRequerimento(user.nome_completo ?? 'Requerente', polo, user.id);
      const { error } = await supabase.from('eventos').insert({
        processo_id: processoId,
        subtipo: 'peticao_generica',
        autor_papel: 'aluno',
        autor_id: user.id,
        titulo: `Requerimento de Habilitação — ${user.nome_completo ?? 'Requerente'}`,
        corpo,
      });
      if (error) throw error;
      toast.success('Requerimento de habilitação protocolado.');
      onEnviou();
      onFechar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao protocolar requerimento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={o => !o && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar habilitação nos autos</DialogTitle>
          <DialogDescription>
            Processo <span className="font-mono">{numeroProcesso}</span>. Ao enviar, um requerimento
            será juntado aos autos. Você poderá peticionar neste processo somente após o deferimento
            pelo juiz.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-2">
          <label className="text-sm font-medium">Você representa:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPolo('ativo')}
              className={`flex-1 border rounded-md px-3 py-2 text-sm text-left ${polo === 'ativo' ? 'border-primary bg-primary/5 font-semibold' : 'border-border'}`}
            >
              <div className="font-semibold text-sm">Polo Ativo</div>
              <div className="text-xs text-muted-foreground">Autor / requerente</div>
            </button>
            <button
              type="button"
              onClick={() => setPolo('passivo')}
              className={`flex-1 border rounded-md px-3 py-2 text-sm text-left ${polo === 'passivo' ? 'border-primary bg-primary/5 font-semibold' : 'border-border'}`}
            >
              <div className="font-semibold text-sm">Polo Passivo</div>
              <div className="text-xs text-muted-foreground">Réu / requerido</div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={enviando}>Cancelar</Button>
          <Button onClick={enviar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            {enviando ? 'Enviando...' : 'Protocolar requerimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
