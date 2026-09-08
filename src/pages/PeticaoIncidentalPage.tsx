import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EprocLayout from '@/components/layout/EprocLayout';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { getDemoProcessos, saveDemoMovimentacao } from '@/data/demoStore';
import { tiposPeticaoIncidental } from '@/data/classesAssuntos';
import { sanitizeStorageSegment } from '@/lib/downloadDoc';
import { CheckCircle, Upload } from 'lucide-react';
import type { Processo } from '@/integrations/supabase/types';

export default function PeticaoIncidentalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processoId = searchParams.get('processo') ?? '';
  const tipoParam = searchParams.get('tipo') ?? '';
  const tarefaParam = searchParams.get('tarefa') ?? '';

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [processoSelecionado, setProcessoSelecionado] = useState(processoId);
  const [tipo, setTipo] = useState(tipoParam || 'Petição Simples');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [protocolado, setProtocolado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    if (DEMO_MODE) {
      setProcessos(getDemoProcessos(user.id).filter(p => p.status !== 'encerrado'));
    } else {
      supabase!
        .from('processos')
        .select('*')
        .eq('aluno_id', user.id)
        .neq('status', 'encerrado')
        .then(({ data }) => data && setProcessos(data));
    }
  }, [user]);

  const protocolar = async () => {
    const errs: Record<string, string> = {};
    if (!processoSelecionado) errs.processo = 'Selecione um processo.';
    if (!arquivo) errs.arquivo = 'Anexe o documento da petição.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();

      if (DEMO_MODE) {
        saveDemoMovimentacao({
          id: crypto.randomUUID(),
          processo_id: processoSelecionado,
          tipo: 'peticao_incidental',
          descricao: `${tipo} protocolada(o) pelo(a) Dr(a). ${user?.nome_completo}\n${observacoes ? `\nObservações: ${observacoes}` : ''}`,
          autor_id: user!.id,
          created_at: now,
        });
      } else {
        await supabase!.from('movimentacoes').insert({
          processo_id: processoSelecionado,
          tipo: 'peticao_incidental',
          descricao: `${tipo} protocolada(o) pelo(a) Dr(a). ${user?.nome_completo}${observacoes ? `\nObservações: ${observacoes}` : ''}`,
          autor_id: user!.id,
        });

        if (arquivo) {
          const path = `processos/${processoSelecionado}/${sanitizeStorageSegment(tipo || 'documento')}/${sanitizeStorageSegment(arquivo.name)}`;
          const up = await supabase!.storage.from('documentos').upload(path, arquivo, { upsert: true });
          if (up.error) {
            alert(`Falha ao enviar o arquivo:\n${up.error.message}`);
            return;
          }
          await supabase!.from('documentos').insert({
            processo_id: processoSelecionado,
            aluno_id: user!.id,
            tipo,
            nome_arquivo: arquivo.name,
            storage_path: path,
            tamanho_bytes: arquivo.size,
          });
        }
      }

      setProtocolado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao protocolar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const processoAtual = processos.find(p => p.id === processoSelecionado);

  if (protocolado) {
    return (
      <EprocLayout>
        <div className="p-4 max-w-xl mx-auto">
          <div className="bg-white border border-border">
            <div className="panel-header flex items-center gap-2">
              <CheckCircle size={16} /> PETIÇÃO PROTOCOLADA
            </div>
            <div className="p-6 text-center">
              <div className="text-[36px] mb-3">✅</div>
              <div className="text-[15px] font-bold mb-2" style={{ color: 'hsl(210,100%,20%)' }}>
                {tipo} protocolado(a) com sucesso!
              </div>
              <div className="text-[12px] text-muted-foreground mb-4">
                Sua petição foi juntada ao processo <strong>{processoAtual?.numero_processo}</strong>.
              </div>
              <div className="text-[11px] text-muted-foreground mb-6">
                {new Date().toLocaleString('pt-BR')}
              </div>
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary" onClick={() => navigate(`/processo/${processoSelecionado}`)}>
                  Ver Processo
                </button>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                  Voltar ao Painel
                </button>
              </div>
            </div>
          </div>
        </div>
      </EprocLayout>
    );
  }

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <button onClick={() => navigate('/meus-processos')}>Meus Processos</button>
          <span>›</span>
          <span>Petição Incidental</span>
        </div>

        <div className="bg-white border border-border max-w-2xl">
          <div className="panel-header">PETIÇÃO INCIDENTAL — JUNTADA AOS AUTOS</div>
          <div className="p-4 space-y-4">
            {tarefaParam && (
              <div className="alert-warning text-[11px]">
                <strong>Atividade de Defesa:</strong> Você foi citado(a) em ação judicial e deve protocolizar a contestação.
                Leia atentamente a petição inicial antes de elaborar sua defesa.
              </div>
            )}
            <div>
              <label className="form-label required">Processo</label>
              <select
                className={`form-field ${errors.processo ? 'form-field-error' : ''}`}
                value={processoSelecionado}
                onChange={e => setProcessoSelecionado(e.target.value)}
              >
                <option value="">-- Selecione o processo --</option>
                {processos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero_processo} — {p.classe_processual}
                  </option>
                ))}
              </select>
              {errors.processo && <div className="form-error">{errors.processo}</div>}
            </div>

            {processoAtual && (
              <div className="p-3 border border-border bg-blue-50 text-[11px]">
                <strong>Processo selecionado:</strong> {processoAtual.numero_processo}<br />
                <strong>Vara:</strong> {processoAtual.vara}<br />
                <strong>Situação:</strong> {processoAtual.status}
              </div>
            )}

            <div>
              <label className="form-label required">Tipo de Petição/Peça</label>
              <select
                className="form-field"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                disabled={!!tipoParam}
              >
                {tiposPeticaoIncidental.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {tipoParam && (
                <div className="text-[10px] text-muted-foreground mt-1">Tipo pré-selecionado pela atividade.</div>
              )}
            </div>

            <div>
              <label className="form-label required">Arquivo (PDF ou DOCX, máx. 10MB)</label>
              <label className={`btn-secondary flex items-center gap-2 cursor-pointer w-fit ${errors.arquivo ? 'border-red-500' : ''}`}>
                <Upload size={14} />
                {arquivo ? 'Alterar arquivo' : 'Selecionar arquivo'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 10 * 1024 * 1024) { alert('Arquivo muito grande.'); return; }
                    setArquivo(f);
                  }}
                />
              </label>
              {arquivo && (
                <div className="mt-1 text-[11px] text-green-700 flex items-center gap-1">
                  <CheckCircle size={12} /> {arquivo.name}
                </div>
              )}
              {errors.arquivo && <div className="form-error">{errors.arquivo}</div>}
            </div>

            <div>
              <label className="form-label">Observações ao Juízo</label>
              <textarea
                className="form-field min-h-20"
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Observações opcionais..."
              />
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
              <button className="btn-primary" onClick={protocolar} disabled={loading}>
                {loading ? 'PROTOCOLANDO...' : '⚖ PROTOCOLAR PETIÇÃO'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </EprocLayout>
  );
}
