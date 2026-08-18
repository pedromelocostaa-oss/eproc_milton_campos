// Dados do passo 1 do peticionamento (Informações do processo) — padrão PJe/TJMG.
// Listas factuais (comarcas, ritos, áreas, classes, sigilo) usadas nos dropdowns.

export const ritosPJe: string[] = [
  'JUIZADO ESPECIAL ESTADUAL',
  'JUÍZO COMUM',
];

export const niveisSigiloPJe: string[] = [
  'Sem Sigilo (Nível 0)',
  'Segredo de Justiça (Nível 1)',
];

export interface AreaPJe {
  nome: string;
  classes: string[];
}

// Classes de Família (conforme lista exibida no PJe/TJMG)
const CLASSES_FAMILIA = [
  'AÇÃO DE EXIGIR CONTAS',
  'AÇÃO DE PARTILHA',
  'ACORDO DE NÃO PERSECUÇÃO CÍVEL',
  'ALIENAÇÃO JUDICIAL DE BENS',
  'ALIMENTOS - LEI ESPECIAL Nº 5.478/68',
  'ALTERAÇÃO DE REGIME DE BENS',
  'CONSIGNAÇÃO EM PAGAMENTO',
  'CONTESTAÇÃO EM FORO DIVERSO',
  'CONVERSÃO DE SEPARAÇÃO JUDICIAL EM DIVÓRCIO',
  'CUMPRIMENTO DE SENTENÇA',
  'CUMPRIMENTO DE SENTENÇA DE OBRIGAÇÃO DE PRESTAR ALIMENTOS',
  'CUMPRIMENTO PROVISÓRIO DE DECISÃO',
  'CUMPRIMENTO PROVISÓRIO DE SENTENÇA',
  'DIVÓRCIO CONSENSUAL',
  'DIVÓRCIO LITIGIOSO',
  'DÚVIDA',
  'EMBARGOS À EXECUÇÃO',
  'EMBARGOS DE TERCEIRO CÍVEL',
  'EXECUÇÃO EXTRAJUDICIAL DE ALIMENTOS',
  'EXIBIÇÃO DE DOCUMENTO OU COISA CÍVEL',
  'EXTINÇÃO CONSENSUAL DE UNIÃO ESTÁVEL',
  'GUARDA DE FAMÍLIA',
  'HABILITAÇÃO',
  'HABILITAÇÃO DE CRÉDITO',
  'HOMOLOGAÇÃO DE TRANSAÇÃO EXTRAJUDICIAL',
  'INCIDENTE DE IMPEDIMENTO CÍVEL',
  'INCIDENTE DE SUSPEIÇÃO CÍVEL',
  'INSTRUÇÃO DE RESCISÓRIA',
  'INTERDIÇÃO/CURATELA',
  'LIQUIDAÇÃO DE SENTENÇA PELO PROCEDIMENTO COMUM',
  'LIQUIDAÇÃO POR ARBITRAMENTO',
  'LIQUIDAÇÃO PROVISÓRIA DE SENTENÇA PELO PROCEDIMENTO COMUM',
  'LIQUIDAÇÃO PROVISÓRIA POR ARBITRAMENTO',
  'MANDADO DE SEGURANÇA CÍVEL',
  'NOMEAÇÃO DE ADVOGADO',
  'NOTIFICAÇÃO',
  'OPOSIÇÃO',
  'OUTROS PROCEDIMENTOS DE JURISDIÇÃO VOLUNTÁRIA',
  'PROCEDIMENTO COMUM CÍVEL',
  'PRODUÇÃO ANTECIPADA DA PROVA',
  'PROTESTO',
  'RECONHECIMENTO E EXTINÇÃO DE UNIÃO ESTÁVEL',
  'REGULAMENTAÇÃO DA CONVIVÊNCIA FAMILIAR',
  'RESTAURAÇÃO DE AUTOS CÍVEL',
  'RETIFICAÇÃO OU SUPRIMENTO OU RESTAURAÇÃO DE REGISTRO CIVIL',
  'SEPARAÇÃO CONSENSUAL',
  'SEPARAÇÃO CONTENCIOSA',
  'SOBREPARTILHA',
  'SUPRIMENTO DE IDADE E/OU CONSENTIMENTO',
  'TOMADA DE DECISÃO APOIADA',
  'TUTELA ANTECIPADA ANTECEDENTE',
];

const CLASSES_CIVEL = [
  'PROCEDIMENTO COMUM CÍVEL',
  'AÇÃO CIVIL PÚBLICA',
  'AÇÃO DE EXIGIR CONTAS',
  'BUSCA E APREENSÃO EM ALIENAÇÃO FIDUCIÁRIA',
  'CONSIGNAÇÃO EM PAGAMENTO',
  'CUMPRIMENTO DE SENTENÇA',
  'CUMPRIMENTO PROVISÓRIO DE SENTENÇA',
  'DESPEJO POR FALTA DE PAGAMENTO',
  'EMBARGOS À EXECUÇÃO',
  'EMBARGOS DE TERCEIRO CÍVEL',
  'EXECUÇÃO DE TÍTULO EXTRAJUDICIAL',
  'EXIBIÇÃO DE DOCUMENTO OU COISA CÍVEL',
  'INTERDITO PROIBITÓRIO',
  'MANDADO DE SEGURANÇA CÍVEL',
  'MONITÓRIA',
  'PRODUÇÃO ANTECIPADA DA PROVA',
  'REINTEGRAÇÃO / MANUTENÇÃO DE POSSE',
  'USUCAPIÃO',
];

const CLASSES_EMPRESARIAL = [
  'PROCEDIMENTO COMUM CÍVEL',
  'RECUPERAÇÃO JUDICIAL',
  'RECUPERAÇÃO EXTRAJUDICIAL',
  'FALÊNCIA DE EMPRESÁRIOS, SOCIEDADES EMPRESÁRIAS',
  'DISSOLUÇÃO PARCIAL DE SOCIEDADE',
  'EXECUÇÃO DE TÍTULO EXTRAJUDICIAL',
  'MONITÓRIA',
];

const CLASSES_FAZENDA = [
  'PROCEDIMENTO COMUM CÍVEL',
  'MANDADO DE SEGURANÇA CÍVEL',
  'AÇÃO POPULAR',
  'AÇÃO CIVIL PÚBLICA',
  'EXECUÇÃO FISCAL',
  'EMBARGOS À EXECUÇÃO FISCAL',
  'CUMPRIMENTO DE SENTENÇA CONTRA A FAZENDA PÚBLICA',
];

const CLASSES_INFANCIA = [
  'GUARDA',
  'ADOÇÃO',
  'TUTELA',
  'DESTITUIÇÃO DE PODER FAMILIAR',
  'ACOLHIMENTO INSTITUCIONAL',
  'APURAÇÃO DE ATO INFRACIONAL',
];

const CLASSES_REGISTROS = [
  'RETIFICAÇÃO DE REGISTRO DE IMÓVEL',
  'USUCAPIÃO',
  'DÚVIDA',
  'RETIFICAÇÃO OU SUPRIMENTO OU RESTAURAÇÃO DE REGISTRO CIVIL',
];

const CLASSES_SUCESSOES = [
  'INVENTÁRIO',
  'ARROLAMENTO SUMÁRIO',
  'ARROLAMENTO COMUM',
  'ALVARÁ JUDICIAL - LEI 6858/80',
  'PETIÇÃO DE HERANÇA',
  'SOBREPARTILHA',
  'TESTAMENTO',
];

const CLASSES_AGRARIA = [
  'PROCEDIMENTO COMUM CÍVEL',
  'REINTEGRAÇÃO / MANUTENÇÃO DE POSSE',
  'INTERDITO PROIBITÓRIO',
  'USUCAPIÃO',
];

const CLASSES_GENERICAS = [
  'PROCEDIMENTO COMUM CÍVEL',
  'CARTA PRECATÓRIA CÍVEL',
  'PRODUÇÃO ANTECIPADA DA PROVA',
  'NOTIFICAÇÃO',
];

const CLASSES_JEC = [
  'PROCEDIMENTO DO JUIZADO ESPECIAL CÍVEL',
  'EXECUÇÃO DE TÍTULO EXTRAJUDICIAL',
  'EXECUÇÃO CONTRA A FAZENDA PÚBLICA',
  'CUMPRIMENTO DE SENTENÇA',
  'EMBARGOS À EXECUÇÃO',
];

const CLASSES_JE_FAZENDA = [
  'PROCEDIMENTO DO JUIZADO ESPECIAL DA FAZENDA PÚBLICA',
  'EXECUÇÃO CONTRA A FAZENDA PÚBLICA',
  'CUMPRIMENTO DE SENTENÇA',
];

const CLASSES_TURMA_RECURSAL = [
  'RECURSO INOMINADO CÍVEL',
  'MANDADO DE SEGURANÇA CÍVEL',
  'EMBARGOS DE DECLARAÇÃO',
  'AGRAVO DE INSTRUMENTO TR',
];

// Áreas do Rito "Juízo Comum"
const AREAS_JUIZO_COMUM: AreaPJe[] = [
  { nome: 'Agrária', classes: CLASSES_AGRARIA },
  { nome: 'Carta de Ordem Cível', classes: ['CARTA DE ORDEM CÍVEL'] },
  { nome: 'Carta Precatória Cível', classes: ['CARTA PRECATÓRIA CÍVEL'] },
  { nome: 'Cível', classes: CLASSES_CIVEL },
  { nome: 'Empresarial', classes: CLASSES_EMPRESARIAL },
  { nome: 'Família', classes: CLASSES_FAMILIA },
  { nome: 'Fazenda Pública', classes: CLASSES_FAZENDA },
  { nome: 'Infância e Juventude Cível', classes: CLASSES_INFANCIA },
  { nome: 'Pré-Processual', classes: CLASSES_GENERICAS },
  { nome: 'Regional do Barreiro', classes: CLASSES_CIVEL },
  { nome: 'Registros Públicos', classes: CLASSES_REGISTROS },
  { nome: 'Sucessões e Ausências', classes: CLASSES_SUCESSOES },
];

// Áreas do Rito "Juizado Especial Estadual"
const AREAS_JUIZADO_ESPECIAL: AreaPJe[] = [
  { nome: 'Carta Precatória Cível', classes: ['CARTA PRECATÓRIA CÍVEL'] },
  { nome: 'Juizado Especial Cível', classes: CLASSES_JEC },
  { nome: 'Juizado Especial da Fazenda Pública', classes: CLASSES_JE_FAZENDA },
  { nome: 'Pré-Processual', classes: ['RECLAMAÇÃO PRÉ-PROCESSUAL'] },
  { nome: 'Turma Recursal Cível', classes: CLASSES_TURMA_RECURSAL },
];

export const areasPorRito: Record<string, AreaPJe[]> = {
  'JUÍZO COMUM': AREAS_JUIZO_COMUM,
  'JUIZADO ESPECIAL ESTADUAL': AREAS_JUIZADO_ESPECIAL,
};

// Compatibilidade (lista padrão = Juízo Comum)
export const areasPJe = AREAS_JUIZO_COMUM;

// Comarcas de Minas Gerais (lista para o campo "Desejo entrar com a ação em")
export const comarcasMG: string[] = [
  'Abaeté', 'Abre Campo', 'Açucena', 'Águas Formosas', 'Aimorés', 'Aiuruoca', 'Além Paraíba',
  'Alfenas', 'Almenara', 'Alpinópolis', 'Alto Rio Doce', 'Alvinópolis', 'Andradas', 'Andrelândia',
  'Araçuaí', 'Araguari', 'Araxá', 'Arcos', 'Areado', 'Arinos', 'Barão de Cocais', 'Barbacena',
  'Barroso', 'Bela Vista de Minas', 'Belo Horizonte', 'Belo Oriente', 'Betim', 'Bicas', 'Boa Esperança',
  'Bocaiúva', 'Bom Despacho', 'Bonfim', 'Borda da Mata', 'Brasília de Minas', 'Brumadinho', 'Buenópolis',
  'Cabo Verde', 'Caeté', 'Camanducaia', 'Cambuí', 'Cambuquira', 'Campanha', 'Campo Belo', 'Campos Altos',
  'Campos Gerais', 'Canápolis', 'Candeias', 'Capelinha', 'Capinópolis', 'Caratinga', 'Carmo do Cajuru',
  'Carmo do Paranaíba', 'Carmo do Rio Claro', 'Carangola', 'Cássia', 'Cataguases', 'Caxambu',
  'Conceição do Mato Dentro', 'Conceição do Rio Verde', 'Congonhas', 'Conselheiro Lafaiete',
  'Conselheiro Pena', 'Contagem', 'Coração de Jesus', 'Coromandel', 'Coronel Fabriciano', 'Corinto',
  'Curvelo', 'Diamantina', 'Divinópolis', 'Dores do Indaiá', 'Elói Mendes', 'Entre Rios de Minas',
  'Ervália', 'Esmeraldas', 'Espinosa', 'Extrema', 'Ferros', 'Formiga', 'Francisco Sá', 'Frutal',
  'Governador Valadares', 'Grão Mogol', 'Guanhães', 'Guaranésia', 'Guaxupé', 'Ibiá', 'Ibirité',
  'Igarapé', 'Iguatama', 'Inhapim', 'Ipanema', 'Ipatinga', 'Itabira', 'Itabirito', 'Itaguara',
  'Itajubá', 'Itamarandiba', 'Itambacuri', 'Itanhandu', 'Itaobim', 'Itapecerica', 'Itaúna', 'Ituiutaba',
  'Iturama', 'Jaboticatubas', 'Jacinto', 'Jacutinga', 'Janaúba', 'Januária', 'Jequeri', 'Jequitinhonha',
  'João Monlevade', 'João Pinheiro', 'Juiz de Fora', 'Lagoa da Prata', 'Lagoa Santa', 'Lambari',
  'Lavras', 'Leopoldina', 'Lima Duarte', 'Machado', 'Malacacheta', 'Manga', 'Manhuaçu', 'Mantena',
  'Mar de Espanha', 'Maria da Fé', 'Mariana', 'Martinho Campos', 'Mateus Leme', 'Matozinhos',
  'Medina', 'Minas Novas', 'Minduri', 'Miradouro', 'Monte Azul', 'Monte Carmelo', 'Monte Santo de Minas',
  'Monte Sião', 'Montes Claros', 'Muriaé', 'Mutum', 'Muzambinho', 'Nanuque', 'Nepomuceno', 'Nova Era',
  'Nova Lima', 'Nova Ponte', 'Nova Serrana', 'Novo Cruzeiro', 'Oliveira', 'Ouro Fino', 'Ouro Preto',
  'Paracatu', 'Pará de Minas', 'Passa Quatro', 'Passos', 'Patos de Minas', 'Patrocínio', 'Pavão',
  'Peçanha', 'Pedra Azul', 'Pedro Leopoldo', 'Perdões', 'Piranga', 'Pirapora', 'Pitangui', 'Piumhi',
  'Poços de Caldas', 'Pompéu', 'Ponte Nova', 'Porteirinha', 'Pouso Alegre', 'Prata', 'Presidente Olegário',
  'Raul Soares', 'Resplendor', 'Ribeirão das Neves', 'Rio Casca', 'Rio Novo', 'Rio Paranaíba',
  'Rio Pardo de Minas', 'Rio Piracicaba', 'Rio Pomba', 'Sabará', 'Sabinópolis', 'Sacramento',
  'Salinas', 'Santa Bárbara', 'Santa Luzia', 'Santa Maria do Suaçuí', 'Santa Rita do Sapucaí',
  'Santa Vitória', 'Santo Antônio do Amparo', 'Santo Antônio do Monte', 'Santos Dumont',
  'São Domingos do Prata', 'São Francisco', 'São Gonçalo do Sapucaí', 'São Gotardo', 'São João del-Rei',
  'São João Nepomuceno', 'São Lourenço', 'São Sebastião do Paraíso', 'Sete Lagoas',
  'Teófilo Otoni', 'Timóteo', 'Tiradentes', 'Tombos', 'Três Corações', 'Três Marias',
  'Três Pontas', 'Tupaciguara', 'Turmalina', 'Ubá', 'Uberaba', 'Uberlândia', 'Unaí', 'Varginha',
  'Várzea da Palma', 'Vazante', 'Viçosa', 'Virginópolis', 'Visconde do Rio Branco',
];
