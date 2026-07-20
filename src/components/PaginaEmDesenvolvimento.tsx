import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

interface Props {
  titulo: string;
}

/**
 * Página placeholder para itens do menu que ainda não têm conteúdo.
 * Renderiza um estado visualmente "apagado" sinalizando que não está ativa.
 */
export default function PaginaEmDesenvolvimento({ titulo }: Props) {
  const navigate = useNavigate();
  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>{titulo}</span>
        </div>

        {/* Cabeçalho com selo de inatividade */}
        <div className="flex items-center gap-3 mb-4 opacity-60">
          <h1 className="text-[22px] font-bold" style={{ color: '#333' }}>{titulo}</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 border border-amber-300">
            Em desenvolvimento
          </span>
        </div>

        {/* Card apagado */}
        <div className="bg-white border border-dashed border-border opacity-60 select-none">
          <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
            <Construction size={40} className="text-muted-foreground" />
            <div className="text-[15px] font-semibold text-muted-foreground">
              Esta página ainda não está ativa
            </div>
            <div className="text-[12px] text-muted-foreground max-w-md">
              O conteúdo de <strong>{titulo}</strong> está em desenvolvimento e será
              disponibilizado em breve neste simulador educacional.
            </div>
          </div>
        </div>
      </div>
    </EprocLayout>
  );
}
