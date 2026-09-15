interface Props {
  estado: 'ativo' | 'sentenciado' | 'baixado' | string | null | undefined;
}

const CONFIG: Record<string, { label: string; bg: string; fg: string; border: string }> = {
  ativo:        { label: 'Em tramitação', bg: 'bg-emerald-50',   fg: 'text-emerald-800', border: 'border-emerald-300' },
  sentenciado:  { label: 'Sentenciado',    bg: 'bg-ato-sentenca-bg', fg: 'text-ato-sentenca', border: 'border-red-300' },
  baixado:      { label: 'Baixado',         bg: 'bg-neutral-100', fg: 'text-neutral-700', border: 'border-neutral-300' },
};

export function StatusProcessoBadge({ estado }: Props) {
  const cfg = CONFIG[estado ?? 'ativo'] ?? CONFIG.ativo;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide border ${cfg.bg} ${cfg.fg} ${cfg.border} rounded-sm transition-colors duration-500`}>
      {cfg.label}
    </span>
  );
}
