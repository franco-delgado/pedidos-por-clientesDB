import { Link, useOutletContext } from "react-router-dom";
import { CATEGORIAS } from "../config";
import { usePedidosMesa } from "../hooks/usePedidosMesa";
import { formatearDinero } from "../lib/pedidos";

export default function Categorias() {
  const { mesa } = useOutletContext();
  const pedidos = usePedidosMesa(mesa);

  const consumos = (pedidos || []).filter((p) => !p.esCuenta);
  const total = consumos.reduce((acc, p) => acc + p.subtotal, 0);

  return (
    <>
      <section className="clientes-hero">
        <span className="chip chip-mesa">Mesa {mesa}</span>
        <h1>¿Qué se te antoja hoy?</h1>
        <p className="texto-suave">Elegí una categoría y armá tu pedido.</p>
      </section>

      {consumos.length > 0 && (
        <section className="card ticket pedidos-realizados" aria-label="Pedidos realizados">
          <h2 className="pedidos-realizados-titulo">Tus pedidos</h2>
          {consumos.map((p) => (
            <div key={p.id} className="ticket-fila">
              <div>
                <span className="ticket-nombre">{p.nombre}</span>
                {p.cantidad > 1 && <span className="texto-suave"> × {p.cantidad}</span>}
                {p.cocina === "listo" && <span className="badge badge-ok pedido-listo">Listo</span>}
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

      <div className="categorias-grid">
        {CATEGORIAS.map((cat) => (
          <Link key={cat.id} to={`/clientes/${mesa}/categoria/${cat.id}`} className="categoria-tile">
            <span className="categoria-emoji" aria-hidden="true">{cat.emoji}</span>
            <span className="categoria-nombre">{cat.nombre}</span>
          </Link>
        ))}
      </div>

      <Link to={`/clientes/${mesa}/cuenta`} className="btn btn-outline btn-block btn-cuenta">
        🧾 Ver mi cuenta
      </Link>
    </>
  );
}
