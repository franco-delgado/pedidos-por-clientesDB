import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./administracion.css";

function Pedidos({ setMesaSeleccionada }) {
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const [estadoMesas, setEstadoMesas] = useState({});
  const navigate = useNavigate();

  const esAlertaRoja = (p) => {
    if (!p) return false;
    return (
      p.espacio === "pedido_nuevo" ||
      p.espacio === 2 ||
      p["nombre-pedido"] === "SOLICITUD DE CUENTA"
    );
  };

  const procesarEstados = (datos) => {
    if (!datos || !Array.isArray(datos)) return;
    const mapeo = Object.fromEntries(mesas.map((num) => [num, "libre"]));

    datos.forEach((p) => {
      if (!p || p.mesa === undefined || p.mesa === null) return;
      if (!mapeo.hasOwnProperty(p.mesa)) return;
      if (mapeo[p.mesa] === "pedido_nuevo") return;

      if (esAlertaRoja(p)) {
        mapeo[p.mesa] = "pedido_nuevo";
      } else if (p.espacio === "ocupada" || p.espacio === 1) {
        mapeo[p.mesa] = "ocupada";
      }
    });

    setEstadoMesas(mapeo);
  };

  const cargarPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos_clientes")
      .select("mesa, nombre-pedido, espacio");
    if (!error && data) procesarEstados(data);
  };

  useEffect(() => {
    // 1. Carga inicial de la página
    cargarPedidos();

    // 2. Escucha en tiempo real optimizada para evitar colgar el celular
    const canal = supabase
      .channel("room-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          // En lugar de hacer un 'await cargarPedidos()' que tilda el móvil,
          // manejamos el cambio de estado directamente con la información que envió Supabase
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const nuevoPedido = payload.new;

            if (nuevoPedido && nuevoPedido.mesa) {
              setEstadoMesas((prevEstado) => {
                const nuevoEstado = { ...prevEstado };

                // Aplicamos las mismas reglas de negocio de forma local e instantánea
                if (nuevoEstado[nuevoPedido.mesa] !== "pedido_nuevo") {
                  if (esAlertaRoja(nuevoPedido)) {
                    nuevoEstado[nuevoPedido.mesa] = "pedido_nuevo";
                  } else if (
                    nuevoPedido.espacio === "ocupada" ||
                    nuevoPedido.espacio === 1
                  ) {
                    nuevoEstado[nuevoPedido.mesa] = "ocupada";
                  } else if (nuevoPedido.espacio === "libre") {
                    nuevoEstado[nuevoPedido.mesa] = "libre";
                  }
                }
                return nuevoEstado;
              });
            }
          } else {
            // Si se borra un pedido o pasa algo raro, refrescamos de forma segura
            cargarPedidos();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const irAMesa = async (num) => {
    setMesaSeleccionada(num);

    await supabase
      .from("pedidos_clientes")
      .update({ espacio: "ocupada" })
      .eq("mesa", num)
      .neq("nombre-pedido", "SOLICITUD DE CUENTA");

    navigate("/DetalleMesas");
  };

  return (
    <div className="admin-page">
      <header className="superior">
        <h1>PANEL DE CONTROL - ADMINISTRACIÓN</h1>
      </header>
      <main className="grid-mesas">
        {mesas.map((num) => {
          const est = estadoMesas[num] || "libre";
          return (
            <div
              key={num}
              onClick={() => irAMesa(num)}
              className={`contenedor-mesa ${est}`}
            >
              <h3>MESA {num}</h3>
              <p className="texto-estado">
                {est === "libre" && "🟢 Libre"}
                {est === "ocupada" && "🟡 Ocupada"}
                {est === "pedido_nuevo" && "🔴 ¡NUEVO PEDIDO / CUENTA!"}
              </p>
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default Pedidos;
