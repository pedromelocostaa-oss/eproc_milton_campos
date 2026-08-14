import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatCpf } from '@/lib/masks';

type PerfilTab = 'aluno' | 'professor';

export default function LoginPage() {
  const { login, demoMode } = useAuth();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState(demoMode ? '121.572.976-69' : '');
  const [senha, setSenha] = useState(demoMode ? 'Milton@2025' : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilTab>('aluno');

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!cpf || !senha) { setError('Preencha CPF e senha.'); return; }

    setLoading(true);
    const { error: loginError, user } = await login(cpf, senha);
    setLoading(false);

    if (loginError) { setError(loginError); return; }

    if (user && perfilSelecionado === 'professor' && user.perfil === 'aluno') {
      setError('Acesso não autorizado para este perfil. Use a aba "Advogado / Aluno".');
      return;
    }
    if (user && perfilSelecionado === 'aluno' && (user.perfil === 'professor' || user.perfil === 'admin')) {
      setError('Use a aba "Magistrado(a) / Professor(a)" para acessar.');
      return;
    }

    navigate(user?.perfil === 'professor' || user?.perfil === 'admin' ? '/prof/dashboard' : '/dashboard');
  };

  const subHeaderAluno = (
    <div className="flex items-center gap-4 px-4 py-1 text-[11px]" style={{ background: 'hsl(213, 100%, 28%)' }}>
      <span className="font-bold cursor-pointer hover:underline text-white">Entrar</span>
      <span className="cursor-pointer hover:underline text-white">Formas de acesso</span>
      <span className="cursor-pointer hover:underline text-white" onClick={() => window.location.href = '/consulta-publica'}>Consulta processual</span>
      <span className="cursor-pointer hover:underline text-white">Manuais</span>
      <span className="cursor-pointer hover:underline text-white">Fale conosco</span>
    </div>
  );

  const subHeaderProf = (
    <div className="flex items-center gap-4 px-4 py-1 text-[11px]" style={{ background: 'hsl(213, 100%, 28%)' }}>
      <span className="font-bold text-white">Sistema de Gestão Acadêmica</span>
      <span className="text-white opacity-60 ml-auto">Acesso restrito — Magistrados e Professores</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(213, 30%, 92%)' }}>
      {demoMode && (
        <div className="demo-banner">
          ⚠️ MODO DEMONSTRAÇÃO — CPF: 121.572.976-69 | Senha: Milton@2025 (aluno) &nbsp;|&nbsp; CPF: 000.000.000-01 (professor)
        </div>
      )}

      {/* Top e-Proc header */}
      <header style={{ background: 'hsl(210, 100%, 20%)' }} className="text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 1L1 5v8c0 6.5 4.3 11.8 10 13.5C16.7 24.8 21 19.5 21 13V5L11 1z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.2"/>
                <path d="M11 3.5L3 7v6c0 5 3.3 9.2 8 10.8C15.7 22.2 19 18 19 13V7L11 3.5z" fill="white" fillOpacity="0.08"/>
                <text x="11" y="15.5" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial" letterSpacing="0.5">JF</text>
                <line x1="6" y1="17.5" x2="16" y2="17.5" stroke="white" strokeWidth="0.8" strokeOpacity="0.5"/>
              </svg>
            </div>
            <div>
              <div className="text-[14px] font-bold">e-Proc</div>
              <div className="text-[10px] opacity-70">Peticionamento Eletrônico — 1º Grau</div>
            </div>
          </div>
          <div className="text-[11px] opacity-80 hidden md:block">Seção Judiciária de Minas Gerais</div>
        </div>
        {perfilSelecionado === 'aluno' ? subHeaderAluno : subHeaderProf}
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-6">
          <div className="text-[18px] font-bold text-foreground mb-1">
            e-Proc · Processo Eletrônico — 1º Grau
          </div>
          <div className="text-[12px] text-muted-foreground">
            Sistema de Simulação Educacional · Acesse com CPF e senha
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white border border-border shadow-sm w-full max-w-[380px]">

          {/* Profile tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              className="flex-1 py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border-r border-border transition-colors"
              style={{
                background: perfilSelecionado === 'aluno' ? 'hsl(210,100%,20%)' : 'hsl(213,20%,96%)',
                color: perfilSelecionado === 'aluno' ? '#ffffff' : 'hsl(210,20%,40%)',
              }}
              onClick={() => { setPerfilSelecionado('aluno'); setError(''); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12z"/>
                <path d="M2.4 21.6c0-5.3 4.3-9.6 9.6-9.6s9.6 4.3 9.6 9.6"/>
              </svg>
              Advogado / Aluno
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              style={{
                background: perfilSelecionado === 'professor' ? 'hsl(210,100%,20%)' : 'hsl(213,20%,96%)',
                color: perfilSelecionado === 'professor' ? '#ffffff' : 'hsl(210,20%,40%)',
              }}
              onClick={() => { setPerfilSelecionado('professor'); setError(''); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <line x1="12" y1="16" x2="12" y2="16.5" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Magistrado(a)
            </button>
          </div>

          <div className="px-4 py-2 text-white text-[12px] font-bold" style={{ background: 'hsl(210, 100%, 20%)' }}>
            IDENTIFICAÇÃO DO USUÁRIO
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="form-label required">CPF</label>
              <input
                type="text"
                className={`form-field ${error ? 'form-field-error' : ''}`}
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="form-label">Tipo de Acesso</label>
              <div className="space-y-1.5 mt-1">
                <label className="pje-radio">
                  <input type="radio" name="tipoAcesso" defaultChecked readOnly />
                  <span>CPF e Senha</span>
                </label>
                <label className="pje-radio" style={{ opacity: 0.45, cursor: 'not-allowed' }}>
                  <input type="radio" name="tipoAcesso" disabled />
                  <span>Certificado Digital <span className="text-[10px] text-muted-foreground">(não disponível neste simulador)</span></span>
                </label>
              </div>
            </div>

            <div>
              <label className="form-label required">Senha</label>
              <input
                type="password"
                className={`form-field ${error ? 'form-field-error' : ''}`}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" className="btn-primary w-full text-center" disabled={loading}>
              {loading ? 'AGUARDE...' : 'ACESSAR'}
            </button>

            <div className="flex justify-between pt-1">
              <button type="button" className="text-[11px] hover:underline bg-transparent border-none cursor-pointer" style={{ color: 'hsl(210,100%,20%)' }}>
                Esqueci minha senha
              </button>
              <button type="button" className="text-[11px] hover:underline bg-transparent border-none cursor-pointer font-semibold" style={{ color: 'hsl(210,100%,20%)' }} onClick={() => navigate('/cadastro')}>
                Primeiro acesso / Cadastro
              </button>
            </div>

            <div className="text-center pt-1 border-t border-border">
              <span className="text-[10px] text-muted-foreground">Versão 2.8.1 — Simulador Educacional</span>
            </div>
          </form>
        </div>

        {/* Info panel — only for aluno tab */}
        {perfilSelecionado === 'aluno' && (
          <div className="mt-6 max-w-[380px] w-full">
            <div className="bg-white border border-border p-4">
              <div className="panel-header mb-2">SOBRE O SIMULADOR</div>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ambiente exclusivamente educacional</li>
                <li>Replica a interface do e-Proc TRF1</li>
                <li>Dados e processos são fictícios</li>
                <li>Acesso controlado por professor</li>
              </ul>
            </div>
          </div>
        )}

        {perfilSelecionado === 'professor' && (
          <div className="mt-6 max-w-[380px] w-full">
            <div className="bg-white border border-border p-4">
              <div className="panel-header mb-2">ACESSO RESTRITO</div>
              <p className="text-[11px] text-muted-foreground">
                Esta área é exclusiva para professores e magistrados simulados.
                Para acessar como aluno, selecione a aba "Advogado / Aluno".
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="edu-footer py-3">
        Simulador Educacional e-Proc — Não possui vínculo com a Justiça Federal ou TRF1 · Desenvolvido para fins acadêmicos · Faculdade Milton Campos / Grupo Anima Educação
      </footer>
    </div>
  );
}
