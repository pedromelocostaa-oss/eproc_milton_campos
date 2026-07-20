import { useNavigate } from 'react-router-dom';
import { Accessibility, Keyboard, Contrast, Type, Hand } from 'lucide-react';
import EprocLayout from '@/components/layout/EprocLayout';

const ATALHOS = [
  { tecla: 'Alt + 1', desc: 'Ir para o conteúdo principal' },
  { tecla: 'Alt + 2', desc: 'Ir para o menu' },
  { tecla: 'Alt + 3', desc: 'Ir para a busca' },
  { tecla: 'Alt + M', desc: 'Pesquisar no menu' },
  { tecla: 'Alt + +', desc: 'Aumentar o tamanho da fonte' },
  { tecla: 'Alt + -', desc: 'Diminuir o tamanho da fonte' },
];

const RECURSOS = [
  { icon: Type, titulo: 'Ajuste de fonte', desc: 'Aumente ou diminua o tamanho do texto pelos botões A+ e A- na barra superior.' },
  { icon: Contrast, titulo: 'Alto contraste', desc: 'Ative o modo de alto contraste para facilitar a leitura.' },
  { icon: Hand, titulo: 'VLibras', desc: 'Tradução automática do conteúdo para a Língua Brasileira de Sinais.' },
  { icon: Keyboard, titulo: 'Teclas de atalho', desc: 'Navegue pelo sistema utilizando apenas o teclado.' },
];

export default function AcessibilidadePage() {
  const navigate = useNavigate();
  return (
    <EprocLayout>
      <div className="p-4">
        <div className="breadcrumb mb-4">
          <button onClick={() => navigate('/dashboard')}>Início</button>
          <span>›</span>
          <span>Acessibilidade</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Accessibility size={28} style={{ color: '#2c77ba' }} />
          <h1 className="text-[26px] font-bold" style={{ color: '#333' }}>Acessibilidade</h1>
        </div>

        <div className="bg-white border border-border p-5 mb-4">
          <p className="text-[13px] text-foreground leading-relaxed">
            O Tribunal de Justiça do Estado de Minas Gerais está comprometido em assegurar a
            acessibilidade digital a todas as pessoas, independentemente de suas capacidades.
            Este simulador educacional reproduz os recursos de acessibilidade do portal e-Proc
            para fins de aprendizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {RECURSOS.map(r => (
            <div key={r.titulo} className="bg-white border border-border p-4 flex gap-3">
              <r.icon size={22} className="shrink-0 mt-0.5" style={{ color: '#2c77ba' }} />
              <div>
                <div className="text-[13px] font-bold text-foreground">{r.titulo}</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-border">
          <div className="panel-header">TECLAS DE ATALHO</div>
          <table className="w-full text-[13px]">
            <tbody>
              {ATALHOS.map((a, i) => (
                <tr key={a.tecla} className={`border-b border-border ${i % 2 ? 'bg-muted/20' : ''}`}>
                  <td className="px-4 py-2 w-40">
                    <kbd className="px-2 py-1 bg-muted border border-border rounded text-[12px] font-mono">{a.tecla}</kbd>
                  </td>
                  <td className="px-4 py-2 text-foreground">{a.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EprocLayout>
  );
}
