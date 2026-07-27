// Acervo de processos disponibilizados pelos professores.
// O professor cadastra processos (com partes e documentos anexados) e eles ficam
// pesquisáveis, na Consulta Processual, apenas para os alunos das suas turmas.
//
// Metadados (processo, partes, documentos) ficam no localStorage.
// O conteúdo dos arquivos fica no IndexedDB (ver src/lib/fileStore.ts).

import { demoTurmas } from '@/data/demoStore';
import type { Turma } from '@/integrations/supabase/types';
import { saveArquivo } from '@/lib/fileStore';

const KEY = 'demo-acervo-processos-v1';
const CHANNEL_NAME = 'acervo-store-sync';

export interface AcervoParte {
  id: string;
  nome: string;
  polo: 'ativo' | 'passivo';
  tipoPessoa: 'fisica' | 'juridica';
  cpfCnpj: string; // apenas dígitos (pode ser vazio)
}

export interface AcervoDocumento {
  id: string;          // chave usada no IndexedDB
  nome: string;        // ex.: "Petição Inicial.pdf"
  tipoPeca: string;    // ex.: "Petição Inicial", "Procuração"
  mime: string;
  tamanho: number;     // bytes
}

export interface AcervoProcesso {
  id: string;
  professorId: string;
  numeroProcesso: string;
  classe: string;
  assunto: string;
  vara: string;
  valorCausa: number | null;
  segredoJustica: boolean;
  partes: AcervoParte[];
  documentos: AcervoDocumento[];
  createdAt: string;
}

// ---- persistência + sincronização entre abas ----
type Listener = () => void;
const listeners = new Set<Listener>();
const bc: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

function notify() {
  listeners.forEach(l => { try { l(); } catch { /* noop */ } });
}

if (bc) bc.onmessage = () => notify();
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => { if (e.key === KEY) notify(); });
}

export function subscribeAcervo(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function readAll(): AcervoProcesso[] {
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as AcervoProcesso[]) : [];
  } catch { return []; }
}

function writeAll(list: AcervoProcesso[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  notify();
  if (bc) { try { bc.postMessage({ t: 'change' }); } catch { /* noop */ } }
}

// ---- CRUD ----

/** Todos os processos cadastrados por um professor. */
export function getAcervoDoProfessor(professorId: string): AcervoProcesso[] {
  return readAll()
    .filter(p => p.professorId === professorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveAcervoProcesso(proc: AcervoProcesso) {
  const list = readAll();
  const idx = list.findIndex(p => p.id === proc.id);
  if (idx >= 0) list[idx] = proc;
  else list.push(proc);
  writeAll(list);
}

export function deleteAcervoProcesso(id: string) {
  writeAll(readAll().filter(p => p.id !== id));
}

// ---- Visibilidade para o aluno ----

/** IDs dos professores das turmas em que o aluno está matriculado. */
export function getProfessoresDoAluno(turmaIds: (string | null | undefined)[]): string[] {
  const ids = turmaIds.filter((t): t is string => !!t);
  const profs = demoTurmas
    .filter((t: Turma) => ids.includes(t.id))
    .map(t => t.professor_id);
  return [...new Set(profs)];
}

/**
 * Processos visíveis para um aluno: os cadastrados por qualquer professor
 * das turmas em que o aluno está. Aceita uma ou várias turmas.
 */
export function getAcervoParaAluno(turmaIds: (string | null | undefined)[]): AcervoProcesso[] {
  const professores = new Set(getProfessoresDoAluno(turmaIds));
  if (professores.size === 0) return [];
  return readAll()
    .filter(p => professores.has(p.professorId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ==================== DADOS DE EXEMPLO (SEED) ====================
// Processos fictícios do professor demo (demo-prof-1) para o sistema já vir
// com bastante conteúdo pesquisável. O professor pode excluir à vontade.

type ParteDef = [nome: string, doc: string, tipo: 'fisica' | 'juridica'];

function proc(
  n: number, numero: string, classe: string, assunto: string, vara: string,
  ativos: ParteDef[], passivos: ParteDef[], pecas: string[], data: string,
): AcervoProcesso {
  const id = `seed-${n}`;
  const partes: AcervoParte[] = [
    ...ativos.map((a, i) => ({ id: `${id}-a${i}`, nome: a[0], polo: 'ativo' as const, tipoPessoa: a[2], cpfCnpj: a[1] })),
    ...passivos.map((p, i) => ({ id: `${id}-p${i}`, nome: p[0], polo: 'passivo' as const, tipoPessoa: p[2], cpfCnpj: p[1] })),
  ];
  const documentos: AcervoDocumento[] = pecas.map((t, i) => ({
    id: `${id}-d${i}`, nome: `${t.replace(/[^\w]+/g, '_')}.pdf`, tipoPeca: t, mime: 'application/pdf', tamanho: 512,
  }));
  return { id, professorId: 'demo-prof-1', numeroProcesso: numero, classe, assunto, vara, valorCausa: null, segredoJustica: false, partes, documentos, createdAt: data };
}

const SEED: AcervoProcesso[] = [
  proc(1, '1001234-56.2025.8.13.0024', 'Procedimento Comum Cível', 'Indenização por Dano Moral', '2ª Vara Cível de Belo Horizonte',
    [['MARIA APARECIDA SANTOS', '11122233344', 'fisica']], [['BANCO BRADESCO S.A.', '60746948000112', 'juridica']],
    ['Petição Inicial', 'Procuração'], '2025-03-01T09:00:00Z'),
  proc(2, '1005678-90.2025.8.13.0024', 'Execução Fiscal', 'Dívida Ativa - IPTU', 'Vara de Execuções Fiscais de Belo Horizonte',
    [['MUNICÍPIO DE BELO HORIZONTE', '18715383000140', 'juridica']], [['JOÃO PAULO FERREIRA', '22233344455', 'fisica']],
    ['Petição Inicial', 'Certidão de Dívida Ativa'], '2025-03-04T10:30:00Z'),
  proc(3, '1009876-54.2025.8.13.0024', 'Divórcio Consensual', 'Dissolução de Casamento', '1ª Vara de Família de Belo Horizonte',
    [['CARLA MENDES OLIVEIRA', '33344455566', 'fisica'], ['RICARDO OLIVEIRA GOMES', '44455566677', 'fisica']], [],
    ['Petição Inicial', 'Acordo de Divórcio'], '2025-03-08T14:00:00Z'),
  proc(4, '1012345-67.2025.8.13.0024', 'Ação de Alimentos', 'Alimentos - Fixação', '2ª Vara de Família de Belo Horizonte',
    [['PEDRO HENRIQUE LIMA (repr. por sua mãe)', '55566677788', 'fisica']], [['ANTÔNIO CARLOS LIMA', '66677788899', 'fisica']],
    ['Petição Inicial'], '2025-03-12T11:15:00Z'),
  proc(5, '1015555-22.2025.8.13.0024', 'Busca e Apreensão', 'Alienação Fiduciária', '4ª Vara Cível de Belo Horizonte',
    [['BANCO BRADESCO S.A.', '60746948000112', 'juridica']], [['FERNANDA COSTA ALVES', '77788899900', 'fisica']],
    ['Petição Inicial', 'Contrato de Financiamento'], '2025-03-15T08:45:00Z'),
  proc(6, '1018888-33.2025.8.13.0024', 'Procedimento do Juizado Especial Cível', 'Direito do Consumidor - Cobrança Indevida', '1º Juizado Especial Cível de Belo Horizonte',
    [['LUCAS GABRIEL SOUZA', '88899900011', 'fisica']], [['TELEFÔNICA BRASIL S.A. (VIVO)', '02558157000162', 'juridica']],
    ['Petição Inicial'], '2025-03-18T16:20:00Z'),
  proc(7, '1021111-44.2025.8.13.0024', 'Mandado de Segurança', 'Ato de Autoridade - Concurso Público', 'Vara da Fazenda Pública de Belo Horizonte',
    [['MARIA APARECIDA SANTOS', '11122233344', 'fisica']], [['ESTADO DE MINAS GERAIS', '18715615000160', 'juridica']],
    ['Petição Inicial', 'Edital do Concurso'], '2025-03-20T09:30:00Z'),
  proc(8, '1024444-55.2025.8.13.0024', 'Ação de Cobrança', 'Contratos - Cotas Condominiais', '3ª Vara Cível de Belo Horizonte',
    [['CONDOMÍNIO EDIFÍCIO SOLAR', '05123456000178', 'juridica']], [['ROBERTO DIAS PEREIRA', '99900011122', 'fisica']],
    ['Petição Inicial', 'Planilha de Débitos'], '2025-03-24T13:10:00Z'),
  proc(9, '1027777-66.2025.8.13.0024', 'Usucapião', 'Propriedade - Usucapião Extraordinária', '5ª Vara Cível de Belo Horizonte',
    [['JOSÉ FRANCISCO ROCHA', '10111213144', 'fisica']], [['ESPÓLIO DE MANOEL ROCHA', '12131415166', 'fisica']],
    ['Petição Inicial', 'Planta do Imóvel'], '2025-03-27T10:00:00Z'),
  proc(10, '1030000-77.2025.8.13.0024', 'Inventário', 'Sucessões - Inventário e Partilha', '1ª Vara de Sucessões de Belo Horizonte',
    [['ANA BEATRIZ NUNES', '13141516177', 'fisica']], [['ESPÓLIO DE HELENA NUNES', '14151617188', 'fisica']],
    ['Petição Inicial', 'Certidão de Óbito'], '2025-04-01T09:00:00Z'),
  proc(11, '1033333-88.2025.8.13.0024', 'Despejo por Falta de Pagamento', 'Locação de Imóvel Urbano', '6ª Vara Cível de Belo Horizonte',
    [['IMOBILIÁRIA HORIZONTE LTDA', '07894561000123', 'juridica']], [['CARLOS EDUARDO MARTINS', '15161718199', 'fisica']],
    ['Petição Inicial', 'Contrato de Locação'], '2025-04-05T15:40:00Z'),
  proc(12, '1036666-99.2025.8.13.0024', 'Ação Monitória', 'Título de Crédito - Nota Promissória', '2ª Vara Cível de Belo Horizonte',
    [['BANCO DO BRASIL S.A.', '00000000000191', 'juridica']], [['MARCELO AUGUSTO RIBEIRO', '16171819200', 'fisica']],
    ['Petição Inicial', 'Nota Promissória'], '2025-04-09T11:25:00Z'),
  proc(13, '1039999-10.2025.8.13.0024', 'Cumprimento de Sentença', 'Obrigação de Pagar Quantia Certa', '3ª Vara Cível de Belo Horizonte',
    [['FERNANDA COSTA ALVES', '77788899900', 'fisica']], [['CONSTRUTORA HORIZONTE LTDA', '11222333000144', 'juridica']],
    ['Petição de Cumprimento', 'Planilha de Cálculo'], '2025-04-14T14:50:00Z'),
  proc(14, '1042222-21.2025.8.13.0024', 'Execução Fiscal', 'Dívida Ativa - ISSQN', 'Vara de Execuções Fiscais de Belo Horizonte',
    [['MUNICÍPIO DE BELO HORIZONTE', '18715383000140', 'juridica']], [['COMÉRCIO DE ALIMENTOS XYZ LTDA', '22333444000155', 'juridica']],
    ['Petição Inicial', 'Certidão de Dívida Ativa'], '2025-04-18T09:15:00Z'),
];

/** PDF de exemplo (com texto) usado como conteúdo dos documentos do seed. */
function blobPdfExemplo(): Blob {
  const linhas = [
    'SIMULADOR EDUCACIONAL e-Proc',
    'Documento de exemplo - conteudo ficticio',
    'Faculdade Milton Campos / Grupo Anima',
    'Este arquivo simula uma peca processual.',
  ];
  let content = 'BT /F1 14 Tf 60 740 Td ';
  linhas.forEach((ln, i) => {
    const esc = ln.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    if (i > 0) content += '0 -22 Td ';
    content += `(${esc}) Tj `;
  });
  content += 'ET';
  const objs: string[] = [];
  objs[1] = '<</Type/Catalog/Pages 2 0 R>>';
  objs[2] = '<</Type/Pages/Kids[3 0 R]/Count 1>>';
  objs[3] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>';
  objs[4] = `<</Length ${content.length}>>\nstream\n${content}\nendstream`;
  objs[5] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>';
  let pdf = '%PDF-1.4\n';
  const off: number[] = [];
  for (let i = 1; i <= 5; i++) { off[i] = pdf.length; pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xs = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) pdf += String(off[i]).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xs}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Popula o acervo com os dados de exemplo na primeira execução (quando nunca
 * foi inicializado). Grava também os PDFs de exemplo no IndexedDB.
 */
export function garantirSeedAcervo(): void {
  try {
    if (localStorage.getItem(KEY) !== null) return; // já inicializado (mesmo que vazio)
    writeAll(SEED); // disponível imediatamente para busca
    const blob = blobPdfExemplo();
    SEED.flatMap(p => p.documentos).forEach(d => { saveArquivo(d.id, blob).catch(() => { /* noop */ }); });
  } catch { /* noop */ }
}
