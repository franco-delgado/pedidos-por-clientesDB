import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { collection, doc, increment, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { MESAS } from "../../config";
import { COLECCION_PEDIDOS, formatearDinero, formatearHora } from "../../lib/pedidos";
import { useToast } from "../../hooks/toastContext";
import { emitirImpresionMesa } from "../../impresora/ticketService";
import "./DetallesMesa.css";

export default function DetalleMesa() {
  const { idMesa } = useParams();
  const mesa = Number(idMesa);
  const navigate = useNavigate();
  const toast = useToast();
  const { pedidos, cargando } = useOutletContext();
  const [procesando, setProcesando] = useState(false);

  // Los pedidos ya llegan en tiempo real desde el panel: acá sólo se filtra la mesa
  const { todos, consumos, cuentaSolicitada, total } = useMemo(() => {
    const todos = pedidos
      .filter((p) => p.mesa === mesa)
      .sort((a, b) => (a.creadoMs ?? Infinity) - (b.creadoMs ?? Infinity));
    const consumos = todos.filter((p) => !p.esCuenta);
    return {
      todos,
      consumos,
      cuentaSolicitada: todos.some((p) => p.esCuenta),
      total: consumos.reduce((acc, p) => acc + p.subtotal, 0),
    };
  }, [pedidos, mesa]);

  const volver = <Link to="/administracion/mesas" className="volver">← Mesas</Link>;

  if (!MESAS.includes(mesa)) {
    return (
      <>
        {volver}
        <div className="card estado-vacio">La mesa «{idMesa}» no existe.</div>
      </>
    );
  }

  const imprimir = () => {
    try {
      emitirImpresionMesa(mesa, consumos, total);
    } catch (error) {
      console.error("Error al generar el ticket:", error);
      toast.mostrar("No se pudo abrir la impresión.", "error");
    }
  };

  // Quita un ítem cargado por error y devuelve el stock
  const quitarItem = async (item) => {
    if (!window.confirm(`¿Quitar "${item.nombre}" (×${item.cantidad}) de la mesa ${mesa}?`)) return;
    try {
      const lote = writeBatch(db);
      lote.delete(doc(db, COLECCION_PEDIDOS, item.id));
      if (item.idProducto) {
        lote.update(doc(db, "datos", item.idProducto), { stock: increment(item.cantidad) });
      }
      await lote.commit();
      toast.mostrar("Ítem quitado.", "ok");
    } catch (error) {
      console.error("Error al quitar el ítem:", error);
      toast.mostrar("No se pudo quitar el ítem.", "error");
    }
  };

  // Cobro: registra en caja y vacía la mesa en una sola operación
  const cobrar = async () => {
    if (todos.length === 0) return;
    if (!window.confirm(`¿Cobrar ${formatearDinero(total)} y vaciar la mesa ${mesa}?`)) return;

    setProcesando(true);
    try {
      const lote = writeBatch(db);

      consumos.forEach((item) => {
        lote.set(doc(collection(db, "caja")), {
          nombre_pedido: item.nombre,
          cantidad_pedido: item.cantidad,
          precio_pedido: item.subtotal, // total de la línea (precio × cantidad)
          mesa,
          fecha: new Date(),
        });
      });
      // También se borra la solicitud de cuenta (no se cobra ni va a caja)
      todos.forEach((item) => lote.delete(doc(db, COLECCION_PEDIDOS, item.id)));

      await lote.commit();
      toast.mostrar(`Mesa ${mesa} cobrada y liberada.`, "ok");
      navigate("/administracion/mesas");
    } catch (error) {
      console.error("Error en el proceso de cobro:", error);
      toast.mostrar("Hubo un error al procesar el cobro.", "error");
      setProcesando(false);
    }
  };

  return (
    <>
      {volver}
      <header className="admin-titulo">
        <h1>Mesa {mesa}</h1>
        {cuentaSolicitada && <span className="chip chip-nuevo">🛎️ Pidió la cuenta</span>}
      </header>

      {cargando ? (
        <div className="spinner" aria-label="Cargando" />
      ) : consumos.length === 0 ? (
        <div className="card estado-vacio">No hay pedidos pendientes para esta mesa.</div>
      ) : (
        <section className="card detalle">
          {consumos.map((item) => (
            <div key={item.id} className="detalle-fila">
              <div className="detalle-info">
                <strong>{item.cantidad}× {item.nombre}</strong>
                <span className="texto-suave">
                  {formatearDinero(item.precio)} c/u
                  {item.creadoMs ? ` · ${formatearHora(item.creadoMs)}` : ""}
                </span>
                {item.nota && <span className="detalle-nota">📝 {item.nota}</span>}
              </div>
              <span className="detalle-subtotal">{formatearDinero(item.subtotal)}</span>
              <button className="icono-btn" aria-label={`Quitar ${item.nombre}`} onClick={() => quitarItem(item)}>
                🗑️
              </button>
            </div>
          ))}

          <div className="fila-total">
            <span>Total a cobrar</span>
            <strong>{formatearDinero(total)}</strong>
          </div>

          <div className="detalle-acciones">
            <button className="btn btn-outline" onClick={imprimir} disabled={procesando}>
              🖨️ Imprimir ticket
            </button>
            <button className="btn btn-ok" onClick={cobrar} disabled={procesando}>
              {procesando ? "Procesando…" : "Cobrar y liberar mesa"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
