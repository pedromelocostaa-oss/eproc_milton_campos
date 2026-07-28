// Audiências do(a) advogado(a) (aluno) — dados de exemplo para a aba "Audiências".
// Reproduz o Painel do Advogado Detalhado do e-Proc: contagem por situação e
// a lista detalhada "Audiências Futuras".

export type SituacaoAudiencia = 'futura' | 'realizada' | 'nao_realizada';

export interface Audiencia {
  id: string;
  numeroProcesso: string;
  vara: string;
  autor: string;
  reu: string;
  evento: string;
  sala: string;
  inicio: string;            // ISO
  previsaoTermino: string;   // ISO
  observacao: string;
  conciliacao: boolean;      // true = audiência de conciliação
  situacao: SituacaoAudiencia;
}

export const AUDIENCIAS: Audiencia[] = [
  {
    id: 'aud-1',
    numeroProcesso: '1012345-67.2025.8.13.0024',
    vara: '2ª Vara de Família da Comarca de Belo Horizonte',
    autor: 'PEDRO HENRIQUE LIMA',
    reu: 'ANTÔNIO CARLOS LIMA',
    evento: 'Audiência de instrução e julgamento designada',
    sala: 'GABINETE — Audiência 2ª Vara de Família BH',
    inicio: '2026-08-05T14:00:00',
    previsaoTermino: '2026-08-05T14:30:00',
    observacao: '',
    conciliacao: false,
    situacao: 'futura',
  },
  {
    id: 'aud-2',
    numeroProcesso: '1018888-33.2025.8.13.0024',
    vara: '1º Juizado Especial Cível da Comarca de Belo Horizonte',
    autor: 'LUCAS GABRIEL SOUZA',
    reu: 'TELEFÔNICA BRASIL S.A. (VIVO)',
    evento: 'Audiência de conciliação designada',
    sala: 'Sala de Conciliação 01 — CEJUSC Belo Horizonte',
    inicio: '2026-08-07T09:00:00',
    previsaoTermino: '2026-08-07T09:30:00',
    observacao: 'Comparecimento obrigatório das partes.',
    conciliacao: true,
    situacao: 'futura',
  },
  {
    id: 'aud-3',
    numeroProcesso: '1001234-56.2025.8.13.0024',
    vara: '2ª Vara Cível da Comarca de Belo Horizonte',
    autor: 'MARIA APARECIDA SANTOS',
    reu: 'BANCO BRADESCO S.A.',
    evento: 'Audiência de instrução e julgamento realizada',
    sala: 'Sala 04 — 2ª Vara Cível BH',
    inicio: '2026-06-18T09:00:00',
    previsaoTermino: '2026-06-18T09:40:00',
    observacao: 'Ouvidas duas testemunhas.',
    conciliacao: false,
    situacao: 'realizada',
  },
  {
    id: 'aud-4',
    numeroProcesso: '1024444-55.2025.8.13.0024',
    vara: '3ª Vara Cível da Comarca de Belo Horizonte',
    autor: 'CONDOMÍNIO EDIFÍCIO SOLAR',
    reu: 'ROBERTO DIAS PEREIRA',
    evento: 'Audiência cancelada por ausência do réu',
    sala: 'Sala 02 — 3ª Vara Cível BH',
    inicio: '2026-06-25T10:00:00',
    previsaoTermino: '2026-06-25T10:30:00',
    observacao: 'Redesignação a ser feita.',
    conciliacao: false,
    situacao: 'nao_realizada',
  },
  {
    id: 'aud-5',
    numeroProcesso: '1009876-54.2025.8.13.0024',
    vara: '1ª Vara de Família da Comarca de Belo Horizonte',
    autor: 'CARLA MENDES OLIVEIRA',
    reu: 'RICARDO OLIVEIRA GOMES',
    evento: 'Audiência de conciliação realizada — acordo homologado',
    sala: 'Sala de Conciliação 02 — CEJUSC Belo Horizonte',
    inicio: '2026-06-10T14:30:00',
    previsaoTermino: '2026-06-10T15:00:00',
    observacao: 'Acordo firmado entre as partes.',
    conciliacao: true,
    situacao: 'realizada',
  },
];

export interface CategoriaAudiencia {
  chave: string;
  rotulo: string;
  situacao: SituacaoAudiencia;
  conciliacao: boolean;
}

// As 6 linhas da tabela Situação × Quantidade (Painel do Advogado Detalhado)
export const CATEGORIAS: CategoriaAudiencia[] = [
  { chave: 'fut',       rotulo: 'Audiências Futuras (Designada, Redesignada, Prorrogada, Adiada, Antecipada)', situacao: 'futura', conciliacao: false },
  { chave: 'real',      rotulo: 'Audiências Realizadas (Audiências Realizadas)', situacao: 'realizada', conciliacao: false },
  { chave: 'nao',       rotulo: 'Audiências Não Realizadas (Canceladas, Não Realizadas)', situacao: 'nao_realizada', conciliacao: false },
  { chave: 'fut_conc',  rotulo: 'Audiências Futuras de Conciliação (Designada, Redesignada, Prorrogada, Adiada, Antecipada)', situacao: 'futura', conciliacao: true },
  { chave: 'real_conc', rotulo: 'Audiências Realizadas de Conciliação (Audiências Realizadas)', situacao: 'realizada', conciliacao: true },
  { chave: 'nao_conc',  rotulo: 'Audiências Não Realizadas de Conciliação (Canceladas, Não Realizadas)', situacao: 'nao_realizada', conciliacao: true },
];

export function filtrarAudiencias(situacao: SituacaoAudiencia, conciliacao: boolean): Audiencia[] {
  return AUDIENCIAS.filter(a => a.situacao === situacao && a.conciliacao === conciliacao);
}

export function contar(situacao: SituacaoAudiencia, conciliacao: boolean): number {
  return filtrarAudiencias(situacao, conciliacao).length;
}

/** A audiência futura mais próxima (menor data de início). */
export function proximaAudiencia(): Audiencia | null {
  const futuras = AUDIENCIAS.filter(a => a.situacao === 'futura').sort((a, b) => a.inicio.localeCompare(b.inicio));
  return futuras[0] ?? null;
}
