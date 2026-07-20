import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, BookOpen } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

interface Norma {
  categoria: string;
  titulo: string;
  descricao: string;
  url: string;
}

const NORMAS: Norma[] = [
  { categoria: 'Constituição', titulo: 'Constituição Federal de 1988', descricao: 'Texto constitucional vigente.', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
  { categoria: 'Constituição', titulo: 'Constituição do Estado de Minas Gerais', descricao: 'Constituição Estadual de 1989.', url: 'https://www.almg.gov.br/legislacao-mineira/CON/1989/' },
  { categoria: 'Códigos', titulo: 'Código de Processo Civil (Lei nº 13.105/2015)', descricao: 'Normas do processo civil.', url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm' },
  { categoria: 'Códigos', titulo: 'Código Civil (Lei nº 10.406/2002)', descricao: 'Normas de direito civil.', url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm' },
  { categoria: 'Códigos', titulo: 'Código de Processo Penal (Decreto-Lei nº 3.689/1941)', descricao: 'Normas do processo penal.', url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689.htm' },
  { categoria: 'Juizados', titulo: 'Lei dos Juizados Especiais (Lei nº 9.099/1995)', descricao: 'Juizados Especiais Cíveis e Criminais.', url: 'https://www.planalto.gov.br/ccivil_03/leis/l9099.htm' },
  { categoria: 'Processo Eletrônico', titulo: 'Lei do Processo Eletrônico (Lei nº 11.419/2006)', descricao: 'Informatização do processo judicial.', url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11419.htm' },
  { categoria: 'Atos Normativos TJMG', titulo: 'Resolução do Órgão Especial do TJMG', descricao: 'Atos normativos internos do Tribunal.', url: 'https://www.tjmg.jus.br' },
  { categoria: 'Atos Normativos CNJ', titulo: 'Resoluções do Conselho Nacional de Justiça', descricao: 'Normas do CNJ aplicáveis ao Judiciário.', url: 'https://www.cnj.jus.br' },
];

export default function LegislacaoPage() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const filtradas = NORMAS.filter(n =>
    (n.titulo + n.descricao + n.categoria).toLowerCase().includes(busca.toLowerCase())
  );

  const categorias = [...new Set(filtradas.map(n => n.categoria))];

  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Legislação</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={28} style={{ color: '#2c77ba' }} />
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Legislação</h1>
        </div>

        <div className="bg-white border border-border p-4 mb-4">
          <div className="relative max-w-xl">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              className="form-field pl-8"
              placeholder="Buscar por lei, código ou palavra-chave..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {categorias.length === 0 && (
          <div className="bg-white border border-border p-6 text-center text-muted-foreground text-[12px]">
            Nenhuma norma encontrada para "<strong>{busca}</strong>".
          </div>
        )}

        {categorias.map(cat => (
          <div key={cat} className="bg-white border border-border mb-4">
            <div className="panel-header">{cat.toUpperCase()}</div>
            <div className="divide-y divide-border">
              {filtradas.filter(n => n.categoria === cat).map(n => (
                <a
                  key={n.titulo}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-blue-50 group"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-sky-700 group-hover:underline">{n.titulo}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{n.descricao}</div>
                  </div>
                  <ExternalLink size={15} className="shrink-0 mt-1 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </EprocLayout>
  );
}
