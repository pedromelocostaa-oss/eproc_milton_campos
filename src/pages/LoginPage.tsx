import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { formatCpf } from '@/lib/masks';
import { Eye, EyeOff, HelpCircle, Contrast, Hand, GraduationCap, BookOpen, CheckCircle, Menu, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { demoTurmas } from '@/data/demoStore';
import { registrarAluno, cadastroPorCpf, autenticarCadastro, isProfessorCpf } from '@/data/cadastroStore';

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

function SidebarItem({ label, sub, disabled, active }: { label: string; sub?: boolean; disabled?: boolean; active?: boolean }) {
  return (
    <div
      style={{
        padding: sub ? '7px 12px 7px 28px' : '9px 12px',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? '#78909c' : active ? '#fff' : '#cfd8dc',
        background: active ? '#455a64' : 'transparent',
        borderLeft: active ? '3px solid #4fc3f7' : '3px solid transparent',
        fontSize: sub ? 12 : 13,
        transition: 'background .15s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#455a64'; }}
      onMouseLeave={e => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {label}
    </div>
  );
}

function SidebarGroup({ label, expanded, onToggle, disabled, children }: {
  label: string; expanded: boolean; onToggle: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onToggle}
        style={{
          padding: '9px 12px', cursor: 'pointer',
          color: disabled ? '#78909c' : '#cfd8dc',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'background .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#455a64'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span style={{ fontSize: 13 }}>{label}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {expanded && children}
    </>
  );
}

type Papel = 'aluno' | 'professor';

export default function LoginPage() {
  const { login, loginComoAluno, demoMode } = useAuth();
  const navigate = useNavigate();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registroEnviado, setRegistroEnviado] = useState(false);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandCadastro, setExpandCadastro] = useState(false);
  const [expandAutenticidade, setExpandAutenticidade] = useState(false);
  const [esqueciSenhaOpen, setEsqueciSenhaOpen] = useState(false);
  const [esqueciCpf, setEsqueciCpf] = useState('');
  const [esqueciResult, setEsqueciResult] = useState<string | null>(null);

  const changeFont = (delta: number) => {
    const root = document.documentElement;
    const cur = parseFloat(getComputedStyle(root).fontSize) || 16;
    root.style.fontSize = `${Math.min(22, Math.max(12, cur + delta))}px`;
  };
  const toggleContrast = () => document.documentElement.classList.toggle('high-contrast');

  const handleEsqueciSenha = () => {
    setEsqueciResult(null);
    if (!esqueciCpf || esqueciCpf.replace(/\D/g, '').length !== 11) {
      setEsqueciResult('Informe um CPF válido (11 dígitos).');
      return;
    }
    const cad = cadastroPorCpf(esqueciCpf);
    if (cad) {
      setEsqueciResult(`Senha encontrada! Sua senha é: ${cad.senha}`);
      return;
    }
    const cpfFmt = formatCpf(esqueciCpf.replace(/\D/g, ''));
    if (cpfFmt === '121.572.976-69') {
      setEsqueciResult('Senha encontrada! Sua senha é: Milton@2025');
      return;
    }
    setEsqueciResult('CPF não encontrado no sistema. Verifique ou faça um novo cadastro.');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!usuario || !senha) { setError('Preencha usuário e senha.'); return; }

    if (papel === 'aluno') {
      setLoading(true);

      if (!primeiroAcesso) {
        // Returning student login — only CPF and senha required
        const cadExistente = cadastroPorCpf(usuario);
        if (cadExistente && cadExistente.status === 'aprovado') {
          const cadAuth = autenticarCadastro(usuario, senha);
          if (cadAuth) {
            const { error: loginError, user } = await loginComoAluno(usuario, senha);
            setLoading(false);
            if (!loginError && user) { navigate('/dashboard'); return; }
            setError('Erro ao autenticar.');
            return;
          }
          setLoading(false);
          setError('CPF ou senha inválidos.');
          return;
        }
        if (cadExistente) {
          setLoading(false);
          setError('CPF ou senha inválidos.');
          return;
        }

        // Try hardcoded demo users (Luiz Cordeiro + professors entering as student)
        const { error: loginError, user } = await loginComoAluno(usuario, senha);
        if (!loginError && user) {
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        setLoading(false);
        setError('CPF não encontrado. Se é seu primeiro acesso, clique em "Meu primeiro acesso" abaixo.');
        return;
      }

      // First access — registration flow
      if (!turmaId) { setLoading(false); setError('Selecione a matéria.'); return; }
      if (!nome.trim()) { setLoading(false); setError('Informe seu nome completo.'); return; }
      if (!email.trim()) { setLoading(false); setError('Informe seu e-mail.'); return; }

      const result = registrarAluno({ cpf: usuario, nome: nome.trim(), email: email.trim(), endereco: endereco.trim(), telefone: telefone.trim(), senha, turmaId });
      if (!result.ok) { setLoading(false); setError(result.erro || 'Erro ao registrar.'); return; }

      const { error: loginError, user } = await loginComoAluno(usuario, senha);
      setLoading(false);
      if (!loginError && user) { navigate('/dashboard'); return; }
      setError('Cadastro realizado. Faça login com seu CPF e senha.');
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
    setEmail('');
    setEndereco('');
    setTelefone('');
    setTurmaId('');
    setPrimeiroAcesso(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
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
      <header className="tjmg-header" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <button
          type="button"
          onClick={() => setSidebarOpen(s => !s)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center' }}
          title="Menu"
        >
          <Menu size={22} />
        </button>
        <span className="tjmg-header-title">Tribunal de Justiça do Estado de Minas Gerais</span>
      </header>

      {/* Layout com sidebar + conteúdo */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <nav style={{
            width: 240, minWidth: 240, background: '#37474f', color: '#cfd8dc',
            overflowY: 'auto', fontSize: 13, display: 'flex', flexDirection: 'column',
          }}>
            {/* Pesquisar no menu */}
            <div style={{ padding: '10px 12px 6px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Pesquisar no Menu (Alt + m)"
                  style={{
                    width: '100%', padding: '6px 8px', fontSize: 12,
                    background: '#455a64', border: '1px solid #546e7a', borderRadius: 3,
                    color: '#cfd8dc', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Menu items */}
            <SidebarItem label="Acessibilidade" />
            <SidebarItem label="Entrar no Sistema" active />

            {/* Cadastre-se AQUI! */}
            <SidebarGroup label="Cadastre-se AQUI!" expanded={expandCadastro} onToggle={() => setExpandCadastro(e => !e)}>
              <SidebarItem label="Cadastrar Advogado" sub />
              <SidebarItem label="Cadastrar Jus Postulandi" sub disabled />
              <SidebarItem label="Cadastrar Representante Legal de PJ" sub disabled />
            </SidebarGroup>

            {/* Consulta Autenticidade */}
            <SidebarGroup label="Consulta Autenticidade" expanded={expandAutenticidade} onToggle={() => setExpandAutenticidade(e => !e)} disabled>
              <SidebarItem label="Certidão Narratória" sub disabled />
              <SidebarItem label="Certidão de Execução" sub disabled />
              <SidebarItem label="Documentos" sub disabled />
            </SidebarGroup>

            <SidebarItem label="Consulta Guia de Custas" disabled />
            <SidebarItem label="Audiências" disabled />
            <SidebarItem label="Consulta Pública de Processos" disabled />
            <SidebarItem label="Consulta de Documento por Chave" disabled />
            <SidebarItem label="Fale Conosco" disabled />
            <SidebarItem label="Fórum de Conciliação" disabled />
            <SidebarItem label="Legislação" disabled />
            <SidebarItem label="Precedentes Qualificados" disabled />
            <SidebarItem label="Sessões de Julgamento" disabled />
            <SidebarItem label="Tutoriais" disabled />

            <div style={{ padding: '12px', fontSize: 10, color: '#78909c', borderTop: '1px solid #455a64', marginTop: 'auto' }}>
              Simulador Educacional<br />Não possui vínculo com o TJMG
            </div>
          </nav>
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto flex justify-center items-start px-4 py-10" style={{ backgroundColor: 'hsl(var(--bg-page))' }}>
        <div className="bg-white border border-border w-full max-w-[520px] px-8 py-8 rounded" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex justify-center mb-6"><EprocLogo /></div>

          {/* Mensagem de registro enviado */}
          {registroEnviado ? (
            <div className="text-center py-4">
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={40} style={{ color: '#16a34a' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>
                Solicitação enviada com sucesso!
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 6 }}>
                Olá, <strong>{nome}</strong>! Seu pedido de acesso à matéria foi enviado ao professor responsável.
              </p>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                Assim que o professor aprovar seu cadastro, você poderá acessar o sistema com seu CPF e senha.
              </p>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 16px', fontSize: 13, color: '#92400e', marginBottom: 20 }}>
                <strong>Guarde seus dados de acesso:</strong><br />
                CPF: {usuario}<br />
                Senha: (a que você acabou de criar)
              </div>
              <button
                type="button"
                onClick={() => { setRegistroEnviado(false); setPapel(null); setUsuario(''); setSenha(''); setNome(''); setEmail(''); setEndereco(''); setTelefone(''); setTurmaId(''); }}
                style={{ background: '#2c77ba', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Voltar ao login
              </button>
            </div>
          ) : papel === null ? (
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

                {/* Campos de primeiro acesso — expandidos ao clicar "Meu primeiro acesso" */}
                {papel === 'aluno' && primeiroAcesso && (
                  <>
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
                    <div>
                      <label className="block text-[14px] text-foreground mb-1">
                        Nome Completo
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
                    <div>
                      <label className="block text-[14px] text-foreground mb-1">E-mail</label>
                      <input
                        type="email"
                        className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                        style={{ borderColor: '#c7ccd1' }}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] text-foreground mb-1">Endereço</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                        style={{ borderColor: '#c7ccd1' }}
                        value={endereco}
                        onChange={e => setEndereco(e.target.value)}
                        placeholder="Rua, número, bairro, cidade/UF"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] text-foreground mb-1">Telefone</label>
                      <input
                        type="tel"
                        className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500"
                        style={{ borderColor: '#c7ccd1' }}
                        value={telefone}
                        onChange={e => setTelefone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </>
                )}

                {error && <div className="alert-error">{error}</div>}

                <button
                  type="submit"
                  className="w-full text-white text-[15px] font-semibold py-2.5 rounded"
                  style={{ background: papel === 'professor' ? '#1e40af' : '#2c77ba' }}
                  disabled={loading}
                >
                  {loading ? 'Aguarde...' : primeiroAcesso ? 'Cadastrar e Enviar' : 'Entrar'}
                </button>
              </form>

              {papel === 'aluno' && (
                <button
                  type="button"
                  onClick={() => { setPrimeiroAcesso(p => !p); setError(''); }}
                  className="w-full mt-3 py-2.5 text-[14px] font-semibold rounded border transition-colors"
                  style={{
                    borderColor: primeiroAcesso ? '#dc2626' : '#2c77ba',
                    color: primeiroAcesso ? '#dc2626' : '#2c77ba',
                    background: primeiroAcesso ? '#fef2f2' : '#f0f7ff',
                  }}
                >
                  {primeiroAcesso ? 'Voltar ao login' : 'Meu primeiro acesso'}
                </button>
              )}

              <div className="flex items-center justify-between mt-5 mb-2">
                <span className="text-[14px] text-muted-foreground">Outras opções de acesso</span>
                <HelpCircle size={17} className="text-sky-600" />
              </div>

              <button
                type="button"
                className="w-full border rounded py-2.5 text-[14px] font-semibold"
                style={{ borderColor: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed', background: '#f9fafb' }}
                disabled
              >
                Certificado Digital
              </button>

              <div className="flex flex-col items-end gap-1 mt-3">
                <button type="button" className="text-[13px] text-sky-600 hover:underline" onClick={() => { setEsqueciSenhaOpen(true); setEsqueciCpf(usuario); setEsqueciResult(null); }}>Esqueci minha senha</button>
                <button type="button" className="text-[13px] text-sky-600 hover:underline">Autenticação em dois fatores</button>
              </div>
            </>
          )}

          <div className="text-right text-[11px] text-muted-foreground italic mt-6">
            Simulador Educacional — Versão 2.8.1
          </div>
        </div>
      </main>
      </div>

      <footer className="edu-footer py-2">
        Simulador Educacional e-Proc — Não possui vínculo com a Justiça Federal, TRF1 ou TJMG · Faculdade Milton Campos / Grupo Anima Educação
      </footer>

      {/* Modal Esqueci minha senha */}
      {esqueciSenhaOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEsqueciSenhaOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 28, width: 400, maxWidth: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>Recuperar Senha</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Informe seu CPF para consultar sua senha cadastrada.
              <br /><em style={{ fontSize: 11 }}>(Simulador educacional — em produção, o envio seria por e-mail)</em>
            </div>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-[14px] outline-none focus:border-sky-500 mb-3"
              style={{ borderColor: '#c7ccd1' }}
              value={esqueciCpf}
              onChange={e => setEsqueciCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {esqueciResult && (
              <div style={{
                padding: '10px 12px', borderRadius: 4, fontSize: 13, marginBottom: 12,
                background: esqueciResult.startsWith('Senha encontrada') ? '#dcfce7' : '#fee2e2',
                color: esqueciResult.startsWith('Senha encontrada') ? '#166534' : '#991b1b',
              }}>
                {esqueciResult}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEsqueciSenhaOpen(false)}
                className="px-4 py-2 text-[13px] border rounded"
                style={{ borderColor: '#d1d5db', color: '#6b7280' }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleEsqueciSenha}
                className="px-4 py-2 text-[13px] rounded font-semibold"
                style={{ background: '#1e40af', color: '#fff' }}
              >
                Consultar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
