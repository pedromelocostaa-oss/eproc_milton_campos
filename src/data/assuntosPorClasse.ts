import type { NodoAssunto } from './classesAssuntos';
import assuntosTPU from './assuntos_tpu.json';
import allowlistRaw from './assuntos_allowlist.json';

const arvoreCompleta = assuntosTPU as NodoAssunto[];

const allowlist: Record<string, string[]> = Object.fromEntries(
  Object.entries(allowlistRaw).filter(([k]) => k !== '_meta'),
) as Record<string, string[]>;

function pruneTree(tree: NodoAssunto[], allowed: Set<string>): NodoAssunto[] {
  const result: NodoAssunto[] = [];
  for (const node of tree) {
    if (allowed.has(node.codigo)) {
      result.push(node);
      continue;
    }
    if (node.subitens) {
      const pruned = pruneTree(node.subitens, allowed);
      if (pruned.length > 0) {
        result.push({ ...node, subitens: pruned });
      }
    }
  }
  return result;
}

const cache = new Map<string, NodoAssunto[]>();

export function assuntosPorClasse(classe: string): NodoAssunto[] {
  if (!classe) return arvoreCompleta;

  const cached = cache.get(classe);
  if (cached) return cached;

  const codes = allowlist[classe];
  if (!codes) {
    cache.set(classe, arvoreCompleta);
    return arvoreCompleta;
  }

  const allowed = new Set(codes);
  const pruned = pruneTree(arvoreCompleta, allowed);
  cache.set(classe, pruned);
  return pruned;
}

export function assuntosPorArea(classes: string[]): NodoAssunto[] {
  const merged = new Set<string>();
  let useFull = false;
  for (const c of classes) {
    const codes = allowlist[c];
    if (!codes) { useFull = true; break; }
    codes.forEach(code => merged.add(code));
  }
  if (useFull || merged.size === 0) return arvoreCompleta;
  return pruneTree(arvoreCompleta, merged);
}

export function classeTemDadosReais(classe: string): boolean {
  return classe in allowlist;
}

export const arvoreAssuntosCompleta = arvoreCompleta;
