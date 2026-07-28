import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Clock, ChevronLeft, HelpCircle } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import {
  CATEGORIAS, contar, filtrarAudiencias, proximaAudiencia,
  type CategoriaAudiencia,
} from '@/data/audiencias';

type Aba = 'audiencias' | 'foruns' | 'pericias';

function fmtDataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ':00';
}

function fmtProxima(iso: string) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} - ${hora}`;
}

export default function AudienciasPage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('audiencias');
  const [categoria, setCategoria] = useState<CategoriaAudiencia | null>(null);

  const proxima = proximaAudiencia();

  // ---- Tela de detalhe (lista de audiências de uma categoria) ----
  if (categoria) {
    const lista = filtrarAudiencias(categoria.situacao, categoria.conciliacao);
    return (
      <EprocLayout>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[20px] font-bold" style={{ color: '#333' }}>{categoria.rotulo}</h1>
            <button className="tjmg-btn-link flex items-center gap-1" onClick={() => setCategoria(null)}>
              <ChevronLeft size={15} /> Voltar
            </button>
          </div>

          <div className="text-right text-[12px] text-muted-foreground mb-1">
            Lista de Audiências ({lista.length} registro{lista.length !== 1 ? 's' : ''}):
          </div>

          <div className="bg-white border border-border overflow-x-auto">
            <table className="w-full text-[12px] min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-3 py-2 font-bold">Número Processo</th>
                  <th className="text-left px-3 py-2 font-bold">Evento</th>
                  <th className="text-left px-3 py-2 font-bold">Local Data/Hora</th>
                  <th className="text-left px-3 py-2 font-bold">Observação</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Nenhuma audiência nesta situação.</td></tr>
                ) : (
                  lista.map((a, i) => (
                    <tr key={a.id} className={`border-b border-border align-top ${i % 2 ? 'bg-muted/20' : ''}`}>
                      <td className="px-3 py-2">
                        <button
                          className="text-sky-700 hover:underline font-mono font-semibold"
                          onClick={() => navigate(`/consulta-processual?numero=${encodeURIComponent(a.numeroProcesso)}`)}
                        >
                          {a.numeroProcesso}
                        </button>
                        <div className="text-[11px] text-muted-foreground">({a.vara})</div>
                        <div className="mt-1 text-[11px]">
                          <div><span className="font-semibold">Autor:</span> {a.autor} <span className="text-muted-foreground">— REQUERENTE</span></div>
                          <div className="text-muted-foreground my-0.5">×</div>
                          <div><span className="font-semibold">Réu:</span> {a.reu} <span className="text-muted-foreground">— REQUERIDO</span></div>
                        </div>
                      </td>
                      <td className="px-3 py-2">{a.evento}</td>
                      <td className="px-3 py-2">
                        <div><span className="font-semibold">Sala:</span> {a.sala}</div>
                        <div className="mt-1"><span className="font-semibold">Início:</span> {fmtDataHora(a.inicio)}</div>
                        <div><span className="font-semibold">Previsão Término:</span> {fmtDataHora(a.previsaoTermino)}</div>
                      </td>
                      <td className="px-3 py-2">{a.observacao || '—'}</td>
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

  // ---- Painel resumo (com abas) ----
  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Audiências</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <CalendarClock size={26} style={{ color: '#2c77ba' }} />
          <h1 className="text-[22px] font-bold" style={{ color: '#333' }}>Audiências</h1>
        </div>

        <p className="text-[13px] text-muted-foreground mb-4 max-w-3xl">
          A aba "Audiências" permite consultar as audiências futuras, incluindo as designadas,
          redesignadas, prorrogadas e adiadas, além das realizadas e não realizadas. Ao final,
          o sistema exibe a data e o horário da sua próxima audiência.
        </p>

        <div className="bg-white border border-border max-w-4xl">
          {/* Cabeçalho do painel */}
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-[13px] font-bold" style={{ color: '#a4292c' }}>
              Audiências/Fóruns de Conciliações/Perícias
            </span>
          </div>

          {/* Abas */}
          <div className="flex border-b border-border">
            {([
              { id: 'audiencias', label: 'Audiências' },
              { id: 'foruns', label: 'Fóruns de Conciliações' },
              { id: 'pericias', label: 'Perícias' },
            ] as { id: Aba; label: string }[]).map(t => (
              <button
                key={t.id}
                className={`px-4 py-2 text-[13px] font-semibold border-b-2 ${aba === t.id ? 'border-sky-600 text-sky-700' : 'border-transparent text-muted-foreground hover:text-sky-700'}`}
                onClick={() => setAba(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Conteúdo da aba */}
          <div className="p-4">
            {aba === 'audiencias' && (
              <>
                <table className="w-full text-[13px] border border-border">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-bold">Situação</th>
                      <th className="text-center px-3 py-2 font-bold w-40">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIAS.map(cat => {
                      const qtd = contar(cat.situacao, cat.conciliacao);
                      return (
                        <tr key={cat.chave} className="border-b border-border">
                          <td className="px-3 py-2 flex items-center gap-1">
                            {cat.rotulo}
                            <HelpCircle size={13} className="text-muted-foreground shrink-0" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {qtd > 0 ? (
                              <button className="text-sky-700 font-semibold hover:underline" onClick={() => setCategoria(cat)}>
                                {qtd}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Próxima audiência */}
                {proxima && (
                  <div className="flex items-center justify-end gap-2 mt-3 text-[13px]" style={{ color: '#2c77ba' }}>
                    <Clock size={15} />
                    <span>Próxima audiência: <strong>{fmtProxima(proxima.inicio)}</strong></span>
                  </div>
                )}
              </>
            )}

            {aba === 'foruns' && (
              <div className="p-6 text-center text-muted-foreground text-[12px]">
                Nenhum fórum de conciliação designado no momento.
              </div>
            )}

            {aba === 'pericias' && (
              <div className="p-6 text-center text-muted-foreground text-[12px]">
                Nenhuma perícia designada no momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </EprocLayout>
  );
}
