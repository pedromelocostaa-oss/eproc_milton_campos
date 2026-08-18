import assuntosTPU from './assuntos_tpu.json';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ClasseProcessual {
  codigo: string;
  descricao: string;
  grupo: string;
}

export interface AssuntoCNJ {
  codigo: string;
  descricao: string;
  area: string;
}

export interface NodoAssunto {
  codigo: string;
  descricao: string;
  area: string;
  podePrincipal?: boolean;
  norma?: string;
  artigo?: string;
  glossario?: string;
  subitens?: NodoAssunto[];
}

export interface EntidadeFederal {
  cnpj: string;
  nome: string;
}

export interface AreaTJMG {
  codigo: string;
  descricao: string;
  classes: string[];
}

// Kept for backwards compatibility — not used in TJMG flow
export interface NivelSigilo {
  codigo: string;
  descricao: string;
}

// ─── TJMG — Tribunal ─────────────────────────────────────────────────────────

export const tribunaisTJMG: string[] = [
  'TJMG - Tribunal de Justiça do Estado de Minas Gerais',
];

// ─── TJMG — Áreas e Classes ──────────────────────────────────────────────────

export const areasTJMG: AreaTJMG[] = [
  {
    codigo: 'CIVEL',
    descricao: 'Cível',
    classes: [
      'Procedimento Comum Cível',
      'Ação Civil Pública',
      'Consignação em Pagamento',
      'Ação Rescisória',
      'Busca e Apreensão em Alienação Fiduciária',
      'Embargos de Terceiro',
      'Interdito Proibitório',
      'Mandado de Segurança Cível',
      'Habeas Data',
      'Cumprimento de Sentença',
      'Execução de Título Extrajudicial',
    ],
  },
  {
    codigo: 'FAMILIA',
    descricao: 'Família e Sucessões',
    classes: [
      'Ação de Alimentos',
      'Regulamentação de Visitas',
      'Guarda e Responsabilidade',
      'Divórcio Litigioso',
      'Divórcio Consensual',
      'Inventário e Partilha',
      'Alvará Judicial',
      'Tutela',
      'União Estável — Dissolução',
    ],
  },
  {
    codigo: 'INFANCIA',
    descricao: 'Infância e Juventude',
    classes: [
      'Procedimento da Infância e Juventude — Cível',
      'Adoção',
      'Destituição do Poder Familiar',
      'Guarda (ECA)',
      'Representação — Ato Infracional',
    ],
  },
  {
    codigo: 'CRIMINAL',
    descricao: 'Criminal',
    classes: [
      'Ação Penal — Procedimento Ordinário',
      'Ação Penal — Procedimento Sumário',
      'Habeas Corpus Criminal',
      'Mandado de Segurança Criminal',
      'Inquérito Policial',
    ],
  },
  {
    codigo: 'EXEC_CRIMINAL',
    descricao: 'Execuções Criminais',
    classes: [
      'Execução de Pena Privativa de Liberdade',
      'Execução de Pena Restritiva de Direito',
      'Execução de Medida de Segurança',
    ],
  },
  {
    codigo: 'FAZENDA',
    descricao: 'Fazenda Pública',
    classes: [
      'Procedimento Comum — Fazenda Pública',
      'Mandado de Segurança — Fazenda Pública',
      'Ação Popular',
      'Ação Civil Pública — Fazenda Pública',
      'Cumprimento de Sentença contra a Fazenda Pública',
    ],
  },
  {
    codigo: 'FALENCIAS',
    descricao: 'Falências e Recuperações Judiciais',
    classes: [
      'Falência',
      'Recuperação Judicial',
      'Recuperação Extrajudicial',
      'Insolvência Civil',
    ],
  },
  {
    codigo: 'REGISTROS',
    descricao: 'Registros Públicos e Notarial',
    classes: [
      'Retificação de Registro',
      'Usucapião',
      'Procedimento Especial — Registros Públicos',
    ],
  },
  {
    codigo: 'JE',
    descricao: 'Juizados Especiais',
    classes: [
      'Procedimento do Juizado Especial Cível',
      'Procedimento do Juizado Especial Criminal',
      'Procedimento do Juizado Especial da Fazenda Pública',
    ],
  },
];

// ─── Níveis de Sigilo (TJMG — string[]) ──────────────────────────────────────

export const niveisSigno: string[] = [
  'Público',
  'Segredo de Justiça',
  'Segredo de Justiça – Somente para as Partes',
  'Sigiloso',
  'Absolutamente Sigiloso',
];

// ─── Sigilo de Documentos ─────────────────────────────────────────────────────

export const siglosDocumento: string[] = [
  'Público',
  'Segredo de Justiça',
  'Restrito às Partes',
  'Restrito ao Juízo',
  'Sigiloso',
  'Restrito Juiz Nível 5',
];

// ─── Pessoas e Documentos ────────────────────────────────────────────────────

export const tiposPessoa: string[] = [
  'Pessoa Física',
  'Pessoa Jurídica',
  'Órgão Público',
  'Ente Despersonalizado',
];

export const tiposDocOutros: string[] = [
  'RG',
  'CNH',
  'Passaporte',
  'CTPS',
  'Certidão de Nascimento',
  'Certidão de Casamento',
  'Título de Eleitor',
  'Outro',
];

// ─── Dados Pessoais ───────────────────────────────────────────────────────────

export const sexos: string[] = [
  'Masculino',
  'Feminino',
  'Não informado',
];

export const estadosCivis: string[] = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
  'Não informado',
];

export const identidadesGenero: string[] = [
  'Cisgênero',
  'Transgênero',
  'Não-binário',
  'Outro',
  'Prefiro não informar',
];

export const orientacoesSexuais: string[] = [
  'Heterossexual',
  'Homossexual',
  'Bissexual',
  'Outro',
  'Prefiro não informar',
];

export const racasEtnia: string[] = [
  'Branca',
  'Preta',
  'Parda',
  'Amarela',
  'Indígena',
  'Não informado',
];

export const tiposDeficiencia: string[] = [
  'Auditiva',
  'Visual',
  'Motora',
  'Mental/Intelectual',
  'Múltipla',
  'Outra',
];

export const niveisEscolaridade: string[] = [
  'Sem escolaridade',
  'Fundamental incompleto',
  'Fundamental completo',
  'Médio incompleto',
  'Médio completo',
  'Superior incompleto',
  'Superior completo',
  'Pós-graduação',
  'Não informado',
];

// ─── Justiça Gratuita ─────────────────────────────────────────────────────────

export const justicaGratuitaOpcoes: string[] = [
  'Não',
  'Sim',
  'Parcial',
  'Deferida pelo Juízo',
];

// ─── Classes Processuais (mantidas — compatibilidade) ────────────────────────

export const classesProcessuais: ClasseProcessual[] = [
  { codigo: '7',     descricao: 'Procedimento Comum Cível',                              grupo: 'CÍVEL' },
  { codigo: '120',   descricao: 'Mandado de Segurança Cível',                            grupo: 'CONSTITUCIONAL' },
  { codigo: '65',    descricao: 'Ação Civil Pública',                                    grupo: 'CÍVEL' },
  { codigo: '436',   descricao: 'Procedimento do Juizado Especial Cível',                grupo: 'JUIZADO' },
  { codigo: '32',    descricao: 'Consignação em Pagamento',                              grupo: 'CÍVEL' },
  { codigo: '156',   descricao: 'Cumprimento de Sentença',                               grupo: 'EXECUÇÃO' },
  { codigo: '159',   descricao: 'Execução de Título Extrajudicial',                      grupo: 'EXECUÇÃO' },
  { codigo: '281',   descricao: 'Ação Rescisória',                                       grupo: 'CÍVEL' },
  { codigo: '1028',  descricao: 'Habeas Data',                                           grupo: 'CONSTITUCIONAL' },
  { codigo: '58',    descricao: 'Interdito Proibitório',                                 grupo: 'CÍVEL' },
  { codigo: '1116',  descricao: 'Ação de Alimentos',                                     grupo: 'FAMÍLIA' },
  { codigo: '475',   descricao: 'Inventário e Partilha',                                 grupo: 'SUCESSÕES' },
  { codigo: '48',    descricao: 'Embargos de Terceiro',                                  grupo: 'CÍVEL' },
  { codigo: '12078', descricao: 'Cumprimento de Sentença contra a Fazenda Pública',      grupo: 'EXECUÇÃO' },
  { codigo: '81',    descricao: 'Busca e Apreensão em Alienação Fiduciária',             grupo: 'CÍVEL' },
  { codigo: '1117',  descricao: 'Regulamentação de Visitas',                             grupo: 'FAMÍLIA' },
  { codigo: '1118',  descricao: 'Guarda e Responsabilidade',                             grupo: 'FAMÍLIA' },
];

// ─── Assuntos CNJ (mantidos — compatibilidade) ───────────────────────────────

export const assuntosCNJ: AssuntoCNJ[] = [
  { codigo: '10431', descricao: 'Responsabilidade Civil',                               area: 'DIREITO CIVIL' },
  { codigo: '10433', descricao: 'Indenização por Dano Moral',                           area: 'DIREITO CIVIL' },
  { codigo: '10434', descricao: 'Indenização por Dano Material',                        area: 'DIREITO CIVIL' },
  { codigo: '10435', descricao: 'Indenização por Dano Moral – Acidente de Trânsito',   area: 'DIREITO CIVIL' },
  { codigo: '10445', descricao: 'Erro Médico',                                          area: 'DIREITO CIVIL' },
  { codigo: '10450', descricao: 'Obrigação de Fazer / Não Fazer',                      area: 'DIREITO CIVIL' },
  { codigo: '10455', descricao: 'Contratos em Geral',                                   area: 'DIREITO CIVIL' },
  { codigo: '10470', descricao: 'Dano Estético',                                        area: 'DIREITO CIVIL' },
  { codigo: '10460', descricao: 'Responsabilidade do Fornecedor',                       area: 'DIREITO DO CONSUMIDOR' },
  { codigo: '10461', descricao: 'Defeito / Vício do Produto',                           area: 'DIREITO DO CONSUMIDOR' },
  { codigo: '10462', descricao: 'Práticas Abusivas',                                    area: 'DIREITO DO CONSUMIDOR' },
  { codigo: '9991',  descricao: 'Responsabilidade da Administração',                    area: 'DIREITO ADMINISTRATIVO' },
  { codigo: '9992',  descricao: 'Indenização por Dano Moral – Responsabilidade Pública', area: 'DIREITO ADMINISTRATIVO' },
  { codigo: '10219', descricao: 'Servidor Público Civil',                               area: 'DIREITO ADMINISTRATIVO' },
  { codigo: '10288', descricao: 'Sistema Remuneratório e Benefícios',                   area: 'DIREITO ADMINISTRATIVO' },
  { codigo: '7769',  descricao: 'Abatimento Proporcional do Preço',                     area: 'DIREITO DO CONSUMIDOR' },
  { codigo: '1156',  descricao: 'Direito do Consumidor – Geral',                        area: 'DIREITO DO CONSUMIDOR' },
];

// ─── Prioridades (mantidas) ───────────────────────────────────────────────────

export const prioridades: string[] = [
  'Idoso (60 a 80 anos)',
  'Idoso (acima de 80 anos)',
  'Portador de doença grave',
  'Pessoa com deficiência',
  'Violência doméstica e familiar',
  'Estatuto da Criança e do Adolescente',
  'Medida de urgência',
  'Juízo 100% Digital',
];

// ─── Tipos de Documento (mantidos) ───────────────────────────────────────────

export const tiposDocumento: string[] = [
  'Petição Inicial',
  'Procuração',
  'Documento de Identidade',
  'CPF',
  'Comprovante de Residência',
  'Laudo Médico/Pericial',
  'Contrato',
  'Nota Fiscal / Recibo',
  'Boletim de Ocorrência',
  'Certidão',
  'Declaração',
  'Fotografias',
  'Extrato Bancário',
  'Prontuário Médico',
  'Outros',
];

// ─── Tipos de Petição Incidental (mantidos) ───────────────────────────────────

export const tiposPeticaoIncidental: string[] = [
  'Contestação',
  'Réplica',
  'Agravo de Instrumento',
  'Apelação',
  'Embargos de Declaração',
  'Impugnação ao Cumprimento de Sentença',
  'Exceção de Incompetência',
  'Reconvenção',
  'Manifestação',
  'Petição (genérica)',
  'Juntada de Documentos',
  'Substabelecimento',
  'Renúncia ao Prazo',
  'Ciência',
  'Memorial',
  'Recurso – Agravo Interno',
  'Requerimento de Provas',
  'Informações Complementares',
  'Desistência',
  'Acordo / Homologação',
];

// ─── Entidades (mantidas — compatibilidade) ───────────────────────────────────

export const entidadesFederais: EntidadeFederal[] = [
  { cnpj: '17.590.929/0001-59', nome: 'Estado de Minas Gerais' },
  { cnpj: '18.715.532/0001-90', nome: 'Município de Belo Horizonte' },
  { cnpj: '16.831.369/0001-78', nome: 'Município de Uberlândia' },
  { cnpj: '18.599.533/0001-82', nome: 'Município de Contagem' },
  { cnpj: '49.247.646/0001-50', nome: 'Companhia Energética de Minas Gerais — CEMIG' },
  { cnpj: '07.155.811/0001-19', nome: 'Companhia de Saneamento de Minas Gerais — COPASA' },
  { cnpj: '00.360.305/0001-04', nome: 'Caixa Econômica Federal — CEF' },
  { cnpj: '00.000.000/0001-91', nome: 'Banco do Brasil S.A.' },
  { cnpj: '29.979.036/0001-40', nome: 'Instituto Nacional do Seguro Social — INSS' },
  { cnpj: '00.394.460/0001-41', nome: 'União Federal (AGU)' },
  { cnpj: '60.746.948/0001-12', nome: 'Banco Bradesco S.A.' },
  { cnpj: '60.701.190/0001-04', nome: 'Itaú Unibanco S.A.' },
  { cnpj: '33.172.537/0001-98', nome: 'Claro S.A.' },
  { cnpj: '02.558.157/0001-62', nome: 'TIM S.A.' },
  { cnpj: '02.449.992/0001-17', nome: 'Vivo — Telefônica Brasil S.A.' },
  { cnpj: '10.563.000/0001-31', nome: 'Azul Linhas Aéreas Brasileiras S.A.' },
  { cnpj: '07.975.010/0001-44', nome: 'GOL Linhas Aéreas Inteligentes S.A.' },
  { cnpj: '02.012.862/0001-60', nome: 'LATAM Airlines Brasil S.A.' },
];

// ─── Árvore de Assuntos — TPU/CNJ (dados reais) ─────────────────────────────

export const arvoreAssuntos: NodoAssunto[] = assuntosTPU as NodoAssunto[];

