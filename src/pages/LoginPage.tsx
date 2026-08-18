import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatCpf } from '@/lib/masks';
import { Eye, EyeOff, HelpCircle, Contrast, Hand, GraduationCap, BookOpen } from 'lucide-react';
import { demoTurmas } from '@/data/demoStore';
import { registrarAluno, cadastroPorCpf, autenticarCadastro } from '@/data/cadastroStore';

function EprocLogo() {
  return (
    <svg width="150" height="118" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-label="eproc">
      <circle cx="112" cy="55" r="50" fill="#5fa4dd" opacity="0.75" />
      <circle cx="70" cy="70" r="38" fill="#9cc6ea" opacity="0.8" />
      <circle cx="105" cy="108" r="34" fill="#7fb8e6" opacity="0.8" />
      <circle cx="140" cy="95" r="26" fill="#bcdcf5" opacity="0.75" />
      <text x="100" y="72" textAnchor="middle" fill="#ffffff" fontSize="36" fontWeight="700" fontFamily="'Open Sans', Arial, sans-serif" letterSpacing="1">eproc</text>
    </svg>
  );
}

type Papel = 'aluno' | 'professor';

export default function LoginPage() {
  const { login, demoMode } = useAuth();
  const navigate = useNavigate();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const changeFont = (delta: number) => {
    const root = document.documentElement;
    const cur = parseFloat(getComputedStyle(root).fontSize) || 16;
    root.style.fontSize = `${Math.min(22, Math.max(12, cur + delta))}px`;
  };
  const toggleContrast = () => document.documentElement.classList.toggle('high-contrast');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!usuario || !senha) { setError('Preencha usuário e senha.'); return; }

    if (papel === 'aluno') {
      if (!turmaId) { setError('Selecione a matéria.'); return; }

      setLoading(true);

      // Try to authenticate first (existing user or hardcoded demo)
      const { error: loginError, user } = await login(usuario, senha);

      if (!loginError && user) {
        setLoading(false);
        navigate(user.perfil === 'professor' || user.perfil === 'admin' ? '/prof/dashboard' : '/dashboard');
        return;
      }

      // Not a known user — try to register
      if (!nome.trim()) {
        setLoading(false);
        setError('Informe seu nome completo para o primeiro acesso.');
        return;
      }

      const result = registrarAluno({ cpf: usuario, nome: nome.trim(), senha, turmaId });
      if (!result.ok) {
        setLoading(false);
        setError(result.erro || 'Erro ao registrar.');
        return;
      }

      // Now log in with the newly created account
      const { error: loginError2, user: user2 } = await login(usuario, senha);
      setLoading(false);
      if (loginError2) { setError(loginError2); return; }
      navigate(user2?.perfil === 'professor' || user2?.perfil === 'admin' ? '/prof/dashboard' : '/dashboard');
      return;
    }

    // Professor flow — direct login
    setLoading(true);
    const { error: loginError, user } = await login(usuario, senha);
    setLoading(false);
    if (loginError) { setError(loginError); return; }
    if (user?.perfil !== 'professor' && user?.perfil !== 'admin') {
      setError('Este CPF não pertence a um professor.');
      return;
    }
    navigate('/prof/dashboard');
  };

  const selectPapel = (p: Papel) => {
    setPapel(p);
    setError('');
    setUsuario('');
    setSenha('');
    setNome('');
    setTurmaId('');
    if (demoMode) {
      if (p === 'aluno') {
        setUsuario('121.572.976-69');
        setSenha('Milton@2025');
      } else {
        setUsuario('000.000.000-01');
        setSenha('Milton@2025');
      }
    }
  };

  const existingCadastro = usuario.replace(/\D/g, '').length === 11 ? cadastroPorCpf(usuario) : null;
  const isReturningStudent = existingCadastro != null || usuario === '121.572.976-69' || (demoMode && usuario === '121.572.976-69');

  return (
    <div className="min-h-screen flex flex-col">
      {demoMode && (
        <div className="demo-banner">
          MODO DEMONSTRAÇÃO — Aluno: 121.572.976-69 | Professor: 000.000.000-01 | Senha: Milton@2025
        </div>
      )}

      {/* Barra de acessibilidade */}
      <div className="tjmg-access-bar">
        <button>Ir para conteúdo</button>
        <button className="font-bold" title="Aumentar fonte" onClick={() => changeFont(1)}>A+</button>
        <button className="font-bold" title="Diminuir fonte" onClick={() => changeFont(-1)}>A-</button>
        <button title="Alto contraste" onClick={toggleContrast} className="flex items-center"><Contrast size={14} /></button>
        <button className="flex items-center gap-1" title="Libras"><Hand size={14} /> Libras</button>
        <button>Acessibilidade</button>
      </div>

      {/* Header teal */}
      <header className="tjmg-header">
        <span className="tjmg-header-title" style={{ marginLeft: 16 }}>Tribunal de Justiça do Estado de Minas Gerais</span>
      </header>

      {/* Conteúdo: card de login */}
      <main className="flex-1 overflow-y-auto flex justify-center items-start px-4 py-10" style={{ backgroundColor: 'hsl(var(--bg-page))' }}>
        <div className="bg-white border border-border w-full max-w-[520px] px-8 py-8 rounded" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex justify-center mb-6"><EprocLogo /></div>

          {/* Role selector */}
          {papel === null ? (
            <div>
              <div className="text-center text-[15px] text-foreground mb-5 font-semibold">
                Como deseja acessar o sistema?
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => selectPapel('aluno')}
                  className="flex-1 flex flex-col items-center gap-3 py-6 rounded border-2 transition-all hover:shadow-md"
                  style={{ borderColor: '#2c77ba', color: '#2c77ba', background: '#f0f7ff' }}
                >
                  <GraduationCap size={36} />
                  <span className="text-[15px] font-semibold">Entrar como Aluno</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectPapel('professor')}
                  className="flex-1 flex flex-col items-center gap-3 py-6 rounded border-2 transition-all hover:shadow-md"
                  style={{ borderColor: '#1e40af', color: '#1e40af', background: '#eef2ff' }}
                >
                  <BookOpen size={36} />
                  <span className="text-[15px] font-semibold">Entrar como Professor</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs showing selected role */}
              <div className="flex mb-5 border rounded overflow-hidden" style={{ borderColor: '#c7ccd1' }}>
                <button
                  type="button"
                  onClick={() => selectPapel('aluno')}
                  className="flex-1 py-2.5 text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    background: papel === 'aluno' ? '#2c77ba' : '#f9fafb',
                    color: papel === 'aluno' ? '#fff' : '#6b7280',
                  }}
                >
                  <GraduationCap size={16} />
                  Aluno
                </button>
                <button
                  type="button"
                  onClick={() => selectPapel('professor')}
                  className="flex-1 py-2.5 text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{
                    background: papel === 'professor' ? '#1e40af' : '#f9fafb',
                    color: papel === 'professor' ? '#fff' : '#6b7280',
                  }}
                >
                  <BookOpen size={16} />
                  Professor
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Matéria selector — only for students */}
                {papel === 'aluno' && (
                  <div>
                    <label className="block text-[14px] text-foreground mb-1 font-medium">Matéria</label>
                    <select
                      className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                      style={{ borderColor: '#c7ccd1' }}
                      value={turmaId}
                      onChange={e => setTurmaId(e.target.value)}
                    >
                      <option value="">-- Selecione a matéria --</option>
                      {demoTurmas.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[14px] text-foreground mb-1">
                    {papel === 'professor' ? 'CPF do Professor' : 'CPF do Aluno'}
                  </label>
                  <input
                    id="login-usuario"
                    type="text"
                    className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                    style={{ borderColor: '#c7ccd1' }}
                    value={usuario}
                    onChange={e => setUsuario(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-foreground mb-1">Senha</label>
                  <div className="flex">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      className="flex-1 border rounded-l px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                      style={{ borderColor: '#c7ccd1' }}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(s => !s)}
                      className="px-3 border border-l-0 rounded-r flex items-center"
                      style={{ borderColor: '#c7ccd1', background: '#eef1f4', color: '#555' }}
                      title={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Nome completo — only for new students (not returning) */}
                {papel === 'aluno' && !isReturningStudent && (
                  <div>
                    <label className="block text-[14px] text-foreground mb-1">
                      Nome Completo <span className="text-[12px] text-muted-foreground">(primeiro acesso)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                      style={{ borderColor: '#c7ccd1' }}
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                )}

                {error && <div className="alert-error">{error}</div>}

                <button
                  type="submit"
                  className="w-full text-white text-[15px] font-semibold py-2.5 rounded"
                  style={{ background: papel === 'professor' ? '#1e40af' : '#2c77ba' }}
                  disabled={loading}
                >
                  {loading ? 'Aguarde...' : 'Entrar'}
                </button>
              </form>

              {papel === 'aluno' && (
                <div className="mt-4 p-3 rounded text-[12px]" style={{ background: '#f0f7ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                  <strong>Primeiro acesso?</strong> Preencha todos os campos, incluindo seu nome completo.
                  Sua solicitação será enviada ao professor da matéria para aprovação.
                </div>
              )}

              <div className="flex items-center justify-between mt-5 mb-2">
                <span className="text-[14px] text-muted-foreground">Outras opções de acesso</span>
                <HelpCircle size={17} className="text-sky-600" />
              </div>

              <button
                type="button"
                className="w-full border rounded py-2.5 text-[14px] font-semibold"
                style={{ borderColor: '#c7ccd1', color: '#2c77ba' }}
                onClick={() => setError('Certificado Digital não disponível neste simulador educacional.')}
              >
                Certificado Digital
              </button>

              <div className="flex flex-col items-end gap-1 mt-3">
                <button type="button" className="text-[13px] text-sky-600 hover:underline">Esqueci minha senha</button>
                <button type="button" className="text-[13px] text-sky-600 hover:underline">Autenticação em dois fatores</button>
              </div>
            </>
          )}

          <div className="text-right text-[11px] text-muted-foreground italic mt-6">
            Simulador Educacional — Versão 2.8.1
          </div>
        </div>
      </main>

      <footer className="edu-footer py-2">
        Simulador Educacional e-Proc — Não possui vínculo com a Justiça Federal, TRF1 ou TJMG · Faculdade Milton Campos / Grupo Anima Educação
      </footer>
    </div>
  );
}
