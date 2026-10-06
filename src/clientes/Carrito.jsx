import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLECCION_PEDIDOS, formatearDinero } from "../lib/pedidos";
import { useToast } from "../hooks/toastContext";

export default function Carrito({ mesa, carrito, onCerrar }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);

  const confirmarPedido = async () => {
    if (carrito.items.length === 0 || enviando) return;
    setEnviando(true);

    try {
      // Pedidos + descuento de stock en UNA sola operación: o se guarda todo o nada.
      // increment() evita pisar el stock si dos mesas piden al mismo tiempo.
      const lote = writeBatch(db);
      const notaLimpia = nota.trim();

      carrito.items.forEach((item) => {
        lote.set(doc(collection(db, COLECCION_PEDIDOS)), {
          mesa,
          id_producto: item.id_producto,
          nombre_pedido: item.nombre,
          cantidad_pedida: item.cantidad,
          precio_unitario: item.precio_unitario,
          espacio: "pedido_nuevo",
          creado: serverTimestamp(),
          ...(notaLimpia ? { nota: notaLimpia } : {}),
        });
        lote.update(doc(db, "datos", item.id_producto), { stock: increment(-item.cantidad) });
      });

      await lote.commit();

      carrito.vaciar();
      toast.mostrar("¡Pedido enviado! Ya lo estamos preparando.", "ok");
      onCerrar();
      navigate(`/clientes/${mesa}`);
    } catch (error) {
      console.error("Error al enviar el pedido:", error);
      toast.mostrar("No se pudo enviar el pedido. Probá de nuevo o avisá a un mozo.", "error");
      setEnviando(false);
    }
  };

  return (
    <div className="hoja-fondo" onClick={onCerrar}>
      <section
        className="hoja"
        role="dialog"
        aria-label="Mi pedido"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="hoja-header">
          <h2>Mi pedido · Mesa {mesa}</h2>
          <button className="icono-btn" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>

        <div className="hoja-items">
          {carrito.items.map((item) => (
            <div key={item.id_producto} className="carrito-item">
              <div className="carrito-item-info">
                <strong>{item.nombre}</strong>
                <span className="texto-suave">{formatearDinero(item.precio_unitario)} c/u</span>
              </div>
              <div className="stepper stepper-sm">
                <button aria-label="Quitar uno" onClick={() => carrito.cambiarCantidad(item.id_producto, -1)}>−</button>
                <span>{item.cantidad}</span>
                <button
                  aria-label="Agregar uno"
                  disabled={item.cantidad >= item.stock}
                  onClick={() => carrito.cambiarCantidad(item.id_producto, 1)}
                >
                  +
                </button>
              </div>
              <span className="carrito-item-subtotal">
                {formatearDinero(item.cantidad * item.precio_unitario)}
              </span>
              <button
                className="icono-btn"
                aria-label={`Quitar ${item.nombre}`}
                onClick={() => carrito.quitar(item.id_producto)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <label className="campo">
          Aclaraciones para la cocina (opcional)
          <textarea
            className="input"
            rows={2}
            maxLength={200}
            placeholder="Ej: sin azúcar, bien caliente…"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </label>

        <footer className="hoja-footer">
          <div className="fila-total">
            <span>Total</span>
            <strong>{formatearDinero(carrito.total)}</strong>
          </div>
          <button className="btn btn-primary btn-block btn-grande" onClick={confirmarPedido} disabled={enviando}>
            {enviando ? "Enviando…" : "Confirmar pedido"}
          </button>
        </footer>
      </section>
    </div>
  );
}
