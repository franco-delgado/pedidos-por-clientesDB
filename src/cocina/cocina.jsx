import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./cocina.css";

function Cocina() {
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  //Estado para guardar los datos de completos de los pedidos
  const [pedidos, setPedidos] = useState([]);

  //Procesa los estados visuales de las mesas
  const procesarPedidos = (pedidos) => {
    const mapeo = object.forEntries(mesas.map((num) => [num, "libre"]));

    forEach((p) => {
      if (p.espacio === "pedidoNuevo" || p.espacio === "ocupada") {
        mapeo[p.mesa] = p.espacio;
      }
    });
    setEstadoMesas(mapeo);
  };

  const cargarPedidos = async () => {
    // Agregamos "cantidad-pedida" a la consulta
    const { data, error } = await supabase
      .from("pedidos_clientes")
      .select('mesa, "nombre-pedido", "cantidad-pedida", espacio'); // Usamos comillas si da error por los guiones

    if (error) {
      console.error("Error al cargar pedidos:", error);
      return;
    }

    if (data) {
      // 1. Guardamos la lista completa para renderizarla en la cocina
      setPedidos(data);
      // 2. Ejecutamos tu lógica mágica para el mapa de mesas
      procesarEstados(data);
    }
  };

  useEffect(() => {
    cargarPedidos();

    const canal = supabase
      .channel("room-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_clientes" },
        async () => {
          await cargarPedidos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
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
          {pedidos.map((pedido, index) => (
            <div className="pedidos" key={index}>
              <h3 className="h3-cocina">Mesa {pedido.mesa}</h3>
              <p className="nombre-pedido">
                <strong>Plato:</strong> {pedido["nombre-pedido"]}
              </p>
              <p className="cantidad-pedido">
                <strong>Cantidad:</strong> {pedido["cantidad-pedida"]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Cocina;
