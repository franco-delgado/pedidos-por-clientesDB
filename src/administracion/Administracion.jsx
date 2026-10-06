import { useCallback, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { MESAS } from "../config";
import { ESTADO } from "../lib/pedidos";
import { usePedidos } from "../hooks/usePedidos";
import { useAlertaSonora } from "../hooks/useAlertaSonora";
import { useToast } from "../hooks/toastContext";
import PinGate from "../components/PinGate";
import "./administracion.css";

// Layout de todo el panel: vive mientras el administrador navega entre secciones,
// por eso las alertas sonoras funcionan en Mesas, Precios y Caja por igual.
function PanelAdmin() {
  const toast = useToast();
  const reproducir = useAlertaSonora();

  const alNuevoPedido = useCallback(
    (p) => {
      if (!p.esAlerta) return;
      reproducir();
      const texto = p.esCuenta
        ? `Mesa ${p.mesa} pide la cuenta`
        : `Mesa ${p.mesa}: ${p.cantidad}× ${p.nombre}`;
      toast.mostrar(`🔔 ${texto}`, "alerta");

      // Notificación nativa si la pestaña está en segundo plano (no existe en todos los WebView)
      try {
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification(`¡Alerta Mesa ${p.mesa}!`, { body: texto, icon: "/icon-192.png" });
        }
      } catch {
        /* notificaciones no disponibles en este dispositivo */
      }
    },
    [reproducir, toast],
  );

  const { pedidos, estadoMesas, cargando, error } = usePedidos({ alNuevoPedido });

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const mesasConAlerta = MESAS.filter((n) => estadoMesas[n] === ESTADO.NUEVO).length;

  return (
    <div className="admin">
      <nav className="admin-nav" aria-label="Secciones de administración">
        <NavLink to="mesas" className="admin-tab">
          Mesas
          {mesasConAlerta > 0 && <span className="admin-tab-badge">{mesasConAlerta}</span>}
        </NavLink>
        <NavLink to="precios" className="admin-tab">Precios</NavLink>
        <NavLink to="caja" className="admin-tab">Caja</NavLink>
        <NavLink to="/cocina" className="admin-tab">Cocina ↗</NavLink>
      </nav>

      {error && (
        <div className="aviso aviso-error">
          No se pueden leer los pedidos en tiempo real. Revisá la conexión y las Reglas de Firestore.
        </div>
      )}

      <Outlet context={{ pedidos, estadoMesas, cargando }} />
    </div>
  );
}

export default function Administracion() {
  return (
    <PinGate>
      <PanelAdmin />
    </PinGate>
  );
}
