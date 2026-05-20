import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import SeleccionePerfil from "./seleccionePerfil.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="header">
      <h1 className="logo">TU BAR</h1>
    </div>
    <div className="body">
      <SeleccionePerfil />
    </div>
  </StrictMode>,
);
