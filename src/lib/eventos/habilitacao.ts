import type { EventoUnificado } from './adapter';

/**
 * Camada de habilitação nos autos.
 * Zero alteração no schema — usa apenas markers no `corpo` de eventos
 * do tipo peticao_generica (pedido) e despacho (deferimento).
 *
 * Marker do pedido:
 *   [HABILITACAO_PEDIDO:aluno_id=<ID>;polo=<ativo|passivo>]
 *
 * Marker do deferimento (emitido pelo professor-juiz):
 *   [HABILITACAO_DEFERIDA:aluno_id=<ID>;polo=<ativo|passivo>]
 */

export type PoloHabilitacao = 'ativo' | 'passivo';

export interface HabilitacaoMarker {
  alunoId: string;
  polo: PoloHabilitacao;
}

const RE_PEDIDO = /\[HABILITACAO_PEDIDO:aluno_id=([^;\]]+);polo=(ativo|passivo)\]/i;
const RE_DEFERIDA = /\[HABILITACAO_DEFERIDA:aluno_id=([^;\]]+);polo=(ativo|passivo)\]/i;

export function parseMarker(corpo: string | null | undefined, tipo: 'pedido' | 'deferimento'): HabilitacaoMarker | null {
  if (!corpo) return null;
  const re = tipo === 'pedido' ? RE_PEDIDO : RE_DEFERIDA;
  const m = re.exec(corpo);
  if (!m) return null;
  return { alunoId: m[1], polo: m[2].toLowerCase() as PoloHabilitacao };
}

/**
 * Remove os markers para exibição amigável.
 */
export function limparCorpoHabilitacao(corpo: string | null | undefined): string {
  if (!corpo) return '';
  return corpo
    .replace(RE_PEDIDO, '')
    .replace(RE_DEFERIDA, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ehPedidoHabilitacao(ev: EventoUnificado): boolean {
  return ev.subtipo === 'peticao_generica' && parseMarker(ev.corpo, 'pedido') != null;
}

export function ehDeferimentoHabilitacao(ev: EventoUnificado): boolean {
  return (ev.subtipo === 'despacho' || ev.subtipo === 'decisao') && parseMarker(ev.corpo, 'deferimento') != null;
}

/**
 * Conjunto de alunoId habilitados no processo (com deferimento posterior).
 */
export function habilitados(eventos: EventoUnificado[]): Set<string> {
  const pedidos = new Map<string, number>(); // alunoId → numero do pedido
  const deferidos = new Set<string>();
  for (const ev of eventos) {
    const p = parseMarker(ev.corpo, 'pedido');
    if (p) pedidos.set(p.alunoId, ev.numero);
    const d = parseMarker(ev.corpo, 'deferimento');
    if (d) {
      const numPedido = pedidos.get(d.alunoId);
      if (numPedido != null && ev.numero > numPedido) deferidos.add(d.alunoId);
    }
  }
  return deferidos;
}

export function pedidosPendentes(eventos: EventoUnificado[]): Array<{ evento: EventoUnificado; marker: HabilitacaoMarker }> {
  const jaDeferidos = habilitados(eventos);
  const out: Array<{ evento: EventoUnificado; marker: HabilitacaoMarker }> = [];
  for (const ev of eventos) {
    const p = parseMarker(ev.corpo, 'pedido');
    if (p && !jaDeferidos.has(p.alunoId)) {
      out.push({ evento: ev, marker: p });
    }
  }
  return out;
}

export function jaSolicitou(eventos: EventoUnificado[], alunoId: string): boolean {
  for (const ev of eventos) {
    const p = parseMarker(ev.corpo, 'pedido');
    if (p?.alunoId === alunoId) return true;
  }
  return false;
}

export function textoRequerimento(nomeAluno: string, polo: PoloHabilitacao, alunoId: string): string {
  const poloTxt = polo === 'ativo' ? 'polo ativo' : 'polo passivo';
  return `Excelentíssimo(a) Senhor(a) Juiz(a),

${nomeAluno} vem, respeitosamente, por meio deste, requerer a HABILITAÇÃO nos presentes autos, como representante do ${poloTxt}, para prática de todos os atos processuais cabíveis.

Requer, ainda, o deferimento do acesso aos autos e habilitação para peticionar em nome da parte representada.

Termos em que pede deferimento.

[HABILITACAO_PEDIDO:aluno_id=${alunoId};polo=${polo}]`;
}

export function textoDeferimento(nomeAluno: string, polo: PoloHabilitacao, alunoId: string): string {
  const poloTxt = polo === 'ativo' ? 'polo ativo' : 'polo passivo';
  return `Vistos.

Defiro o pedido de habilitação formulado por ${nomeAluno} para atuar no ${poloTxt} destes autos.

Anote-se. Prossiga o feito.

[HABILITACAO_DEFERIDA:aluno_id=${alunoId};polo=${polo}]`;
}
