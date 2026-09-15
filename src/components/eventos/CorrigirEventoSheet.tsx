import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EventoUnificado } from '@/lib/eventos/adapter';
import { SUBTIPO_CONFIG } from '@/lib/eventos/subtipoConfig';

interface Props {
  evento: EventoUnificado | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvou: () => void;
}

export function CorrigirEventoSheet({ evento, aberto, onFechar, onSalvou }: Props) {
  const { user } = useAuth();
  const [nota, setNota] = useState('');
  const [feedback, setFeedback] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!evento) return;
    setNota(evento.correcao?.nota != null ? String(evento.correcao.nota).replace('.', ',') : '');
    setFeedback(evento.correcao?.feedback ?? '');
  }, [evento]);

  if (!evento) return null;
  const cfg = SUBTIPO_CONFIG[evento.subtipo];

  async function salvar() {
    if (!evento || !user) return;
    const notaNum = nota ? parseFloat(nota.replace(',', '.')) : null;
    if (notaNum != null && (isNaN(notaNum) || notaNum < 0 || notaNum > 10)) {
      toast.error('A nota deve ser entre 0 e 10.');
      return;
    }
    if (!feedback.trim() && notaNum == null) {
      toast.error('Informe nota ou feedback.');
      return;
    }
    setSalvando(true);
    try {
      if (evento.legacy) {
        toast.error('Este evento pertence a um processo antigo. Use a tela "Abrir correção (modo antigo)".');
        setSalvando(false);
        return;
      }
      const { error } = await supabase
        .from('evento_correcoes')
        .upsert({
          evento_id: evento.id,
          nota: notaNum,
          feedback: feedback.trim() || null,
          corrigido_por: user.id,
        }, { onConflict: 'evento_id' });
      if (error) throw error;
      toast.success('Correção salva.');
      onSalvou();
      onFechar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar correção.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={o => !o && onFechar()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className={`flex items-center gap-2 ${cfg.textClass}`}>
            <cfg.icon className="h-5 w-5" />
            Evento {evento.numero} — {cfg.label}
          </SheetTitle>
          <SheetDescription>{evento.titulo}</SheetDescription>
        </SheetHeader>

        {evento.corpo && (
          <div className="mt-4 p-3 rounded border bg-muted/40 text-sm whitespace-pre-line max-h-56 overflow-y-auto">
            {evento.corpo}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Nota (0 a 10)</label>
            <Input
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ex.: 8,5"
              className="max-w-[120px] mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Opcional. Deixe em branco se quiser só escrever feedback.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Feedback</label>
            <Textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Escreva aqui sua análise da petição. O aluno lerá exatamente o que você escrever."
              className="min-h-[200px] mt-1"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onFechar} disabled={salvando}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {salvando ? 'Salvando...' : 'Salvar correção'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
