import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, FileCheck2 } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

interface Documento {
  chave: string;
  tipo: string;
  processo: string;
  dataJuntada: string;
  autor: string;
}

const DOCUMENTOS: Record<string, Documento> = {
  '8A2F91C7D3': {
    chave: '8A2F91C7D3',
    tipo: 'Petição Inicial',
    processo: '1085367-89.2025.8.13.0024',
    dataJuntada: '12/06/2025 14:32',
    autor: 'Giovanna Novais Torres',
  },
};

export default function ConsultaDocumentoChavePage() {
  const navigate = useNavigate();
  const [chave, setChave] = useState('');
  const [resultado, setResultado] = useState<Documento | null>(null);
  const [erro, setErro] = useState('');

  const consultar = () => {
    setErro('');
    setResultado(null);
    const c = chave.trim().toUpperCase();
    if (!c) { setErro('Informe a chave do documento.'); return; }
    const doc = DOCUMENTOS[c];
    if (doc) setResultado(doc);
    else setErro(`Nenhum documento encontrado para a chave "${chave}".`);
  };

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <KeyRound size={26} style={{ color: '#2c77ba' }} />
            <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Consulta de Documento por Chave</h1>
          </div>
          <div className="flex gap-2">
            <button className="tjmg-btn-primary" onClick={consultar}>Consultar</button>
            <button className="tjmg-btn-link" onClick={() => navigate('/dashboard')}>Voltar</button>
          </div>
        </div>

        <div className="bg-white border border-border p-5">
          <div className="text-[14px] font-bold mb-3">Informe a chave de acesso ao documento</div>
          <p className="text-[12px] text-muted-foreground mb-3">
            A chave é um código gerado pelo sistema que permite validar e visualizar um documento
            do processo eletrônico sem necessidade de login.
          </p>
          <label className="form-label">Chave do Documento:</label>
          <input
            type="text"
            className="form-field max-w-md font-mono"
            value={chave}
            onChange={e => setChave(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && consultar()}
            placeholder="Ex.: 8A2F91C7D3"
          />
          <div className="text-[11px] text-muted-foreground mt-2">Dica (simulação): experimente a chave <strong>8A2F91C7D3</strong>.</div>
        </div>

        {erro && <div className="alert-error mt-4">{erro}</div>}

        {resultado && (
          <div className="bg-white border border-border mt-4">
            <div className="panel-header flex items-center gap-2">
              <FileCheck2 size={14} /> DOCUMENTO LOCALIZADO
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label="Chave" value={resultado.chave} mono />
              <Info label="Tipo de Documento" value={resultado.tipo} />
              <Info label="Processo" value={resultado.processo} mono />
              <Info label="Data de Juntada" value={resultado.dataJuntada} />
              <Info label="Signatário" value={resultado.autor} />
            </div>
            <div className="px-4 pb-4">
              <button className="tjmg-btn-primary">Visualizar documento (PDF)</button>
            </div>
          </div>
        )}
      </div>
    </EprocLayout>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase">{label}</div>
      <div className={`text-[13px] ${mono ? 'font-mono font-semibold' : ''}`}>{value}</div>
    </div>
  );
}
