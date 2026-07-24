import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebise"; // Tu configuración habitual
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { emitirImpresionMesa } from "../../impresora/ticketService";
import "./DetallesMesa.css";

function DetalleMesa({ idMesa }) {
  const [datosPedido, setDatosPedido] = useState([]);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // Carga el detalle de la mesa desde Firestore
  const cargarDetalle = async () => {
    if (!idMesa) return;

    try {
      const q = query(
        collection(db, "pedidos_clientes"), 
        where("mesa", "==", Number(idMesa)) // Garantiza la comparación numérica o texto según cómo guardes el id
      );

      const querySnapshot = await getDocs(q);
      
      const listaPedidos = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Si no devolvió resultados intentando como número, intenta la búsqueda con string por seguridad
      if (listaPedidos.length === 0) {
        const qString = query(
          collection(db, "pedidos_clientes"),
          where("mesa", "==", String(idMesa))
        );
        const querySnapshotString = await getDocs(qString);
        const listaPedidosString = querySnapshotString.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setDatosPedido(listaPedidosString);
      } else {
        setDatosPedido(listaPedidos);
      }

    } catch (error) {
      console.error("Error al cargar el detalle de la mesa desde Firestore:", error);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [idMesa]);

  const calcularTotalMesa = () => {
    return datosPedido.reduce((acumulador, item) => {
      const cantidad = Number(item["cantidad_pedida"]) || 0;
      const precio = Number(item["precio_unitario"]) || 0;
      return acumulador + precio * cantidad;
    }, 0);
  };

  const gestionarPago = async () => {
    if (datosPedido.length === 0) return;

    const totalMesa = calcularTotalMesa();

    const quiereImprimir = window.confirm(
      "¿Deseas imprimir el ticket de consumo para esta mesa?"
    );

    if (quiereImprimir) {
      try {
        emitirImpresionMesa(idMesa, datosPedido, totalMesa);
      } catch (err) {
        console.error("Error al generar la impresión del ticket:", err);
        const procederSinTicket = window.confirm(
          "Ocurrió un problema con la impresora. ¿Deseas proceder con el cobro en caja igualmente?"
        );
        if (!procederSinTicket) return;
      }
    }

    const confirmar = window.confirm(
      `¿Estás seguro de cobrar el total de $${totalMesa} y vaciar la mesa ${idMesa}?`
    );
    if (!confirmar) return;

    setCargando(true);

    try {
      // 1. Registrar las ventas en la colección 'caja'
      const promesasInsertar = datosPedido.map((item) => {
        const cantidad = Number(item["cantidad_pedida"]) || 0;
        const precioUnitario = Number(item["precio_unitario"]) || 0;

        return addDoc(collection(db, "caja"), {
          nombre_pedido: item["nombre-pedido"] || item["nombre_pedido"],
          precio_pedido: precioUnitario * cantidad,
          cantidad_pedido: cantidad,
          mesa: Number(idMesa),
          fecha: new Date()
        });
      });

      await Promise.all(promesasInsertar);

      // 2. VACIAR LA MESA: Borra cada documento de pedido de la colección 'pedidos_clientes'
      const promesasEliminar = datosPedido.map((item) => {
        return deleteDoc(doc(db, "pedidos_clientes", item.id));
      });

      await Promise.all(promesasEliminar);

      alert("¡Cuenta cobrada con éxito y mesa vaciada!");
      setDatosPedido([]);
      
      // 3. Redirigir al panel de pedidos para ver la mesa libre
      navigate("/Pedidos");

    } catch (error) {
      console.error("Error en el proceso de cobro:", error);
      alert("Hubo un error al procesar el pago. Por favor revisá la consola.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2>Detalle de Mesa {idMesa}</h2>

      {datosPedido.length > 0 ? (
        <div>
          {datosPedido.map((item, i) => {
            const cantidad = Number(item["cantidad_pedida"]) || 0;
            const precio = Number(item["precio_unitario"]) || 0;
            return (
              <div key={i}>
                <p>
                  {cantidad}x {item["nombre-pedido"] || item["nombre_pedido"]} ${precio}
                  <span style={{ color: "gray" }}>
                    {" "}
                    (Subtotal: ${cantidad * precio})
                  </span>
                </p>
              </div>
            );
          })}

          <hr />
          <p style={{ fontSize: "1.2em" }}>
            <strong>Total a Pagar:</strong> ${calcularTotalMesa().toFixed(2)}
          </p>

          <button
            onClick={gestionarPago}
            disabled={cargando}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              width: "100%",
              marginTop: "10px",
            }}
          >
            {cargando ? "Procesando..." : "Cobrar Cuenta y Vaciar Mesa"}
          </button>
        </div>
      ) : (
        <p>No hay pedidos pendientes para esta mesa.</p>
      )}
    </div>
  );
}

export default DetalleMesa;