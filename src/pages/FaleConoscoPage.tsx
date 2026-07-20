import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';
import { formatPhone } from '@/lib/masks';

const ASSUNTOS = [
  'Dúvida sobre peticionamento',
  'Problema técnico / erro no sistema',
  'Consulta processual',
  'Cadastro e acesso',
  'Sugestão',
  'Outros',
];

export default function FaleConoscoPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviado, setEnviado] = useState(false);

  const enviar = () => {
    if (!nome || !email || !assunto || !mensagem) return;
    setEnviado(true);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Fale Conosco</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Mail size={28} style={{ color: '#2c77ba' }} />
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Fale Conosco</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Formulário */}
          <div className="lg:col-span-2 bg-white border border-border">
            <div className="panel-header">ENVIE SUA MENSAGEM</div>
            {enviado ? (
              <div className="p-6">
                <div className="alert-success text-[13px]">
                  ✅ Mensagem enviada com sucesso! Nossa equipe responderá no e-mail informado.
                  <div className="text-[11px] mt-1 text-muted-foreground">
                    (Simulação — nenhuma mensagem real é enviada neste ambiente educacional.)
                  </div>
                </div>
                <button className="tjmg-btn-link mt-4" onClick={() => { setEnviado(false); setNome(''); setEmail(''); setTelefone(''); setAssunto(''); setMensagem(''); }}>
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div>
                  <label className="form-label">Nome completo: *</label>
                  <input type="text" className="form-field" value={nome} onChange={e => setNome(e.target.value)} />
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
                <div>
                  <label className="form-label">Assunto: *</label>
                  <select className="form-field" value={assunto} onChange={e => setAssunto(e.target.value)}>
                    <option value="">Selecione...</option>
                    {ASSUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Mensagem: *</label>
                  <textarea className="form-field min-h-[120px] resize-y" value={mensagem} onChange={e => setMensagem(e.target.value)} />
                </div>
                <button className="tjmg-btn-primary" onClick={enviar}>Enviar mensagem</button>
              </div>
            )}
          </div>

          {/* Contatos */}
          <div className="bg-white border border-border">
            <div className="panel-header">ATENDIMENTO</div>
            <div className="p-4 space-y-4 text-[12px]">
              <div className="flex items-start gap-2">
                <Phone size={16} className="shrink-0 mt-0.5" style={{ color: '#2c77ba' }} />
                <div>
                  <div className="font-bold text-foreground">Central de Atendimento</div>
                  <div className="text-muted-foreground">(31) 3237-6000</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="shrink-0 mt-0.5" style={{ color: '#2c77ba' }} />
                <div>
                  <div className="font-bold text-foreground">E-mail</div>
                  <div className="text-muted-foreground">atendimento@tjmg.jus.br</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: '#2c77ba' }} />
                <div>
                  <div className="font-bold text-foreground">Endereço</div>
                  <div className="text-muted-foreground">Av. Afonso Pena, 4001 — Serra, Belo Horizonte/MG</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={16} className="shrink-0 mt-0.5" style={{ color: '#2c77ba' }} />
                <div>
                  <div className="font-bold text-foreground">Horário</div>
                  <div className="text-muted-foreground">Segunda a sexta, das 8h às 18h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EprocLayout>
  );
}
