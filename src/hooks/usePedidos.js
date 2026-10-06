import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLECCION_PEDIDOS, calcularEstadoMesas, normalizarPedido } from "../lib/pedidos";

/**
 * Escucha en tiempo real TODOS los pedidos activos (uso: administración y cocina).
 * `alNuevoPedido(pedido)` se llama sólo para documentos nuevos que llegan después
 * de la carga inicial, así no suena la alerta al abrir la app.
 */
export function usePedidos({ alNuevoPedido } = {}) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const callbackRef = useRef(alNuevoPedido);

  useEffect(() => {
    callbackRef.current = alNuevoPedido;
  });

  useEffect(() => {
    let primeraCarga = true;

    const desuscribir = onSnapshot(
      collection(db, COLECCION_PEDIDOS),
      (snapshot) => {
        setPedidos(snapshot.docs.map((d) => normalizarPedido(d.id, d.data())));
        setCargando(false);
        setError(null);

        if (!primeraCarga && callbackRef.current) {
          snapshot.docChanges().forEach((cambio) => {
            if (cambio.type === "added") {
              callbackRef.current(normalizarPedido(cambio.doc.id, cambio.doc.data()));
            }
          });
        }
        primeraCarga = false;
      },
      (err) => {
        console.error("Error escuchando pedidos:", err);
        setError(err);
        setCargando(false);
      },
    );

    return desuscribir;
  }, []);

  const estadoMesas = useMemo(() => calcularEstadoMesas(pedidos), [pedidos]);

  return { pedidos, estadoMesas, cargando, error };
}
