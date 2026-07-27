import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { garantirSeedAcervo } from "./data/acervoStore";

// Popula o sistema com processos de exemplo na primeira execução.
garantirSeedAcervo();

createRoot(document.getElementById("root")!).render(<App />);
