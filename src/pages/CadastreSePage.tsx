import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scale, User, Building2, ChevronRight } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import { formatCpf, formatCnpj, formatPhone } from '@/lib/masks';

type Tipo = 'advogado' | 'pessoa-fisica' | 'pessoa-juridica';

const TIPOS: { id: Tipo; icon: typeof User; titulo: string; desc: string }[] = [
  { id: 'advogado', icon: Scale, titulo: 'Advogado / Procurador', desc: 'Inscrito na OAB, para atuar em nome de partes.' },
  { id: 'pessoa-fisica', icon: User, titulo: 'Pessoa Física sem OAB', desc: 'Cidadão que atua em causa própria (jus postulandi).' },
  { id: 'pessoa-juridica', icon: Building2, titulo: 'Pessoa Jurídica / Ente Governamental', desc: 'Empresas, órgãos públicos e entes governamentais.' },
];

export default function CadastreSePage() {
  const navigate = useNavigate();
  const { tipo } = useParams<{ tipo?: string }>();
  const tipoAtual = TIPOS.find(t => t.id === tipo);

  // Se nenhum tipo selecionado → tela de escolha
  if (!tipoAtual) {
    return (
      <EprocLayout>
        <div className="p-4">
          <div className="breadcrumb mb-4">
            <button onClick={() => navigate('/dashboard')}>Início</button>
            <span>›</span>
            <span>Cadastre-se</span>
          </div>
          <h1 className="text-[26px] font-bold mb-1" style={{ color: '#333' }}>Cadastre-se</h1>
          <p className="text-[13px] text-muted-foreground mb-5">Selecione o tipo de cadastro que deseja realizar.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIPOS.map(t => (
              <button
                key={t.id}
                className="bg-white border border-border p-5 text-left hover:border-sky-500 hover:shadow transition-all flex flex-col gap-3"
                onClick={() => navigate(`/cadastre-se/${t.id}`)}
              >
                <t.icon size={32} style={{ color: '#2c77ba' }} />
                <div className="text-[15px] font-bold text-foreground">{t.titulo}</div>
                <div className="text-[12px] text-muted-foreground flex-1">{t.desc}</div>
                <div className="text-[12px] font-semibold text-sky-700 flex items-center gap-1">
                  Cadastrar <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </EprocLayout>
    );
  }

  return <FormularioCadastro tipo={tipoAtual.id} titulo={tipoAtual.titulo} />;
}

function FormularioCadastro({ tipo, titulo }: { tipo: Tipo; titulo: string }) {
  const navigate = useNavigate();
  const isPJ = tipo === 'pessoa-juridica';
  const isAdv = tipo === 'advogado';

  const [nome, setNome] = useState('');
  const [doc, setDoc] = useState('');
  const [oab, setOab] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enviado, setEnviado] = useState(false);

  const enviar = () => {
    if (!nome || !doc || !email) return;
    setEnviado(true);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <button onClick={() => navigate('/cadastre-se')}>Cadastre-se</button>
          <span>›</span>
          <span>{titulo}</span>
        </div>

        <h1 className="text-[26px] font-bold mb-4" style={{ color: '#333' }}>Cadastro — {titulo}</h1>

        <div className="bg-white border border-border max-w-2xl">
          <div className="panel-header">DADOS DO SOLICITANTE</div>
          {enviado ? (
            <div className="p-6">
              <div className="alert-success text-[13px]">
                ✅ Solicitação de cadastro enviada! Você receberá as instruções de acesso no e-mail informado.
                <div className="text-[11px] mt-1 text-muted-foreground">
                  (Simulação — nenhum cadastro real é criado neste ambiente educacional.)
                </div>
              </div>
              <button className="tjmg-btn-link mt-4" onClick={() => navigate('/cadastre-se')}>Voltar aos tipos de cadastro</button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div>
                <label className="form-label">{isPJ ? 'Razão Social: *' : 'Nome completo: *'}</label>
                <input type="text" className="form-field" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">{isPJ ? 'CNPJ: *' : 'CPF: *'}</label>
                  <input
                    type="text"
                    className="form-field"
                    value={doc}
                    onChange={e => setDoc(isPJ ? formatCnpj(e.target.value) : formatCpf(e.target.value))}
                  />
                </div>
                {isAdv && (
                  <div>
                    <label className="form-label">Nº OAB/MG: *</label>
                    <input type="text" className="form-field" value={oab} onChange={e => setOab(e.target.value)} placeholder="MG 000.000" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">E-mail: *</label>
                  <input type="email" className="form-field" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Telefone:</label>
                  <input type="text" className="form-field" value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button className="tjmg-btn-primary" onClick={enviar}>Solicitar cadastro</button>
                <button className="tjmg-btn-link" onClick={() => navigate('/cadastre-se')}>Voltar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </EprocLayout>
  );
}
