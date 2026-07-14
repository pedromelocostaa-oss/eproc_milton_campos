import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

const ORGAOS_JULGADORES = [
  'Todos',
  '1ª Turma Recursal do Grupo Jurisdicional de Divinópolis',
  '1ª Turma Recursal do Grupo Jurisdicional de Governador Valadares',
  '1ª Turma Recursal do Grupo Jurisdicional de Ipatinga',
  '1ª Turma Recursal do Grupo Jurisdicional de Juiz de Fora',
  '1ª Turma Recursal do Grupo Jurisdicional de Montes Claros',
  '1ª Turma Recursal do Grupo Jurisdicional de Poços de Caldas',
  '1ª Turma Recursal do Grupo Jurisdicional de Sete Lagoas',
  '1ª Turma Recursal do Grupo Jurisdicional de Teófilo Otoni',
  '1ª Turma Recursal do Grupo Jurisdicional de Uberaba',
  '1ª Turma Recursal do Grupo Jurisdicional de Uberlândia',
  '1ª Turma Recursal do Grupo Jurisdicional de Varginha',
  '2ª Turma Recursal do Grupo Jurisdicional de Divinópolis',
  '2ª Turma Recursal do Grupo Jurisdicional de Governador Valadares',
  '2ª Turma Recursal do Grupo Jurisdicional de Ipatinga',
  '2ª Turma Recursal do Grupo Jurisdicional de Juiz de Fora',
  '2ª Turma Recursal do Grupo Jurisdicional de Montes Claros',
  '2ª Turma Recursal do Grupo Jurisdicional de Poços de Caldas',
  '2ª Turma Recursal do Grupo Jurisdicional de Sete Lagoas',
  '2ª Turma Recursal do Grupo Jurisdicional de Teófilo Otoni',
  '2ª Turma Recursal do Grupo Jurisdicional de Uberaba',
  '2ª Turma Recursal do Grupo Jurisdicional de Uberlândia',
  '2ª Turma Recursal do Grupo Jurisdicional de Varginha',
  '3ª Turma Recursal do Grupo Jurisdicional de Juiz de Fora',
  '3ª Turma Recursal do Grupo Jurisdicional de Uberlândia',
  '4ª Turma Recursal do Grupo Jurisdicional de Uberlândia',
  '5ª Turma Recursal do Grupo Jurisdicional de Juiz de Fora',
  'TR Exclusiva de Belo Horizonte, Betim e Contagem',
  'Turma Recursal do Grupo Jurisdicional de Araguari',
  'Turma Recursal do Grupo Jurisdicional de Araxá',
  'Turma Recursal do Grupo Jurisdicional de Barbacena',
  'Turma Recursal do Grupo Jurisdicional de Cataguases',
  'Turma Recursal do Grupo Jurisdicional de Conselheiro Lafaiete',
  'Turma Recursal do Grupo Jurisdicional de Curvelo',
  'Turma Recursal do Grupo Jurisdicional de Formiga',
  'Turma Recursal do Grupo Jurisdicional de Itabira',
  'Turma Recursal do Grupo Jurisdicional de Itajubá',
  'Turma Recursal do Grupo Jurisdicional de Ituiutaba',
  'Turma Recursal do Grupo Jurisdicional de Lavras',
  'Turma Recursal do Grupo Jurisdicional de Muriaé',
  'Turma Recursal do Grupo Jurisdicional de Paracatu',
  'Turma Recursal do Grupo Jurisdicional de Passos',
  'Turma Recursal do Grupo Jurisdicional de Patos de Minas',
  'Turma Recursal do Grupo Jurisdicional de Pouso Alegre',
  'Turma Recursal do Grupo Jurisdicional de São João del-Rei',
  'Turma Recursal do Grupo Jurisdicional de Unaí',
  'Turma Recursal do Grupo Jurisdicional de Varginha',
];

const TIPOS_SESSAO = [
  '',
  'Excepcional',
  'Extraordinária',
  'Ordinária Presencial',
  'Sessão Telepresencial',
  'Sessão Virtual',
  'Sessão Virtual - Resolução 591/24 do CNJ',
];

interface Sessao {
  id: number;
  dataHora: string;
  tipoSessao: string;
  orgaoJulgador: string;
  magistrados: string;
  pauta: string;
}

const MOCK_SESSOES: Sessao[] = [
  {
    id: 1,
    dataHora: '2026-07-08T09:00:00',
    tipoSessao: 'Ordinária Presencial',
    orgaoJulgador: '1ª Turma Recursal do Grupo Jurisdicional de Belo Horizonte',
    magistrados: 'Dr. André Luís Menezes / Dra. Carla Fonseca / Dr. Ricardo Pimenta',
    pauta: 'Pauta nº 14/2026',
  },
  {
    id: 2,
    dataHora: '2026-07-09T14:00:00',
    tipoSessao: 'Sessão Virtual',
    orgaoJulgador: '1ª Turma Recursal do Grupo Jurisdicional de Juiz de Fora',
    magistrados: 'Dra. Patrícia Alvim / Dr. Flávio Costa / Dra. Renata Braga',
    pauta: 'Pauta nº 15/2026',
  },
  {
    id: 3,
    dataHora: '2026-07-10T10:30:00',
    tipoSessao: 'Sessão Virtual - Resolução 591/24 do CNJ',
    orgaoJulgador: '2ª Turma Recursal do Grupo Jurisdicional de Uberlândia',
    magistrados: 'Dr. Marcos Oliveira / Dra. Fernanda Nunes / Dr. Pedro Sousa',
    pauta: 'Pauta nº 16/2026',
  },
  {
    id: 4,
    dataHora: '2026-07-11T09:00:00',
    tipoSessao: 'Extraordinária',
    orgaoJulgador: 'TR Exclusiva de Belo Horizonte, Betim e Contagem',
    magistrados: 'Dra. Luciana Moreira / Dr. João Batista / Dra. Ana Paula Reis',
    pauta: 'Pauta nº 17/2026',
  },
  {
    id: 5,
    dataHora: '2026-07-14T09:00:00',
    tipoSessao: 'Sessão Telepresencial',
    orgaoJulgador: '1ª Turma Recursal do Grupo Jurisdicional de Montes Claros',
    magistrados: 'Dr. Cláudio Ferreira / Dra. Simone Teixeira / Dr. Wagner Lima',
    pauta: 'Pauta nº 18/2026',
  },
];

type SortKey = 'dataHora' | 'tipoSessao' | 'orgaoJulgador' | 'magistrados';
type SortDir = 'asc' | 'desc' | null;

function toLocaleDateTimeStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toInputDate(iso: string) {
  return iso.slice(0, 10);
}

export default function SessoesJulgamentoPage() {
  const navigate = useNavigate();

  const hoje = new Date();
  const seteDiasAtras = new Date(hoje);
  seteDiasAtras.setDate(hoje.getDate() - 7);

  const [orgao, setOrgao] = useState('Todos');
  const [dataInicial, setDataInicial] = useState(toInputDate(seteDiasAtras.toISOString()));
  const [dataFinal, setDataFinal] = useState(toInputDate(hoje.toISOString()));
  const [tipoSessao, setTipoSessao] = useState('');
  const [porPagina, setPorPagina] = useState(25);
  const [resultados, setResultados] = useState<Sessao[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('dataHora');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showExportar, setShowExportar] = useState(false);

  const limpar = () => {
    setOrgao('Todos');
    setDataInicial(toInputDate(seteDiasAtras.toISOString()));
    setDataFinal(toInputDate(hoje.toISOString()));
    setTipoSessao('');
    setResultados(null);
    setSortKey('dataHora');
    setSortDir('asc');
  };

  const consultar = () => {
    let lista = [...MOCK_SESSOES];
    if (orgao !== 'Todos') lista = lista.filter(s => s.orgaoJulgador === orgao);
    if (tipoSessao) lista = lista.filter(s => s.tipoSessao === tipoSessao);
    if (dataInicial) lista = lista.filter(s => s.dataHora.slice(0, 10) >= dataInicial);
    if (dataFinal) lista = lista.filter(s => s.dataHora.slice(0, 10) <= dataFinal);
    setResultados(lista);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
  };

  const sorted = resultados ? [...resultados].sort((a, b) => {
    if (!sortDir) return 0;
    const va = a[sortKey]; const vb = b[sortKey];
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  }) : null;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={12} className="inline ml-1 opacity-40" />;
    if (sortDir === 'asc') return <ChevronUp size={12} className="inline ml-1" />;
    if (sortDir === 'desc') return <ChevronDown size={12} className="inline ml-1" />;
    return <ChevronsUpDown size={12} className="inline ml-1 opacity-40" />;
  }

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Sessões de Julgamento</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-semibold text-foreground">Sessões de Julgamento</h1>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={consultar}>Consultar</button>
            <button className="btn-secondary" onClick={limpar}>Limpar filtros</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-border p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Órgão Julgador */}
            <div>
              <label className="form-label">Órgão Julgador:</label>
              <select
                className="form-field w-full"
                value={orgao}
                onChange={e => setOrgao(e.target.value)}
                size={1}
              >
                {ORGAOS_JULGADORES.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Datas */}
            <div className="space-y-3">
              <div>
                <label className="form-label">Data Inicial:</label>
                <div className="relative">
                  <input
                    type="date"
                    className="form-field w-full pr-8"
                    value={dataInicial}
                    onChange={e => setDataInicial(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Data Final:</label>
                <div className="relative">
                  <input
                    type="date"
                    className="form-field w-full pr-8"
                    value={dataFinal}
                    onChange={e => setDataFinal(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tipo de Sessão */}
            <div>
              <label className="form-label">Tipo de Sessão:</label>
              <select
                className="form-field w-full"
                value={tipoSessao}
                onChange={e => setTipoSessao(e.target.value)}
              >
                {TIPOS_SESSAO.map(t => (
                  <option key={t} value={t}>{t === '' ? 'Nada selecionado' : t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de resultados */}
        <div className="bg-white border border-border">
          {/* Controles da tabela */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 text-[12px]">
              <select
                className="form-field py-0.5 px-1 text-[12px]"
                value={porPagina}
                onChange={e => setPorPagina(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-muted-foreground">resultados por página</span>
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-800"
                onClick={() => setShowExportar(!showExportar)}
              >
                <Download size={13} />
                Exportar
                <ChevronDown size={11} />
              </button>
              {showExportar && (
                <div className="absolute right-0 top-6 bg-white border border-border shadow z-10 min-w-[140px]">
                  {['CSV', 'Excel', 'PDF'].map(fmt => (
                    <button
                      key={fmt}
                      className="block w-full text-left px-3 py-1.5 text-[12px] hover:bg-muted"
                      onClick={() => setShowExportar(false)}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cabeçalho da tabela */}
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {(
                  [
                    { key: 'dataHora', label: 'Data/Hora' },
                    { key: 'tipoSessao', label: 'Tipo Sessão' },
                    { key: 'orgaoJulgador', label: 'Órgão Julgador' },
                    { key: 'magistrados', label: 'Magistrados' },
                  ] as { key: SortKey; label: string }[]
                ).map(col => (
                  <th
                    key={col.key}
                    className="text-left px-3 py-2 font-semibold cursor-pointer select-none hover:bg-muted/60"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon col={col.key} />
                  </th>
                ))}
                <th className="text-left px-3 py-2 font-semibold">Pauta e Ata da Sessão</th>
              </tr>
            </thead>
            <tbody>
              {sorted === null ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-[12px]">
                    Utilize os filtros acima e clique em <strong>Consultar</strong> para exibir as sessões.
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-[12px]">
                    Nenhuma sessão encontrada para os filtros informados.
                  </td>
                </tr>
              ) : (
                sorted.slice(0, porPagina).map((s, i) => (
                  <tr key={s.id} className={`border-b border-border ${i % 2 === 0 ? '' : 'bg-muted/20'} hover:bg-blue-50`}>
                    <td className="px-3 py-2 whitespace-nowrap">{toLocaleDateTimeStr(s.dataHora)}</td>
                    <td className="px-3 py-2">{s.tipoSessao}</td>
                    <td className="px-3 py-2">{s.orgaoJulgador}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.magistrados}</td>
                    <td className="px-3 py-2">
                      <button className="text-blue-600 hover:underline text-[11px]">
                        {s.pauta}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Rodapé da tabela */}
          {sorted && sorted.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
              <span>Exibindo {Math.min(sorted.length, porPagina)} de {sorted.length} registro(s)</span>
            </div>
          )}
        </div>

        {/* Botões rodapé */}
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-primary" onClick={consultar}>Consultar</button>
          <button className="btn-secondary" onClick={limpar}>Limpar filtros</button>
        </div>
      </div>
    </EprocLayout>
  );
}
