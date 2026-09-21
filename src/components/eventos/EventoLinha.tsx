import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { EventoUnificado } from '@/lib/eventos/adapter';
import { SUBTIPO_CONFIG, labelAutorPapel } from '@/lib/eventos/subtipoConfig';
import { DocumentoAnexoItem } from './DocumentoAnexoItem';

interface Props {
  evento: EventoUnificado;
  viewMode: 'aluno' | 'professor';
  destacar?: boolean;
  onAbrirDetalhes?: (evento: EventoUnificado) => void;
}

export function EventoLinha({ evento, viewMode, destacar, onAbrirDetalhes }: Props) {
  const [aberto, setAberto] = useState(false);
  const cfg = SUBTIPO_CONFIG[evento.subtipo];
  const Icone = cfg.icon;
  const data = format(new Date(evento.dataEvento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  if (viewMode === 'aluno') {
    return (
      <div className={`border-l-4 ${cfg.borderClass} bg-white border-b border-eproc-borda ${destacar ? 'bg-destaque-novo' : ''} transition-colors duration-1000`}>
        <button
          type="button"
          onClick={() => setAberto(v => !v)}
          className="w-full grid grid-cols-[36px_100px_180px_1fr_100px_60px] items-center gap-2 px-2 py-1.5 text-[12px] text-eproc-texto hover:bg-eproc-tabela-row-hover text-left"
        >
          <span className="text-eproc-texto-secundario">
            {aberto ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
          <span className="font-mono font-semibold">Evento {evento.numero}</span>
          <span className="text-eproc-texto-secundario">{data}</span>
          <span className="flex items-center gap-1.5 min-w-0">
            <Icone className={`h-3.5 w-3.5 shrink-0 ${cfg.textClass}`} />
            <span className={`font-medium truncate ${cfg.textClass}`}>{cfg.label}</span>
            {evento.titulo && cfg.label !== evento.titulo && (
              <span className="text-eproc-texto-secundario truncate">— {evento.titulo}</span>
            )}
          </span>
          <span className="text-eproc-texto-secundario truncate" title={evento.autorNome ?? undefined}>
            {evento.autorNome ?? labelAutorPapel(evento.autorPapel)}
          </span>
          <span className="text-eproc-texto-secundario text-right">{evento.documentos.length > 0 ? `${evento.documentos.length} doc` : '—'}</span>
        </button>
        {aberto && (
          <div className={`px-4 py-3 ${cfg.bgClass} border-t border-eproc-borda text-[12px] space-y-2`}>
            {evento.corpo && <p className="whitespace-pre-line text-eproc-texto">{evento.corpo}</p>}
            {evento.documentos.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {evento.documentos.map(d => <DocumentoAnexoItem key={d.id} doc={d} />)}
              </div>
            )}
            {!evento.corpo && evento.documentos.length === 0 && (
              <p className="text-eproc-texto-secundario italic">Sem conteúdo adicional.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Professor: card com mais respiro, clicável para abrir dialog de detalhes
  const clicavel = !!onAbrirDetalhes;
  return (
    <article
      onClick={clicavel ? () => onAbrirDetalhes!(evento) : undefined}
      role={clicavel ? 'button' : undefined}
      tabIndex={clicavel ? 0 : undefined}
      onKeyDown={clicavel ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrirDetalhes!(evento); }
      } : undefined}
      className={`border-l-4 ${cfg.borderClass} bg-card rounded-md shadow-sm border border-border p-4 transition-shadow ${clicavel ? 'cursor-pointer hover:shadow-md hover:border-primary/40' : 'hover:shadow-md'} ${destacar ? 'ring-2 ring-warning' : ''}`}
    >
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icone className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.textClass}`} />
          <div className="min-w-0">
            <div className={`text-[13px] font-semibold ${cfg.textClass}`}>
              Evento {evento.numero} — {cfg.label}
            </div>
            <div className="text-[12px] text-muted-foreground">
              {evento.autorNome
                ? <>Enviado por <strong className="text-foreground">{evento.autorNome}</strong> ({labelAutorPapel(evento.autorPapel)})</>
                : labelAutorPapel(evento.autorPapel)}
              {' · '}{data}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          {evento.correcao && (
            <div className="text-right text-[12px] shrink-0">
              {evento.correcao.nota != null && (
                <div className="font-semibold text-success">Nota: {evento.correcao.nota.toFixed(1).replace('.', ',')}</div>
              )}
              <div className="text-muted-foreground">Corrigido</div>
            </div>
          )}
          {clicavel && (
            <span className="text-[11px] text-muted-foreground italic shrink-0 self-start mt-0.5">
              clique para ver detalhes
            </span>
          )}
        </div>
      </header>
      {evento.titulo && cfg.label !== evento.titulo && (
        <div className="text-[13px] font-medium mb-1">{evento.titulo}</div>
      )}
      {evento.corpo && (
        <p className="text-[13px] leading-relaxed whitespace-pre-line text-foreground mb-2 line-clamp-3">{evento.corpo}</p>
      )}
      {evento.documentos.length > 0 && (
        <div className="pt-2 border-t border-border/60 flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-[12px] font-semibold text-muted-foreground mr-1">
            {evento.documentos.length} documento(s):
          </span>
          {evento.documentos.map(d => (
            <span key={d.id} onClick={(e) => e.stopPropagation()}>
              <DocumentoAnexoItem doc={d} />
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
