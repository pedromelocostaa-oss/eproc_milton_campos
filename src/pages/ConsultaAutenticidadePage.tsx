import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldX } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

const VALIDOS = ['TJMG2025-4A7C-9F2B', 'A1B2C3D4E5F6A7B8C9D0'];

export default function ConsultaAutenticidadePage() {
  const navigate = useNavigate();
  const { modo } = useParams<{ modo?: string }>();
  const [aba, setAba] = useState<'codigo' | 'hash'>(modo === 'hash' ? 'hash' : 'codigo');
  const [valor, setValor] = useState('');
  const [resultado, setResultado] = useState<'autentico' | 'invalido' | null>(null);

  const consultar = () => {
    const v = valor.trim().toUpperCase();
    if (!v) { setResultado(null); return; }
    setResultado(VALIDOS.includes(v) ? 'autentico' : 'invalido');
  };

  const trocarAba = (a: 'codigo' | 'hash') => {
    setAba(a);
    setValor('');
    setResultado(null);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={26} style={{ color: '#2c77ba' }} />
            <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Consulta de Autenticidade</h1>
          </div>
          <div className="flex gap-2">
            <button className="tjmg-btn-primary" onClick={consultar}>Consultar</button>
            <button className="tjmg-btn-link" onClick={() => navigate('/dashboard')}>Voltar</button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-border mb-0">
          <button
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 ${aba === 'codigo' ? 'border-sky-600 text-sky-700' : 'border-transparent text-muted-foreground'}`}
            onClick={() => trocarAba('codigo')}
          >
            Por Código de Verificação
          </button>
          <button
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 ${aba === 'hash' ? 'border-sky-600 text-sky-700' : 'border-transparent text-muted-foreground'}`}
            onClick={() => trocarAba('hash')}
          >
            Por Hash do Documento
          </button>
        </div>

        <div className="bg-white border border-border border-t-0 p-5">
          <p className="text-[12px] text-muted-foreground mb-3">
            {aba === 'codigo'
              ? 'Informe o código de verificação impresso no rodapé do documento para confirmar sua autenticidade.'
              : 'Informe o hash (resumo criptográfico) do documento para verificar a integridade e autenticidade.'}
          </p>
          <label className="form-label">
            {aba === 'codigo' ? 'Código de Verificação:' : 'Hash do Documento:'}
          </label>
          <input
            type="text"
            className="form-field max-w-lg font-mono"
            value={valor}
            onChange={e => setValor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && consultar()}
            placeholder={aba === 'codigo' ? 'Ex.: TJMG2025-4A7C-9F2B' : 'Ex.: A1B2C3D4E5F6A7B8C9D0'}
          />
          <div className="text-[11px] text-muted-foreground mt-2">
            Dica (simulação): {aba === 'codigo' ? <strong>TJMG2025-4A7C-9F2B</strong> : <strong>A1B2C3D4E5F6A7B8C9D0</strong>}.
          </div>
        </div>

        {resultado === 'autentico' && (
          <div className="bg-white border border-green-300 mt-4">
            <div className="flex items-center gap-3 p-4 bg-green-50">
              <ShieldCheck size={28} className="text-green-600 shrink-0" />
              <div>
                <div className="text-[14px] font-bold text-green-800">Documento autêntico</div>
                <div className="text-[12px] text-green-700">
                  O documento foi emitido pelo sistema e-Proc e não sofreu alterações.
                </div>
              </div>
            </div>
          </div>
        )}

        {resultado === 'invalido' && (
          <div className="bg-white border border-red-300 mt-4">
            <div className="flex items-center gap-3 p-4 bg-red-50">
              <ShieldX size={28} className="text-red-600 shrink-0" />
              <div>
                <div className="text-[14px] font-bold text-red-800">Não foi possível validar</div>
                <div className="text-[12px] text-red-700">
                  O {aba === 'codigo' ? 'código' : 'hash'} informado não corresponde a nenhum documento emitido.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EprocLayout>
  );
}
