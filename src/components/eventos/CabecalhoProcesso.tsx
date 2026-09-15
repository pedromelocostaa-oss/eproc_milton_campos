import type { Processo, Parte } from '@/integrations/supabase/types';
import { StatusProcessoBadge } from './StatusProcessoBadge';

interface Props {
  processo: Processo;
  partes: Parte[];
  viewMode: 'aluno' | 'professor';
  extra?: React.ReactNode;
}

export function CabecalhoProcesso({ processo, partes, viewMode, extra }: Props) {
  const autores = partes.filter(p => p.polo === 'ativo');
  const reus = partes.filter(p => p.polo === 'passivo');
  const nomeAutores = autores.map(a => a.nome).join(', ') || '—';
  const nomeReus = reus.map(a => a.nome).join(', ') || '—';
  const estado = processo.estado ?? (processo.status === 'encerrado' ? 'sentenciado' : 'ativo');

  if (viewMode === 'aluno') {
    return (
      <div className="border border-eproc-borda bg-white p-3 mb-3">
        <div className="flex flex-wrap items-baseline gap-2 mb-1">
          <h1 className="font-mono text-[14px] font-semibold text-eproc-texto">
            {processo.numero_processo}
          </h1>
          <StatusProcessoBadge estado={estado} />
        </div>
        <div className="text-[12px] text-eproc-texto-secundario">
          {processo.classe_processual} · {processo.assunto} · {processo.vara}
        </div>
        <div className="text-[12px] text-eproc-texto mt-1">
          <span className="font-medium">{nomeAutores}</span>
          <span className="mx-2 text-eproc-texto-secundario">×</span>
          <span className="font-medium">{nomeReus}</span>
        </div>
        {extra && <div className="mt-2">{extra}</div>}
      </div>
    );
  }

  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-sm text-muted-foreground">Processo</span>
        <span className="font-mono text-lg font-semibold">{processo.numero_processo}</span>
        <StatusProcessoBadge estado={estado} />
      </div>
      <div className="text-sm text-muted-foreground mb-1">
        {processo.classe_processual} · {processo.assunto}
      </div>
      <div className="text-sm">
        Autor: <span className="font-medium">{nomeAutores}</span>
        <span className="mx-2 text-muted-foreground">×</span>
        Réu: <span className="font-medium">{nomeReus}</span>
      </div>
      {extra && <div className="mt-3">{extra}</div>}
    </header>
  );
}
