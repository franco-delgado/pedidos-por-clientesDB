import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
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

  // Cargar Productos de la Categoría
  useEffect(() => {
    async function obtenerProductos() {
      setCargando(true);
      const { data, error } = await supabase
        .from("datos")
        .select("*")
        .eq("categoria", categoria.nombre.toUpperCase());

      if (error) {
        console.error("Error al cargar productos:", error);
      } else {
        setProductos(data || []);
      }
      setCargando(false);
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

  // --- FINALIZAR PEDIDO (CARGA A BASE DE DATOS) ---
  const finalizarPedidoCompleto = async () => {
    if (pedidos.length === 0) return;

    try {
      // 1. Preparamos los datos para enviar
      // Como tu tabla tiene columnas individuales, enviamos un array de filas
      const filasParaInsertar = pedidos.map((item) => ({
        mesa: 8, // Tu columna 1 (number)
        "nombre-pedido": item.nombre, // Tu columna 2 (text)
        "cantidad-pedida": item.cantidad, // Tu columna 3 (number)
        precio_unitario: item.precio_unitario, // Tu columna 4 (number)
        espacio: "pedido_nuevo" // <--- ESTA ES LA CLAVE PARA EL COLOR ROJO
      }));

      // 2. Insertar en la base de datos
      // Supabase permite enviar un array de objetos para insertar varias filas a la vez
      const { error: errorPedido } = await supabase
        .from("pedidos_clientes")
        .insert(filasParaInsertar);

      if (errorPedido) {
        console.error("Error de Supabase:", errorPedido.message);
        alert("Error al guardar: " + errorPedido.message);
        return;
      }

      // 3. Actualizar el stock de los productos en la tabla 'datos'
      const promesasStock = pedidos.map((item) => {
        return supabase
          .from("datos")
          .update({ stock: item.stock_original - item.cantidad })
          .eq("id", item.id_producto);
      });

      await Promise.all(promesasStock);

      // 4. Limpieza y éxito
      alert("¡Pedido enviado correctamente!");
      setPedidos([]);
      localStorage.removeItem("carrito_mesa");
      setMostrarCarrito(false);
      alVolver();
    } catch (err) {
      console.error("Error inesperado:", err);
      alert("Ocurrió un error inesperado.");
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
          {" "}
          ← Atrás{" "}
        </button>
        <h2>{categoria?.nombre?.toUpperCase()}</h2>
      </header>

      <div className="formulario-edicion">
        {productos.map((prod) => (
          <div
            key={prod.id}
            className={`item-editar ${prod.stock <= 0 ? "sin-stock" : ""}`}
          >

            {/* 1. LA FOTO VA PRIMERO (A la izquierda) */}
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
    </div>
  );
}

export default OpcionesPedidos;
