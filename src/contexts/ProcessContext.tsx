import { createContext, useContext, useState, ReactNode } from "react";

export interface DadosIniciais {
  materia: string;
  jurisdicao: string;
  competencia: string;
  classeJudicial: string;
  rito: string;
  area: string;
}

export interface Assunto {
  codigo: string;
  descricao: string;
}

export interface Parte {
  id: string;
  polo: "ativo" | "passivo";
  tipoParte: string;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: "Física" | "Jurídica";
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  email: string;
  telefone: string;
}

export interface Caracteristicas {
  justicaGratuita: boolean;
  pedidoLiminar: boolean;
  valorCausa: string;
  segredoJustica: boolean;
  motivoSigilo: string;
}

export interface Anexo {
  id: string;
  tipoDocumento: string;
  descricao: string;
  numero: string;
  sigiloso: boolean;
  nomeArquivo: string;
}

export interface Peticao {
  tipoDocumento: string;
  descricao: string;
  numero: string;
  sigiloso: boolean;
  conteudo: string;
  anexos: Anexo[];
}

export interface ProcessData {
  dadosIniciais: DadosIniciais | null;
  assuntos: Assunto[];
  partes: Parte[];
  caracteristicas: Caracteristicas | null;
  peticao: Peticao | null;
}

interface ProcessContextType {
  data: ProcessData;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  setDadosIniciais: (d: DadosIniciais) => void;
  addAssunto: (a: Assunto) => void;
  removeAssunto: (codigo: string) => void;
  addParte: (p: Parte) => void;
  removeParte: (id: string) => void;
  setCaracteristicas: (c: Caracteristicas) => void;
  setPeticao: (p: Peticao) => void;
  resetProcess: () => void;
}

const initialData: ProcessData = {
  dadosIniciais: null,
  assuntos: [],
  partes: [],
  caracteristicas: null,
  peticao: null,
};

const ProcessContext = createContext<ProcessContextType | null>(null);

export function ProcessProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProcessData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);

  const setDadosIniciais = (d: DadosIniciais) =>
    setData((prev) => ({ ...prev, dadosIniciais: d }));

  const addAssunto = (a: Assunto) =>
    setData((prev) => ({
      ...prev,
      assuntos: prev.assuntos.find((x) => x.codigo === a.codigo)
        ? prev.assuntos
        : [...prev.assuntos, a],
    }));

  const removeAssunto = (codigo: string) =>
    setData((prev) => ({
      ...prev,
      assuntos: prev.assuntos.filter((x) => x.codigo !== codigo),
    }));

  const addParte = (p: Parte) =>
    setData((prev) => ({ ...prev, partes: [...prev.partes, p] }));

  const removeParte = (id: string) =>
    setData((prev) => ({
      ...prev,
      partes: prev.partes.filter((x) => x.id !== id),
    }));

  const setCaracteristicas = (c: Caracteristicas) =>
    setData((prev) => ({ ...prev, caracteristicas: c }));

  const setPeticao = (p: Peticao) =>
    setData((prev) => ({ ...prev, peticao: p }));

  const resetProcess = () => {
    setData(initialData);
    setCurrentStep(0);
  };

  return (
    <ProcessContext.Provider
      value={{
        data,
        currentStep,
        setCurrentStep,
        setDadosIniciais,
        addAssunto,
        removeAssunto,
        addParte,
        removeParte,
        setCaracteristicas,
        setPeticao,
        resetProcess,
      }}
    >
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcess() {
  const ctx = useContext(ProcessContext);
  if (!ctx) throw new Error("useProcess must be used within ProcessProvider");
  return ctx;
}
