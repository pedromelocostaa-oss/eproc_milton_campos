import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Volume2 } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import { formatCpf, formatCnpj } from '@/lib/masks';

interface Parte {
  id: string;
  nome: string;
  cpfCnpj: string; // apenas dígitos
  tipo: 'fisica' | 'juridica';
}

interface Processo {
  numero: string;
  autor: string;
  reu: string;
  assunto: string;
  ultimoEvento: string;
}

// Base de dados fictícia (educacional)
const PARTES: Parte[] = [
  { id: 'p1', nome: 'GEOVANNA APARECIDA MARTINS NOVAES', cpfCnpj: '09612345678', tipo: 'fisica' },
  { id: 'p2', nome: 'GIOVANNA MITRAUD NOVAIS', cpfCnpj: '01098765432', tipo: 'fisica' },
  { id: 'p3', nome: 'GIOVANNA NOVAIS TORRES', cpfCnpj: '09587654321', tipo: 'fisica' },
];

const PROCESSOS_POR_PARTE: Record<string, Processo[]> = {
  p3: [
    {
      numero: '1085367-89.2025.8.13.0024',
      autor: 'GIOVANNA NOVAIS TORRES',
      reu: 'ESTADO DE MINAS GERAIS\ne outros',
      assunto: '',
      ultimoEvento: '',
    },
  ],
  p1: [],
  p2: [],
};

// mascara CPF/CNPJ exibindo apenas os 3 primeiros dígitos (padrão TJMG)
function maskDocumento(digits: string, tipo: 'fisica' | 'juridica') {
  const prefix = digits.slice(0, 3);
  const rest = tipo === 'fisica' ? '*'.repeat(8) : '*'.repeat(11);
  return `${prefix}.${rest}`;
}

type View = 'form' | 'partes' | 'processos';

export default function ConsultaProcessualPage() {
  const navigate = useNavigate();

  const [numProcesso, setNumProcesso] = useState('');
  const [chaveProcesso, setChaveProcesso] = useState('');
  const [chaveDocumento, setChaveDocumento] = useState('');
  const [nomeParte, setNomeParte] = useState('');
  const [fonetica, setFonetica] = useState(true);
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [cpf, setCpf] = useState('');
  const [oab, setOab] = useState('');
  const [captcha, setCaptcha] = useState('');

  const [view, setView] = useState<View>('form');
  const [partesEncontradas, setPartesEncontradas] = useState<Parte[]>([]);
  const [processosEncontrados, setProcessosEncontrados] = useState<Processo[]>([]);
  const [parteSelecionada, setParteSelecionada] = useState<Parte | null>(null);
  const [erro, setErro] = useState('');

  const normaliza = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const parteCasaTermo = (nome: string, termo: string) => {
    const nomeNorm = normaliza(nome);
    const termoNorm = normaliza(termo);
    if (!fonetica) return nomeNorm.includes(termoNorm);
    // "pesquisa fonética" simples: casa cada palavra do termo por prefixo (4 letras)
    const tokens = termoNorm.split(/\s+/).filter(Boolean);
    const palavras = nomeNorm.split(/\s+/);
    return tokens.every(tk =>
      nomeNorm.includes(tk) || palavras.some(w => w.startsWith(tk.slice(0, 4)))
    );
  };

  const consultar = () => {
    setErro('');

    // Busca por nome da parte → lista de partes
    if (nomeParte.trim()) {
      const encontradas = PARTES.filter(p => parteCasaTermo(p.nome, nomeParte.trim()));
      setPartesEncontradas(encontradas);
      setView('partes');
      return;
    }

    // Busca por número do processo → lista de processos
    if (numProcesso.trim()) {
      const alvo = numProcesso.replace(/\D/g, '');
      const todos = Object.values(PROCESSOS_POR_PARTE).flat();
      const found = todos.filter(pr => pr.numero.replace(/\D/g, '').includes(alvo));
      setProcessosEncontrados(found);
      setParteSelecionada(null);
      setView('processos');
      return;
    }

    setErro('Informe ao menos um critério de busca (número do processo, nome da parte, CPF ou OAB).');
  };

  const abrirProcessosDaParte = (parte: Parte) => {
    setParteSelecionada(parte);
    setProcessosEncontrados(PROCESSOS_POR_PARTE[parte.id] ?? []);
    setView('processos');
  };

  const voltar = () => {
    if (view === 'processos' && parteSelecionada) {
      setView('partes');
      setParteSelecionada(null);
      return;
    }
    if (view === 'partes' || view === 'processos') {
      setView('form');
      setPartesEncontradas([]);
      setProcessosEncontrados([]);
      setParteSelecionada(null);
      return;
    }
    navigate('/dashboard');
  };

  const limparResultados = () => {
    setView('form');
    setPartesEncontradas([]);
    setProcessosEncontrados([]);
    setParteSelecionada(null);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>
            Consulta Processual - Busca de Processo
          </h1>
          <div className="flex gap-2">
            <button className="tjmg-btn-primary" onClick={consultar}>Consultar</button>
            {view !== 'form' && (
              <button className="tjmg-btn-link" onClick={() => window.print()}>Imprimir</button>
            )}
            <button className="tjmg-btn-link" onClick={voltar}>Voltar</button>
          </div>
        </div>

        {/* Critérios da consulta */}
        <div className="bg-white border border-border p-5">
          <div className="text-[14px] font-bold mb-4">Critérios da consulta processual</div>

          {/* Nº Processo */}
          <div className="mb-4">
            <label className="form-label">
              N<u>º</u> Processo:
            </label>
            <input
              type="text"
              className="form-field max-w-xl"
              value={numProcesso}
              onChange={e => setNumProcesso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && consultar()}
              placeholder="0000000-00.0000.8.13.0000"
            />
          </div>

          {/* Chave Processo / OU / Chave Documento */}
          <div className="mb-4 flex items-end gap-3 flex-wrap">
            <div>
              <label className="form-label"><u>C</u>have Processo:</label>
              <input
                type="text"
                className="form-field w-[280px]"
                value={chaveProcesso}
                onChange={e => setChaveProcesso(e.target.value)}
              />
            </div>
            <div className="pb-1.5">
              <span className="inline-block px-2 py-1 bg-slate-700 text-white text-[11px] font-bold rounded">OU</span>
            </div>
            <div>
              <label className="form-label">Chave <u>D</u>ocumento:</label>
              <input
                type="text"
                className="form-field w-[280px]"
                value={chaveDocumento}
                onChange={e => setChaveDocumento(e.target.value)}
              />
            </div>
          </div>

          {/* Nome da Parte + fonética */}
          <div className="mb-4">
            <label className="form-label flex items-center gap-1">
              <u>N</u>ome da Parte:
              <Info size={13} className="text-sky-600" />
            </label>
            <div className="flex items-center gap-6 flex-wrap">
              <input
                type="text"
                className="form-field max-w-2xl flex-1 min-w-[300px]"
                value={nomeParte}
                onChange={e => setNomeParte(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && consultar()}
              />
              <label className="flex items-center gap-2 text-[13px] cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={fonetica}
                  onChange={e => setFonetica(e.target.checked)}
                />
                Pesquisa fonética
              </label>
            </div>
          </div>

          {/* Pessoa Física/Jurídica + CPF + OAB */}
          <div className="flex items-start gap-8 flex-wrap">
            <div className="flex flex-col gap-1.5 pt-6">
              <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                <input
                  type="radio"
                  name="tipoPessoa"
                  className="w-4 h-4 accent-blue-600"
                  checked={tipoPessoa === 'fisica'}
                  onChange={() => setTipoPessoa('fisica')}
                />
                Pessoa Física
              </label>
              <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                <input
                  type="radio"
                  name="tipoPessoa"
                  className="w-4 h-4 accent-blue-600"
                  checked={tipoPessoa === 'juridica'}
                  onChange={() => setTipoPessoa('juridica')}
                />
                Pessoa Jurídica
              </label>
            </div>

            <div>
              <label className="form-label flex items-center gap-1">
                <u>C</u>P<u>F</u>:
                <Info size={13} className="text-sky-600" />
              </label>
              <input
                type="text"
                className="form-field w-[300px]"
                value={cpf}
                onChange={e =>
                  setCpf(tipoPessoa === 'fisica' ? formatCpf(e.target.value) : formatCnpj(e.target.value))
                }
              />
            </div>

            <div>
              <label className="form-label"><u>O</u>AB:</label>
              <input
                type="text"
                className="form-field w-[300px]"
                value={oab}
                onChange={e => setOab(e.target.value)}
              />
            </div>
          </div>
        </div>

        {erro && <div className="alert-error mt-3">{erro}</div>}

        {/* Captcha (aparece no formulário) */}
        {view === 'form' && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div
                className="w-[150px] h-[52px] border border-border flex items-center justify-center text-[24px] font-serif tracking-[0.3em] select-none"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, #f4f4f8, #f4f4f8 3px, #e8e8f0 3px, #e8e8f0 6px)',
                  color: '#333',
                }}
              >
                R4CC
              </div>
              <button className="text-sky-600" title="Ouvir código">
                <Volume2 size={20} />
              </button>
            </div>
            <input
              type="text"
              className="form-field w-[150px]"
              value={captcha}
              onChange={e => setCaptcha(e.target.value)}
              aria-label="Digite o código da imagem"
            />
          </div>
        )}

        {/* Lista de Partes */}
        {view === 'partes' && (
          <div className="mt-6">
            <div className="text-right text-[13px] text-muted-foreground mb-1">
              Lista de Partes ({partesEncontradas.length} registro{partesEncontradas.length !== 1 ? 's' : ''}):
            </div>
            <div className="bg-white border border-border">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-center px-4 py-2 font-bold">Nome da Parte</th>
                    <th className="text-right px-4 py-2 font-bold w-[300px]">CPF / CNPJ</th>
                  </tr>
                </thead>
                <tbody>
                  {partesEncontradas.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhuma parte encontrada para "<strong>{nomeParte}</strong>".
                      </td>
                    </tr>
                  ) : (
                    partesEncontradas.map((p, i) => (
                      <tr key={p.id} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-2">
                          <button
                            className="text-sky-700 hover:underline font-semibold"
                            onClick={() => abrirProcessosDaParte(p)}
                          >
                            {p.nome}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {maskDocumento(p.cpfCnpj, p.tipo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lista de Processos */}
        {view === 'processos' && (
          <div className="mt-6">
            <div className="text-right text-[13px] text-muted-foreground mb-1">
              Lista de Processos ({processosEncontrados.length} registro{processosEncontrados.length !== 1 ? 's' : ''}):
            </div>
            <div className="bg-white border border-border overflow-x-auto">
              <table className="w-full text-[13px] min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2 font-bold">Nº Processo</th>
                    <th className="text-left px-4 py-2 font-bold">Autor</th>
                    <th className="text-left px-4 py-2 font-bold">Réu</th>
                    <th className="text-left px-4 py-2 font-bold">Assunto</th>
                    <th className="text-left px-4 py-2 font-bold">Último Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {processosEncontrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum processo encontrado.
                      </td>
                    </tr>
                  ) : (
                    processosEncontrados.map((pr, i) => (
                      <tr key={pr.numero} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''} align-top`}>
                        <td className="px-4 py-2">
                          <button
                            className="text-sky-700 hover:underline font-mono text-left"
                            onClick={() => navigate(`/consulta-publica?numero=${encodeURIComponent(pr.numero)}`)}
                          >
                            {pr.numero}
                          </button>
                        </td>
                        <td className="px-4 py-2">{pr.autor}</td>
                        <td className="px-4 py-2 whitespace-pre-line">{pr.reu}</td>
                        <td className="px-4 py-2">{pr.assunto || '—'}</td>
                        <td className="px-4 py-2">{pr.ultimoEvento || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="alert-warning text-[11px] mt-4">
          ⚠️ Simulador Educacional — os dados exibidos são fictícios, produzidos por alunos da Faculdade Milton Campos. Sem vínculo com o TJMG.
        </div>
      </div>
    </EprocLayout>
  );
}
