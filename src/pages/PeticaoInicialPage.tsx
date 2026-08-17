import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import {
  areasTJMG, niveisSigno, siglosDocumento, tribunaisTJMG,
  tiposPessoa, tiposDocOutros, sexos, estadosCivis,
  identidadesGenero, orientacoesSexuais, racasEtnia,
  tiposDeficiencia, niveisEscolaridade, justicaGratuitaOpcoes,
  arvoreAssuntos,
} from '@/data/classesAssuntos';
import type { AssuntoCNJ, NodoAssunto } from '@/data/classesAssuntos';
import { comarcasMG, ritosPJe, areasPJe, niveisSigiloPJe } from '@/data/peticaoInicialPJe';
import { sortearVara } from '@/data/varas';
import { formatCpfCnpj, formatPhone, formatCep, formatCurrency, parseCurrency } from '@/lib/masks';
import { generateProcessNumber } from '@/lib/cnj';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { saveDemoProcesso, saveDemoPartes, saveDemoMovimentacao, getDemoTarefas } from '@/data/demoStore';
import { CheckCircle, Upload, X, Plus, Trash2, ChevronDown, ChevronRight, Search, Loader2, Folder } from 'lucide-react';

function countLeaves(node: NodoAssunto): number {
  if (!node.subitens || node.subitens.length === 0) return 1;
  return node.subitens.reduce((acc, s) => acc + countLeaves(s), 0);
}

function ConsultarInativoBtn() {
  const [hover, setHover] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        disabled
        style={{
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 12px',
          background: '#94a3b8',
          color: '#fff',
          border: '1px solid #64748b',
          borderRadius: 2,
          fontSize: 11,
          fontWeight: 600,
          cursor: 'not-allowed',
          opacity: 0.85,
        }}
      >
        <Search size={12} /> Consultar
      </button>
      {hover && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            background: '#1e293b',
            color: '#fff',
            padding: '8px 10px',
            borderRadius: 4,
            fontSize: 11,
            lineHeight: 1.4,
            width: 280,
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -5,
              left: 16,
              width: 10,
              height: 10,
              background: '#1e293b',
              transform: 'rotate(45deg)',
            }}
          />
          Botão inativo: não consulta CPFs na base do governo. Mantido na tela apenas para você entender o layout do PJe.
        </div>
      )}
    </span>
  );
}
import type { Tarefa } from '@/integrations/supabase/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Parte {
  polo: 'ativo' | 'passivo';
  tipo_pessoa: string;
  nome: string;
  cpf_cnpj: string;
  semCpf: boolean;
  outroDocTipo: string;
  outroDocNum: string;
  nomeSocial: string;
  sexo: string;
  estadoCivil: string;
  dataNascimento: string;
  profissao: string;
  ehLGBTI: boolean;
  identidadeGenero: string;
  orientacaoSexual: string;
  naturalidade: string;
  nomeMae: string;
  nomePai: string;
  temDeficiencia: boolean;
  tipoDeficiencia: string;
  gestante: boolean;
  escolaridade: string;
  racaEtnia: string;
  dependentes: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  email: string;
  telefone: string;
  justicaGratuita: string;
  qualificacao: string;
}

interface DocumentoForm {
  tipo: string;
  arquivo: File | null;
  nomeArquivo: string;
  sigilo: string;
  collapsed: boolean;
}

interface InfoAdicionais {
  doencaGrave: boolean;
  liminarAnticipacao: boolean;
  intervencaoMP: boolean;
  idoso: boolean;
  deficiencia: boolean;
  criancaAdolescente: boolean;
  lei14289: boolean;
  juizo100Digital: boolean;
  peticaoUrgente: boolean;
}

interface ResultadoBusca {
  id: string;
  cpf: string;
  nome: string;
  infoExtras: string;
}

interface ConsultaQuery {
  tipoPessoa: string;
  cpf: string;
  semCpf: boolean;
  outroDocTipo: string;
  outroDocNum: string;
  nome: string;
}

type ConsultaEstado = 'idle' | 'buscando' | 'resultado' | 'nao_encontrado' | 'novo_cadastro';

interface FormData {
  tribunal: string;
  comarca: string;
  rito: string;
  area: string;
  classe: string;
  nivelSigilo: string;
  tipoJustica: string;
  valorCausa: string;
  valorNaoSeAplica: boolean;
  valorAlcada: boolean;
  processoOriginario: string;
  juizo: string;
  naoSeAplica: boolean;
  remeterPlantao: boolean;
  apoioIA: boolean;
  tarefaId: string;
  assuntos: AssuntoCNJ[];
  partesAutoras: Parte[];
  partesReus: Parte[];
  documentos: DocumentoForm[];
  docsConfirmados: boolean;
  infoAdicionais: InfoAdicionais;
  numeroProcesso: string;
  varaProtocolo: string;
  dataProtocolo: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_NAMES = [
  'Informações do processo',
  'Assuntos',
  'Partes Autoras',
  'Partes Rés',
  'Documentos',
  'Confirmar Ajuizamento',
];

const INFO_ADICIONAIS_LABELS: [keyof InfoAdicionais, string][] = [
  ['doencaGrave',       'Doença grave'],
  ['liminarAnticipacao','Liminar/Antecipação de Tutela'],
  ['intervencaoMP',     'Intervenção do Ministério Público'],
  ['idoso',             'Idoso (60+)'],
  ['deficiencia',       'Deficiência'],
  ['criancaAdolescente','Criança e Adolescente'],
  ['lei14289',          'LEI 14.289'],
  ['juizo100Digital',   'Juízo 100% Digital'],
  ['peticaoUrgente',    'Petição Urgente'],
];

const CPF_MOCK_DB: Record<string, { nome: string; dataNasc: string; infoExtras: string }> = {
  '121.572.976-69': { nome: 'Luiz Cordeiro',            dataNasc: '1985-03-15', infoExtras: 'Belo Horizonte — MG' },
  '000.000.001-91': { nome: 'Maria da Silva Santos',     dataNasc: '1972-07-22', infoExtras: 'Contagem — MG' },
  '111.222.333-44': { nome: 'João Carlos Oliveira',      dataNasc: '1990-11-08', infoExtras: 'Uberlândia — MG' },
  '123.456.789-09': { nome: 'Ana Paula Ferreira',        dataNasc: '1995-05-30', infoExtras: 'Juiz de Fora — MG' },
  '987.654.321-00': { nome: 'Carlos Eduardo Nascimento', dataNasc: '1968-12-01', infoExtras: 'Montes Claros — MG' },
};

const emptyParte = (polo: 'ativo' | 'passivo'): Parte => ({
  polo,
  tipo_pessoa: 'Pessoa Física',
  nome: '', cpf_cnpj: '', semCpf: false,
  outroDocTipo: '', outroDocNum: '',
  nomeSocial: '', sexo: '', estadoCivil: '', dataNascimento: '', profissao: '',
  ehLGBTI: false, identidadeGenero: '', orientacaoSexual: '',
  naturalidade: '', nomeMae: '', nomePai: '',
  temDeficiencia: false, tipoDeficiencia: '', gestante: false,
  escolaridade: '', racaEtnia: '', dependentes: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'MG',
  email: '', telefone: '',
  justicaGratuita: 'Não',
  qualificacao: 'REQUERIDO',
});

const emptyQuery = (): ConsultaQuery => ({
  tipoPessoa: 'Pessoa Física', cpf: '', semCpf: false,
  outroDocTipo: '', outroDocNum: '', nome: '',
});

const emptyDocumento = (): DocumentoForm => ({
  tipo: '', arquivo: null, nomeArquivo: '', sigilo: 'Público', collapsed: false,
});

const emptyInfoAdicionais = (): InfoAdicionais => ({
  doencaGrave: false, liminarAnticipacao: false, intervencaoMP: false,
  idoso: false, deficiencia: false, criancaAdolescente: false,
  lei14289: false, juizo100Digital: false, peticaoUrgente: false,
});

const initialForm = (tarefaId: string): FormData => ({
  tribunal: tribunaisTJMG[0],
  comarca: '',
  rito: 'JUÍZO COMUM',
  area: '',
  classe: '',
  nivelSigilo: niveisSigiloPJe[0],
  tipoJustica: 'Estadual',
  valorCausa: '',
  valorNaoSeAplica: false,
  valorAlcada: false,
  processoOriginario: '',
  juizo: '',
  naoSeAplica: false,
  remeterPlantao: false,
  apoioIA: false,
  tarefaId,
  assuntos: [],
  partesAutoras: [],
  partesReus: [],
  documentos: [{ tipo: 'Petição Inicial', arquivo: null, nomeArquivo: '', sigilo: 'Público', collapsed: false }],
  docsConfirmados: false,
  infoAdicionais: emptyInfoAdicionais(),
  numeroProcesso: '', varaProtocolo: '', dataProtocolo: '',
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssuntoNode({
  node, level, selected, onToggle, onSelectLeaf, selectedLeaf,
}: {
  node: NodoAssunto;
  level: number;
  selected: AssuntoCNJ[];
  onToggle: (a: AssuntoCNJ) => void;
  onSelectLeaf: (n: NodoAssunto) => void;
  selectedLeaf: NodoAssunto | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLeaf = !node.subitens || node.subitens.length === 0;
  const isSelected = isLeaf && selected.some(s => s.codigo === node.codigo);
  const isDetailActive = selectedLeaf?.codigo === node.codigo;
  const pl = level * 18 + 8;

  if (isLeaf) {
    return (
      <div
        onClick={() => { onSelectLeaf(node); onToggle({ codigo: node.codigo, descricao: node.descricao, area: node.area }); }}
        style={{
          paddingLeft: pl, paddingTop: 5, paddingBottom: 5, paddingRight: 8,
          cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f3f4f6',
          background: isDetailActive ? '#eff6ff' : isSelected ? '#dbeafe' : 'transparent',
          color: isSelected ? 'hsl(205,60%,28%)' : '#374151',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ width: 14, fontWeight: 700, color: isSelected ? 'hsl(205,60%,28%)' : '#9ca3af' }}>
          {isSelected ? '✓' : '○'}
        </span>
        <span style={{ flex: 1 }}>{node.descricao}</span>
      </div>
    );
  }

  const isTop = level === 0;
  const leafCount = isTop ? countLeaves(node) : 0;

  return (
    <div>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          paddingLeft: pl, paddingTop: isTop ? 7 : 6, paddingBottom: isTop ? 7 : 6, paddingRight: 8,
          cursor: 'pointer', fontWeight: isTop ? 700 : 600, fontSize: 12,
          background: isTop ? '#fff' : '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#1a4f72',
          letterSpacing: isTop ? 0.2 : 0,
        }}
      >
        {expanded
          ? <ChevronDown size={12} style={{ flexShrink: 0, color: '#6b7280' }} />
          : <ChevronRight size={12} style={{ flexShrink: 0, color: '#6b7280' }} />}
        {isTop && <Folder size={13} style={{ flexShrink: 0, color: '#ca8a04', fill: '#fde68a' }} />}
        <span>
          {isTop ? node.descricao.toUpperCase() : node.descricao}
          {isTop && (
            <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>
              ({String(leafCount).padStart(2, '0')})
            </span>
          )}
        </span>
      </div>
      {expanded && node.subitens?.map(sub => (
        <AssuntoNode key={sub.codigo} node={sub} level={level + 1}
          selected={selected} onToggle={onToggle}
          onSelectLeaf={onSelectLeaf} selectedLeaf={selectedLeaf} />
      ))}
    </div>
  );
}

function StepPanel({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#fff', border: '1px solid #d1d5db' }}>{children}</div>;
}

function SumRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: 12, width: 200, background: '#f9fafb', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
        {label}
      </td>
      <td style={{ padding: '5px 10px', fontSize: 12, color: '#374151' }}>{value}</td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PeticaoInicialPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tarefa, setTarefa] = useState<Tarefa | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>(() => initialForm(searchParams.get('tarefa') ?? ''));

  // Step 2 state
  const [assuntoSearch, setAssuntoSearch] = useState('');
  const [assuntoModo, setAssuntoModo] = useState<'assunto' | 'glossario'>('assunto');
  const [selectedLeaf, setSelectedLeaf] = useState<NodoAssunto | null>(null);

  // Step 3 state
  const [queryAutora, setQueryAutora] = useState<ConsultaQuery>(emptyQuery());
  const [consultaAutoraEstado, setConsultaAutoraEstado] = useState<ConsultaEstado>('idle');
  const [resultadosAutora, setResultadosAutora] = useState<ResultadoBusca[]>([]);
  const [draftAutora, setDraftAutora] = useState<Parte>(emptyParte('ativo'));
  const [showCadastroAutora, setShowCadastroAutora] = useState(false);

  // Step 4 state
  const [queryReu, setQueryReu] = useState<ConsultaQuery>(emptyQuery());
  const [consultaReuEstado, setConsultaReuEstado] = useState<ConsultaEstado>('idle');
  const [resultadosReu, setResultadosReu] = useState<ResultadoBusca[]>([]);
  const [draftReu, setDraftReu] = useState<Parte>(emptyParte('passivo'));
  const [showCadastroReu, setShowCadastroReu] = useState(false);

  useEffect(() => {
    if (form.tarefaId && DEMO_MODE) {
      const t = getDemoTarefas().find(t => t.id === form.tarefaId);
      if (t) setTarefa(t);
    }
  }, [form.tarefaId]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const resetForm = () => {
    setForm(initialForm(searchParams.get('tarefa') ?? ''));
    setStep(1);
    setErrors({});
    setAssuntoSearch('');
    setSelectedLeaf(null);
    setQueryAutora(emptyQuery());
    setConsultaAutoraEstado('idle');
    setResultadosAutora([]);
    setDraftAutora(emptyParte('ativo'));
    setShowCadastroAutora(false);
    setQueryReu(emptyQuery());
    setConsultaReuEstado('idle');
    setResultadosReu([]);
    setDraftReu(emptyParte('passivo'));
    setShowCadastroReu(false);
    scrollTop();
  };

  // ── Área → Classe cascade ──
  const areaClasses = form.area
    ? (areasPJe.find(a => a.nome === form.area)?.classes ?? [])
    : [];

  const handleAreaChange = (newArea: string) => {
    setForm(f => ({ ...f, area: newArea, classe: '' }));
  };

  // ── Assuntos ──
  const toggleAssunto = (a: AssuntoCNJ) => {
    setForm(f => {
      const exists = f.assuntos.some(s => s.codigo === a.codigo);
      return { ...f, assuntos: exists ? f.assuntos.filter(s => s.codigo !== a.codigo) : [...f.assuntos, a] };
    });
  };

  function flattenLeaves(nodes: NodoAssunto[]): NodoAssunto[] {
    return nodes.flatMap(n => n.subitens ? flattenLeaves(n.subitens) : [n]);
  }
  const allLeaves = flattenLeaves(arvoreAssuntos);
  const filteredLeaves = assuntoSearch.length >= 2
    ? allLeaves.filter(n => {
        const q = assuntoSearch.toLowerCase();
        if (assuntoModo === 'glossario') {
          return (n.glossario ?? '').toLowerCase().includes(q);
        }
        return n.descricao.toLowerCase().includes(q) || n.codigo.includes(assuntoSearch);
      })
    : null;

  // ── Consulta Autoras ──
  const consultarAutora = () => {
    setConsultaAutoraEstado('buscando');
    setTimeout(() => {
      const cpf = queryAutora.cpf;
      const nome = queryAutora.nome.toLowerCase();
      const found = Object.entries(CPF_MOCK_DB)
        .filter(([k, v]) => {
          if (cpf && k !== cpf) return false;
          if (nome && !v.nome.toLowerCase().includes(nome)) return false;
          return true;
        })
        .map(([k, v]) => ({ id: k, cpf: k, nome: v.nome, infoExtras: v.infoExtras }));
      if (found.length > 0) {
        setResultadosAutora(found);
        setConsultaAutoraEstado('resultado');
      } else {
        setConsultaAutoraEstado('nao_encontrado');
      }
    }, 800);
  };

  const incluirAutoraFromResultado = (r: ResultadoBusca) => {
    const db = CPF_MOCK_DB[r.cpf];
    const p = emptyParte('ativo');
    p.tipo_pessoa = queryAutora.tipoPessoa;
    p.nome = r.nome;
    p.cpf_cnpj = r.cpf;
    p.dataNascimento = db?.dataNasc ?? '';
    setForm(f => ({ ...f, partesAutoras: [...f.partesAutoras, { ...p }] }));
    setConsultaAutoraEstado('idle');
    setResultadosAutora([]);
    setQueryAutora(emptyQuery());
  };

  const incluirAutoraCadastro = () => {
    if (!draftAutora.nome.trim()) {
      setErrors(e => ({ ...e, autora: 'Informe o nome da parte requerente.' }));
      return;
    }
    setErrors(e => { const n = { ...e }; delete n.autora; return n; });
    setForm(f => ({ ...f, partesAutoras: [...f.partesAutoras, { ...draftAutora }] }));
    setDraftAutora(emptyParte('ativo'));
    setShowCadastroAutora(false);
    setConsultaAutoraEstado('idle');
  };

  const removerAutora = (idx: number) =>
    setForm(f => ({ ...f, partesAutoras: f.partesAutoras.filter((_, i) => i !== idx) }));

  // ── Consulta Réus ──
  const consultarReu = () => {
    setConsultaReuEstado('buscando');
    setTimeout(() => {
      const cpf = queryReu.cpf;
      const nome = queryReu.nome.toLowerCase();
      const found = Object.entries(CPF_MOCK_DB)
        .filter(([k, v]) => {
          if (cpf && k !== cpf) return false;
          if (nome && !v.nome.toLowerCase().includes(nome)) return false;
          return true;
        })
        .map(([k, v]) => ({ id: k, cpf: k, nome: v.nome, infoExtras: v.infoExtras }));
      if (found.length > 0) {
        setResultadosReu(found);
        setConsultaReuEstado('resultado');
      } else {
        setConsultaReuEstado('nao_encontrado');
      }
    }, 800);
  };

  const incluirReuFromResultado = (r: ResultadoBusca) => {
    const db = CPF_MOCK_DB[r.cpf];
    const p = emptyParte('passivo');
    p.tipo_pessoa = queryReu.tipoPessoa;
    p.nome = r.nome;
    p.cpf_cnpj = r.cpf;
    p.dataNascimento = db?.dataNasc ?? '';
    p.qualificacao = 'REQUERIDO';
    setForm(f => ({ ...f, partesReus: [...f.partesReus, { ...p }] }));
    setConsultaReuEstado('idle');
    setResultadosReu([]);
    setQueryReu(emptyQuery());
  };

  const incluirReuCadastro = () => {
    if (!draftReu.nome.trim()) {
      setErrors(e => ({ ...e, reu: 'Informe o nome da parte requerida.' }));
      return;
    }
    setErrors(e => { const n = { ...e }; delete n.reu; return n; });
    setForm(f => ({ ...f, partesReus: [...f.partesReus, { ...draftReu }] }));
    setDraftReu(emptyParte('passivo'));
    setShowCadastroReu(false);
    setConsultaReuEstado('idle');
  };

  const removerReu = (idx: number) =>
    setForm(f => ({ ...f, partesReus: f.partesReus.filter((_, i) => i !== idx) }));

  // ── Documentos ──
  const updateDoc = (idx: number, key: keyof DocumentoForm, val: unknown) =>
    setForm(f => {
      const docs = [...f.documentos];
      docs[idx] = { ...docs[idx], [key]: val };
      return { ...f, documentos: docs };
    });

  const addDoc = () => {
    if (form.documentos.length >= 10) return;
    setForm(f => ({ ...f, documentos: [...f.documentos, emptyDocumento()] }));
  };

  const removeDoc = (idx: number) => {
    if (idx === 0) return;
    setForm(f => ({ ...f, documentos: f.documentos.filter((_, i) => i !== idx) }));
  };

  const toggleInfoAdic = (key: keyof InfoAdicionais) =>
    setForm(f => ({ ...f, infoAdicionais: { ...f.infoAdicionais, [key]: !f.infoAdicionais[key] } }));

  const buscarCep = async (cep: string, setFn: (k: keyof Parte, v: string) => void) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFn('logradouro', data.logradouro ?? '');
        setFn('bairro', data.bairro ?? '');
        setFn('cidade', data.localidade ?? '');
        setFn('estado', data.uf ?? 'MG');
      }
    } catch { /* ignore */ }
  };

  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  // ── Validation ──
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.comarca)    errs.comarca = 'Selecione a comarca.';
      if (!form.area)       errs.area    = 'Selecione a área.';
      if (!form.classe)     errs.classe  = 'Selecione a classe processual.';
      if (!form.valorCausa && !form.valorNaoSeAplica) errs.valorCausa = 'Informe o valor da causa.';
    }
    if (step === 2) {
      if (form.assuntos.length === 0) errs.assuntos = 'Selecione ao menos um assunto.';
    }
    if (step === 3) {
      if (form.partesAutoras.length === 0) errs.autora = 'Inclua ao menos uma parte requerente.';
    }
    if (step === 4) {
      if (form.partesReus.length === 0) errs.reu = 'Inclua ao menos uma parte requerida.';
    }
    if (step === 5) {
      if (!form.documentos[0].nomeArquivo) errs.peticao_inicial = 'A petição inicial é obrigatória.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (!validate()) return; setStep(s => s + 1); scrollTop(); };
  const back = () => { setStep(s => s - 1); scrollTop(); };

  // ── Protocolar ──
  const protocolar = async () => {
    setLoading(true);
    try {
      const vara = sortearVara();
      const numeroProcesso = generateProcessNumber(vara.codigo);
      const dataProtocolo = new Date().toISOString();
      const processoId = crypto.randomUUID();
      const todasPartes = [...form.partesAutoras, ...form.partesReus];
      const assuntoPrincipal = form.assuntos[0]?.descricao ?? '';

      if (DEMO_MODE) {
        saveDemoProcesso({
          id: processoId,
          numero_processo: numeroProcesso,
          aluno_id: user!.id,
          tarefa_id: form.tarefaId || null,
          classe_processual: form.classe,
          assunto: assuntoPrincipal,
          valor_causa: parseCurrency(form.valorCausa),
          vara: vara.nome,
          segredo_justica: /segredo|sigilo/i.test(form.nivelSigilo) && !/sem sigilo/i.test(form.nivelSigilo),
          prioridade: null,
          status: 'em_andamento',
          nota: null,
          feedback_professor: null,
          created_at: dataProtocolo,
          updated_at: dataProtocolo,
        });

        saveDemoPartes(todasPartes.map(p => ({
          id: crypto.randomUUID(),
          processo_id: processoId,
          polo: p.polo,
          tipo_pessoa: p.tipo_pessoa === 'Pessoa Física' ? 'fisica' : 'juridica' as 'fisica' | 'juridica',
          nome: p.nome,
          cpf_cnpj: p.cpf_cnpj || null,
          rg: null,
          data_nascimento: p.dataNascimento || null,
          endereco: { logradouro: p.logradouro, numero: p.numero, bairro: p.bairro, cidade: p.cidade, estado: p.estado, cep: p.cep },
          email: p.email || null,
          telefone: p.telefone || null,
        })));

        saveDemoMovimentacao({
          id: crypto.randomUUID(),
          processo_id: processoId,
          tipo: 'distribuicao',
          descricao: `Petição inicial protocolada e distribuída automaticamente à ${vara.nome}. Número: ${numeroProcesso}`,
          autor_id: user!.id,
          created_at: dataProtocolo,
        });
      } else {
        await supabase!.from('processos').insert({
          id: processoId,
          numero_processo: numeroProcesso,
          aluno_id: user!.id,
          tarefa_id: form.tarefaId || null,
          classe_processual: form.classe,
          assunto: assuntoPrincipal,
          valor_causa: parseCurrency(form.valorCausa),
          vara: vara.nome,
          segredo_justica: /segredo|sigilo/i.test(form.nivelSigilo) && !/sem sigilo/i.test(form.nivelSigilo),
          prioridade: null,
          status: 'em_andamento',
        });

        await supabase!.from('partes').insert(
          todasPartes.map(p => ({
            processo_id: processoId,
            polo: p.polo,
            tipo_pessoa: p.tipo_pessoa === 'Pessoa Física' ? 'fisica' : 'juridica',
            nome: p.nome,
            cpf_cnpj: p.cpf_cnpj || null,
            rg: null,
            data_nascimento: p.dataNascimento || null,
            endereco: { logradouro: p.logradouro, numero: p.numero, bairro: p.bairro, cidade: p.cidade, estado: p.estado, cep: p.cep },
            email: p.email || null,
            telefone: p.telefone || null,
          }))
        );

        await supabase!.from('movimentacoes').insert({
          processo_id: processoId,
          tipo: 'distribuicao',
          descricao: `Petição inicial protocolada e distribuída à ${vara.nome}`,
          autor_id: user!.id,
        });
      }

      update('numeroProcesso', numeroProcesso);
      update('varaProtocolo', vara.nome);
      update('dataProtocolo', dataProtocolo);
      setStep(7);
      scrollTop();
    } catch (err) {
      console.error(err);
      alert('Erro ao protocolar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────────────────────────────────────

  const isReceipt = step === 7;
  const isConfirm = step === 6;

  const TOOLBAR_BTN: React.CSSProperties = {
    height: 28, padding: '0 12px', fontSize: 12, fontWeight: 600,
    border: '1px solid #a0a0a0', borderRadius: 2, cursor: 'pointer',
    background: '#e8e8e8', color: '#1a1a1a',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  };
  const TOOLBAR_BTN_DISABLED: React.CSSProperties = { ...TOOLBAR_BTN, opacity: 0.45, cursor: 'default' };
  const BTN_PRIMARY: React.CSSProperties = {
    ...TOOLBAR_BTN, background: 'hsl(205,60%,28%)', color: '#fff', borderColor: 'hsl(205,60%,22%)',
  };

  const SECT_HEADER: React.CSSProperties = {
    background: 'hsl(205,60%,28%)', color: '#fff',
    padding: '5px 10px', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
  };

  const FORM_LABEL: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 3,
  };

  const fieldCls = (err?: string) => `form-field${err ? ' form-field-error' : ''}`;

  // ── Shared nav bar for step 5 ──
  const Step5NavBar = () => (
    <div style={{
      background: '#dde3ea', borderBottom: '1px solid #b0b8c4',
      padding: '6px 16px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
    }}>
      <button style={TOOLBAR_BTN} onClick={() => { setStep(1); scrollTop(); }}>
        ◀ Retornar para Etapa Inicial
      </button>
      <button style={TOOLBAR_BTN} onClick={back}>◀ Anterior</button>
      <button
        style={{ ...TOOLBAR_BTN, background: 'hsl(205,60%,28%)', color: '#fff', borderColor: 'hsl(205,60%,22%)' }}
        onClick={next}
      >
        Finalizar ▶
      </button>
      <button style={{ ...TOOLBAR_BTN, background: '#4b5563', color: '#fff', borderColor: '#374151' }}>
        ✎ Assinar com Certificado Digital
      </button>
      <div style={{ width: 1, height: 22, background: '#b0b8c4', margin: '0 4px' }} />
      <button style={TOOLBAR_BTN} onClick={() => navigate('/dashboard')}>Cancelar</button>
    </div>
  );

  // ── Cadastro de Pessoa Física form (Steps 3 & 4) ──
  const renderCadastroForm = (
    draft: Parte,
    setDraft: React.Dispatch<React.SetStateAction<Parte>>,
    onIncluir: () => void,
    errKey: string,
  ) => {
    const set = (k: keyof Parte, v: unknown) => setDraft(d => ({ ...d, [k]: v }));
    return (
      <div style={{ border: '1px solid #c7d2fe', borderRadius: 4, margin: '12px 0', background: '#f8faff' }}>
        <div style={{ background: 'hsl(205,60%,28%)', color: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
          Cadastro de Pessoa Física — Novo Registro
        </div>
        <div style={{ padding: 12 }}>
          {errors[errKey] && (
            <div style={{ marginBottom: 8, padding: '6px 10px', background: '#fef2f2', color: '#dc2626', fontSize: 12, borderRadius: 3 }}>
              {errors[errKey]}
            </div>
          )}

          {/* Nome e Nome Social */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FORM_LABEL}>Nome Completo *</label>
              <input type="text" className="form-field" value={draft.nome}
                onChange={e => set('nome', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Nome Social</label>
              <input type="text" className="form-field" value={draft.nomeSocial}
                onChange={e => set('nomeSocial', e.target.value)} />
            </div>
          </div>

          {/* Dados pessoais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FORM_LABEL}>Sexo</label>
              <select className="form-field" value={draft.sexo} onChange={e => set('sexo', e.target.value)}>
                <option value="">--</option>
                {sexos.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={FORM_LABEL}>Estado Civil</label>
              <select className="form-field" value={draft.estadoCivil} onChange={e => set('estadoCivil', e.target.value)}>
                <option value="">--</option>
                {estadosCivis.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={FORM_LABEL}>Data de Nascimento</label>
              <input type="date" className="form-field" value={draft.dataNascimento}
                onChange={e => set('dataNascimento', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Profissão</label>
              <input type="text" className="form-field" value={draft.profissao}
                onChange={e => set('profissao', e.target.value)} />
            </div>
          </div>

          {/* LGBTI */}
          <div style={{ marginBottom: 8, padding: '8px 10px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 3 }}>
            <label className="pje-checkbox" style={{ fontSize: 12 }}>
              <input type="checkbox" checked={draft.ehLGBTI} onChange={e => set('ehLGBTI', e.target.checked)} />
              <span style={{ fontWeight: 600 }}>LGBTI+</span>
            </label>
            {draft.ehLGBTI && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={FORM_LABEL}>Identidade de Gênero</label>
                  <select className="form-field" value={draft.identidadeGenero} onChange={e => set('identidadeGenero', e.target.value)}>
                    <option value="">--</option>
                    {identidadesGenero.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={FORM_LABEL}>Orientação Sexual</label>
                  <select className="form-field" value={draft.orientacaoSexual} onChange={e => set('orientacaoSexual', e.target.value)}>
                    <option value="">--</option>
                    {orientacoesSexuais.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Naturalidade, Mãe, Pai */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FORM_LABEL}>Naturalidade</label>
              <input type="text" className="form-field" value={draft.naturalidade}
                onChange={e => set('naturalidade', e.target.value)} placeholder="Cidade — UF" />
            </div>
            <div>
              <label style={FORM_LABEL}>Nome da Mãe</label>
              <input type="text" className="form-field" value={draft.nomeMae}
                onChange={e => set('nomeMae', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Nome do Pai</label>
              <input type="text" className="form-field" value={draft.nomePai}
                onChange={e => set('nomePai', e.target.value)} />
            </div>
          </div>

          {/* Deficiência, Gestante, Escolaridade, Raça */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FORM_LABEL}>Deficiência</label>
              <select className="form-field" value={draft.tipoDeficiencia}
                onChange={e => { set('tipoDeficiencia', e.target.value); set('temDeficiencia', e.target.value !== ''); }}>
                <option value="">Nenhuma</option>
                {tiposDeficiencia.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="pje-checkbox" style={{ fontSize: 12 }}>
                <input type="checkbox" checked={draft.gestante} onChange={e => set('gestante', e.target.checked)} />
                <span>Gestante</span>
              </label>
            </div>
            <div>
              <label style={FORM_LABEL}>Escolaridade</label>
              <select className="form-field" value={draft.escolaridade} onChange={e => set('escolaridade', e.target.value)}>
                <option value="">--</option>
                {niveisEscolaridade.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={FORM_LABEL}>Raça / Etnia</label>
              <select className="form-field" value={draft.racaEtnia} onChange={e => set('racaEtnia', e.target.value)}>
                <option value="">--</option>
                {racasEtnia.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Dependentes */}
          <div style={{ marginBottom: 8 }}>
            <label style={FORM_LABEL}>Dependentes (quantidade)</label>
            <input type="number" className="form-field" value={draft.dependentes}
              onChange={e => set('dependentes', e.target.value)}
              style={{ maxWidth: 100 }} min={0} />
          </div>

          {/* Endereço */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a4f72', marginBottom: 4, marginTop: 8, textTransform: 'uppercase' }}>
            Endereço
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FORM_LABEL}>CEP</label>
              <input type="text" className="form-field" value={draft.cep}
                onChange={e => set('cep', formatCep(e.target.value))}
                onBlur={e => buscarCep(e.target.value, (k, v) => setDraft(d => ({ ...d, [k]: v })))}
                placeholder="00000-000" maxLength={9} />
            </div>
            <div>
              <label style={FORM_LABEL}>Logradouro</label>
              <input type="text" className="form-field" value={draft.logradouro}
                onChange={e => set('logradouro', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Número</label>
              <input type="text" className="form-field" value={draft.numero}
                onChange={e => set('numero', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={FORM_LABEL}>Complemento</label>
              <input type="text" className="form-field" value={draft.complemento}
                onChange={e => set('complemento', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Bairro</label>
              <input type="text" className="form-field" value={draft.bairro}
                onChange={e => set('bairro', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Cidade</label>
              <input type="text" className="form-field" value={draft.cidade}
                onChange={e => set('cidade', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>UF</label>
              <select className="form-field" value={draft.estado} onChange={e => set('estado', e.target.value)}>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* Contato */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a4f72', marginBottom: 4, textTransform: 'uppercase' }}>
            Contato
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={FORM_LABEL}>E-mail</label>
              <input type="email" className="form-field" value={draft.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label style={FORM_LABEL}>Telefone</label>
              <input type="text" className="form-field" value={draft.telefone}
                onChange={e => set('telefone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000" maxLength={15} />
            </div>
          </div>

          <button style={{ ...BTN_PRIMARY, height: 36, padding: '0 20px', fontSize: 13 }} onClick={onIncluir}>
            <Plus size={14} /> Incluir Parte
          </button>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <EprocLayout>
      <div ref={topRef} style={{ minHeight: '100vh', background: '#f4f6f9' }}>

        {/* ── Page title ── */}
        {!isReceipt && (
          <div style={{
            background: 'hsl(205,60%,28%)', color: '#fff',
            padding: '8px 16px', fontSize: 13, fontWeight: 700,
            borderBottom: '2px solid hsl(205,60%,22%)',
          }}>
            {isConfirm
              ? 'Peticionamento Eletrônico — Confirmar Ajuizamento'
              : `Peticionamento Eletrônico (${step} de 5) — ${STEP_NAMES[step - 1]}`}
          </div>
        )}

        {/* ── Toolbar (steps 1–4 & 6) ── */}
        {!isReceipt && step !== 5 && (
          <div style={{
            background: '#dde3ea', borderBottom: '1px solid #b0b8c4',
            padding: '6px 16px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <button style={TOOLBAR_BTN} onClick={() => navigate('/meus-processos')}>Consultar</button>
            <button style={TOOLBAR_BTN} onClick={resetForm}>Novo</button>
            <div style={{ width: 1, height: 22, background: '#b0b8c4', margin: '0 4px' }} />
            <button
              style={step <= 1 ? TOOLBAR_BTN_DISABLED : TOOLBAR_BTN}
              onClick={step > 1 ? back : undefined}
              disabled={step <= 1}
            >
              ◀ Anterior
            </button>
            {step < 6 && (
              <button style={TOOLBAR_BTN} onClick={next}>Próxima ▶</button>
            )}
            {step === 6 && (
              <button
                style={{ ...TOOLBAR_BTN, background: 'hsl(205,60%,28%)', color: '#fff', borderColor: 'hsl(205,60%,22%)' }}
                onClick={protocolar}
                disabled={loading}
              >
                {loading ? <><Loader2 size={12} className="animate-spin" /> Protocolando...</> : '⚖ Confirmar Ajuizamento'}
              </button>
            )}
            <div style={{ width: 1, height: 22, background: '#b0b8c4', margin: '0 4px' }} />
            <button style={TOOLBAR_BTN} onClick={() => navigate('/dashboard')}>Cancelar</button>
          </div>
        )}

        {/* ── Breadcrumb ── */}
        {!isReceipt && !isConfirm && (
          <div style={{
            background: '#fff', borderBottom: '1px solid #e5e7eb',
            padding: '6px 16px', fontSize: 11, display: 'flex', gap: 4, flexWrap: 'wrap',
          }}>
            {STEP_NAMES.slice(0, 5).map((name, i) => {
              const sNum = i + 1;
              const active = sNum === step;
              const done = sNum < step;
              return (
                <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {i > 0 && <span style={{ color: '#9ca3af' }}>&gt;&gt;</span>}
                  <span style={{
                    fontWeight: active ? 700 : done ? 600 : 400,
                    color: active ? 'hsl(205,60%,28%)' : done ? '#16a34a' : '#6b7280',
                  }}>
                    {done && '✓ '}{name}
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* ── Tarefa alert ── */}
        {tarefa && !isReceipt && (
          <div style={{
            margin: '12px 16px 0', padding: '8px 12px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            fontSize: 12, color: 'hsl(205,60%,28%)', borderRadius: 4,
          }}>
            <strong>Tarefa vinculada:</strong> {tarefa.titulo}
            {tarefa.prazo && (
              <span style={{ marginLeft: 8 }}>· Prazo: {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}</span>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1 — Informações do Processo
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ margin: 16 }}>
            {/* Apoio por IA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => update('apoioIA', !form.apoioIA)}
                aria-pressed={form.apoioIA}
                style={{
                  width: 42, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
                  background: form.apoioIA ? '#2c77ba' : '#cbd5e1', transition: 'background .15s',
                }}
              >
                <span style={{ position: 'absolute', top: 2, left: form.apoioIA ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Apoio por Inteligência Artificial
                <span title="Recurso ilustrativo — não disponível neste simulador" style={{ color: '#94a3b8', cursor: 'help' }}>ⓘ</span>
              </span>
            </div>

            <StepPanel>
              <div style={SECT_HEADER}>Informações Preliminares</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {/* Coluna esquerda: comarca, rito, área, classe, sigilo */}
                <div style={{ borderRight: '1px solid #e5e7eb', padding: '4px 0' }}>
                  <div style={{ padding: '8px 12px' }}>
                    <label style={FORM_LABEL}>Desejo entrar com a ação em:</label>
                    <select className={fieldCls(errors.comarca)} value={form.comarca} onChange={e => update('comarca', e.target.value)} style={{ maxWidth: '100%' }}>
                      <option value=""></option>
                      {comarcasMG.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.comarca && <div className="form-error">{errors.comarca}</div>}
                  </div>

                  <div style={{ padding: '8px 12px' }}>
                    <label style={FORM_LABEL}>Rito:</label>
                    <select className="form-field" value={form.rito} onChange={e => update('rito', e.target.value)} style={{ maxWidth: '100%' }}>
                      {ritosPJe.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div style={{ padding: '8px 12px' }}>
                    <label style={FORM_LABEL}>Área:</label>
                    <select className={fieldCls(errors.area)} value={form.area} onChange={e => handleAreaChange(e.target.value)} style={{ maxWidth: '100%' }}>
                      <option value="">-- Selecione uma área --</option>
                      {areasPJe.map(a => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                    </select>
                    {errors.area && <div className="form-error">{errors.area}</div>}
                  </div>

                  <div style={{ padding: '8px 12px' }}>
                    <label style={FORM_LABEL}>Classe processual:</label>
                    <select className={fieldCls(errors.classe)} value={form.classe} onChange={e => update('classe', e.target.value)} disabled={!form.area} style={{ maxWidth: '100%' }}>
                      <option value=""></option>
                      {areaClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.classe && <div className="form-error">{errors.classe}</div>}
                  </div>

                  <div style={{ padding: '8px 12px' }}>
                    <label style={FORM_LABEL}>
                      Nível de Sigilo do Processo:{' '}
                      <span title="Sem Sigilo: processo público. Segredo de Justiça: acesso restrito às partes." style={{ color: '#94a3b8', cursor: 'help' }}>ⓘ</span>
                    </label>
                    <select className="form-field" value={form.nivelSigilo} onChange={e => update('nivelSigilo', e.target.value)} style={{ maxWidth: '100%' }}>
                      {niveisSigiloPJe.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* Coluna direita: valor da causa, previsão de custas, advogados */}
                <div style={{ padding: '4px 0' }}>
                  <div style={{ padding: '8px 12px' }}>
                    <label style={FORM_LABEL}>
                      Valor da Causa: (R$) <span style={{ fontWeight: 400, color: '#6b7280' }}>(Somente números)</span>
                    </label>
                    <input
                      type="text"
                      className={fieldCls(errors.valorCausa)}
                      value={form.valorCausa}
                      onChange={e => update('valorCausa', formatCurrency(e.target.value))}
                      disabled={form.valorNaoSeAplica}
                      style={{ maxWidth: 260, background: form.valorNaoSeAplica ? '#f1f5f9' : undefined }}
                    />
                    {errors.valorCausa && <div className="form-error">{errors.valorCausa}</div>}

                    {/* Previsão de custas — aparece ao digitar o valor (igual ao PJe) */}
                    {form.valorCausa && !form.valorNaoSeAplica && (
                      <div style={{ fontSize: 13, marginTop: 6, color: '#374151' }}>
                        <strong>Previsão de Custas:</strong> <span style={{ color: '#6b7280' }}>Não foi possível calcular as custas</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
                      <label className="pje-checkbox" style={{ fontSize: 13 }}>
                        <input type="checkbox" checked={form.valorNaoSeAplica} onChange={e => update('valorNaoSeAplica', e.target.checked)} />
                        <span>Não se aplica</span>
                      </label>
                      <label className="pje-checkbox" style={{ fontSize: 13 }}>
                        <input type="checkbox" checked={form.valorAlcada} onChange={e => update('valorAlcada', e.target.checked)} />
                        <span>Valor de Alçada</span>
                      </label>
                    </div>

                    <button type="button" style={{ marginTop: 14, background: 'transparent', border: 'none', color: '#2c77ba', fontSize: 14, cursor: 'pointer', padding: 0 }}>
                      + Incluir outros advogados
                    </button>
                  </div>
                </div>
              </div>
            </StepPanel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2 — Assuntos
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ margin: 16 }}>
            <StepPanel>
              <div style={SECT_HEADER}>
                {form.assuntos.length === 0 ? 'Selecionar Assunto Principal' : 'Selecionar Demais Assuntos'}
              </div>

              {/* Modo radio */}
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Modo de busca:</span>
                {(['assunto', 'glossario'] as const).map(m => (
                  <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                    <input type="radio" value={m} checked={assuntoModo === m} onChange={() => setAssuntoModo(m)} />
                    {m === 'assunto' ? 'Assunto' : 'Glossário'}
                  </label>
                ))}
              </div>

              {/* Decorative toolbar */}
              <div style={{
                padding: '6px 12px', borderBottom: '1px solid #e5e7eb',
                background: '#f8fafc', display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <button
                  style={TOOLBAR_BTN}
                  onClick={() => { /* filtrar — já ocorre via estado */ }}
                >
                  🔎 Filtrar
                </button>
                <button
                  style={TOOLBAR_BTN}
                  onClick={() => {
                    const q = assuntoSearch;
                    setAssuntoSearch('');
                    setTimeout(() => setAssuntoSearch(q), 0);
                  }}
                >
                  🔍 Pesquisar
                </button>
                <button
                  style={TOOLBAR_BTN}
                  onClick={() => { setAssuntoSearch(''); setSelectedLeaf(null); }}
                >
                  ✕ Limpar
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Search size={13} style={{ color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder={assuntoModo === 'assunto' ? 'Buscar por assunto ou código...' : 'Buscar por glossário...'}
                    className="form-field"
                    value={assuntoSearch}
                    onChange={e => setAssuntoSearch(e.target.value)}
                    style={{ maxWidth: 300, fontSize: 12 }}
                  />
                </div>
              </div>

              {errors.assuntos && (
                <div style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', fontSize: 12, borderBottom: '1px solid #fecaca' }}>
                  {errors.assuntos}
                </div>
              )}

              {/* Main content: tree left, table right */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px' }}>
                {/* Tree / search results */}
                <div style={{ borderRight: '1px solid #e5e7eb' }}>
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {filteredLeaves ? (
                      filteredLeaves.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                          Nenhum assunto encontrado para "{assuntoSearch}"
                        </div>
                      ) : filteredLeaves.map(n => (
                        <AssuntoNode key={n.codigo} node={n} level={0}
                          selected={form.assuntos} onToggle={toggleAssunto}
                          onSelectLeaf={setSelectedLeaf} selectedLeaf={selectedLeaf} />
                      ))
                    ) : (
                      arvoreAssuntos.map(n => (
                        <AssuntoNode key={n.codigo} node={n} level={0}
                          selected={form.assuntos} onToggle={toggleAssunto}
                          onSelectLeaf={setSelectedLeaf} selectedLeaf={selectedLeaf} />
                      ))
                    )}
                  </div>

                  {/* Leaf detail panel */}
                  {selectedLeaf && (
                    <div style={{
                      borderTop: '1px solid #e5e7eb', padding: '8px 12px',
                      background: '#eff6ff', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#1a4f72', marginBottom: 4 }}>
                        {selectedLeaf.descricao} <span style={{ fontFamily: 'monospace', fontWeight: 400, color: '#6b7280' }}>({selectedLeaf.codigo})</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        <div>
                          <span style={{ color: '#6b7280' }}>Pode ser principal: </span>
                          <strong>{selectedLeaf.podePrincipal ? 'Sim' : 'Não'}</strong>
                        </div>
                        {selectedLeaf.norma && (
                          <div>
                            <span style={{ color: '#6b7280' }}>Norma: </span>
                            <strong>{selectedLeaf.norma}</strong>
                          </div>
                        )}
                        {selectedLeaf.artigo && (
                          <div>
                            <span style={{ color: '#6b7280' }}>Artigo: </span>
                            <strong>{selectedLeaf.artigo}</strong>
                          </div>
                        )}
                      </div>
                      {selectedLeaf.glossario && (
                        <div style={{ marginTop: 4, color: '#374151', fontStyle: 'italic' }}>
                          Glossário: {selectedLeaf.glossario}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: assuntos incluídos */}
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 6 }}>
                    Assuntos selecionados ({form.assuntos.length})
                  </div>
                  {form.assuntos.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', padding: '12px 0' }}>
                      Nenhum assunto incluído ainda.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: '#dbeafe' }}>
                          <th style={{ padding: '4px 6px', textAlign: 'left' }}>#</th>
                          <th style={{ padding: '4px 6px', textAlign: 'left' }}>Assunto</th>
                          <th style={{ padding: '4px 6px', textAlign: 'left' }}>Função</th>
                          <th style={{ width: 24 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.assuntos.map((a, i) => (
                          <tr key={a.codigo} style={{ borderBottom: '1px solid #bfdbfe' }}>
                            <td style={{ padding: '3px 6px', color: '#6b7280' }}>{i + 1}</td>
                            <td style={{ padding: '3px 6px' }}>{a.descricao}</td>
                            <td style={{ padding: '3px 6px', fontWeight: 600, color: i === 0 ? 'hsl(205,60%,28%)' : '#374151' }}>
                              {i === 0 ? 'Principal' : 'Secundário'}
                            </td>
                            <td style={{ padding: '3px 4px', textAlign: 'center' }}>
                              <button
                                onClick={() => toggleAssunto(a)}
                                style={{ color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none' }}
                              >
                                <X size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </StepPanel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3 — Partes Requerentes
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ margin: 16 }}>
            <StepPanel>
              <div style={SECT_HEADER}>Polo Ativo — Partes Requerentes</div>

              {errors.autora && (
                <div style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', fontSize: 12, borderBottom: '1px solid #fecaca' }}>
                  {errors.autora}
                </div>
              )}

              {/* Advogado */}
              <div style={{ padding: '8px 12px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', fontSize: 12 }}>
                <strong>Advogado(a) peticionante:</strong> {user?.nome_completo} — {user?.oab_simulado}
              </div>

              {/* Consulta form */}
              <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 8 }}>
                  Consultar Pessoa
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 200px 1fr', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                  <div>
                    <label style={FORM_LABEL}>Tipo de Pessoa</label>
                    <select className="form-field" value={queryAutora.tipoPessoa}
                      onChange={e => setQueryAutora(q => ({ ...q, tipoPessoa: e.target.value }))}>
                      {tiposPessoa.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={FORM_LABEL}>CPF</label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-field"
                        value={queryAutora.cpf}
                        onChange={e => setQueryAutora(q => ({ ...q, cpf: formatCpfCnpj(e.target.value) }))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        disabled={queryAutora.semCpf}
                        style={{ flex: 1, background: queryAutora.semCpf ? '#f9fafb' : undefined }}
                      />
                    </div>
                    <label className="pje-checkbox" style={{ fontSize: 11, marginTop: 2 }}>
                      <input type="checkbox" checked={queryAutora.semCpf}
                        onChange={e => setQueryAutora(q => ({ ...q, semCpf: e.target.checked, cpf: '' }))} />
                      <span>Sem CPF</span>
                    </label>
                  </div>
                  <div>
                    <label style={FORM_LABEL}>Nome (opcional)</label>
                    <input type="text" className="form-field" value={queryAutora.nome}
                      onChange={e => setQueryAutora(q => ({ ...q, nome: e.target.value }))}
                      placeholder="Parte do nome para filtrar" />
                  </div>
                </div>

                {/* Outros documentos */}
                {queryAutora.semCpf && (
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={FORM_LABEL}>Outros Documentos</label>
                      <select className="form-field" value={queryAutora.outroDocTipo}
                        onChange={e => setQueryAutora(q => ({ ...q, outroDocTipo: e.target.value }))}>
                        <option value="">-- Selecione --</option>
                        {tiposDocOutros.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={FORM_LABEL}>Número</label>
                      <input type="text" className="form-field" value={queryAutora.outroDocNum}
                        onChange={e => setQueryAutora(q => ({ ...q, outroDocNum: e.target.value }))} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <ConsultarInativoBtn />
                  <button
                    style={TOOLBAR_BTN}
                    onClick={() => {
                      setConsultaAutoraEstado('novo_cadastro');
                      setShowCadastroAutora(true);
                      setDraftAutora(p => ({ ...p, tipo_pessoa: queryAutora.tipoPessoa, cpf_cnpj: queryAutora.cpf }));
                    }}
                  >
                    <Plus size={12} /> Novo
                  </button>
                </div>
              </div>

              {/* Resultado da busca */}
              {consultaAutoraEstado === 'nao_encontrado' && (
                <div style={{ padding: '10px 12px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
                  Nenhuma pessoa encontrada. Clique em <strong>Novo</strong> para cadastrar.
                </div>
              )}
              {consultaAutoraEstado === 'resultado' && resultadosAutora.length > 0 && (
                <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 6 }}>
                    Resultado da consulta
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pessoa</th>
                        <th>CPF</th>
                        <th>Nome</th>
                        <th>Info. Extras</th>
                        <th>Principal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosAutora.map(r => (
                        <tr key={r.id}>
                          <td>Física</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.cpf}</td>
                          <td style={{ fontWeight: 600 }}>{r.nome}</td>
                          <td style={{ fontSize: 11, color: '#6b7280' }}>{r.infoExtras}</td>
                          <td>
                            <select style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: 2 }}>
                              <option>Sim ▼</option>
                            </select>
                          </td>
                          <td>
                            <button
                              style={{ ...BTN_PRIMARY, height: 24, padding: '0 8px', fontSize: 11 }}
                              onClick={() => incluirAutoraFromResultado(r)}
                            >
                              Incluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cadastro inline */}
              {showCadastroAutora && (
                <div style={{ padding: '0 12px' }}>
                  {renderCadastroForm(draftAutora, setDraftAutora, incluirAutoraCadastro, 'autora')}
                </div>
              )}

              {/* Partes incluídas */}
              {form.partesAutoras.length > 0 && (
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 6 }}>
                    Partes requerentes incluídas ({form.partesAutoras.length}):
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>Tipo</th>
                        <th>Justiça Gratuita</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.partesAutoras.map((p, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{p.nome}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.cpf_cnpj || '—'}</td>
                          <td>{p.tipo_pessoa}</td>
                          <td>
                            <select
                              style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: 2 }}
                              value={p.justicaGratuita}
                              onChange={e => {
                                const arr = [...form.partesAutoras];
                                arr[i] = { ...arr[i], justicaGratuita: e.target.value };
                                update('partesAutoras', arr);
                              }}
                            >
                              {justicaGratuitaOpcoes.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td>
                            <button onClick={() => removerAutora(i)}
                              style={{ color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none' }}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer links */}
              <div style={{
                padding: '8px 12px', borderTop: '1px solid #e5e7eb',
                fontSize: 12, display: 'flex', gap: 16,
              }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12, textDecoration: 'underline' }}>
                  Ver totalizador de partes
                </button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12, textDecoration: 'underline' }}>
                  Custas Processuais
                </button>
              </div>
            </StepPanel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4 — Partes Requeridas
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ margin: 16 }}>
            <StepPanel>
              <div style={SECT_HEADER}>Polo Passivo — Partes Requeridas</div>

              {errors.reu && (
                <div style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', fontSize: 12, borderBottom: '1px solid #fecaca' }}>
                  {errors.reu}
                </div>
              )}

              {/* Consulta form */}
              <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 8 }}>
                  Consultar Pessoa
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 200px 1fr', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                  <div>
                    <label style={FORM_LABEL}>Tipo de Pessoa</label>
                    <select className="form-field" value={queryReu.tipoPessoa}
                      onChange={e => setQueryReu(q => ({ ...q, tipoPessoa: e.target.value }))}>
                      {tiposPessoa.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={FORM_LABEL}>CPF</label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-field"
                        value={queryReu.cpf}
                        onChange={e => setQueryReu(q => ({ ...q, cpf: formatCpfCnpj(e.target.value) }))}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        disabled={queryReu.semCpf}
                        style={{ flex: 1, background: queryReu.semCpf ? '#f9fafb' : undefined }}
                      />
                    </div>
                    <label className="pje-checkbox" style={{ fontSize: 11, marginTop: 2 }}>
                      <input type="checkbox" checked={queryReu.semCpf}
                        onChange={e => setQueryReu(q => ({ ...q, semCpf: e.target.checked, cpf: '' }))} />
                      <span>Sem CPF</span>
                    </label>
                  </div>
                  <div>
                    <label style={FORM_LABEL}>Nome (opcional)</label>
                    <input type="text" className="form-field" value={queryReu.nome}
                      onChange={e => setQueryReu(q => ({ ...q, nome: e.target.value }))}
                      placeholder="Parte do nome para filtrar" />
                  </div>
                </div>

                {queryReu.semCpf && (
                  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={FORM_LABEL}>Outros Documentos</label>
                      <select className="form-field" value={queryReu.outroDocTipo}
                        onChange={e => setQueryReu(q => ({ ...q, outroDocTipo: e.target.value }))}>
                        <option value="">-- Selecione --</option>
                        {tiposDocOutros.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={FORM_LABEL}>Número</label>
                      <input type="text" className="form-field" value={queryReu.outroDocNum}
                        onChange={e => setQueryReu(q => ({ ...q, outroDocNum: e.target.value }))} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <ConsultarInativoBtn />
                  <button
                    style={TOOLBAR_BTN}
                    onClick={() => {
                      setConsultaReuEstado('novo_cadastro');
                      setShowCadastroReu(true);
                      setDraftReu(p => ({ ...p, tipo_pessoa: queryReu.tipoPessoa, cpf_cnpj: queryReu.cpf }));
                    }}
                  >
                    <Plus size={12} /> Novo
                  </button>
                </div>
              </div>

              {consultaReuEstado === 'nao_encontrado' && (
                <div style={{ padding: '10px 12px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
                  Nenhuma pessoa encontrada. Clique em <strong>Novo</strong> para cadastrar.
                </div>
              )}

              {consultaReuEstado === 'resultado' && resultadosReu.length > 0 && (
                <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 6 }}>
                    Resultado da consulta
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pessoa</th>
                        <th>CPF</th>
                        <th>Nome</th>
                        <th>Info. Extras</th>
                        <th>Qualificação</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosReu.map(r => {
                        // mask CPF: show first 4 digits then ***
                        const cpfMasked = r.cpf.length >= 4
                          ? r.cpf.slice(0, 4) + r.cpf.slice(4).replace(/\d/g, '*')
                          : r.cpf;
                        return (
                          <tr key={r.id}>
                            <td>Física</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{cpfMasked}</td>
                            <td style={{ fontWeight: 600 }}>{r.nome}</td>
                            <td style={{ fontSize: 11, color: '#6b7280' }}>{r.infoExtras}</td>
                            <td>
                              <select style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: 2 }}>
                                <option>REQUERIDO ▼</option>
                                <option>RÉSTAURADO</option>
                              </select>
                            </td>
                            <td>
                              <button
                                style={{ ...BTN_PRIMARY, height: 24, padding: '0 8px', fontSize: 11 }}
                                onClick={() => incluirReuFromResultado(r)}
                              >
                                Incluir
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {showCadastroReu && (
                <div style={{ padding: '0 12px' }}>
                  {renderCadastroForm(draftReu, setDraftReu, incluirReuCadastro, 'reu')}
                </div>
              )}

              {form.partesReus.length > 0 && (
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', marginBottom: 6 }}>
                    Partes requeridas incluídas ({form.partesReus.length}):
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>CPF</th>
                        <th>Tipo</th>
                        <th>Qualificação</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.partesReus.map((p, i) => {
                        const cpfMasked = p.cpf_cnpj && p.cpf_cnpj.length >= 4
                          ? p.cpf_cnpj.slice(0, 4) + p.cpf_cnpj.slice(4).replace(/\d/g, '*')
                          : p.cpf_cnpj;
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{p.nome}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{cpfMasked || '—'}</td>
                            <td>{p.tipo_pessoa}</td>
                            <td>
                              <select
                                style={{ fontSize: 11, padding: '2px 4px', border: '1px solid #d1d5db', borderRadius: 2 }}
                                value={p.qualificacao}
                                onChange={e => {
                                  const arr = [...form.partesReus];
                                  arr[i] = { ...arr[i], qualificacao: e.target.value };
                                  update('partesReus', arr);
                                }}
                              >
                                <option value="REQUERIDO">REQUERIDO</option>
                                <option value="RÉSTAURADO">RÉSTAURADO</option>
                                <option value="INTIMADO">INTIMADO</option>
                              </select>
                            </td>
                            <td>
                              <button onClick={() => removerReu(i)}
                                style={{ color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none' }}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ padding: '8px 12px', borderTop: '1px solid #e5e7eb', fontSize: 12, display: 'flex', gap: 16 }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12, textDecoration: 'underline' }}>
                  Ver totalizador de partes
                </button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12, textDecoration: 'underline' }}>
                  Custas Processuais
                </button>
              </div>
            </StepPanel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 5 — Documentos
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <>
            <Step5NavBar />
            <div style={{ margin: 16 }}>
              <StepPanel>
                <div style={SECT_HEADER}>Documentos e Petição</div>

                {/* Links */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 12, display: 'flex', gap: 12 }}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12 }}
                    onClick={addDoc}
                  >
                    Adicionar mais Documentos
                  </button>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12 }}>
                    Digitar Documento
                  </button>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,60%,28%)', fontSize: 12 }}>
                    Opções Avançadas
                  </button>
                </div>

                {errors.peticao_inicial && (
                  <div style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', fontSize: 12, borderBottom: '1px solid #fecaca' }}>
                    {errors.peticao_inicial}
                  </div>
                )}

                {/* Documents list */}
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.documentos.map((doc, idx) => (
                    <div key={idx} style={{ border: '1px solid #d1d5db', borderRadius: 4, background: '#fff' }}>
                      {/* Doc header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px',
                        background: idx === 0 ? '#f0fdf4' : '#f9fafb',
                        borderBottom: doc.collapsed ? 'none' : '1px solid #e5e7eb',
                        borderRadius: doc.collapsed ? 4 : '4px 4px 0 0',
                      }}>
                        <button
                          onClick={() => updateDoc(idx, 'collapsed', !doc.collapsed)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', flexShrink: 0, fontSize: 14, fontWeight: 700 }}
                        >
                          {doc.collapsed ? '[+]' : '[ - ]'}
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4f72', flex: 1 }}>
                          Documento {idx + 1}
                          {doc.nomeArquivo && (
                            <span style={{ fontWeight: 400, color: '#16a34a', marginLeft: 8 }}>
                              ✓ {doc.nomeArquivo}
                            </span>
                          )}
                        </span>
                        <select
                          value={doc.sigilo}
                          onChange={e => updateDoc(idx, 'sigilo', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, border: '1px solid #d1d5db', borderRadius: 3, padding: '2px 4px', background: '#fff', cursor: 'pointer' }}
                        >
                          {siglosDocumento.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {idx > 0 && (
                          <button
                            onClick={() => removeDoc(idx)}
                            style={{ color: '#dc2626', cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0 }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Doc body */}
                      {!doc.collapsed && (
                        <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'start' }}>
                          <div>
                            <label style={FORM_LABEL}>Tipo do Documento</label>
                            <input
                              type="text"
                              className="form-field"
                              value={doc.tipo}
                              onChange={e => updateDoc(idx, 'tipo', e.target.value)}
                              placeholder="Ex.: Petição Inicial, Procuração..."
                              disabled={idx === 0}
                              style={idx === 0 ? { background: '#f9fafb' } : undefined}
                            />
                          </div>
                          <div>
                            <label style={FORM_LABEL}>
                              Arquivo (PDF ou DOCX, máx. 10 MB){idx === 0 && ' *'}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <label style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                padding: '5px 14px', fontSize: 12, fontWeight: 600,
                                border: `1px solid ${errors.peticao_inicial && idx === 0 ? '#dc2626' : '#d1d5db'}`,
                                borderRadius: 4, background: '#fff', color: '#374151',
                              }}>
                                <Upload size={13} />
                                {doc.nomeArquivo ? 'Alterar' : 'Selecionar arquivo'}
                                <input
                                  type="file"
                                  style={{ display: 'none' }}
                                  accept=".pdf,.docx"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande (máx 10 MB).'); return; }
                                    updateDoc(idx, 'arquivo', file);
                                    updateDoc(idx, 'nomeArquivo', file.name);
                                    if (idx === 0) setErrors(err => { const n = { ...err }; delete n.peticao_inicial; return n; });
                                  }}
                                />
                              </label>
                              {doc.nomeArquivo && (
                                <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle size={12} /> {doc.nomeArquivo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Confirmar seleção */}
                  <div style={{ marginTop: 4 }}>
                    <button
                      style={{
                        ...TOOLBAR_BTN,
                        background: form.docsConfirmados ? '#16a34a' : '#e8e8e8',
                        color: form.docsConfirmados ? '#fff' : '#1a1a1a',
                        height: 34, padding: '0 16px',
                      }}
                      onClick={() => update('docsConfirmados', !form.docsConfirmados)}
                    >
                      {form.docsConfirmados ? '✓ Seleção confirmada' : 'Confirmar seleção de documentos'}
                    </button>
                  </div>

                  {/* Docs confirmed table */}
                  {form.docsConfirmados && form.documentos.some(d => d.nomeArquivo) && (
                    <div style={{ border: '1px solid #bbf7d0', borderRadius: 4, background: '#f0fdf4', padding: 10, marginTop: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                        Documentos confirmados para envio:
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#dcfce7' }}>
                            <th style={{ padding: '4px 8px', textAlign: 'left' }}>#</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left' }}>Tipo</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left' }}>Arquivo</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left' }}>Sigilo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.documentos.filter(d => d.nomeArquivo).map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #d1fae5' }}>
                              <td style={{ padding: '3px 8px' }}>{i + 1}</td>
                              <td style={{ padding: '3px 8px' }}>{d.tipo || '—'}</td>
                              <td style={{ padding: '3px 8px', color: '#16a34a' }}>✓ {d.nomeArquivo}</td>
                              <td style={{ padding: '3px 8px', fontSize: 11, color: '#6b7280' }}>{d.sigilo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Informações Adicionais — 3 colunas × 3 linhas */}
                <div style={{ margin: '0 12px 12px', border: '1px solid #d1d5db', borderRadius: 4 }}>
                  <div style={{ ...SECT_HEADER, borderRadius: '4px 4px 0 0', fontSize: 11, padding: '5px 10px' }}>
                    Informações Adicionais (marque o que se aplica)
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px 16px',
                  }}>
                    {INFO_ADICIONAIS_LABELS.map(([key, label]) => (
                      <label key={key} className="pje-checkbox" style={{ fontSize: 12 }}>
                        <input
                          type="checkbox"
                          checked={form.infoAdicionais[key]}
                          onChange={() => toggleInfoAdic(key)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </StepPanel>
            </div>
            {/* Bottom nav bar */}
            <Step5NavBar />
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 6 — Confirmar Ajuizamento
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 6 && (
          <div style={{ margin: 16 }}>
            <StepPanel>
              <div style={SECT_HEADER}>Resumo do Peticionamento</div>
              <div style={{ padding: '8px 12px', fontSize: 12, color: '#374151', background: '#fffbeb', borderBottom: '1px solid #e5e7eb' }}>
                Revise todas as informações antes de confirmar. Após o ajuizamento, a petição será enviada ao sistema para distribuição.
              </div>

              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Processo */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Informações do Processo
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <tbody>
                      <SumRow label="Tribunal" value={form.tribunal} />
                      <SumRow label="Área" value={form.area} />
                      <SumRow label="Classe Processual" value={form.classe} />
                      <SumRow label="Tipo de Justiça" value={form.tipoJustica} />
                      <SumRow label="Nível de Sigilo" value={form.nivelSigilo} />
                      <SumRow label="Valor da Causa" value={`R$ ${form.valorCausa}`} />
                      {form.processoOriginario && <SumRow label="Processo Originário" value={form.processoOriginario} />}
                      {form.remeterPlantao && <SumRow label="Plantão Judiciário" value="Sim" />}
                      <SumRow label="Distribuição" value="Automática — vara será sorteada pelo sistema" />
                    </tbody>
                  </table>
                </div>

                {/* Assuntos */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Assuntos ({form.assuntos.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <tbody>
                      {form.assuntos.map((a, i) => (
                        <SumRow key={a.codigo}
                          label={i === 0 ? 'Assunto Principal' : `Assunto ${i + 1}`}
                          value={`${a.descricao} (${a.codigo})`} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Polo ativo */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Polo Ativo — Requerentes ({form.partesAutoras.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <tbody>
                      {form.partesAutoras.map((p, i) => (
                        <SumRow key={i} label={`Requerente ${i + 1}`} value={`${p.nome}${p.cpf_cnpj ? ` — ${p.cpf_cnpj}` : ''}`} />
                      ))}
                      <SumRow label="Advogado(a)" value={`${user?.nome_completo} — ${user?.oab_simulado}`} />
                    </tbody>
                  </table>
                </div>

                {/* Polo passivo */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Polo Passivo — Requeridos ({form.partesReus.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <tbody>
                      {form.partesReus.map((p, i) => (
                        <SumRow key={i} label={`Requerido ${i + 1}`} value={`${p.nome}${p.cpf_cnpj ? ` — ${p.cpf_cnpj}` : ''}`} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Documentos */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Documentos ({form.documentos.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <tbody>
                      {form.documentos.map((d, i) => (
                        <SumRow key={i}
                          label={i === 0 ? 'Petição Inicial' : `Anexo ${i}`}
                          value={d.nomeArquivo || '(sem arquivo)'} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info Adicionais */}
                {Object.values(form.infoAdicionais).some(Boolean) && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', marginBottom: 4, textTransform: 'uppercase' }}>
                      Informações Adicionais
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                      <tbody>
                        {INFO_ADICIONAIS_LABELS
                          .filter(([key]) => form.infoAdicionais[key])
                          .map(([key, label]) => (
                            <SumRow key={key} label="Marcado" value={label} />
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Declarations */}
                <div style={{ border: '1px solid #d1d5db', padding: '10px 14px', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="pje-checkbox" style={{ fontSize: 12 }}>
                    <input type="checkbox" />
                    <span>Declaro, sob as penas da lei, que as informações prestadas são verdadeiras e de minha inteira responsabilidade.</span>
                  </label>
                  <label className="pje-checkbox" style={{ fontSize: 12 }}>
                    <input type="checkbox" />
                    <span>Estou ciente de que este é um <strong>sistema de simulação educacional</strong> sem vínculo com o TJMG real.</span>
                  </label>
                </div>
              </div>
            </StepPanel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 7 — Comprovante
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 7 && (
          <div style={{ maxWidth: 700, margin: '24px auto', padding: '0 16px' }}>
            <div style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'hsl(205,60%,28%)', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
                <CheckCircle size={16} />
                PETIÇÃO PROTOCOLADA COM SUCESSO
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
                  <CheckCircle size={56} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'hsl(205,60%,28%)' }}>
                    Petição Distribuída com Sucesso!
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                    Sua petição inicial foi protocolada e encaminhada para distribuição automática.
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(205,60%,28%)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.04em' }}>
                    Comprovante de Protocolo
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {([
                        ['Número do Processo', <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'hsl(205,60%,28%)', fontSize: 13 }}>{form.numeroProcesso}</span>],
                        ['Vara Distribuída', form.varaProtocolo],
                        ['Tribunal', form.tribunal],
                        ['Área', form.area],
                        ['Classe Processual', form.classe],
                        ['Assunto Principal', form.assuntos[0]?.descricao ?? '—'],
                        ['Valor da Causa', `R$ ${form.valorCausa}`],
                        ['Nível de Sigilo', form.nivelSigilo],
                        ['Advogado(a)', `${user?.nome_completo} — ${user?.oab_simulado}`],
                        ['Data / Hora', form.dataProtocolo ? new Date(form.dataProtocolo).toLocaleString('pt-BR') : '—'],
                      ] as [string, React.ReactNode][]).map(([label, value], i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #bfdbfe' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600, width: 200, color: '#1a4f72' }}>{label}</td>
                          <td style={{ padding: '6px 10px', color: '#374151' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 20 }}>
                  Acompanhe as movimentações e intimações pelo painel do sistema.
                  Você será notificado(a) quando o professor/juízo emitir despachos ou intimações.
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    style={{ ...TOOLBAR_BTN, height: 44, padding: '0 24px', fontSize: 13 }}
                    onClick={() => navigate('/meus-processos')}
                  >
                    Ver Meus Processos
                  </button>
                  <button
                    style={{ ...TOOLBAR_BTN, height: 44, padding: '0 24px', fontSize: 13, background: 'hsl(205,60%,28%)', color: '#fff', borderColor: 'hsl(205,60%,20%)' }}
                    onClick={() => navigate('/dashboard')}
                  >
                    Voltar ao Painel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </EprocLayout>
  );
}
