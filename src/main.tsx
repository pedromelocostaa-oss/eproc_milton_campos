import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { garantirSeedAcervo } from "./data/acervoStore";
import { garantirSeedCadastros } from "./data/cadastroStore";

// Popula o sistema com dados de exemplo na primeira execução.
garantirSeedAcervo();
garantirSeedCadastros();

createRoot(document.getElementById("root")!).render(<App />);
