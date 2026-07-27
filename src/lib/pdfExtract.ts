// Extração de dados de processos a partir do texto de um PDF (100% no navegador).
// Usa pdfjs para ler o texto e heurísticas/regex para preencher os campos.
// Calibrado para os padrões comuns do e-Proc / PJe / TJMG. O professor revisa antes de salvar.

import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ParteExtraida {
  nome: string;
  cpfCnpj: string;             // apenas dígitos
  polo: 'ativo' | 'passivo';
  tipoPessoa: 'fisica' | 'juridica';
}

export interface DadosExtraidos {
  numero: string;
  classe: string;
  assunto: string;
  vara: string;
  partes: ParteExtraida[];
  textoLido: boolean;          // false = PDF sem texto (provável escaneado)
}

const RE_CNJ = /(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/;
const RE_CNJ_SEM_MASCARA = /\b(\d{20})\b/;
const RE_CPF = /(\d{3}\.\d{3}\.\d{3}-\d{2})/;
const RE_CNPJ = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/;

const PALAVRAS_PJ = /\b(LTDA|S\.?\/?A\.?|EIRELI|ME|EPP|S\/S|SOCIEDADE|ASSOCIA[ÇC][ÃA]O|BANCO|SEGURADORA|MUNIC[ÍI]PIO|ESTADO DE|UNI[ÃA]O|FAZENDA|INSS|CAIXA|COMPANHIA|CIA\.?|EMPRESA|COOPERATIVA|FUNDA[ÇC][ÃA]O|INSTITUTO)\b/i;

// Rótulos que indicam o polo de uma parte
const LABELS_ATIVO = ['autor', 'autora', 'autores', 'requerente', 'requerentes', 'exequente', 'impetrante', 'reclamante', 'embargante', 'agravante', 'apelante', 'recorrente', 'promovente', 'polo ativo'];
const LABELS_PASSIVO = ['réu', 'reu', 'ré', 're', 'requerido', 'requerida', 'requeridos', 'executado', 'executada', 'impetrado', 'reclamado', 'reclamada', 'embargado', 'agravado', 'apelado', 'recorrido', 'promovido', 'polo passivo'];

function soDigitos(s: string) { return s.replace(/\D/g, ''); }

function inferirTipo(nome: string, doc: string): 'fisica' | 'juridica' {
  if (doc && soDigitos(doc).length > 11) return 'juridica';
  if (PALAVRAS_PJ.test(nome)) return 'juridica';
  return 'fisica';
}

/** Lê o texto do PDF, reconstruindo linhas pela posição vertical dos elementos. */
async function lerLinhasPdf(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const linhas: string[] = [];
  const maxPaginas = Math.min(pdf.numPages, 4); // a capa/autuação costuma estar no início
  for (let i = 1; i <= maxPaginas; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const porLinha = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items as Array<{ str?: string; transform?: number[] }>) {
      if (typeof it.str !== 'string' || !it.transform) continue;
      const y = Math.round(it.transform[5]);
      const x = it.transform[4];
      if (!porLinha.has(y)) porLinha.set(y, []);
      porLinha.get(y)!.push({ x, s: it.str });
    }
    const ys = [...porLinha.keys()].sort((a, b) => b - a); // topo -> base
    for (const y of ys) {
      const linha = porLinha.get(y)!.sort((a, b) => a.x - b.x).map(o => o.s).join(' ').replace(/\s+/g, ' ').trim();
      if (linha) linhas.push(linha);
    }
  }
  return linhas;
}

function valorAposRotulo(texto: string, rotulos: string[]): string {
  for (const r of rotulos) {
    const re = new RegExp(r + '\\s*:?\\s*([^\\n]+)', 'i');
    const m = texto.match(re);
    if (m && m[1]) {
      let v = m[1].trim();
      // corta em quebras lógicas comuns
      v = v.split(/\s{3,}| - CPF| - CNPJ|Assunto:|Órgão|Classe:|Distribu/i)[0].trim();
      if (v.length >= 2 && v.length <= 120) return v;
    }
  }
  return '';
}

function limparNome(bruto: string): string {
  return bruto
    .replace(/\(?\s*(CPF|CNPJ|RG)\s*:?.*$/i, '')   // remove doc anexado
    .replace(/[-–—:]\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extrairPartes(linhas: string[]): ParteExtraida[] {
  const partes: ParteExtraida[] = [];
  const jaAdd = new Set<string>();

  const add = (nome: string, doc: string, polo: 'ativo' | 'passivo') => {
    const limpo = limparNome(nome);
    if (limpo.length < 3) return;
    const chave = `${limpo.toLowerCase()}|${polo}`;
    if (jaAdd.has(chave)) return;
    jaAdd.add(chave);
    partes.push({ nome: limpo.toUpperCase(), cpfCnpj: soDigitos(doc), polo, tipoPessoa: inferirTipo(limpo, doc) });
  };

  const rotuloPolo = (linha: string): 'ativo' | 'passivo' | null => {
    const l = linha.toLowerCase();
    const inicio = l.slice(0, 24);
    if (LABELS_ATIVO.some(r => new RegExp('(^|\\b)' + r + '\\b').test(inicio))) return 'ativo';
    if (LABELS_PASSIVO.some(r => new RegExp('(^|\\b)' + r + '\\b').test(inicio))) return 'passivo';
    return null;
  };

  let poloAtual: 'ativo' | 'passivo' | null = null;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const polo = rotuloPolo(linha);

    // "AUTOR: Fulano de Tal - CPF 123..."
    if (polo) {
      poloAtual = polo;
      const resto = linha.replace(new RegExp('^[^:]*:\\s*'), '');
      const nomeInline = resto === linha ? '' : resto; // só se havia ":"
      const doc = (linha.match(RE_CPF) || linha.match(RE_CNPJ) || [])[0]
        || (linhas[i + 1] ? (linhas[i + 1].match(RE_CPF) || linhas[i + 1].match(RE_CNPJ) || [])[0] : '') || '';
      if (nomeInline && limparNome(nomeInline).length >= 3) {
        add(nomeInline, doc, polo);
      } else if (linhas[i + 1] && !rotuloPolo(linhas[i + 1])) {
        // nome na linha seguinte (formato seccionado)
        add(linhas[i + 1], doc, polo);
      }
      continue;
    }

    // linha que parece um nome, dentro de uma seção de polo já detectada
    if (poloAtual) {
      const pareceNome = /[A-Za-zÀ-ÿ]{3,}\s+[A-Za-zÀ-ÿ]/.test(linha) && linha.length <= 90 && !/\d{3}\.\d{3}/.test(linha.slice(0, 4));
      if (pareceNome) {
        const doc = (linha.match(RE_CPF) || linha.match(RE_CNPJ) || [])[0] || '';
        add(linha, doc, poloAtual);
      }
    }
  }

  return partes;
}

/** Extrai os dados de um processo a partir de um arquivo PDF. */
export async function extrairProcessoDoPdf(file: File): Promise<DadosExtraidos> {
  const vazio: DadosExtraidos = { numero: '', classe: '', assunto: '', vara: '', partes: [], textoLido: false };
  let linhas: string[] = [];
  try {
    linhas = await lerLinhasPdf(file);
  } catch {
    return vazio;
  }

  const texto = linhas.join('\n');
  if (texto.replace(/\s/g, '').length < 20) {
    return vazio; // sem texto útil (provável PDF escaneado)
  }

  const numero =
    (texto.match(RE_CNJ)?.[1]) ||
    (() => {
      const m = texto.match(RE_CNJ_SEM_MASCARA)?.[1];
      if (!m) return '';
      return `${m.slice(0, 7)}-${m.slice(7, 9)}.${m.slice(9, 13)}.${m.slice(13, 14)}.${m.slice(14, 16)}.${m.slice(16, 20)}`;
    })() || '';

  const classe = valorAposRotulo(texto, ['Classe Judicial', 'Classe processual', 'Classe']);
  const assunto = valorAposRotulo(texto, ['Assunto Principal', 'Assunto\\(s\\)', 'Assunto']);
  const vara = valorAposRotulo(texto, ['Órgão Julgador', 'Órgão', 'Vara', 'Ju[íi]zo']);
  const partes = extrairPartes(linhas);

  return { numero, classe, assunto, vara, partes, textoLido: true };
}
