import { useState } from "react";
import { Link } from "react-router-dom";
import { MESAS, NOMBRE_LOCAL } from "../config";

export default function Inicio() {
  const [mesa, setMesa] = useState(MESAS[0]);

  return (
    <div className="inicio">
      <h1 className="inicio-titulo">Bienvenido a {NOMBRE_LOCAL}</h1>
      <p className="texto-suave">Elegí cómo querés ingresar.</p>

      <div className="inicio-grid">
        <section className="card inicio-card">
          <span className="inicio-emoji" aria-hidden="true">🍽️</span>
          <h2>Soy cliente</h2>
          <p className="texto-suave">Hacé tu pedido desde la mesa.</p>
          <label className="campo-inline">
            Mesa
            <select className="input" value={mesa} onChange={(e) => setMesa(Number(e.target.value))}>
              {MESAS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <Link className="btn btn-primary btn-block" to={`/clientes/${mesa}`}>
            Ver el menú
          </Link>
        </section>

        <Link className="card inicio-card inicio-link" to="/administracion">
          <span className="inicio-emoji" aria-hidden="true">🧾</span>
          <h2>Administración</h2>
          <p className="texto-suave">Mesas, precios y caja.</p>
        </Link>

        <Link className="card inicio-card inicio-link" to="/cocina">
          <span className="inicio-emoji" aria-hidden="true">👨‍🍳</span>
          <h2>Cocina</h2>
          <p className="texto-suave">Pedidos en preparación.</p>
        </Link>
      </div>

      <p className="inicio-nota texto-suave">
        Los QR de cada mesa deben apuntar a <code>/clientes/NÚMERO</code>
      </p>
    </div>
  );
}
