import { Link, useOutletContext } from "react-router-dom";
import { CATEGORIAS } from "../config";

export default function Categorias() {
  const { mesa } = useOutletContext();

  return (
    <>
      <section className="clientes-hero">
        <span className="chip chip-mesa">Mesa {mesa}</span>
        <h1>¿Qué se te antoja hoy?</h1>
        <p className="texto-suave">Elegí una categoría y armá tu pedido.</p>
      </section>

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
