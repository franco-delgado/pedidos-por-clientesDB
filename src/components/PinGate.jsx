import { useState } from "react";
import { ADMIN_PIN } from "../config";

const CLAVE_SESION = "acceso_personal";

// Pide un PIN para entrar a Administración y Cocina (si VITE_ADMIN_PIN está definido).
// Es una barrera básica del lado del navegador: no reemplaza a las Reglas de Firestore.
export default function PinGate({ children }) {
  const [permitido, setPermitido] = useState(
    () => !ADMIN_PIN || sessionStorage.getItem(CLAVE_SESION) === "1",
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (permitido) return children;

  const validar = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(CLAVE_SESION, "1");
      setPermitido(true);
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="pantalla-centro">
      <form className="card pin-card" onSubmit={validar}>
        <h2>Acceso del personal</h2>
        <p className="texto-suave">Ingresá el PIN para continuar.</p>
        <input
          className="input pin-input"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          aria-label="PIN"
        />
        {error && <p className="texto-error">PIN incorrecto</p>}
        <button className="btn btn-primary btn-block" type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
