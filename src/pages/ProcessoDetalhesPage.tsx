import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getDemoProcessos, getDemoPartes, getDemoMovimentacoes, getDemoDocumentos, getDemoIntimacoesAluno } from '@/data/demoStore';
import { getJuiz } from '@/data/varas';
import { baixarDocumento } from '@/lib/downloadDoc';
import type { Processo, Parte, Movimentacao, Documento, Intimacao } from '@/integrations/supabase/types';

type Tab = 'partes' | 'movimentacoes' | 'documentos' | 'intimacoes';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function statusLabel(s: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    em_andamento: { label: 'Em Andamento', cls: 'badge-info' },
    aguardando_resposta: { label: 'Aguardando Resposta', cls: 'badge-warning' },
    com_despacho: { label: 'Com Despacho', cls: 'badge-warning' },
    encerrado: { label: 'Encerrado', cls: 'badge-neutral' },
    devolvido: { label: 'Devolvido p/ Ajuste', cls: 'badge-danger' },
  };
  return map[s] ?? { label: s, cls: 'badge-neutral' };
}

function movTipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    distribuicao: '[DIST.] Distribuição',
    despacho: '[DESP.] Despacho',
    intimacao: '[INTIM.] Intimação',
    peticao_incidental: '[PET.] Petição Incidental',
    encerramento: '[ENC.] Encerramento',
    solicitacao_emenda: '[EMENDA] Solicitação de Emenda',
  };
  return map[tipo] ?? tipo;
}

export default function ProcessoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('movimentacoes');
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [intimacoes, setIntimacoesAluno] = useState<Intimacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;

    if (DEMO_MODE) {
      const all = getDemoProcessos(user.id);
      const p = all.find(p => p.id === id);
      if (p) {
        setProcesso(p);
        setPartes(getDemoPartes(id));
        setMovimentacoes(getDemoMovimentacoes(id));
        setDocumentos(getDemoDocumentos(id));
        setIntimacoesAluno(getDemoIntimacoesAluno(user.id).filter(i => i.processo_id === id));
      }
      setLoading(false);
      return;
    }

    Promise.all([
      supabase!.from('processos').select('*').eq('id', id).single(),
      supabase!.from('partes').select('*').eq('processo_id', id),
      supabase!.from('movimentacoes').select('*').eq('processo_id', id).order('created_at', { ascending: false }),
      supabase!.from('documentos').select('*').eq('processo_id', id),
      supabase!.from('intimacoes').select('*').eq('processo_id', id).eq('destinatario_id', user.id),
    ]).then(([pRes, partRes, movRes, docRes, intimRes]) => {
      if (pRes.data) setProcesso(pRes.data);
      if (partRes.data) setPartes(partRes.data);
      if (movRes.data) setMovimentacoes(movRes.data);
      if (docRes.data) setDocumentos(docRes.data);
      if (intimRes.data) setIntimacoesAluno(intimRes.data);
      setLoading(false);
    });
  }, [id, user]);

  if (loading) return <EprocLayout><div className="p-8 text-center text-muted-foreground">Carregando...</div></EprocLayout>;
  if (!processo) return <EprocLayout><div className="p-8 text-center text-muted-foreground">Processo não encontrado.</div></EprocLayout>;

  const st = statusLabel(processo.status);
  const varaCode = processo.vara.includes('3800') ? '3800' : '3801';
  const juiz = getJuiz(varaCode);
  const intimacoesNaoLidas = intimacoes.filter(i => !i.lida).length;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'movimentacoes', label: 'Movimentações' },
    { key: 'partes', label: 'Partes' },
    { key: 'documentos', label: 'Documentos' },
    { key: 'intimacoes', label: 'Intimações', badge: intimacoesNaoLidas },
  ];

  return (
    <EprocLayout>
      <div>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <button onClick={() => navigate('/meus-processos')}>Meus Processos</button>
          <span>›</span>
          <span className="font-mono">{processo.numero_processo}</span>
        </div>

        {/* Process header bar */}
        <div className="bg-white border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[16px] font-bold font-mono" style={{ color: 'hsl(210,100%,20%)' }}>
                {processo.numero_processo}
              </div>
              <div className="text-[12px] mt-0.5">{processo.classe_processual}</div>
              <div className="text-[12px] text-muted-foreground">{processo.assunto}</div>
            </div>
            <div className="text-right">
              <span className={`${st.cls} text-sm`}>{st.label}</span>
              {processo.nota != null && (
                <div className="mt-1">
                  <span className="text-[12px] font-bold" style={{ color: 'hsl(210,100%,20%)' }}>
                    Nota: {processo.nota.toFixed(1)}
                  </span>
                </div>
              )}
              {processo.status !== 'encerrado' && (
                <button
                  className="btn-secondary text-[11px] py-0.5 px-2 mt-2"
                  onClick={() => navigate(`/peticao-incidental?processo=${processo.id}`)}
                >
                  + Peticionar Incidentalmente
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3 border-t border-border pt-3">
            <InfoCell label="Vara" value={processo.vara} />
            <InfoCell label="Juiz(a) Simulado(a)" value={juiz} />
            <InfoCell label="Valor da Causa" value={`R$ ${(processo.valor_causa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <InfoCell label="Distribuído em" value={formatDateShort(processo.created_at)} />
            <InfoCell label="Segredo de Justiça" value="Não" />
            <InfoCell label="Prioridade" value="Sem Prioridade" />
          </div>
        </div>

        {/* Tabs */}
        <div className="pje-tab-bar">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`pje-tab-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Tab: Movimentações */}
          {tab === 'movimentacoes' && (
            <div className="bg-white border border-border">
              <div className="panel-header">MOVIMENTAÇÕES PROCESSUAIS</div>
              {movimentacoes.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-[12px]">Nenhuma movimentação registrada.</div>
              )}
              <div className="divide-y divide-border">
                {movimentacoes.map((m, idx) => (
                  <div key={m.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'hsl(210,100%,20%)' }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12px] font-bold">
                            Evento {movimentacoes.length - idx} — {movTipoLabel(m.tipo)}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-muted-foreground">{formatDate(m.created_at)}</span>
                            <button
                              className="text-[11px] hover:underline cursor-pointer"
                              style={{ color: 'hsl(210,100%,20%)' }}
                              onClick={() => {}}
                            >
                              [Ver]
                            </button>
                          </div>
                        </div>
                        <div className="text-[12px] mt-1 whitespace-pre-line">{m.descricao}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Partes */}
          {tab === 'partes' && (
            <div className="space-y-3">
              {(['ativo', 'passivo'] as const).map(polo => {
                const partesDosPolo = partes.filter(p => p.polo === polo);
                return (
                  <div key={polo} className="bg-white border border-border">
                    <div className="panel-header">
                      POLO {polo === 'ativo' ? 'ATIVO — AUTOR(ES)/REQUERENTE(S)' : 'PASSIVO — RÉU(S)/REQUERIDO(S)'}
                    </div>
                    {partesDosPolo.length === 0 && (
                      <div className="p-4 text-muted-foreground text-[12px]">Nenhuma parte cadastrada neste polo.</div>
                    )}
                    {partesDosPolo.map(p => (
                      <div key={p.id} className="p-4 border-b last:border-b-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <InfoCell label="Nome" value={p.nome} />
                          <InfoCell label={p.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'} value={p.cpf_cnpj ?? '—'} />
                          <InfoCell label="Tipo" value={p.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'} />
                          {p.email && <InfoCell label="E-mail" value={p.email} />}
                          {p.telefone && <InfoCell label="Telefone" value={p.telefone} />}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab: Documentos */}
          {tab === 'documentos' && (
            <div className="bg-white border border-border">
              <div className="panel-header">PEÇAS E DOCUMENTOS</div>
              {documentos.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-[12px]">
                  Documentos enviados aparecem aqui (funcionalidade completa com Supabase Storage).
                </div>
              )}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Nome do Arquivo</th>
                    <th>Tamanho</th>
                    <th>Data</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map(d => (
                    <tr key={d.id}>
                      <td>{d.tipo}</td>
                      <td>{d.nome_arquivo}</td>
                      <td>{d.tamanho_bytes ? `${(d.tamanho_bytes / 1024).toFixed(0)} KB` : '—'}</td>
                      <td>{formatDateShort(d.created_at)}</td>
                      <td><button className="btn-secondary text-[10px] py-0.5 px-2" onClick={() => baixarDocumento(d.storage_path, d.nome_arquivo)}>Baixar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Intimações */}
          {tab === 'intimacoes' && (
            <div className="bg-white border border-border">
              <div className="panel-header">INTIMAÇÕES E CITAÇÕES</div>
              {intimacoes.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-[12px]">Nenhuma intimação neste processo.</div>
              )}
              <div className="divide-y divide-border">
                {intimacoes.map(i => (
                  <div key={i.id} className={`p-4 ${!i.lida ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-[12px] font-bold">{i.lida ? '✅ Ciente' : '📬 Nova Intimação'}</div>
                      <div className="text-[11px] text-muted-foreground">{formatDate(i.created_at)}</div>
                    </div>
                    <div className="text-[12px] whitespace-pre-line border border-border p-3 bg-white">{i.texto}</div>
                    {i.prazo_resposta && (
                      <div className="mt-2 text-[11px] text-orange-600 font-bold">
                        ⏰ Prazo para resposta: {formatDate(i.prazo_resposta)}
                      </div>
                    )}
                    {i.data_ciencia && (
                      <div className="mt-1 text-[11px] text-green-700">
                        Ciência em: {formatDate(i.data_ciencia)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback do professor */}
          {processo.feedback_professor && (
            <div className="mt-4 bg-white border border-border">
              <div className="panel-header">FEEDBACK DO PROFESSOR / DESPACHO</div>
              <div className="p-4">
                <div className="text-[12px] whitespace-pre-line">{processo.feedback_professor}</div>
                {processo.nota != null && (
                  <div className="mt-3 text-[14px] font-bold" style={{ color: 'hsl(210,100%,20%)' }}>
                    Nota Final: {processo.nota.toFixed(1)} / 10,0
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </EprocLayout>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase">{label}</div>
      <div className="text-[12px]">{value}</div>
    </div>
  );
}
