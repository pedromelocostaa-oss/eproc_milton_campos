import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, GraduationCap } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

interface Tutorial {
  titulo: string;
  descricao: string;
  tipo: 'Vídeo' | 'Manual (PDF)';
  duracao: string;
}

const TUTORIAIS: Tutorial[] = [
  { titulo: 'Primeiro acesso ao sistema', descricao: 'Como fazer login com CPF e trocar a senha no primeiro acesso.', tipo: 'Vídeo', duracao: '4 min' },
  { titulo: 'Peticionamento inicial', descricao: 'Passo a passo para protocolar uma petição inicial (nova ação).', tipo: 'Vídeo', duracao: '9 min' },
  { titulo: 'Cadastro de partes e assuntos', descricao: 'Como preencher partes, classe processual e assuntos corretamente.', tipo: 'Vídeo', duracao: '7 min' },
  { titulo: 'Consulta processual', descricao: 'Como pesquisar processos por número, parte, CPF ou OAB.', tipo: 'Manual (PDF)', duracao: '12 páginas' },
  { titulo: 'Intimações e prazos', descricao: 'Como acompanhar intimações e registrar ciência.', tipo: 'Vídeo', duracao: '6 min' },
  { titulo: 'Petições incidentais', descricao: 'Como protocolar contestação, recursos e demais petições.', tipo: 'Manual (PDF)', duracao: '18 páginas' },
];

export default function TutoriaisPage() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<'todos' | 'Vídeo' | 'Manual (PDF)'>('todos');

  const lista = TUTORIAIS.filter(t => filtro === 'todos' || t.tipo === filtro);

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Tutoriais</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <GraduationCap size={28} style={{ color: '#2c77ba' }} />
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Tutoriais</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(['todos', 'Vídeo', 'Manual (PDF)'] as const).map(f => (
            <button
              key={f}
              className={`text-[12px] px-3 py-1.5 border rounded ${filtro === f ? 'tjmg-btn-primary' : 'tjmg-btn-link'}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todos' ? 'Todos' : f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map(t => {
            const isVideo = t.tipo === 'Vídeo';
            const Icon = isVideo ? PlayCircle : FileText;
            return (
              <div key={t.titulo} className="bg-white border border-border flex flex-col">
                <div className="flex items-center justify-center h-28 bg-muted/40 border-b border-border">
                  <Icon size={40} style={{ color: '#2c77ba' }} />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-[13px] font-bold text-foreground">{t.titulo}</div>
                  <div className="text-[12px] text-muted-foreground mt-1 flex-1">{t.descricao}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {t.tipo} · {t.duracao}
                    </span>
                    <button className="text-[12px] font-semibold text-sky-700 hover:underline">
                      {isVideo ? 'Assistir' : 'Baixar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </EprocLayout>
  );
}
