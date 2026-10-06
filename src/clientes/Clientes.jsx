import { useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { MESAS } from "../config";
import { useCarrito } from "../hooks/useCarrito";
import { formatearDinero } from "../lib/pedidos";
import Carrito from "./Carrito";
import "./Clientes.css";

// La mesa sale de la URL del QR: /clientes/5
function ClientesMesa({ mesa }) {
  const carrito = useCarrito(mesa);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  return (
    <div className="clientes">
      <Outlet context={{ mesa, carrito }} />

      {carrito.cantidadTotal > 0 && !carritoAbierto && (
        <button className="barra-carrito" onClick={() => setCarritoAbierto(true)}>
          <span className="barra-carrito-cant">{carrito.cantidadTotal}</span>
          <span>Ver mi pedido</span>
          <strong>{formatearDinero(carrito.total)}</strong>
        </button>
      )}

      {carritoAbierto && (
        <Carrito mesa={mesa} carrito={carrito} onCerrar={() => setCarritoAbierto(false)} />
      )}
    </div>
  );
}

export default function Clientes() {
  const { idMesa } = useParams();
  const mesa = Number(idMesa);

  if (!MESAS.includes(mesa)) {
    return (
      <div className="clientes">
        <div className="card estado-vacio">
          <p>La mesa «{idMesa}» no existe.</p>
          <Link className="btn btn-primary" to="/">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  // key: al cambiar de mesa se reinicia el carrito en memoria
  return <ClientesMesa key={mesa} mesa={mesa} />;
}
