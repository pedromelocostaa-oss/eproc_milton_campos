import { useNavigate } from 'react-router-dom';
import EprocLayout from '@/components/layout/EprocLayout';

export default function TutoriaisPage() {
  const navigate = useNavigate();
  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Tutoriais</span>
        </div>
        <div className="bg-white border border-border">
          <div className="panel-header">TUTORIAIS</div>
          <div className="p-6 text-center text-muted-foreground text-[12px]">
            Conteúdo em desenvolvimento.
          </div>
        </div>
      </div>
    </EprocLayout>
  );
}
