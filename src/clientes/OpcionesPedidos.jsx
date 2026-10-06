import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { buscarCategoria, claveCategoria } from "../config";
import { formatearDinero } from "../lib/pedidos";
import { useToast } from "../hooks/toastContext";

export default function OpcionesPedidos() {
  const { idCategoria } = useParams();
  const { mesa, carrito } = useOutletContext();
  const toast = useToast();

  const categoria = buscarCategoria(idCategoria);
  const clave = categoria ? claveCategoria(categoria) : null;

  // `clave` indica a qué categoría pertenece la lista: mientras no coincida, se muestra "cargando"
  const [datos, setDatos] = useState({ clave: null, lista: [], error: false });
  const [busqueda, setBusqueda] = useState("");

  // Escucha en vivo: si cambia el stock, la tarjeta se actualiza sola
  useEffect(() => {
    if (!clave) return;
    const consulta = query(collection(db, "datos"), where("categoria", "==", clave));
    return onSnapshot(
      consulta,
      (snapshot) => {
        const lista = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));
        setDatos({ clave, lista, error: false });
      },
      (error) => {
        console.error("Error al cargar productos:", error);
        setDatos({ clave, lista: [], error: true });
      },
    );
  }, [clave]);

  const volver = (
    <Link to={`/clientes/${mesa}`} className="volver">← Categorías</Link>
  );

  if (!categoria) {
    return (
      <>
        {volver}
        <div className="card estado-vacio">Esa categoría no existe.</div>
      </>
    );
  }

  const cargando = datos.clave !== clave;
  const filtro = busqueda.trim().toLowerCase();
  const productos = datos.lista.filter((p) => String(p.nombre).toLowerCase().includes(filtro));

  const agregar = (prod) => {
    if ((Number(prod.stock) || 0) - carrito.cantidadDe(prod.id) <= 0) {
      toast.mostrar("No queda más stock de este producto.", "error");
      return;
    }
    carrito.agregar(prod, 1);
  };

  return (
    <>
      {volver}
      <header className="seccion-titulo">
        <span aria-hidden="true">{categoria.emoji}</span>
        <h1>{categoria.nombre}</h1>
      </header>

      {datos.lista.length > 6 && (
        <input
          className="input buscador"
          type="search"
          placeholder="Buscar producto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      )}

      {cargando && <div className="spinner" aria-label="Cargando" />}
      {!cargando && datos.error && (
        <div className="card estado-vacio">No se pudieron cargar los productos.</div>
      )}
      {!cargando && !datos.error && productos.length === 0 && (
        <div className="card estado-vacio">
          {datos.lista.length === 0 ? "Todavía no hay productos en esta categoría." : "Sin resultados."}
        </div>
      )}

      <div className="productos-grid">
        {productos.map((prod) => {
          const stock = Number(prod.stock) || 0;
          const enCarrito = carrito.cantidadDe(prod.id);
          const disponible = stock - enCarrito;
          const sinStock = stock <= 0;

          return (
            <article key={prod.id} className={`producto ${sinStock ? "sin-stock" : ""}`}>
              <div className="producto-foto">
                {prod.imagen_url ? (
                  <img src={prod.imagen_url} alt={prod.nombre} loading="lazy" />
                ) : (
                  <span className="producto-sin-foto" aria-hidden="true">{categoria.emoji}</span>
                )}
                {sinStock && <span className="badge badge-danger producto-badge">Sin stock</span>}
                {!sinStock && stock <= 5 && (
                  <span className="badge badge-warn producto-badge">Quedan {stock}</span>
                )}
              </div>

              <div className="producto-info">
                <p className="producto-nombre">{prod.nombre}</p>
                <p className="producto-precio">{formatearDinero(prod.precio)}</p>
              </div>

              {enCarrito === 0 ? (
                <button className="btn btn-primary btn-block" disabled={sinStock} onClick={() => agregar(prod)}>
                  {sinStock ? "Sin stock" : "Agregar +"}
                </button>
              ) : (
                <div className="stepper">
                  <button aria-label="Quitar uno" onClick={() => carrito.cambiarCantidad(prod.id, -1, stock)}>−</button>
                  <span>{enCarrito}</span>
                  <button
                    aria-label="Agregar uno"
                    disabled={disponible <= 0}
                    onClick={() => carrito.cambiarCantidad(prod.id, 1, stock)}
                  >
                    +
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
