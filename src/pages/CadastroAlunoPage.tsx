import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCpf } from '@/lib/masks';
import { demoTurmas } from '@/data/demoStore';
import { registrarAluno } from '@/data/cadastroStore';
import { CheckCircle2, UserPlus } from 'lucide-react';

export default function CadastroAlunoPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  const turmaNome = demoTurmas.find(t => t.id === turmaId)?.nome ?? '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) { setErro('As senhas não conferem.'); return; }
    const r = registrarAluno({ cpf, nome, senha, turmaId });
    if (!r.ok) { setErro(r.erro ?? 'Não foi possível concluir o cadastro.'); return; }
    setEnviado(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(213, 30%, 92%)' }}>
      {/* Header e-Proc */}
      <header style={{ background: 'hsl(210, 100%, 20%)' }} className="text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <span className="text-[11px] font-bold">JF</span>
            </div>
            <div>
              <div className="text-[14px] font-bold">e-Proc</div>
              <div className="text-[10px] opacity-70">Peticionamento Eletrônico — 1º Grau</div>
            </div>
          </div>
          <div className="text-[11px] opacity-80 hidden md:block">Seção Judiciária de Minas Gerais</div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-6">
          <div className="text-[18px] font-bold text-foreground mb-1">Criar cadastro de aluno</div>
          <div className="text-[12px] text-muted-foreground max-w-md">
            Preencha seus dados e escolha a matéria que está cursando. Seu acesso ficará disponível
            após a aprovação do professor responsável.
          </div>
        </div>

        <div className="bg-white border border-border shadow-sm w-full max-w-[420px]">
          <div className="px-4 py-2 text-white text-[12px] font-bold flex items-center gap-2" style={{ background: 'hsl(210, 100%, 20%)' }}>
            <UserPlus size={14} /> NOVO CADASTRO
          </div>

          {enviado ? (
            <div className="p-5">
              <div className="flex items-start gap-3 bg-green-50 border border-green-300 rounded p-4">
                <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
                <div className="text-[13px] text-green-800">
                  <div className="font-bold mb-1">Solicitação enviada!</div>
                  Seu cadastro na matéria <strong>{turmaNome}</strong> foi enviado ao professor responsável.
                  Assim que ele aprovar, você poderá acessar o sistema com seu CPF e senha.
                </div>
              </div>
              <button className="btn-primary w-full mt-4" onClick={() => navigate('/')}>
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="p-5 space-y-3">
              <div>
                <label className="form-label required">Nome completo</label>
                <input type="text" className="form-field" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div>
                <label className="form-label required">CPF</label>
                <input type="text" className="form-field" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} required />
              </div>
              <div>
                <label className="form-label required">Matéria que está cursando</label>
                <select className="form-field" value={turmaId} onChange={e => setTurmaId(e.target.value)} required>
                  <option value="">Selecione a matéria...</option>
                  {demoTurmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label required">Senha</label>
                  <input type="password" className="form-field" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required />
                </div>
                <div>
                  <label className="form-label required">Confirmar senha</label>
                  <input type="password" className="form-field" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>

              {erro && <div className="alert-error">{erro}</div>}

              <button type="submit" className="btn-primary w-full">Enviar solicitação de cadastro</button>
              <button type="button" className="btn-secondary w-full" onClick={() => navigate('/')}>Voltar para o login</button>
            </form>
          )}
        </div>
      </div>

      <footer className="edu-footer py-3">
        Simulador Educacional e-Proc — Não possui vínculo com a Justiça Federal ou TRF1 · Faculdade Milton Campos / Grupo Anima Educação
      </footer>
    </div>
  );
}
