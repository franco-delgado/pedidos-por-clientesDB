import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLECCION_PEDIDOS, SOLICITUD_CUENTA, formatearDinero } from "../lib/pedidos";
import { usePedidosMesa } from "../hooks/usePedidosMesa";
import { useToast } from "../hooks/toastContext";

export default function Cuenta() {
  const { mesa, carrito } = useOutletContext();
  const toast = useToast();

  const pedidos = usePedidosMesa(mesa); // null = cargando; sólo los de ESTA mesa, en vivo
  const [enviando, setEnviando] = useState(false);

  const consumos = (pedidos || []).filter((p) => !p.esCuenta);
  const cuentaSolicitada = (pedidos || []).some((p) => p.esCuenta);
  const total = consumos.reduce((acc, p) => acc + p.subtotal, 0);

  const pedirCuenta = async () => {
    setEnviando(true);
    try {
      await addDoc(collection(db, COLECCION_PEDIDOS), {
        mesa,
        nombre_pedido: SOLICITUD_CUENTA,
        precio_unitario: 0,
        cantidad_pedida: 1,
        espacio: "pedido_nuevo", // dispara la alerta visual y sonora de administración
        creado: new Date(),
      });
      carrito.vaciar();
      toast.mostrar("En un momento le entregamos la cuenta.", "ok");
    } catch (error) {
      console.error("Error al solicitar la cuenta:", error);
      toast.mostrar("No se pudo pedir la cuenta. Avisá a un mozo.", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Link to={`/clientes/${mesa}`} className="volver">← Volver al menú</Link>
      <header className="seccion-titulo">
        <span aria-hidden="true">🧾</span>
        <h1>Mi cuenta · Mesa {mesa}</h1>
      </header>

      {pedidos === null && <div className="spinner" aria-label="Cargando" />}

      {pedidos !== null && consumos.length === 0 && (
        <div className="card estado-vacio">Todavía no hay pedidos en esta mesa.</div>
      )}

      {consumos.length > 0 && (
        <section className="card ticket">
          {consumos.map((p) => (
            <div key={p.id} className="ticket-fila">
              <div>
                <span className="ticket-nombre">{p.nombre}</span>
                {p.cantidad > 1 && <span className="texto-suave"> × {p.cantidad}</span>}
              </div>
              <span>{formatearDinero(p.subtotal)}</span>
            </div>
          ))}
          <div className="fila-total">
            <span>Total</span>
            <strong>{formatearDinero(total)}</strong>
          </div>
        </section>
      )}

      {cuentaSolicitada ? (
        <div className="aviso aviso-ok">✅ Cuenta solicitada. En un momento se acerca un mozo.</div>
      ) : (
        consumos.length > 0 && (
          <button className="btn btn-primary btn-block btn-grande" onClick={pedirCuenta} disabled={enviando}>
            {enviando ? "Enviando…" : "🛎️ Pedir la cuenta"}
          </button>
        )
      )}
    </>
  );
}
