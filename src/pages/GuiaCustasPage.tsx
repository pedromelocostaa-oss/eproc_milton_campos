import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import { formatCpf } from '@/lib/masks';

interface Guia {
  numero: string;
  processo: string;
  tipo: string;
  valor: number;
  vencimento: string;
  situacao: 'Paga' | 'Em aberto' | 'Vencida';
}

const GUIAS: Guia[] = [
  { numero: '2025.0001.334455', processo: '1085367-89.2025.8.13.0024', tipo: 'Custas iniciais', valor: 372.45, vencimento: '30/06/2025', situacao: 'Paga' },
  { numero: '2025.0001.778899', processo: '1085367-89.2025.8.13.0024', tipo: 'Taxa judiciária', valor: 128.90, vencimento: '20/07/2026', situacao: 'Em aberto' },
];

function situacaoBadge(s: Guia['situacao']) {
  const map = { 'Paga': 'badge-success', 'Em aberto': 'badge-warning', 'Vencida': 'badge-danger' } as const;
  return map[s];
}

export default function GuiaCustasPage() {
  const navigate = useNavigate();
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [numeroGuia, setNumeroGuia] = useState('');
  const [cpf, setCpf] = useState('');
  const [resultados, setResultados] = useState<Guia[] | null>(null);

  const consultar = () => {
    let lista = [...GUIAS];
    const np = numeroProcesso.replace(/\D/g, '');
    if (np) lista = lista.filter(g => g.processo.replace(/\D/g, '').includes(np));
    if (numeroGuia.trim()) lista = lista.filter(g => g.numero.includes(numeroGuia.trim()));
    setResultados(lista);
  };

  const limpar = () => {
    setNumeroProcesso(''); setNumeroGuia(''); setCpf(''); setResultados(null);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Receipt size={26} style={{ color: '#2c77ba' }} />
            <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Consulta Guia de Custas</h1>
          </div>
          <div className="flex gap-2">
            <button className="tjmg-btn-primary" onClick={consultar}>Consultar</button>
            <button className="tjmg-btn-link" onClick={limpar}>Limpar filtros</button>
          </div>
        </div>

        <div className="bg-white border border-border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Nº do Processo:</label>
              <input type="text" className="form-field" value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)} placeholder="0000000-00.0000.8.13.0000" />
            </div>
            <div>
              <label className="form-label">Nº da Guia:</label>
              <input type="text" className="form-field" value={numeroGuia} onChange={e => setNumeroGuia(e.target.value)} placeholder="0000.0000.000000" />
            </div>
            <div>
              <label className="form-label">CPF/CNPJ do Pagador:</label>
              <input type="text" className="form-field" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-border overflow-x-auto">
          <table className="w-full text-[13px] min-w-[820px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2 font-bold">Nº da Guia</th>
                <th className="text-left px-3 py-2 font-bold">Processo</th>
                <th className="text-left px-3 py-2 font-bold">Tipo</th>
                <th className="text-right px-3 py-2 font-bold">Valor (R$)</th>
                <th className="text-left px-3 py-2 font-bold">Vencimento</th>
                <th className="text-left px-3 py-2 font-bold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {resultados === null ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Informe os filtros e clique em <strong>Consultar</strong>.</td></tr>
              ) : resultados.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Nenhuma guia encontrada.</td></tr>
              ) : (
                resultados.map((g, i) => (
                  <tr key={g.numero} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''}`}>
                    <td className="px-3 py-2 font-mono">{g.numero}</td>
                    <td className="px-3 py-2 font-mono">{g.processo}</td>
                    <td className="px-3 py-2">{g.tipo}</td>
                    <td className="px-3 py-2 text-right">{g.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2">{g.vencimento}</td>
                    <td className="px-3 py-2"><span className={situacaoBadge(g.situacao)}>{g.situacao}</span></td>
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
