import { useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import {
  FileText, History, ListChecks, HelpCircle, MoreVertical, Clock,
  Lightbulb, X, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { DEMO_MODE } from '@/integrations/supabase/client';
import {
  getDemoProcessos, getDemoIntimacoesAluno, getDemoIntimacoesNaoLidas,
  getDemoTarefas, subscribeDemoStore,
} from '@/data/demoStore';
import { getAcervoParaAluno, subscribeAcervo } from '@/data/acervoStore';
import { contar, proximaAudiencia } from '@/data/audiencias';
import type { Processo, Tarefa, Intimacao } from '@/integrations/supabase/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtProxima(iso: string) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} - ${hora}`;
}

export default function DashboardAlunoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [aprovadoBanner, setAprovadoBanner] = useState(() => searchParams.get('aprovado') === '1');
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [intimacoes, setIntimacoes] = useState<Intimacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [acervoCount, setAcervoCount] = useState(0);
  const [abaCit, setAbaCit] = useState<'MG' | 'TJMG'>('MG');
  const [abaAud, setAbaAud] = useState<'audiencias' | 'foruns' | 'pericias'>('audiencias');
  const [abaTrab, setAbaTrab] = useState<'pendencias' | 'substabelecimento'>('pendencias');
  const [novidades, setNovidades] = useState(true);

  useEffect(() => {
    if (!user || !DEMO_MODE) return;
    const load = () => {
      setProcessos(getDemoProcessos(user.id));
      setIntimacoes(getDemoIntimacoesAluno(user.id));
      setNaoLidas(getDemoIntimacoesNaoLidas(user.id));
      setTarefas(getDemoTarefas().filter(t => t.ativa));
      setAcervoCount(getAcervoParaAluno([user.turma_id]).length);
    };
    load();
    const u1 = subscribeDemoStore(load);
    const u2 = subscribeAcervo(load);
    return () => { u1(); u2(); };
  }, [user]);

  // ---- números conectados aos dados reais ----
  const audFuturas = useMemo(() => contar('futura', false), []);
  const audFuturasConc = useMemo(() => contar('futura', true), []);
  const prox = useMemo(() => proximaAudiencia(), []);
  const tarefasPendentes = tarefas.filter(t => !processos.some(p => p.tarefa_id === t.id));

  const irRelatorio = () => navigate('/relatorios/processos');
  const irIntimacoes = () => navigate('/intimacoes');
  const irAudiencias = () => navigate('/audiencias');

  return (
    <EprocLayout intimacoesCount={naoLidas}>
      <div className="p-4 relative">
        {/* Toast Novidades */}
        {novidades && (
          <div style={{ position: 'absolute', top: 8, right: 12, width: 340, maxWidth: '90%', background: '#fff', border: '1px solid #dbeafe', borderRadius: 6, boxShadow: '0 4px 14px rgba(0,0,0,0.12)', padding: 12, display: 'flex', gap: 10, zIndex: 30 }}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lightbulb size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f' }}>Novidades</div>
              <div style={{ fontSize: 12, color: '#2c77ba' }}>Você possui novidades não lidas.</div>
            </div>
            <button onClick={() => setNovidades(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={16} /></button>
          </div>
        )}

        {/* Banner de aprovação */}
        {aprovadoBanner && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>Cadastro aprovado!</div>
              <div style={{ fontSize: 13, color: '#15803d' }}>Seu cadastro foi aprovado pelo professor. Você já pode usar o sistema normalmente.</div>
            </div>
            <button onClick={() => { setAprovadoBanner(false); searchParams.delete('aprovado'); setSearchParams(searchParams, { replace: true }); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#15803d' }}><X size={16} /></button>
          </div>
        )}

        {/* Título + ações */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Painel do Advogado</h1>
          <div className="flex gap-2 flex-wrap">
            <BotaoAcao icon={<FileText size={15} />} label="Petição inicial" onClick={() => navigate('/peticao-inicial')} />
            <BotaoAcao icon={<History size={15} />} label="Últimas movimentações" onClick={() => navigate('/meus-processos')} />
            <BotaoAcao icon={<ListChecks size={15} />} label="Relação de processos" onClick={irRelatorio} />
          </div>
        </div>

        {/* Aviso / Novidades */}
        <div className="text-[13px] text-foreground leading-relaxed mb-5 max-w-5xl">
          <p className="font-bold mb-2">Prezados Advogados e Advogadas,</p>
          <p className="mb-2">
            A interposição de <strong>Agravo de Instrumento</strong> em processos dos <strong>Juizados Especiais Cíveis</strong>
            {' '}deve ser feita pela ação <strong>"Agravo de Instrumento TR"</strong>, disponível nos autos digitais —
            tramitando no e-Proc da 1ª Instância, perante a Turma Recursal.
          </p>
          <p className="mb-2">
            Já nos processos da <strong>Justiça Comum</strong>, utilize a ação <strong>"Agravo"</strong>, também nos autos
            digitais, com tramitação no e-Proc da 2ª Instância. Consulte o Manual dos Advogados para o passo a passo completo.
          </p>
        </div>

        {/* Grade de painéis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Citações/Intimações */}
          <Painel titulo="Citações/Intimações" cor="#c0392b" menu>
            <Abas
              itens={[{ id: 'MG', label: 'MG' }, { id: 'TJMG', label: 'TJMG' }]}
              ativo={abaCit}
              onSelect={id => setAbaCit(id as 'MG' | 'TJMG')}
            />
            {abaCit === 'MG' ? (
              <TabelaContagem
                colTipo="Tipo"
                linhas={[
                  { label: 'Processos com prazo em aberto', qtd: acervoCount, onClick: irRelatorio },
                  { label: 'Processos com prazo em aberto - urgente', qtd: 0 },
                  { label: 'Processos pendentes de citação/intimação - Urgentes', qtd: 0 },
                  { label: 'Processos pendentes de citação/intimação', qtd: naoLidas, onClick: irIntimacoes },
                  { label: 'Processos pendentes de intimação de homologação de acordo', qtd: 0 },
                  { label: 'Processos pendentes de citação - art. 334 CPC', qtd: 0 },
                  { label: 'Decursos de prazo nos últimos 30 dias', qtd: 0 },
                ]}
              />
            ) : (
              <TabelaContagem colTipo="Tipo" linhas={[{ label: 'Processos com prazo em aberto', qtd: 0 }]} />
            )}
            <RodapeRelogio texto="Processos com prazo vencendo hoje:" valor="0" />
          </Painel>

          {/* Audiências/Fóruns/Perícias */}
          <Painel titulo="Audiências/Fóruns de Conciliações/Perícias" cor="#c0392b" menu>
            <Abas
              itens={[
                { id: 'audiencias', label: 'Audiências' },
                { id: 'foruns', label: 'Fóruns de Conciliações' },
                { id: 'pericias', label: 'Perícias' },
              ]}
              ativo={abaAud}
              onSelect={id => setAbaAud(id as typeof abaAud)}
            />
            {abaAud === 'audiencias' && (
              <>
                <TabelaContagem
                  colTipo="Situação"
                  linhas={[
                    { label: 'Audiências Futuras', qtd: audFuturas, ajuda: true, onClick: irAudiencias },
                    { label: 'Audiências Futuras de Conciliação', qtd: audFuturasConc, ajuda: true, onClick: irAudiencias },
                  ]}
                />
                <div className="flex items-center justify-end gap-2 mt-3 text-[12px]" style={{ color: '#2c77ba' }}>
                  <Clock size={14} />
                  <span>Próxima audiência:{' '}
                    {prox
                      ? <button className="hover:underline font-semibold" onClick={irAudiencias}>{fmtProxima(prox.inicio)}</button>
                      : <span className="font-semibold">SEM AUDIÊNCIAS</span>}
                  </span>
                </div>
              </>
            )}
            {abaAud === 'foruns' && <Vazio texto="Nenhum fórum de conciliação designado." />}
            {abaAud === 'pericias' && <Vazio texto="Nenhuma perícia designada." />}
          </Painel>
        </div>

        {/* Recursos do Tribunal + Sessões de Julgamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Painel titulo="Recursos do Tribunal" cor="#334155">
            <TabelaContagem colTipo="Tipo" linhas={[{ label: 'Agravo de Instrumento Distribuído', qtd: 0 }]} />
          </Painel>

          <Painel titulo="Sessões de Julgamento" cor="#2e7d32">
            <TabelaContagem
              colTipo="Tipo"
              linhas={[{ label: 'Processos em pauta', qtd: 0, onClick: () => navigate('/sessoes-julgamento') }]}
            />
          </Painel>
        </div>

        {/* Área de trabalho */}
        <div className="mb-4">
          <Painel titulo="Área de trabalho" cor="#334155">
            <Abas
              itens={[{ id: 'pendencias', label: 'Pendências' }, { id: 'substabelecimento', label: 'Substabelecimento' }]}
              ativo={abaTrab}
              onSelect={id => setAbaTrab(id as typeof abaTrab)}
            />
            {abaTrab === 'pendencias' ? (
              <TabelaContagem
                colTipo="Tipo"
                linhas={[
                  { label: 'Processos pendentes do advogado', qtd: processos.length, onClick: () => navigate('/meus-processos') },
                  { label: 'Movimentações/petições pendentes para advogado', qtd: 0 },
                ]}
              />
            ) : (
              <Vazio texto="Nenhum substabelecimento pendente." />
            )}
          </Painel>
        </div>

        {/* Tarefas do Professor (educacional) */}
        <div className="bg-white border border-border">
          <div className="panel-header flex items-center justify-between">
            <span>TAREFAS DO PROFESSOR</span>
            {tarefasPendentes.length > 0 && <span className="badge-warning">{tarefasPendentes.length} pendente(s)</span>}
          </div>
          {tarefas.length === 0 ? (
            <div className="px-3 py-4 text-[12px] text-muted-foreground text-center">Nenhuma tarefa ativa no momento.</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Tarefa</th><th>Prazo</th><th>Situação</th><th>Ação</th></tr></thead>
              <tbody>
                {tarefas.map(t => {
                  const hasProcesso = processos.some(p => p.tarefa_id === t.id);
                  const vencido = t.prazo && new Date(t.prazo) < new Date();
                  return (
                    <tr key={t.id}>
                      <td className="font-semibold">{t.titulo}</td>
                      <td>{t.prazo ? formatDate(t.prazo) : '—'}{vencido && <span className="ml-2 text-red-600 font-bold text-[10px]">VENCIDO</span>}</td>
                      <td>{hasProcesso ? <span className="badge-success">Protocolado</span> : <span className="badge-warning">Pendente</span>}</td>
                      <td>{!hasProcesso && (
                        <button className="btn-primary text-[10px] py-0.5 px-2 flex items-center gap-1" onClick={() => navigate(`/peticao-inicial?tarefa=${t.id}`)}>
                          <ArrowRight size={11} /> Peticionar
                        </button>
                      )}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </EprocLayout>
  );
}

// ---------- componentes de UI ----------
function BotaoAcao({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[13px] font-medium px-3 py-2 bg-white border rounded hover:bg-blue-50"
      style={{ color: '#2c77ba', borderColor: '#d1d5db' }}
    >
      {icon} {label}
    </button>
  );
}

function Painel({ titulo, cor, menu, children }: { titulo: string; cor: string; menu?: boolean; children: ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `3px solid ${cor}`, borderRadius: 3 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: cor, fontWeight: 700, fontSize: 14 }}>{titulo}</span>
        {menu && <MoreVertical size={16} style={{ color: '#c0392b' }} />}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function Abas({ itens, ativo, onSelect }: { itens: { id: string; label: string }[]; ativo: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 12 }}>
      {itens.map(it => (
        <button
          key={it.id}
          onClick={() => onSelect(it.id)}
          style={{
            padding: '6px 14px', fontSize: 13, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer',
            color: ativo === it.id ? '#2c77ba' : '#6b7280',
            borderBottom: ativo === it.id ? '2px solid #2c77ba' : '2px solid transparent',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

interface LinhaContagem { label: string; qtd: number; ajuda?: boolean; onClick?: () => void; }
function TabelaContagem({ colTipo, linhas }: { colTipo: string; linhas: LinhaContagem[] }) {
  const cell: React.CSSProperties = { padding: '9px 12px', fontSize: 13, textAlign: 'left', borderBottom: '1px solid #f0f0f0' };
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ ...cell, fontWeight: 700, color: '#374151' }}>{colTipo}</th>
            <th style={{ ...cell, fontWeight: 700, color: '#374151', textAlign: 'center', width: 130 }}>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i}>
              <td style={cell}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {l.label}
                  {l.ajuda && <HelpCircle size={13} style={{ color: '#9ca3af' }} />}
                </span>
              </td>
              <td style={{ ...cell, textAlign: 'center' }}>
                {l.onClick && l.qtd > 0 ? (
                  <button onClick={l.onClick} style={{ color: '#2c77ba', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13 }}>{l.qtd}</button>
                ) : (
                  <span style={{ color: l.qtd > 0 ? '#2c77ba' : '#9ca3af', fontWeight: 600 }}>{l.qtd}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RodapeRelogio({ texto, valor }: { texto: string; valor: string }) {
  return (
    <div className="flex items-center justify-end gap-2 mt-3 text-[12px]" style={{ color: '#374151' }}>
      <Clock size={14} style={{ color: '#374151' }} />
      <span>{texto} <strong style={{ color: '#2c77ba' }}>{valor}</strong></span>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>{texto}</div>;
}
