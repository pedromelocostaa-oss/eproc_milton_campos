import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Volume2, FileText, ExternalLink, ArrowLeft } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import { useAuth } from '@/contexts/AuthContext';
import { formatCpf, formatCnpj } from '@/lib/masks';
import { getAcervoParaAluno, subscribeAcervo, type AcervoProcesso } from '@/data/acervoStore';
import { abrirArquivo } from '@/lib/fileStore';

interface ParteAgregada {
  chave: string;
  nome: string;
  cpfCnpj: string;
  tipo: 'fisica' | 'juridica';
  processoIds: string[];
}

function maskDocumento(digits: string, tipo: 'fisica' | 'juridica') {
  if (!digits) return 'Não informado';
  const prefix = digits.slice(0, 3);
  const rest = tipo === 'fisica' ? '*'.repeat(8) : '*'.repeat(11);
  return `${prefix}.${rest}`;
}

function poloReu(p: AcervoProcesso) {
  const reus = p.partes.filter(x => x.polo === 'passivo').map(x => x.nome);
  if (reus.length === 0) return '—';
  return reus.length === 1 ? reus[0] : `${reus[0]}\ne outros`;
}
function poloAutor(p: AcervoProcesso) {
  const a = p.partes.find(x => x.polo === 'ativo');
  return a?.nome ?? '—';
}

type View = 'form' | 'partes' | 'processos' | 'detalhe';

export default function ConsultaProcessualPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [acervo, setAcervo] = useState<AcervoProcesso[]>([]);
  useEffect(() => {
    const load = () => setAcervo(getAcervoParaAluno([user?.turma_id]));
    load();
    return subscribeAcervo(load);
  }, [user?.turma_id]);

  const procById = useMemo(() => {
    const m = new Map<string, AcervoProcesso>();
    acervo.forEach(p => m.set(p.id, p));
    return m;
  }, [acervo]);

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
  const [partesEncontradas, setPartesEncontradas] = useState<ParteAgregada[]>([]);
  const [processosEncontrados, setProcessosEncontrados] = useState<AcervoProcesso[]>([]);
  const [parteSelecionada, setParteSelecionada] = useState<ParteAgregada | null>(null);
  const [detalhe, setDetalhe] = useState<AcervoProcesso | null>(null);
  const [erro, setErro] = useState('');

  const normaliza = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const parteCasaTermo = (nome: string, termo: string) => {
    const nomeNorm = normaliza(nome);
    const termoNorm = normaliza(termo);
    if (!fonetica) return nomeNorm.includes(termoNorm);
    const tokens = termoNorm.split(/\s+/).filter(Boolean);
    const palavras = nomeNorm.split(/\s+/);
    return tokens.every(tk => nomeNorm.includes(tk) || palavras.some(w => w.startsWith(tk.slice(0, 4))));
  };

  // Agrega todas as partes do acervo (únicas por nome+documento) com os processos em que aparecem.
  const partesAgregadas = useMemo<ParteAgregada[]>(() => {
    const map = new Map<string, ParteAgregada>();
    acervo.forEach(proc => {
      proc.partes.forEach(pt => {
        const chave = `${normaliza(pt.nome)}|${pt.cpfCnpj}`;
        const existente = map.get(chave);
        if (existente) {
          if (!existente.processoIds.includes(proc.id)) existente.processoIds.push(proc.id);
        } else {
          map.set(chave, { chave, nome: pt.nome, cpfCnpj: pt.cpfCnpj, tipo: pt.tipoPessoa, processoIds: [proc.id] });
        }
      });
    });
    return [...map.values()];
  }, [acervo]);

  const consultar = () => {
    setErro('');

    // Busca por nome da parte ou CPF → lista de partes
    if (nomeParte.trim() || cpf.replace(/\D/g, '')) {
      const cpfDigits = cpf.replace(/\D/g, '');
      const encontradas = partesAgregadas.filter(p => {
        const okNome = nomeParte.trim() ? parteCasaTermo(p.nome, nomeParte.trim()) : true;
        const okCpf = cpfDigits ? p.cpfCnpj.startsWith(cpfDigits) : true;
        return okNome && okCpf;
      });
      setPartesEncontradas(encontradas);
      setView('partes');
      return;
    }

    // Busca por número do processo → lista de processos
    if (numProcesso.trim()) {
      const alvo = numProcesso.replace(/\D/g, '');
      const found = acervo.filter(pr => pr.numeroProcesso.replace(/\D/g, '').includes(alvo));
      setProcessosEncontrados(found);
      setParteSelecionada(null);
      setView('processos');
      return;
    }

    setErro('Informe ao menos um critério de busca (número do processo, nome da parte, CPF ou OAB).');
  };

  const abrirProcessosDaParte = (parte: ParteAgregada) => {
    setParteSelecionada(parte);
    setProcessosEncontrados(parte.processoIds.map(id => procById.get(id)).filter((p): p is AcervoProcesso => !!p));
    setView('processos');
  };

  const abrirDetalhe = (proc: AcervoProcesso) => {
    setDetalhe(proc);
    setView('detalhe');
  };

  const voltar = () => {
    if (view === 'detalhe') {
      setView(processosEncontrados.length ? 'processos' : 'form');
      setDetalhe(null);
      return;
    }
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

  const abrirDocumento = async (id: string) => {
    const ok = await abrirArquivo(id);
    if (!ok) alert('Não foi possível abrir o documento (arquivo não encontrado neste dispositivo).');
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

          <div className="mb-4">
            <label className="form-label"><u>Nº</u> Processo:</label>
            <input type="text" className="form-field max-w-xl" value={numProcesso}
              onChange={e => setNumProcesso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && consultar()}
              placeholder="0000000-00.0000.8.13.0000" />
          </div>

          <div className="mb-4 flex items-end gap-3 flex-wrap">
            <div>
              <label className="form-label"><u>C</u>have Processo:</label>
              <input type="text" className="form-field w-[280px]" value={chaveProcesso} onChange={e => setChaveProcesso(e.target.value)} />
            </div>
            <div className="pb-1.5">
              <span className="inline-block px-2 py-1 bg-slate-700 text-white text-[11px] font-bold rounded">OU</span>
            </div>
            <div>
              <label className="form-label">Chave <u>D</u>ocumento:</label>
              <input type="text" className="form-field w-[280px]" value={chaveDocumento} onChange={e => setChaveDocumento(e.target.value)} />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label flex items-center gap-1"><u>N</u>ome da Parte: <Info size={13} className="text-sky-600" /></label>
            <div className="flex items-center gap-6 flex-wrap">
              <input type="text" className="form-field max-w-2xl flex-1 min-w-[300px]" value={nomeParte}
                onChange={e => setNomeParte(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && consultar()} />
              <label className="flex items-center gap-2 text-[13px] cursor-pointer whitespace-nowrap">
                <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={fonetica} onChange={e => setFonetica(e.target.checked)} />
                Pesquisa fonética
              </label>
            </div>
          </div>

          <div className="flex items-start gap-8 flex-wrap">
            <div className="flex flex-col gap-1.5 pt-6">
              <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                <input type="radio" name="tipoPessoa" className="w-4 h-4 accent-blue-600" checked={tipoPessoa === 'fisica'} onChange={() => setTipoPessoa('fisica')} />
                Pessoa Física
              </label>
              <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer">
                <input type="radio" name="tipoPessoa" className="w-4 h-4 accent-blue-600" checked={tipoPessoa === 'juridica'} onChange={() => setTipoPessoa('juridica')} />
                Pessoa Jurídica
              </label>
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><u>C</u>P<u>F</u>: <Info size={13} className="text-sky-600" /></label>
              <input type="text" className="form-field w-[300px]" value={cpf}
                onChange={e => setCpf(tipoPessoa === 'fisica' ? formatCpf(e.target.value) : formatCnpj(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && consultar()} />
            </div>
            <div>
              <label className="form-label"><u>O</u>AB:</label>
              <input type="text" className="form-field w-[300px]" value={oab} onChange={e => setOab(e.target.value)} />
            </div>
          </div>
        </div>

        {erro && <div className="alert-error mt-3">{erro}</div>}

        {/* Captcha */}
        {view === 'form' && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-[150px] h-[52px] border border-border flex items-center justify-center text-[24px] font-serif tracking-[0.3em] select-none"
                style={{ background: 'repeating-linear-gradient(45deg, #f4f4f8, #f4f4f8 3px, #e8e8f0 3px, #e8e8f0 6px)', color: '#333' }}>
                R4CC
              </div>
              <button className="text-sky-600" title="Ouvir código"><Volume2 size={20} /></button>
            </div>
            <input type="text" className="form-field w-[150px]" value={captcha} onChange={e => setCaptcha(e.target.value)} aria-label="Digite o código da imagem" />
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
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma parte encontrada para "<strong>{nomeParte || cpf}</strong>".
                    </td></tr>
                  ) : (
                    partesEncontradas.map((p, i) => (
                      <tr key={p.chave} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-2">
                          <button className="text-sky-700 hover:underline font-semibold" onClick={() => abrirProcessosDaParte(p)}>{p.nome}</button>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">{maskDocumento(p.cpfCnpj, p.tipo)}</td>
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
                    <th className="text-left px-4 py-2 font-bold">Documentos</th>
                  </tr>
                </thead>
                <tbody>
                  {processosEncontrados.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum processo encontrado.</td></tr>
                  ) : (
                    processosEncontrados.map((pr, i) => (
                      <tr key={pr.id} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''} align-top`}>
                        <td className="px-4 py-2">
                          <button className="text-sky-700 hover:underline font-mono text-left" onClick={() => abrirDetalhe(pr)}>{pr.numeroProcesso}</button>
                        </td>
                        <td className="px-4 py-2">{poloAutor(pr)}</td>
                        <td className="px-4 py-2 whitespace-pre-line">{poloReu(pr)}</td>
                        <td className="px-4 py-2">{pr.assunto || '—'}</td>
                        <td className="px-4 py-2">{pr.documentos.length}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detalhe do processo */}
        {view === 'detalhe' && detalhe && (
          <div className="mt-6 space-y-4">
            <button className="flex items-center gap-1 text-[13px] text-sky-700 hover:underline" onClick={voltar}>
              <ArrowLeft size={14} /> Voltar aos resultados
            </button>

            <div className="bg-white border border-border">
              <div className="panel-header">DADOS DO PROCESSO</div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Cell label="Número do Processo" value={detalhe.numeroProcesso} mono />
                <Cell label="Classe" value={detalhe.classe || '—'} />
                <Cell label="Assunto" value={detalhe.assunto || '—'} />
                <Cell label="Vara / Órgão Julgador" value={detalhe.vara || '—'} />
              </div>
            </div>

            <div className="bg-white border border-border">
              <div className="panel-header">PARTES</div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2 font-bold w-40">Polo</th>
                    <th className="text-left px-4 py-2 font-bold">Nome</th>
                    <th className="text-right px-4 py-2 font-bold w-[220px]">CPF / CNPJ</th>
                  </tr>
                </thead>
                <tbody>
                  {detalhe.partes.map(pt => (
                    <tr key={pt.id} className="border-b border-border">
                      <td className="px-4 py-2 capitalize">{pt.polo === 'ativo' ? 'Autor' : 'Réu'}</td>
                      <td className="px-4 py-2">{pt.nome}</td>
                      <td className="px-4 py-2 text-right font-mono">{maskDocumento(pt.cpfCnpj, pt.tipoPessoa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-border">
              <div className="panel-header">DOCUMENTOS DO PROCESSO</div>
              {detalhe.documentos.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-[12px]">Nenhum documento anexado a este processo.</div>
              ) : (
                <div className="divide-y divide-border">
                  {detalhe.documentos.map(d => (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
                      <FileText size={18} className="text-slate-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate">{d.nome}</div>
                        <div className="text-[11px] text-muted-foreground">{d.tipoPeca} · {(d.tamanho / 1024).toFixed(0)} KB</div>
                      </div>
                      <button className="tjmg-btn-link flex items-center gap-1 text-[12px]" onClick={() => abrirDocumento(d.id)}>
                        <ExternalLink size={13} /> Abrir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="alert-warning text-[11px] mt-4">
          ⚠️ Simulador Educacional — os dados exibidos são fictícios, produzidos por alunos e professores da Faculdade Milton Campos. Sem vínculo com o TJMG.
        </div>
      </div>
    </EprocLayout>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase">{label}</div>
      <div className={`text-[13px] ${mono ? 'font-mono font-semibold' : ''}`}>{value}</div>
    </div>
  );
}
