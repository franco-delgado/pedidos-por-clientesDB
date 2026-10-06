import { Link } from "react-router-dom";
import { CATEGORIAS } from "../config";

export default function Precios() {
  return (
    <>
      <header className="admin-titulo">
        <h1>Precios y productos</h1>
      </header>
      <p className="texto-suave">Elegí una categoría para editar precios, stock y fotos, o agregar productos.</p>

      <div className="categorias-grid categorias-admin">
        {CATEGORIAS.map((cat) => (
          <Link key={cat.id} to={cat.id} className="categoria-tile">
            <span className="categoria-emoji" aria-hidden="true">{cat.emoji}</span>
            <span className="categoria-nombre">{cat.nombre}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
