import { useState } from "react";
import { useProcess } from "@/contexts/ProcessContext";
import {
  mockMaterias,
  mockJurisdicoes,
  mockClassesJudiciais,
  mockRitos,
  mockAreasByRito,
} from "@/data/mockData";

const StepDadosIniciais = () => {
  const { data, setDadosIniciais, setCurrentStep } = useProcess();
  const [materia, setMateria] = useState(data.dadosIniciais?.materia || "");
  const [jurisdicao, setJurisdicao] = useState(data.dadosIniciais?.jurisdicao || "");
  const [classeJudicial, setClasseJudicial] = useState(data.dadosIniciais?.classeJudicial || "");
  const [rito, setRito] = useState(data.dadosIniciais?.rito || "");
  const [area, setArea] = useState(data.dadosIniciais?.area || "");
  const [included, setIncluded] = useState(!!data.dadosIniciais);
  const [msg, setMsg] = useState("");

  const areasDisponiveis = rito ? (mockAreasByRito[rito] || []) : [];

  const handleRitoChange = (novoRito: string) => {
    setRito(novoRito);
    setArea("");
  };

  const handleIncluir = () => {
    if (!materia || !jurisdicao || !classeJudicial || !rito || !area) {
      setMsg("Preencha todos os campos obrigatórios.");
      return;
    }
    setDadosIniciais({ materia, jurisdicao, competencia: "", classeJudicial, rito, area });
    setIncluded(true);
    setMsg("");
  };

  return (
    <div>
      {!included ? (
        <>
          <div className="mb-3">
            <label className="form-label required">Matéria</label>
            <select className="form-field" value={materia} onChange={(e) => setMateria(e.target.value)}>
              <option value="">Selecione</option>
              {mockMaterias.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label required">Jurisdição</label>
            <select className="form-field" value={jurisdicao} onChange={(e) => setJurisdicao(e.target.value)}>
              <option value="">Selecione</option>
              {mockJurisdicoes.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label required">Rito</label>
            <select className="form-field" value={rito} onChange={(e) => handleRitoChange(e.target.value)}>
              <option value="">-- Selecione um rito --</option>
              {mockRitos.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label required">Área</label>
            <select className="form-field" value={area} onChange={(e) => setArea(e.target.value)} disabled={!rito}>
              <option value="">-- Selecione uma área --</option>
              {areasDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label required">Classe judicial</label>
            <select className="form-field" value={classeJudicial} onChange={(e) => setClasseJudicial(e.target.value)}>
              <option value="">Selecione</option>
              {mockClassesJudiciais.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {msg && <div className="alert-error mb-2">{msg}</div>}

          <button className="btn-primary" onClick={handleIncluir}>INCLUIR</button>
        </>
      ) : (
        <div>
          <div className="alert-success mb-3">Dados iniciais incluídos com sucesso.</div>
          <table className="data-table mb-3">
            <thead>
              <tr>
                <th>Matéria</th>
                <th>Jurisdição</th>
                <th>Rito</th>
                <th>Área</th>
                <th>Classe Judicial</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{data.dadosIniciais?.materia}</td>
                <td>{data.dadosIniciais?.jurisdicao}</td>
                <td>{data.dadosIniciais?.rito}</td>
                <td>{data.dadosIniciais?.area}</td>
                <td>{data.dadosIniciais?.classeJudicial}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StepDadosIniciais;
