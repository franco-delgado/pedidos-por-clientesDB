import React, { useState, useEffect } from "react";
// Importamos la instancia de la base de datos de tu archivo de configuración central
import { db } from "../lib/firebise";
// Importamos los métodos en tiempo real de Firestore
import { collection, onSnapshot } from "firebase/firestore";
import "./cocina.css";

function Cocina() {
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  
  // Estado para guardar los datos completos de los pedidos
  const [pedidos, setPedidos] = useState([]);
  // Añadimos el estado que faltaba definir en tu componente original para evitar errores
  const [estadoMesas, setEstadoMesas] = useState({});

  // Lógica para procesar los estados visuales de las mesas (si la usás en los estilos)
  const procesarEstados = (listaPedidos) => {
    const mapeo = Object.fromEntries(mesas.map((num) => [num, "libre"]));

    listaPedidos.forEach((p) => {
      // Validamos tanto el formato viejo como el nuevo estandarizado
      const estado = p.espacio;
      if (estado === "pedido_nuevo" || estado === "pedidoNuevo" || estado === "ocupada") {
        mapeo[p.mesa] = estado;
      }
    });
    setEstadoMesas(mapeo);
  };

  // --- ESCUCHA EN TIEMPO REAL CON FIRESTORE ---
  useEffect(() => {
    const coleccionRef = collection(db, "pedidos_clientes");

    // onSnapshot se ejecuta inmediatamente y cada vez que cambia la colección
    const desuscribir = onSnapshot(coleccionRef, (snapshot) => {
      const listaPedidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 1. Guardamos la lista en tiempo real para renderizarla en la cocina
      setPedidos(listaPedidos);
      
      // 2. Ejecutamos tu lógica para el mapa de mesas
      procesarEstados(listaPedidos);
    }, (error) => {
      console.error("Error escuchando cambios en pedidos de cocina:", error);
    });

    // Limpieza del listener al desmontar el componente
    return () => desuscribir();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Pantalla de Cocina</h1>

      <hr />

      {/* SECCIÓN DE PEDIDOS ACTIVOS */}
      <h2>Pedidos en Cola</h2>
      {pedidos.length === 0 ? (
        <p>No hay pedidos pendientes en este momento.</p>
      ) : (
        <div className="pedidos-container">
          {pedidos.map((pedido) => (
            <div className="pedidos" key={pedido.id}>
              <h3 className="h3-cocina">Mesa {pedido.mesa}</h3>
              <p className="nombre-pedido">
                {/* Soportamos el campo estandarizado y el anterior por compatibilidad */}
                <strong>Plato:</strong> {pedido.nombre_pedido || pedido["nombre-pedido"]}
              </p>
              <p className="cantidad-pedido">
                {/* Soportamos el campo estandarizado y el anterior por compatibilidad */}
                <strong>Cantidad:</strong> {pedido.cantidad_pedida || pedido["cantidad-pedida"]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Cocina;