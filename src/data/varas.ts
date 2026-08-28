export interface Vara {
  codigo: string;
  nome: string;
  competencia: string;
  cidade: string;
}

// Varas estaduais da Comarca de Belo Horizonte — TJMG
// Cada grupo corresponde à competência/área do processo
export const varasBH: Vara[] = [
  // ── Cível ──
  { codigo: '0001', nome: '1ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0002', nome: '2ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0003', nome: '3ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0004', nome: '4ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0005', nome: '5ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0006', nome: '6ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0007', nome: '7ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0008', nome: '8ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0009', nome: '9ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },
  { codigo: '0010', nome: '10ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Cível', cidade: 'Belo Horizonte' },

  // ── Família ──
  { codigo: '0101', nome: '1ª Vara de Família da Comarca de Belo Horizonte', competencia: 'Família', cidade: 'Belo Horizonte' },
  { codigo: '0102', nome: '2ª Vara de Família da Comarca de Belo Horizonte', competencia: 'Família', cidade: 'Belo Horizonte' },
  { codigo: '0103', nome: '3ª Vara de Família da Comarca de Belo Horizonte', competencia: 'Família', cidade: 'Belo Horizonte' },
  { codigo: '0104', nome: '4ª Vara de Família da Comarca de Belo Horizonte', competencia: 'Família', cidade: 'Belo Horizonte' },
  { codigo: '0105', nome: '5ª Vara de Família da Comarca de Belo Horizonte', competencia: 'Família', cidade: 'Belo Horizonte' },
  { codigo: '0106', nome: '6ª Vara de Família da Comarca de Belo Horizonte', competencia: 'Família', cidade: 'Belo Horizonte' },

  // ── Empresarial ──
  { codigo: '0201', nome: '1ª Vara Empresarial da Comarca de Belo Horizonte', competencia: 'Empresarial', cidade: 'Belo Horizonte' },
  { codigo: '0202', nome: '2ª Vara Empresarial da Comarca de Belo Horizonte', competencia: 'Empresarial', cidade: 'Belo Horizonte' },
  { codigo: '0203', nome: '3ª Vara Empresarial da Comarca de Belo Horizonte', competencia: 'Empresarial', cidade: 'Belo Horizonte' },

  // ── Fazenda Pública ──
  { codigo: '0301', nome: '1ª Vara da Fazenda Pública e Autarquias da Comarca de Belo Horizonte', competencia: 'Fazenda Pública', cidade: 'Belo Horizonte' },
  { codigo: '0302', nome: '2ª Vara da Fazenda Pública e Autarquias da Comarca de Belo Horizonte', competencia: 'Fazenda Pública', cidade: 'Belo Horizonte' },
  { codigo: '0303', nome: '3ª Vara da Fazenda Pública e Autarquias da Comarca de Belo Horizonte', competencia: 'Fazenda Pública', cidade: 'Belo Horizonte' },
  { codigo: '0304', nome: '4ª Vara da Fazenda Pública e Autarquias da Comarca de Belo Horizonte', competencia: 'Fazenda Pública', cidade: 'Belo Horizonte' },

  // ── Sucessões e Ausências ──
  { codigo: '0401', nome: '1ª Vara de Sucessões e Ausências da Comarca de Belo Horizonte', competencia: 'Sucessões e Ausências', cidade: 'Belo Horizonte' },
  { codigo: '0402', nome: '2ª Vara de Sucessões e Ausências da Comarca de Belo Horizonte', competencia: 'Sucessões e Ausências', cidade: 'Belo Horizonte' },

  // ── Registros Públicos ──
  { codigo: '0501', nome: '1ª Vara de Registros Públicos da Comarca de Belo Horizonte', competencia: 'Registros Públicos', cidade: 'Belo Horizonte' },
  { codigo: '0502', nome: '2ª Vara de Registros Públicos da Comarca de Belo Horizonte', competencia: 'Registros Públicos', cidade: 'Belo Horizonte' },

  // ── Infância e Juventude ──
  { codigo: '0601', nome: '1ª Vara da Infância e Juventude da Comarca de Belo Horizonte', competencia: 'Infância e Juventude Cível', cidade: 'Belo Horizonte' },
  { codigo: '0602', nome: '2ª Vara da Infância e Juventude da Comarca de Belo Horizonte', competencia: 'Infância e Juventude Cível', cidade: 'Belo Horizonte' },

  // ── Juizado Especial Cível ──
  { codigo: '0701', nome: '1º Juizado Especial Cível da Comarca de Belo Horizonte', competencia: 'Juizado Especial Cível', cidade: 'Belo Horizonte' },
  { codigo: '0702', nome: '2º Juizado Especial Cível da Comarca de Belo Horizonte', competencia: 'Juizado Especial Cível', cidade: 'Belo Horizonte' },
  { codigo: '0703', nome: '3º Juizado Especial Cível da Comarca de Belo Horizonte', competencia: 'Juizado Especial Cível', cidade: 'Belo Horizonte' },
  { codigo: '0704', nome: '4º Juizado Especial Cível da Comarca de Belo Horizonte', competencia: 'Juizado Especial Cível', cidade: 'Belo Horizonte' },

  // ── Juizado Especial da Fazenda Pública ──
  { codigo: '0801', nome: 'Juizado Especial da Fazenda Pública da Comarca de Belo Horizonte', competencia: 'Juizado Especial da Fazenda Pública', cidade: 'Belo Horizonte' },

  // ── Turma Recursal ──
  { codigo: '0901', nome: '1ª Turma Recursal Cível da Comarca de Belo Horizonte', competencia: 'Turma Recursal Cível', cidade: 'Belo Horizonte' },

  // ── Carta Precatória / Carta de Ordem (distribuída para vara cível) ──
  { codigo: '1001', nome: '1ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Carta Precatória Cível', cidade: 'Belo Horizonte' },
  { codigo: '1002', nome: '1ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Carta de Ordem Cível', cidade: 'Belo Horizonte' },

  // ── Pré-Processual (distribuída para vara cível) ──
  { codigo: '1101', nome: '1ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Pré-Processual', cidade: 'Belo Horizonte' },

  // ── Agrária (BH não tem vara agrária específica — vai para cível) ──
  { codigo: '1201', nome: '1ª Vara Cível da Comarca de Belo Horizonte', competencia: 'Agrária', cidade: 'Belo Horizonte' },
];

// Mapeamento: nome da área (do peticaoInicialPJe.ts) → competência da vara
const AREA_PARA_COMPETENCIA: Record<string, string> = {
  'Cível': 'Cível',
  'Família': 'Família',
  'Empresarial': 'Empresarial',
  'Fazenda Pública': 'Fazenda Pública',
  'Sucessões e Ausências': 'Sucessões e Ausências',
  'Registros Públicos': 'Registros Públicos',
  'Infância e Juventude Cível': 'Infância e Juventude Cível',
  'Juizado Especial Cível': 'Juizado Especial Cível',
  'Juizado Especial da Fazenda Pública': 'Juizado Especial da Fazenda Pública',
  'Turma Recursal Cível': 'Turma Recursal Cível',
  'Carta Precatória Cível': 'Carta Precatória Cível',
  'Carta de Ordem Cível': 'Carta de Ordem Cível',
  'Pré-Processual': 'Pré-Processual',
  'Agrária': 'Cível',
};

export const juizesFicticios: Record<string, string> = {
  '0001': 'Dr. Antônio Carlos Mendes',
  '0002': 'Dra. Renata Oliveira Fonseca',
  '0003': 'Dr. Paulo Roberto Nascimento',
  '0004': 'Dra. Cristiane Alves Souza',
  '0005': 'Dr. Marcelo Lima Santos',
  '0006': 'Dra. Fernanda Costa Xavier',
  '0007': 'Dr. Ricardo Borges Pereira',
  '0008': 'Dra. Ana Paula Ferreira',
  '0009': 'Dr. Eduardo Rocha Lima',
  '0010': 'Dra. Juliana Martins Costa',
  '0101': 'Dr. Carlos Henrique Prado',
  '0102': 'Dra. Sandra Regina Teixeira',
  '0103': 'Dr. Gustavo Henrique Moreira',
  '0104': 'Dra. Márcia Helena Duarte',
  '0105': 'Dr. Flávio Augusto Ribeiro',
  '0106': 'Dra. Luciana Ferreira Campos',
  '0201': 'Dr. Roberto Marques Almeida',
  '0202': 'Dra. Patrícia Gonçalves Reis',
  '0203': 'Dr. Alexandre Souza Neto',
  '0301': 'Dra. Cláudia Maria Vieira',
  '0302': 'Dr. Fernando José Andrade',
  '0303': 'Dra. Beatriz Lopes Carvalho',
  '0304': 'Dr. Márcio Antônio Freitas',
  '0401': 'Dra. Tereza Cristina Ramos',
  '0402': 'Dr. Luís Felipe Borges',
  '0501': 'Dra. Raquel Souza Monteiro',
  '0502': 'Dr. Daniel Costa Pereira',
  '0601': 'Dra. Carolina Mendes Silva',
  '0602': 'Dr. André Luiz Barbosa',
  '0701': 'Dra. Simone Alves Teixeira',
  '0702': 'Dr. Rodrigo Martins Prado',
  '0703': 'Dra. Valéria Souza Campos',
  '0704': 'Dr. Henrique José Moreira',
  '0801': 'Dra. Adriana Costa Ferreira',
  '0901': 'Dr. Fábio Augusto Lima',
};

export function sortearVara(area?: string): Vara {
  const competencia = area ? (AREA_PARA_COMPETENCIA[area] ?? 'Cível') : 'Cível';
  const candidatas = varasBH.filter(v => v.competencia === competencia);
  const lista = candidatas.length > 0 ? candidatas : varasBH.filter(v => v.competencia === 'Cível');
  return lista[Math.floor(Math.random() * lista.length)];
}

export function getVaraNome(codigo: string): string {
  return varasBH.find(v => v.codigo === codigo)?.nome ?? codigo;
}

export function getJuiz(varaCode: string): string {
  return juizesFicticios[varaCode] ?? 'Dr. João da Silva';
}

// Compatibilidade — exportação antiga
export const varasFicticias = varasBH;
