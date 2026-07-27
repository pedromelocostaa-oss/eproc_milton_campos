import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProfLayout from '@/components/layout/ProfLayout';
import { HelpTooltip } from '@/components/prof/HelpTooltip';
import { Upload, Users, Download } from 'lucide-react';
import Papa from 'papaparse';
import { supabase, DEMO_MODE } from '@/integrations/supabase/client';
import { cpfToEmail, formatCpf, generateOab } from '@/lib/masks';
import { demoAlunosLista } from '@/data/demoStore';

interface AlunoCSV {
  cpf: string;
  nome_completo: string;
  matricula: string;
  turma: string;
}

interface ResultadoImport {
  cpf: string;
  nome: string;
  status: 'ok' | 'erro';
  mensagem?: string;
}

const DEMO_ALUNOS = demoAlunosLista.map(a => ({
  cpf: a.cpf, nome: a.nome, matricula: a.matricula, turma: a.turma,
}));

export default function GerenciarAlunosPage() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const [alunos] = useState(DEMO_ALUNOS);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AlunoCSV[]>([]);
  const [resultados, setResultados] = useState<ResultadoImport[]>([]);
  const [importing, setImporting] = useState(false);

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setResultados([]);

    Papa.parse<AlunoCSV>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase()
        .replace('nome', 'nome_completo')
        .replace('matrícula', 'matricula'),
      complete: (results) => setPreview(results.data.slice(0, 20)),
    });
  };

  const importar = async () => {
    if (!preview.length) return;
    setImporting(true);
    const resultList: ResultadoImport[] = [];

    for (const aluno of preview) {
      try {
        if (!aluno.cpf || !aluno.nome_completo) {
          resultList.push({
            cpf: aluno.cpf ?? '?',
            nome: aluno.nome_completo ?? '?',
            status: 'erro',
            mensagem: 'CPF ou nome ausente',
          });
          continue;
        }

        const cpfFormatado = formatCpf(aluno.cpf.replace(/\D/g, ''));
        const oab = generateOab();

        if (DEMO_MODE) {
          resultList.push({
            cpf: cpfFormatado, nome: aluno.nome_completo,
            status: 'ok', mensagem: 'Usuário demo (não persistido em banco)',
          });
          continue;
        }

        const email = cpfToEmail(aluno.cpf);
        const { data: authData, error: authError } = await supabase!.auth.admin.createUser({
          email, password: 'Milton@2025', email_confirm: true,
        });

        if (authError) throw authError;

        await supabase!.from('profiles').insert({
          id: authData.user.id,
          cpf: cpfFormatado,
          nome_completo: aluno.nome_completo,
          matricula: aluno.matricula,
          turma_id: null,
          perfil: 'aluno',
          oab_simulado: oab,
          primeiro_acesso: true,
          ativo: true,
        });

        resultList.push({ cpf: cpfFormatado, nome: aluno.nome_completo, status: 'ok' });
      } catch (err: any) {
        resultList.push({ cpf: aluno.cpf, nome: aluno.nome_completo, status: 'erro', mensagem: err.message });
      }
    }

    setResultados(resultList);
    setImporting(false);
  };

  const baixarModelo = () => {
    const csv = 'cpf,nome_completo,matricula,turma\n123.456.789-00,João da Silva,2025.1.000001,Processo Civil I\n987.654.321-00,Maria Santos,2025.1.000002,Processo Civil I';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_alunos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProfLayout>
      <div style={{ padding: 24, maxWidth: 1200 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="prof-page-title">Gerenciar Alunos</div>
          <div style={{ fontSize: 15, color: '#6b7280' }}>
            Visualize os alunos cadastrados e importe novos alunos em lote.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* ── 7.1 Enrolled students table ── */}
          <div className="prof-card" style={{ padding: 0 }}>
            <div className="prof-card-header">
              <Users size={18} style={{ flexShrink: 0 }} />
              <span>
                Alunos Cadastrados
                <HelpTooltip text="Lista de todos os alunos que têm acesso ao sistema. Para adicionar novos alunos, use a área de importação ao lado." />
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Matrícula</th>
                    <th>Turma</th>
                    <th>Senha padrão</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map(a => (
                    <tr key={a.cpf}>
                      <td style={{ fontWeight: 600 }}>{a.nome}</td>
                      <td style={{ fontFamily: 'monospace' }}>{a.cpf}</td>
                      <td>{a.matricula}</td>
                      <td>{a.turma}</td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 13,
                          color: '#9ca3af', background: '#f9fafb',
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          Milton@2025
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: '#dcfce7', color: '#166534',
                          padding: '3px 12px', borderRadius: 4,
                          fontSize: 13, fontWeight: 700,
                        }}>
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                  {alunos.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 15 }}>
                        Nenhum aluno cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', fontSize: 14, color: '#6b7280' }}>
              Senha padrão para novos alunos:{' '}
              <strong style={{ fontFamily: 'monospace', color: '#374151' }}>Milton@2025</strong>
              {' '}(troca obrigatória no primeiro acesso)
            </div>
          </div>

          {/* ── 7.2 CSV Import area ── */}
          <div className="prof-card" style={{ padding: 0 }}>
            <div className="prof-card-header">
              <Upload size={18} style={{ flexShrink: 0 }} />
              <span>
                Adicionar Novos Alunos
                <HelpTooltip text={'Para cadastrar alunos em lote, baixe o modelo de planilha,\npreencha com os dados e faça o upload aqui.\nCada aluno receberá acesso automático ao sistema.'} />
              </span>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Info box */}
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 6, padding: '14px 16px', fontSize: 14, color: '#1e40af',
                lineHeight: 1.6,
              }}>
                <strong>Formato esperado do arquivo CSV:</strong><br />
                Colunas: <code>cpf, nome_completo, matricula, turma</code><br />
                Separador: vírgula ou ponto-e-vírgula · Encoding: UTF-8
              </div>

              {/* Download model button */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Passo 1 — Baixe o modelo de planilha:
                </div>
                <button
                  className="prof-btn-secondary"
                  style={{ height: 44, padding: '0 20px', fontSize: 14, color: '#16a34a', borderColor: '#16a34a' }}
                  onClick={baixarModelo}
                >
                  <Download size={18} />
                  Baixar Modelo CSV
                  <HelpTooltip text={'Baixe este arquivo, abra no Excel ou Google Planilhas e preencha com os\ndados dos alunos. Depois faça o upload aqui.'} />
                </button>
              </div>

              {/* File upload */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Passo 2 — Selecione o arquivo preenchido:
                </div>
                <label
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <span
                    className="prof-btn-secondary"
                    style={{ height: 52, padding: '0 24px', fontSize: 15 }}
                  >
                    <Upload size={20} />
                    {csvFile ? csvFile.name : 'Selecionar arquivo CSV'}
                  </span>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    accept=".csv,.xlsx,.xls"
                    onChange={handleCsvChange}
                  />
                </label>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#1e3a5f' }}>
                    Prévia — {preview.length} aluno(s) encontrado(s):
                  </div>
                  <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                    <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>CPF</th>
                          <th>Nome</th>
                          <th>Matrícula</th>
                          <th>Turma</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((a, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace' }}>{a.cpf}</td>
                            <td>{a.nome_completo}</td>
                            <td>{a.matricula}</td>
                            <td>{a.turma}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="prof-btn-primary"
                    style={{ height: 52, padding: '0 28px', fontSize: 16, marginTop: 16, width: '100%' }}
                    onClick={importar}
                    disabled={importing}
                  >
                    <Users size={20} />
                    {importing ? 'Importando...' : `Importar ${preview.length} Aluno(s)`}
                  </button>
                </div>
              )}

              {/* Results */}
              {resultados.length > 0 && (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#1e3a5f' }}>
                    Resultado da importação:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {resultados.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', borderRadius: 6, fontSize: 14,
                          background: r.status === 'ok' ? '#f0fdf4' : '#fef2f2',
                        }}
                      >
                        <span>{r.nome} ({r.cpf})</span>
                        <span style={{
                          fontWeight: 700,
                          color: r.status === 'ok' ? '#166534' : '#dc2626',
                        }}>
                          {r.status === 'ok' ? '✓ Importado' : `✗ ${r.mensagem}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProfLayout>
  );
}
