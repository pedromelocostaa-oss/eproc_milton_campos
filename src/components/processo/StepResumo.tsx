import { useState } from "react";
import { useProcess } from "@/contexts/ProcessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { generateProcessNumber, getCurrentDateTime, mockOrgaosJulgadores } from "@/data/mockData";
import { CheckCircle, Download, ArrowLeft, FileText, Eye } from "lucide-react";

const StepResumo = () => {
  const { data, resetProcess } = useProcess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [protocolado, setProtocolado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numProcesso, setNumProcesso] = useState("");
  const [dataProtocolo, setDataProtocolo] = useState("");
  const [orgaoJulgador, setOrgaoJulgador] = useState("");

  const handleProtocolar = () => {
    setLoading(true);
    setTimeout(() => {
      setNumProcesso(generateProcessNumber());
      setDataProtocolo(getCurrentDateTime());
      setOrgaoJulgador(mockOrgaosJulgadores[Math.floor(Math.random() * mockOrgaosJulgadores.length)]);
      setLoading(false);
      setProtocolado(true);
    }, 3000);
  };

  const handleVoltarHome = () => {
    resetProcess();
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-[12px] text-muted-foreground">Realizando distribuição automática e protocolo do processo...</p>
        <p className="text-[11px] text-muted-foreground mt-1">Aguarde...</p>
      </div>
    );
  }

  if (protocolado) {
    return (
      <div>
        <div className="alert-success mb-4 flex items-center gap-2">
          <CheckCircle size={16} />
          <span className="font-bold">Processo protocolado com sucesso!</span>
        </div>

        <div className="text-center py-4 mb-4 border" style={{ backgroundColor: "hsl(120, 40%, 96%)", borderColor: "hsl(120, 40%, 75%)" }}>
          <div className="text-[12px] font-bold text-foreground mb-1">Número do Processo</div>
          <div className="text-xl font-bold" style={{ color: "hsl(187, 45%, 32%)" }}>{numProcesso}</div>
        </div>

        <table className="data-table mb-4">
          <tbody>
            <tr><td className="font-bold" style={{ width: 200 }}>Número do Processo</td><td>{numProcesso}</td></tr>
            <tr><td className="font-bold">Data/Hora do Protocolo</td><td>{dataProtocolo}</td></tr>
            <tr><td className="font-bold">Órgão Julgador</td><td>{orgaoJulgador}</td></tr>
            <tr><td className="font-bold">Classe Judicial</td><td>{data.dadosIniciais?.classeJudicial}</td></tr>
            <tr><td className="font-bold">Assunto Principal</td><td>{data.assuntos[0]?.descricao || "—"}</td></tr>
            <tr><td className="font-bold">Peticionante</td><td>{user?.name}</td></tr>
            <tr><td className="font-bold">Status</td><td><span className="badge-success">Protocolado</span></td></tr>
          </tbody>
        </table>

        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-1" onClick={() => window.print()}>
            <Download size={12} /> Baixar Recibo
          </button>
          <button className="btn-secondary flex items-center gap-1" onClick={handleVoltarHome}>
            <ArrowLeft size={12} /> Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  // Summary view - matching PJE "Protocolar Inicial" page
  return (
    <div>
      {/* Dados do processo */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-muted-foreground mb-1 border-b pb-1" style={{ borderColor: "hsl(220,12%,85%)" }}>
          Dados do processo
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-1">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Número do processo</span>
            <span className="text-[11px]">—</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Órgão julgador</span>
            <span className="text-[11px]">—</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Data da distribuição</span>
            <span className="text-[11px]">—</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Jurisdição</span>
            <span className="text-[11px]">{data.dadosIniciais?.jurisdicao || "—"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Rito</span>
            <span className="text-[11px]">{data.dadosIniciais?.rito || "—"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Área</span>
            <span className="text-[11px]">{data.dadosIniciais?.area || "—"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Classe</span>
            <span className="text-[11px]">{data.dadosIniciais?.classeJudicial || "—"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Valor de causa</span>
            <span className="text-[11px]">{data.caracteristicas?.valorCausa || "0,00"}</span>
          </div>
        </div>
      </div>

      {/* Detalhes do processo */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-muted-foreground mb-1 border-b pb-1" style={{ borderColor: "hsl(220,12%,85%)" }}>
          Detalhes do processo
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Assuntos</span>
            {data.assuntos.map((a) => (
              <div key={a.codigo} className="text-[11px]">{a.descricao.split("|").pop()?.trim()} ({a.codigo})</div>
            ))}
            {data.assuntos.length === 0 && <span className="text-[11px] text-destructive">Não informado</span>}
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Polo ativo</span>
            {data.partes.filter((p) => p.polo === "ativo").map((p) => (
              <div key={p.id} className="text-[11px]">{p.nome}</div>
            ))}
            {data.partes.filter((p) => p.polo === "ativo").length === 0 && <span className="text-[11px] text-destructive">Não informado</span>}
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Polo passivo</span>
            {data.partes.filter((p) => p.polo === "passivo").map((p) => (
              <div key={p.id} className="text-[11px]">{p.nome}</div>
            ))}
            {data.partes.filter((p) => p.polo === "passivo").length === 0 && <span className="text-[11px] text-destructive">Não informado</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 mt-2">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Segredo de justiça?</span>
            <span className="text-[11px]">{data.caracteristicas?.segredoJustica ? "SIM" : "NÃO"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Justiça gratuita?</span>
            <span className="text-[11px]">{data.caracteristicas?.justicaGratuita ? "SIM" : "NÃO"}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground block">Pedido de liminar ou antecipação de tutela?</span>
            <span className="text-[11px]">{data.caracteristicas?.pedidoLiminar ? "SIM" : "NÃO"}</span>
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-muted-foreground mb-1 border-b pb-1" style={{ borderColor: "hsl(220,12%,85%)" }}>
          Documentos
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Id na origem</th>
              <th>Número</th>
              <th>Origem</th>
              <th>Juntado em</th>
              <th>Juntado por</th>
              <th>Documento</th>
              <th>Tipo</th>
              <th>Anexos</th>
            </tr>
          </thead>
          <tbody>
            {data.peticao && (
              <tr>
                <td>{Math.floor(10000000000 + Math.random() * 90000000000)}</td>
                <td></td>
                <td>1° Grau</td>
                <td className="text-[10px]">&lt;Documento ainda não juntado ao processo&gt;</td>
                <td>{data.peticao.descricao}</td>
                <td>{data.peticao.tipoDocumento}</td>
                <td>
                  <div className="flex gap-1">
                    <Eye size={11} className="text-accent cursor-pointer" />
                  </div>
                </td>
                <td></td>
                <td>{data.peticao.anexos.length}</td>
              </tr>
            )}
            {data.peticao?.anexos.map((a) => (
              <tr key={a.id}>
                <td>{Math.floor(10000000000 + Math.random() * 90000000000)}</td>
                <td></td>
                <td>1° Grau</td>
                <td className="text-[10px]">&lt;Documento ainda não juntado ao processo&gt;</td>
                <td>{a.descricao}</td>
                <td>{a.tipoDocumento}</td>
                <td>
                  <div className="flex gap-1">
                    <Eye size={11} className="text-accent cursor-pointer" />
                  </div>
                </td>
                <td></td>
                <td>0</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.peticao && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {1 + (data.peticao?.anexos.length || 0)} resultados encontrados
          </div>
        )}
      </div>

      {/* Protocolar button */}
      <div>
        <button className="btn-primary" onClick={handleProtocolar}>PROTOCOLAR</button>
      </div>
    </div>
  );
};

export default StepResumo;
