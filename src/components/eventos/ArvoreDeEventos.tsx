import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEventosUnificados, type EventoUnificado } from '@/lib/eventos/adapter';
import { EventoLinha } from './EventoLinha';

interface Props {
  processoId: string;
  dataDistribuicao: string;
  viewMode: 'aluno' | 'professor';
  destacarNumero?: number | null;
  atualizarKey?: number;
}

export function ArvoreDeEventos({ processoId, dataDistribuicao, viewMode, destacarNumero, atualizarKey }: Props) {
  const [eventos, setEventos] = useState<EventoUnificado[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchEventosUnificados({ processoId, dataDistribuicao });
    setEventos(data);
    setRefreshing(false);
  }, [processoId, dataDistribuicao]);

  useEffect(() => {
    carregar();
    const onFocus = () => carregar();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [carregar, atualizarKey]);

  if (eventos === null) {
    return (
      <div className="space-y-1 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const ordenados = [...eventos].sort((a, b) => b.numero - a.numero);

  if (viewMode === 'aluno') {
    return (
      <div className="border border-eproc-borda bg-white">
        <header className="flex items-center justify-between px-3 py-1.5 bg-eproc-tabela-header border-b border-eproc-borda">
          <h2 className="text-[12px] font-semibold text-eproc-texto uppercase tracking-wide">Eventos</h2>
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-1 text-[11px] text-eproc-link hover:underline"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Atualizar
          </button>
        </header>
        <div className="grid grid-cols-[36px_100px_180px_1fr_100px_60px] items-center gap-2 px-2 py-1 border-b border-eproc-borda bg-eproc-tabela-row-alt text-[11px] font-semibold uppercase text-eproc-texto-secundario">
          <span></span>
          <span>Nº</span>
          <span>Data</span>
          <span>Descrição</span>
          <span>Autor</span>
          <span className="text-right">Docs</span>
        </div>
        {ordenados.length === 0 ? (
          <p className="p-4 text-[12px] text-eproc-texto-secundario">Nenhum evento registrado.</p>
        ) : (
          ordenados.map(e => (
            <EventoLinha key={e.id} evento={e} viewMode="aluno" destacar={destacarNumero === e.numero} />
          ))
        )}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Eventos</h2>
        <button
          type="button"
          onClick={carregar}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </button>
      </header>
      {ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda neste processo.</p>
      ) : (
        <div className="space-y-3">
          {ordenados.map(e => (
            <EventoLinha key={e.id} evento={e} viewMode="professor" destacar={destacarNumero === e.numero} />
          ))}
        </div>
      )}
    </section>
  );
}
