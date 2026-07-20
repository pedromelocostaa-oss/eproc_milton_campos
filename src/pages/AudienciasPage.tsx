import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

const TIPOS = ['', 'Conciliação', 'Instrução e Julgamento', 'Una', 'Justificação', 'Custódia'];

interface Audiencia {
  dataHora: string;
  processo: string;
  tipo: string;
  local: string;
  situacao: 'Designada' | 'Realizada' | 'Cancelada' | 'Redesignada';
}

const AUDIENCIAS: Audiencia[] = [
  { dataHora: '2026-07-22T14:00:00', processo: '1085367-89.2025.8.13.0024', tipo: 'Conciliação', local: 'CEJUSC Belo Horizonte — Sala 03', situacao: 'Designada' },
  { dataHora: '2026-07-24T09:30:00', processo: '1042219-55.2025.8.13.0024', tipo: 'Instrução e Julgamento', local: '2ª Vara Cível — Sala de Audiências', situacao: 'Designada' },
  { dataHora: '2026-06-30T10:00:00', processo: '1039911-10.2025.8.13.0024', tipo: 'Una', local: 'Juizado Especial — Telepresencial', situacao: 'Realizada' },
];

function situacaoBadge(s: Audiencia['situacao']) {
  const map = { 'Designada': 'badge-info', 'Realizada': 'badge-success', 'Cancelada': 'badge-danger', 'Redesignada': 'badge-warning' } as const;
  return map[s];
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toInputDate(d: Date) { return d.toISOString().slice(0, 10); }

export default function AudienciasPage() {
  const navigate = useNavigate();
  const hoje = new Date();
  const em30 = new Date(hoje); em30.setDate(hoje.getDate() + 30);

  const [processo, setProcesso] = useState('');
  const [tipo, setTipo] = useState('');
  const [dataInicial, setDataInicial] = useState(toInputDate(hoje));
  const [dataFinal, setDataFinal] = useState(toInputDate(em30));
  const [resultados, setResultados] = useState<Audiencia[] | null>(null);

  const consultar = () => {
    let lista = [...AUDIENCIAS];
    const np = processo.replace(/\D/g, '');
    if (np) lista = lista.filter(a => a.processo.replace(/\D/g, '').includes(np));
    if (tipo) lista = lista.filter(a => a.tipo === tipo);
    if (dataInicial) lista = lista.filter(a => a.dataHora.slice(0, 10) >= dataInicial);
    if (dataFinal) lista = lista.filter(a => a.dataHora.slice(0, 10) <= dataFinal);
    setResultados(lista);
  };

  const limpar = () => {
    setProcesso(''); setTipo(''); setDataInicial(toInputDate(hoje)); setDataFinal(toInputDate(em30)); setResultados(null);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarClock size={26} style={{ color: '#2c77ba' }} />
            <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Audiências</h1>
          </div>
          <div className="flex gap-2">
            <button className="tjmg-btn-primary" onClick={consultar}>Consultar</button>
            <button className="tjmg-btn-link" onClick={limpar}>Limpar filtros</button>
          </div>
        </div>

        <div className="bg-white border border-border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Nº do Processo:</label>
              <input type="text" className="form-field" value={processo} onChange={e => setProcesso(e.target.value)} placeholder="0000000-00.0000.8.13.0000" />
            </div>
            <div>
              <label className="form-label">Tipo de Audiência:</label>
              <select className="form-field" value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t === '' ? 'Todos' : t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Data Inicial:</label>
              <input type="date" className="form-field" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Data Final:</label>
              <input type="date" className="form-field" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-border overflow-x-auto">
          <table className="w-full text-[13px] min-w-[820px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2 font-bold">Data/Hora</th>
                <th className="text-left px-3 py-2 font-bold">Processo</th>
                <th className="text-left px-3 py-2 font-bold">Tipo</th>
                <th className="text-left px-3 py-2 font-bold">Local / Sala</th>
                <th className="text-left px-3 py-2 font-bold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {resultados === null ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Informe os filtros e clique em <strong>Consultar</strong>.</td></tr>
              ) : resultados.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Nenhuma audiência encontrada para o período.</td></tr>
              ) : (
                resultados.map((a, i) => (
                  <tr key={a.processo + a.dataHora} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''}`}>
                    <td className="px-3 py-2 whitespace-nowrap">{fmt(a.dataHora)}</td>
                    <td className="px-3 py-2 font-mono">{a.processo}</td>
                    <td className="px-3 py-2">{a.tipo}</td>
                    <td className="px-3 py-2">{a.local}</td>
                    <td className="px-3 py-2"><span className={situacaoBadge(a.situacao)}>{a.situacao}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </EprocLayout>
  );
}
