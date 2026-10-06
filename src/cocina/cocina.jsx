import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLECCION_PEDIDOS } from "../lib/pedidos";
import { usePedidos } from "../hooks/usePedidos";
import { useAlertaSonora } from "../hooks/useAlertaSonora";
import { useToast } from "../hooks/toastContext";
import "./cocina.css";

const MINUTOS_URGENTE = 15;

async function marcar(ids, estado) {
  const lote = writeBatch(db);
  ids.forEach((id) => lote.update(doc(db, COLECCION_PEDIDOS, id), { cocina: estado }));
  await lote.commit();
}

function Cocina() {
  const toast = useToast();
  const reproducir = useAlertaSonora();
  const [ahora, setAhora] = useState(() => Date.now());

  // Suena sólo con pedidos nuevos (no con solicitudes de cuenta)
  const alNuevoPedido = useCallback(
    (p) => {
      if (!p.esCuenta) reproducir();
    },
    [reproducir],
  );
  const { pedidos, cargando, error } = usePedidos({ alNuevoPedido });

  // Refresca el "hace X min" cada 30 segundos
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const { tickets, listos } = useMemo(() => {
    const platos = pedidos.filter((p) => !p.esCuenta);

    const agrupar = (lista) => {
      const porMesa = {};
      lista.forEach((p) => {
        (porMesa[p.mesa] = porMesa[p.mesa] || []).push(p);
      });
      return Object.entries(porMesa).map(([mesa, items]) => ({
        mesa: Number(mesa),
        items: items.sort((a, b) => (a.creadoMs ?? Infinity) - (b.creadoMs ?? Infinity)),
        desde: Math.min(...items.map((i) => i.creadoMs ?? Infinity)),
      }));
    };

    return {
      tickets: agrupar(platos.filter((p) => p.cocina !== "listo")).sort((a, b) => a.desde - b.desde),
      listos: platos.filter((p) => p.cocina === "listo"),
    };
  }, [pedidos]);

  const actualizar = async (ids, estado) => {
    try {
      await marcar(ids, estado);
    } catch (err) {
      console.error("Error al actualizar el estado en cocina:", err);
      toast.mostrar("No se pudo actualizar el pedido.", "error");
    }
  };

  const minutos = (ms) => (Number.isFinite(ms) ? Math.max(0, Math.floor((ahora - ms) / 60000)) : null);

  return (
    <div className="cocina">
      <header className="admin-titulo">
        <h1>👨‍🍳 Cocina</h1>
        <span className="chip chip-nuevo">{tickets.length} {tickets.length === 1 ? "mesa" : "mesas"} en preparación</span>
      </header>

      {error && <div className="aviso aviso-error">No se pueden leer los pedidos. Revisá la conexión.</div>}
      {cargando && <div className="spinner" aria-label="Cargando" />}

      {!cargando && tickets.length === 0 && (
        <div className="card estado-vacio">🎉 No hay pedidos pendientes en este momento.</div>
      )}

      <div className="cocina-grid">
        {tickets.map((t) => {
          const min = minutos(t.desde);
          const urgente = min !== null && min >= MINUTOS_URGENTE;
          return (
            <article key={t.mesa} className={`card ticket-cocina ${urgente ? "urgente" : ""}`}>
              <header className="ticket-cocina-header">
                <h2>Mesa {t.mesa}</h2>
                {min !== null && <span className="chip">{min === 0 ? "recién" : `hace ${min} min`}</span>}
              </header>

              <ul className="ticket-cocina-items">
                {t.items.map((p) => (
                  <li key={p.id}>
                    <div>
                      <span className="cantidad-cocina">{p.cantidad}×</span> {p.nombre}
                      {p.nota && <div className="nota-cocina">📝 {p.nota}</div>}
                    </div>
                    <button className="btn btn-sm btn-ok" onClick={() => actualizar([p.id], "listo")}>
                      Listo
                    </button>
                  </li>
                ))}
              </ul>

              {t.items.length > 1 && (
                <button className="btn btn-primary btn-block" onClick={() => actualizar(t.items.map((i) => i.id), "listo")}>
                  ✓ Todo listo
                </button>
              )}
            </article>
          );
        })}
      </div>

      {listos.length > 0 && (
        <details className="listos">
          <summary>Listos para entregar ({listos.length})</summary>
          <ul>
            {listos.map((p) => (
              <li key={p.id}>
                <span>Mesa {p.mesa} · {p.cantidad}× {p.nombre}</span>
                <button className="btn btn-sm btn-outline" onClick={() => actualizar([p.id], "pendiente")}>
                  Deshacer
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default Cocina;
