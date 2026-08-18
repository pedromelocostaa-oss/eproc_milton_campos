export const mockStudent = {
  id: "1",
  name: "Luiz Cordeiro",
  email: "luiz.cordeiro@universidade.edu.br",
  matricula: "2023.1.001234",
  curso: "Direito",
  instituicao: "Universidade Federal Acadêmica",
  oab: "MG192731",
  cpf: "121.572.976-69",
};

export const mockActivities = [
  {
    id: "1",
    title: "Petição Inicial – Responsabilidade Civil",
    disciplina: "Processo Civil I",
    professor: "Professor Carlos Andrade",
    prazo: "20/03/2026",
    status: "Não iniciada" as const,
    descricao:
      "Elabore e protocole uma petição inicial de ação de responsabilidade civil por danos morais e materiais, seguindo o fluxo completo de peticionamento eletrônico.",
  },
];

export const mockMaterias = [
  "DIREITO ADMINISTRATIVO E OUTRAS MATÉRIAS DE DIREITO PÚBLICO",
  "DIREITO ASSISTENCIAL",
  "DIREITO CIVIL > COISAS",
  "DIREITO CIVIL > EMPRESAS",
  "DIREITO CIVIL > FAMÍLIA",
  "DIREITO CIVIL > FATOS JURÍDICOS",
  "DIREITO CIVIL > OBRIGAÇÕES",
  "DIREITO CIVIL > PESSOAS JURÍDICAS",
  "DIREITO CIVIL > PESSOAS NATURAIS",
  "DIREITO CIVIL > RESPONSABILIDADE CIVIL",
  "DIREITO CIVIL > SUCESSÕES",
  "DIREITO DA CRIANÇA E DO ADOLESCENTE",
  "DIREITO DA SAÚDE",
  "DIREITO DO CONSUMIDOR",
  "DIREITO DO TRABALHO",
  "DIREITO ELEITORAL",
  "DIREITO ELEITORAL E PROCESSO ELEITORAL DO STF",
  "DIREITO INTERNACIONAL",
  "DIREITO MARÍTIMO",
];

export const mockJurisdicoes = [
  "Abaeté",
  "Abaeté - Juizado Especial",
  "Abre Campo",
  "Abre Campo - Juizado Especial",
  "Açucena",
  "Açucena - Juizado Especial",
  "Águas Formosas",
  "Águas Formosas - Juizado Especial",
  "Aimorés",
  "Aimorés - Juizado Especial",
  "Aiuruoca",
  "Aiuruoca - Juizado Especial",
  "Além Paraíba",
  "Além Paraíba - Juizado Especial",
  "Alfenas",
  "Alfenas - Juizado Especial",
  "Almenara",
  "Almenara - Juizado Especial",
  "Belo Horizonte",
  "Belo Horizonte - Juizado Especial",
  "Contagem",
  "Curitiba",
  "Porto Alegre",
  "Rio de Janeiro",
  "Salvador",
  "São Paulo",
];

export const mockRitos = [
  "JUÍZO COMUM",
  "JUIZADO ESPECIAL ESTADUAL",
];

export const mockAreasByRito: Record<string, string[]> = {
  "JUÍZO COMUM": [
    "Agrária",
    "Carta de Ordem Cível",
    "Carta Precatória Cível",
    "Cível",
    "Empresarial",
    "Família",
    "Fazenda Pública",
    "Infância e Juventude Cível",
    "Pré-Processual",
    "Regional do Barreiro",
    "Registros Públicos",
    "Sucessões e Ausências",
  ],
  "JUIZADO ESPECIAL ESTADUAL": [
    "Carta Precatória Cível",
    "Juizado Especial Cível",
    "Juizado Especial da Fazenda Pública",
    "Pré-Processual",
    "Turma Recursal Cível",
  ],
};

export const mockCompetencias = [
  "Cível",
  "Família",
  "Fazenda Pública",
  "Juizado Especial Cível",
  "Vara de Sucessões",
];

export const mockClassesJudiciais = [
  "[CÍVEL] AÇÃO DE EXIGIR CONTAS (45)",
  "[CÍVEL] ALIENAÇÃO JUDICIAL DE BENS (52)",
  "[CÍVEL] ARRECADAÇÃO DAS COISAS VAGAS (53)",
  "[CÍVEL] BUSCA E APREENSÃO EM ALIENAÇÃO FIDUCIÁRIA (81)",
  "[CÍVEL] CARTA ARBITRAL (12082)",
  "[CÍVEL] COBRANÇA DE CÉDULA DE CRÉDITO INDUSTRIAL (84)",
  "[CÍVEL] COMPROMISSO ARBITRAL (85)",
  "[CÍVEL] CONSIGNAÇÃO EM PAGAMENTO (32)",
  "[CÍVEL] CONSIGNATÓRIA DE ALUGUÉIS (86)",
  "[CÍVEL] CUMPRIMENTO DE SENTENÇA (156)",
  "[CÍVEL] CUMPRIMENTO DE SENTENÇA CONTRA A FAZENDA PÚBLICA (12078)",
  "[CÍVEL] CUMPRIMENTO DE SENTENÇA - LEI ARBITRAL (LEI 9.307/1996) (12231)",
  "[CÍVEL] DEPÓSITO DA LEI 8.866/94 (89)",
  "[CÍVEL] DESPEJO (92)",
  "[CÍVEL] DESPEJO POR FALTA DE PAGAMENTO (93)",
  "[CÍVEL] PROCEDIMENTO COMUM CÍVEL (7)",
  "[CÍVEL] PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL (436)",
  "[CÍVEL] EXECUÇÃO DE TÍTULO EXTRAJUDICIAL (159)",
  "[CÍVEL] MANDADO DE SEGURANÇA CÍVEL (120)",
  "[CÍVEL] AÇÃO CIVIL PÚBLICA (65)",
];

export const mockOrgaosJulgadores = [
  "1ª Vara Cível",
  "2ª Vara Cível",
  "3ª Vara Cível",
  "4ª Vara Cível",
  "1ª Vara de Família",
  "2ª Vara de Família",
  "Juizado Especial Cível",
];

export const mockAssuntos = [
  { codigo: "10431", descricao: "DIREITO CIVIL (899) | Responsabilidade Civil (10431)" },
  { codigo: "10433", descricao: "DIREITO CIVIL (899) | Responsabilidade Civil (10431) | Indenização por Dano Moral (10433)" },
  { codigo: "10434", descricao: "DIREITO CIVIL (899) | Responsabilidade Civil (10431) | Indenização por Dano Material (10434)" },
  { codigo: "10435", descricao: "DIREITO CIVIL (899) | Responsabilidade Civil (10431) | Indenização por Dano Moral (10433) | Acidente de Trânsito (10435)" },
  { codigo: "10445", descricao: "DIREITO CIVIL (899) | Responsabilidade Civil (10431) | Erro Médico (10445)" },
  { codigo: "10450", descricao: "DIREITO CIVIL (899) | Obrigação de Fazer / Não Fazer (10450)" },
  { codigo: "10455", descricao: "DIREITO CIVIL (899) | Contratos (10455)" },
  { codigo: "10460", descricao: "DIREITO DO CONSUMIDOR (1156) | Responsabilidade do Fornecedor (6220)" },
  { codigo: "10470", descricao: "DIREITO CIVIL (899) | Responsabilidade Civil (10431) | Dano Estético (10470)" },
  { codigo: "9996", descricao: "DIREITO ADMINISTRATIVO E OUTRAS MATÉRIAS DE DIREITO PÚBLICO (9985) | Responsabilidade da Administração (9991) | Indenização por Dano Moral (9992) | Acidente de Trânsito (9996)" },
  { codigo: "14162", descricao: "DIREITO ADMINISTRATIVO E OUTRAS MATÉRIAS DE DIREITO PÚBLICO (9985) | Responsabilidade da Administração (9991) | Indenização por Dano Moral (9992) | Acidentes (14162)" },
  { codigo: "6153", descricao: "DIREITO PREVIDENCIÁRIO (195) | RMI - Renda Mensal Inicial, Reajustes e Revisões Específicas (6119) | Abono da Lei 8.178/91 (6153)" },
  { codigo: "10662", descricao: "DIREITO ADMINISTRATIVO E OUTRAS MATÉRIAS DE DIREITO PÚBLICO (9905) | Servidor Público Civil (10219) | Sistema Remuneratório e Benefícios (10288) | Abono de Permanência (10662)" },
  { codigo: "7769", descricao: "DIREITO DO CONSUMIDOR (1156) | Responsabilidade do Fornecedor (6220) | Abatimento proporcional do preço (27789)" },
  { codigo: "15301", descricao: "DIREITO AMBIENTAL (10110) | Dano Moral Coletivo Decorrente de Dano Ambiental (15301)" },
];

export const mockTiposParte = [
  "AUTOR",
  "REQUERENTE",
];

export const mockTiposPartePassivo = [
  "RÉU/RÉ",
  "REQUERIDO(A)",
];

export const mockTiposPessoa = [
  "Física",
  "Jurídica",
  "Ente ou autoridade",
];

export const mockTiposDocumento = [
  "Petição Inicial",
  "Procuração",
  "Documento de Identificação",
  "Comprovante de Residência",
  "Laudo Pericial",
  "Contrato",
  "Nota Fiscal",
  "Boletim de Ocorrência",
  "Certidão",
  "Declaração",
  "Documento de Comprovação",
  "Outros",
];

export const mockTiposDocumentoAnexo = [
  "Acordo",
  "Acordo de Divórcio",
  "Acordo de Não-Persecutínio Penal",
  "Acordo Extrajudicial",
  "Acordo (Outros)",
  "Aditamento",
  "Aditamento a Denúncia",
  "Aditamento a Inicial",
  "Alegações Finais",
  "Certidão",
  "Contrato",
  "Declaração",
  "Documento de Comprovação",
  "Laudo Pericial",
  "Nota Fiscal",
  "Procuração",
  "Outros",
];

export const mockPrioridades = [
  "Ação Civil de Improbidade Administrativa",
  "Ação Civil Pública Cível",
  "Adolescente Acautelado",
  "Alienação Parental",
  "Estatuto da criança e do adolescente",
  "Juízo 100% Digital",
  "Lei de Licitações",
  "Medida Cautelar de Monitoração eletrônica",
  "Pessoa com deficiência",
  "Pessoa com idade acima de 80 anos",
  "Pessoa com idade entre 60 e 80 anos",
  "Pessoa em situação de rua",
  "Portador(a) de doença grave",
  "Réu/Ré Preso(a)",
  "Violência Doméstica e Familiar",
];

export const mockEstados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function generateProcessNumber(): string {
  const seq = String(Math.floor(1000000 + Math.random() * 9000000));
  const dig = String(Math.floor(10 + Math.random() * 90));
  const ano = "2026";
  const just = "8";
  const trib = "13";
  const orig = "0024";
  return `${seq}-${dig}.${ano}.${just}.${trib}.${orig}`;
}

export function getCurrentDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
