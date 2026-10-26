import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { MESAS } from "../config";
import { useCarrito } from "../hooks/useCarrito";
import { SESION, useSesionMesa } from "../hooks/useSesionMesa";
import { formatearDinero } from "../lib/pedidos";
import Carrito from "./Carrito";
import "./Clientes.css";

// La mesa sale de la URL del QR: /clientes/5
function ClientesMesa({ mesa }) {
  const carrito = useCarrito(mesa);
  const sesion = useSesionMesa(mesa);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  // Si el administrador libera la mesa, el carrito viejo de este dispositivo ya no corresponde
  const sesionPrevia = useRef(sesion);
  const vaciarCarrito = carrito.vaciar;
  useEffect(() => {
    if (sesionPrevia.current === SESION.MIA && sesion === SESION.LIBRE) vaciarCarrito();
    sesionPrevia.current = sesion;
  }, [sesion, vaciarCarrito]);

  if (sesion === SESION.CARGANDO) {
    return <div className="spinner" aria-label="Cargando" />;
  }

  // Otro dispositivo ya hizo el primer pedido en esta mesa: sólo se muestra el cartel
  if (sesion === SESION.OCUPADA) {
    return (
      <div className="clientes">
        <div className="card qr-bloqueado" role="alert">
          <span className="qr-bloqueado-icono" aria-hidden="true">🔒</span>
          <h1>ESTE QR YA ESTÁ UTILIZADO</h1>
        </div>
      </div>
    );
  }

  if (sesion === SESION.ERROR) {
    return (
      <div className="clientes">
        <div className="card estado-vacio">
          <p>No se pudo verificar el estado de la mesa.</p>
          <p className="texto-suave">Revisá tu conexión o avisá a un mozo.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

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
