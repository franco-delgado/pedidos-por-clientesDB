import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "../hooks/toastContext";

// Reemplaza los alert() del navegador por avisos no bloqueantes.
export default function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const contador = useRef(0);

  const mostrar = useCallback((mensaje, tipo = "ok") => {
    const id = ++contador.current;
    setAvisos((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== id)), 4000);
  }, []);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toast-pila" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`toast toast-${a.tipo}`}>
            {a.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
