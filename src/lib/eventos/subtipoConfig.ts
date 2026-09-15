import type { EventoAutorPapel, EventoSubtipo } from '@/integrations/supabase/types';
import {
  Shuffle, Bell, FileText, FileEdit, MessageSquare, CheckSquare, Reply,
  Shield, Paperclip, ArrowUpCircle, File, Feather, Scale, Gavel,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SubtipoConfig {
  label: string;
  icon: LucideIcon;
  borderClass: string;
  bgClass: string;
  textClass: string;
}

export const SUBTIPO_CONFIG: Record<EventoSubtipo, SubtipoConfig> = {
  distribuicao:         { label: 'Distribuição',           icon: Shuffle,        borderClass: 'border-ato-sistema',  bgClass: 'bg-ato-sistema-bg',  textClass: 'text-ato-sistema' },
  intimacao:            { label: 'Intimação',              icon: Bell,           borderClass: 'border-ato-sistema',  bgClass: 'bg-ato-sistema-bg',  textClass: 'text-ato-sistema' },
  peticao_inicial:      { label: 'Petição Inicial',        icon: FileText,       borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  emenda_inicial:       { label: 'Emenda à Inicial',       icon: FileEdit,       borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  manifestacao:         { label: 'Manifestação',           icon: MessageSquare,  borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  cumprimento_despacho: { label: 'Cumprimento de Despacho',icon: CheckSquare,    borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  replica:              { label: 'Réplica',                icon: Reply,          borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  contestacao:          { label: 'Contestação',            icon: Shield,         borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  peticao_juntada:      { label: 'Petição de Juntada',     icon: Paperclip,      borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  recurso:              { label: 'Recurso',                icon: ArrowUpCircle,  borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  peticao_generica:     { label: 'Petição',                icon: File,           borderClass: 'border-ato-aluno',    bgClass: 'bg-ato-aluno-bg',    textClass: 'text-ato-aluno' },
  despacho:             { label: 'Despacho',               icon: Feather,        borderClass: 'border-ato-juiz',     bgClass: 'bg-ato-juiz-bg',     textClass: 'text-ato-juiz' },
  decisao:              { label: 'Decisão',                icon: Scale,          borderClass: 'border-ato-juiz',     bgClass: 'bg-ato-juiz-bg',     textClass: 'text-ato-juiz' },
  sentenca:             { label: 'Sentença',               icon: Gavel,          borderClass: 'border-ato-sentenca', bgClass: 'bg-ato-sentenca-bg', textClass: 'text-ato-sentenca' },
};

export const SUBTIPOS_ALUNO: readonly EventoSubtipo[] = [
  'peticao_inicial', 'emenda_inicial', 'manifestacao', 'cumprimento_despacho',
  'replica', 'contestacao', 'peticao_juntada', 'recurso', 'peticao_generica',
] as const;

export const SUBTIPOS_PROFESSOR: readonly EventoSubtipo[] = ['despacho', 'decisao', 'sentenca'] as const;

export function labelAutorPapel(p: EventoAutorPapel): string {
  return p === 'aluno' ? 'Autor' : p === 'professor_juiz' ? 'Juiz' : 'Sistema';
}
