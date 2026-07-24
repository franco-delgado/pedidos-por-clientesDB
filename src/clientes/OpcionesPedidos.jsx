import React, { useState, useEffect } from "react";
// Importamos la instancia de la base de datos de tu configuración de Firebase
import { db } from "../lib/firebise"; 
// Importamos los métodos requeridos de Firestore
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from "firebase/firestore";
import FooterComponent from "../FooterComponent";
import "./Clientes.css";

function OpcionesPedidos({ categoria, alVolver }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS PARA EL CARRITO Y EL MODAL ---
  const [pedidos, setPedidos] = useState(() => {
    const guardado = localStorage.getItem("carrito_mesa");
    return guardado ? JSON.parse(guardado) : [];
  });

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadPedido, setCantidadPedido] = useState("");
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  // Persistencia en LocalStorage
  useEffect(() => {
    localStorage.setItem("carrito_mesa", JSON.stringify(pedidos));
  }, [pedidos]);

  // Cargar Productos de la Categoría desde Firestore
  useEffect(() => {
    async function obtenerProductos() {
      try {
        setCargando(true);
        const coleccionRef = collection(db, "datos");
        const consulta = query(
          coleccionRef, 
          where("categoria", "==", categoria.nombre.toUpperCase())
        );
        const snapshot = await getDocs(consulta);
        
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos de Firestore:", error);
      } finally {
        setCargando(false);
      }
    }
    obtenerProductos();
  }, [categoria.nombre]);

  // --- FUNCIONES DEL MODAL ---
  const abrirModal = (producto) => {
    const enCarrito =
      pedidos.find((p) => p.id_producto === producto.id)?.cantidad || 0;
    const disponibleReal = producto.stock - enCarrito;

    if (disponibleReal <= 0) {
      alert("Lo sentimos, no queda más stock disponible de este producto.");
      return;
    }

    setProductoSeleccionado({ ...producto, disponibleReal });
    setCantidadPedido("1");
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
    setCantidadPedido("");
  };

  const agregarAlPedido = () => {
    const cantidadAAgregar = parseInt(cantidadPedido);
    if (!cantidadAAgregar || cantidadAAgregar <= 0) return;

    if (cantidadAAgregar > productoSeleccionado.disponibleReal) {
      alert(
        `Solo puedes agregar ${productoSeleccionado.disponibleReal} unidades más.`,
      );
      return;
    }

    const existe = pedidos.find(
      (p) => p.id_producto === productoSeleccionado.id,
    );

    if (existe) {
      setPedidos(
        pedidos.map((p) =>
          p.id_producto === productoSeleccionado.id
            ? {
                ...p,
                cantidad: p.cantidad + cantidadAAgregar,
                subtotal: (p.cantidad + cantidadAAgregar) * p.precio_unitario,
              }
            : p,
        ),
      );
    } else {
      const nuevoItem = {
        id_producto: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        cantidad: cantidadAAgregar,
        precio_unitario: productoSeleccionado.precio,
        subtotal: productoSeleccionado.precio * cantidadAAgregar,
        stock_original: productoSeleccionado.stock,
      };
      setPedidos([...pedidos, nuevoItem]);
    }
    cerrarModal();
  };

  // --- FUNCIONES DEL CARRITO ---
  const actualizarCantidadCarrito = (id_producto, delta) => {
    setPedidos((prevPedidos) => {
      return prevPedidos.map((item) => {
        if (item.id_producto === id_producto) {
          const nuevaCantidad = item.cantidad + delta;
          if (nuevaCantidad < 1) return item;
          if (nuevaCantidad > item.stock_original) {
            alert(`Stock máximo alcanzado (${item.stock_original} unidades).`);
            return item;
          }
          return {
            ...item,
            text: item.nombre,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precio_unitario,
          };
        }
        return item;
      });
    });
  };

  const eliminarDelCarrito = (index) => {
    const nuevosPedidos = [...pedidos];
    nuevosPedidos.splice(index, 1);
    setPedidos(nuevosPedidos);
    if (nuevosPedidos.length === 0) setMostrarCarrito(false);
  };

  // --- FINALIZAR PEDIDO (CARGA A BASE DE DATOS FIRESTORE) ---
  const finalizarPedidoCompleto = async () => {
    if (pedidos.length === 0) return;

    try {
      const coleccionPedidosRef = collection(db, "pedidos_clientes");

      // 1. Guardar cada ítem del carrito en Firestore de forma paralela y eficiente
      const promesasPedidos = pedidos.map((item) => {
        return addDoc(coleccionPedidosRef, {
          mesa: 8, // ID estático temporal según requerimiento de tu código original
          nombre_pedido: item.nombre, 
          cantidad_pedida: item.cantidad, 
          precio_unitario: item.precio_unitario, 
          espacio: "pedido_nuevo" 
        });
      });

      await Promise.all(promesasPedidos);

      // 2. Actualizar el stock remanente en la colección 'datos'
      const promesasStock = pedidos.map((item) => {
        const documentoProductoRef = doc(db, "datos", item.id_producto);
        return updateDoc(documentoProductoRef, {
          stock: item.stock_original - item.cantidad
        });
      });

      await Promise.all(promesasStock);

      // 3. Limpieza de interfaz y éxito
      alert("¡Pedido enviado correctamente!");
      setPedidos([]);
      localStorage.removeItem("carrito_mesa");
      setMostrarCarrito(false);
      alVolver();
    } catch (err) {
      console.error("Error inesperado en el guardado de Firestore:", err);
      alert("Ocurrió un error inesperado al enviar el pedido.");
    }
  };

  if (cargando)
    return (
      <p className="cargando">Cargando productos de {categoria.nombre}...</p>
    );

  return (
    <div className="editor-container">
      <header className="superior">
        <button onClick={alVolver} className="btn-atras">
          ← Atrás
        </button>
        <h2>{categoria?.nombre?.toUpperCase()}</h2>
      </header>

      <div className="formulario-edicion">
        {productos.map((prod) => (
          <div
            key={prod.id}
            className={`item-editar ${prod.stock <= 0 ? "sin-stock" : ""}`}
          >
            <div className="foto-producto-contenedor">
              {prod.imagen_url ? (
                <img
                  src={prod.imagen_url}
                  alt={prod.nombre}
                  className="producto-foto-cliente"
                />
              ) : (
                <div className="producto-sin-foto">📸</div>
              )}
            </div>

            <button
              className="opciones"
              onClick={() => abrirModal(prod)}
              disabled={prod.stock <= 0}
            >
              {prod.nombre} {prod.stock <= 0 ? "(Sin stock)" : ""}
            </button>
            <p>${prod.precio}</p>
            <small>Stock: {prod.stock}</small>
          </div>
        ))}
      </div>

      {/* Botón Flotante */}
      {pedidos.length > 0 && (
        <button
          className="btn-carrito-flotante"
          onClick={() => setMostrarCarrito(!mostrarCarrito)}
        >
          🛒 Ver Pedido ({pedidos.length})
        </button>
      )}

      {/* Modal de Cantidad */}
      {productoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <h3>{productoSeleccionado.nombre}</h3>
            <p>Disponible: {productoSeleccionado.disponibleReal}</p>
            <input
              type="number"
              min="1"
              max={productoSeleccionado.disponibleReal}
              value={cantidadPedido}
              onChange={(e) => setCantidadPedido(e.target.value)}
              autoFocus
            />
            <div className="modal-botones">
              <button onClick={cerrarModal}>Cancelar</button>
              <button className="btn-confirmar" onClick={agregarAlPedido}>
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrito Desplegable */}
      {mostrarCarrito && (
        <div className="carrito-desplegable">
          <div className="carrito-header">
            <h3>Mi Pedido</h3>
            <button
              className="btn-cerrar-x"
              onClick={() => setMostrarCarrito(false)}
            >
              X
            </button>
          </div>
          <div className="carrito-items">
            {pedidos.map((item, idx) => (
              <div key={item.id_producto} className="item-carrito-lista">
                <div className="info-item">
                  <strong>{item.nombre}</strong>
                  <p>${item.precio_unitario}</p>
                </div>
                <div className="controles-cantidad">
                  <button
                    onClick={() =>
                      actualizarCantidadCarrito(item.id_producto, -1)
                    }
                  >
                    ◀
                  </button>
                  <span className="cantidad-numero">{item.cantidad}</span>
                  <button
                    onClick={() =>
                      actualizarCantidadCarrito(item.id_producto, 1)
                    }
                  >
                    ▶
                  </button>
                </div>
                <div className="subtotal-item">
                  <span>${item.subtotal}</span>
                </div>
                <button
                  className="btn-eliminar"
                  onClick={() => eliminarDelCarrito(idx)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <div className="carrito-footer">
            <div className="total-contenedor">
              <strong>Total:</strong>
              <strong>
                ${pedidos.reduce((acc, i) => acc + i.subtotal, 0)}
              </strong>
            </div>
            <button className="btn-finalizar" onClick={finalizarPedidoCompleto}>
              Confirmar Pedido
            </button>
          </div>
        </div>
      )}
      <div className="footer">
        <FooterComponent />
      </div>
    </div>
  );
}

export default OpcionesPedidos;