import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getAcervoParaAluno, subscribeAcervo, type AcervoProcesso } from '@/data/acervoStore';

function autores(p: AcervoProcesso) {
  const a = p.partes.filter(x => x.polo === 'ativo').map(x => x.nome);
  return a.length ? a.join(', ') : '—';
}
function reus(p: AcervoProcesso) {
  const r = p.partes.filter(x => x.polo === 'passivo').map(x => x.nome);
  if (r.length === 0) return '—';
  return r.length === 1 ? r[0] : `${r[0]} e outros`;
}
function localidade(vara: string) {
  const m = vara.match(/de\s+(.+)$/i);
  return m ? m[1] : 'Belo Horizonte';
}
function fmtData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function RelatorioProcessosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [acervo, setAcervo] = useState<AcervoProcesso[]>([]);

  useEffect(() => {
    const load = () => setAcervo(getAcervoParaAluno([user?.turma_id]));
    load();
    return subscribeAcervo(load);
  }, [user?.turma_id]);

  const lista = useMemo(() => [...acervo].sort((a, b) => a.numeroProcesso.localeCompare(b.numeroProcesso)), [acervo]);

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Relatórios</span>
          <span>›</span>
          <span>Relação de Processos</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <FileBarChart size={26} style={{ color: '#2c77ba' }} />
          <h1 className="text-[22px] font-bold" style={{ color: '#333' }}>Relatório de Processos</h1>
        </div>
        <p className="text-[13px] text-muted-foreground mb-3 max-w-3xl">
          Lista os processos em que você está vinculado(a) como representante da parte autora ou ré.
        </p>

        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center gap-2 text-[12px] cursor-pointer text-muted-foreground">
            <input type="checkbox" className="w-4 h-4 accent-blue-600" /> Listar processos baixados
          </label>
          <div className="text-[12px] text-muted-foreground">
            Lista de Processos ({lista.length} registro{lista.length !== 1 ? 's' : ''}):
          </div>
        </div>

        <div className="bg-white border border-border overflow-x-auto">
          <table className="w-full text-[12px] min-w-[1000px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2 font-bold">Número Processo</th>
                <th className="text-left px-3 py-2 font-bold">Classe</th>
                <th className="text-left px-3 py-2 font-bold">Autores Principais</th>
                <th className="text-left px-3 py-2 font-bold">Réu(s)</th>
                <th className="text-left px-3 py-2 font-bold">Localidade Judicial</th>
                <th className="text-left px-3 py-2 font-bold">Assunto</th>
                <th className="text-left px-3 py-2 font-bold">Data/Hora Autuação</th>
                <th className="text-right px-3 py-2 font-bold">Valor da Causa</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Nenhum processo vinculado.</td></tr>
              ) : (
                lista.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border align-top ${i % 2 ? 'bg-muted/20' : ''} hover:bg-blue-50`}>
                    <td className="px-3 py-2">
                      <button
                        className="text-sky-700 hover:underline font-mono font-semibold text-left"
                        onClick={() => navigate(`/consulta-processual?numero=${encodeURIComponent(p.numeroProcesso)}`)}
                      >
                        {p.numeroProcesso}
                      </button>
                      <div className="text-[11px] text-muted-foreground">{p.vara}</div>
                    </td>
                    <td className="px-3 py-2">{p.classe || '—'}</td>
                    <td className="px-3 py-2">{autores(p)}</td>
                    <td className="px-3 py-2">{reus(p)}</td>
                    <td className="px-3 py-2">{localidade(p.vara)}</td>
                    <td className="px-3 py-2">{p.assunto || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtData(p.createdAt)}</td>
                    <td className="px-3 py-2 text-right">
                      {p.valorCausa != null ? `R$ ${p.valorCausa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
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
