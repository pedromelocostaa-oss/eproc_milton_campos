import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, MapPin } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

interface Cejusc {
  comarca: string;
  endereco: string;
  telefone: string;
}

const CEJUSCS: Cejusc[] = [
  { comarca: 'Belo Horizonte', endereco: 'Av. Raja Gabaglia, 1753 — Luxemburgo', telefone: '(31) 3330-0000' },
  { comarca: 'Contagem', endereco: 'Rua João Camilo de Oliveira, 100 — Centro', telefone: '(31) 3352-0000' },
  { comarca: 'Juiz de Fora', endereco: 'Av. Barão do Rio Branco, 2500 — Centro', telefone: '(32) 3690-0000' },
  { comarca: 'Uberlândia', endereco: 'Av. Rondon Pacheco, 4600 — Tibery', telefone: '(34) 3239-0000' },
  { comarca: 'Montes Claros', endereco: 'Av. Cula Mangabeira, 400 — Centro', telefone: '(38) 3229-0000' },
];

export default function ForumConciliacaoPage() {
  const navigate = useNavigate();
  const [comarca, setComarca] = useState('');

  const lista = CEJUSCS.filter(c => c.comarca.toLowerCase().includes(comarca.toLowerCase()));

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Fórum de Conciliação</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Handshake size={28} style={{ color: '#2c77ba' }} />
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Fórum de Conciliação</h1>
        </div>

        <div className="bg-white border border-border p-5 mb-4">
          <p className="text-[13px] text-foreground leading-relaxed">
            A conciliação é um método consensual de solução de conflitos em que um conciliador
            auxilia as partes a chegarem a um acordo. No âmbito do TJMG, esse trabalho é realizado
            pelos <strong>CEJUSCs</strong> — Centros Judiciários de Solução de Conflitos e Cidadania.
            A busca por acordo pode ocorrer antes ou durante o processo judicial.
          </p>
        </div>

        <div className="bg-white border border-border">
          <div className="panel-header">CEJUSCs — CENTROS DE CONCILIAÇÃO</div>
          <div className="p-4 border-b border-border">
            <label className="form-label">Filtrar por comarca:</label>
            <input
              type="text"
              className="form-field max-w-md"
              placeholder="Digite o nome da comarca..."
              value={comarca}
              onChange={e => setComarca(e.target.value)}
            />
          </div>
          <div className="divide-y divide-border">
            {lista.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-[12px]">
                Nenhum CEJUSC encontrado para "<strong>{comarca}</strong>".
              </div>
            ) : (
              lista.map(c => (
                <div key={c.comarca} className="flex items-start gap-3 px-4 py-3">
                  <MapPin size={18} className="shrink-0 mt-0.5" style={{ color: '#2c77ba' }} />
                  <div>
                    <div className="text-[13px] font-bold text-foreground">CEJUSC {c.comarca}</div>
                    <div className="text-[12px] text-muted-foreground">{c.endereco}</div>
                    <div className="text-[12px] text-muted-foreground">Telefone: {c.telefone}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </EprocLayout>
  );
}
