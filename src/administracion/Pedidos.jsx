// src/administracion/Pedidos.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import "./administracion.css";

function Pedidos({ setMesaSeleccionada }) {
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const navigate = useNavigate();
  const location = useLocation();

  // Tomamos el estado que nos envió Administracion.jsx, o iniciamos vacío si no hay
  const [estadoMesas, setEstadoMesas] = useState(
    location.state?.estadoMesas || {},
  );

  // Opcional: Mantenemos una escucha simple en tiempo real SOLO para pintar los colores si cambia algo mientras estamos viendo esta pantalla.
  useEffect(() => {
    const canalPedidos = supabase
      .channel("vista-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const p = payload.new;
            const nombrePedido = p["nombre-pedido"] || p["nombre_pedido"] || "";
            const esRoja =
              p.espacio === "pedido_nuevo" ||
              p.espacio === 2 ||
              nombrePedido === "SOLICITUD DE CUENTA";

            setEstadoMesas((prev) => {
              const copia = { ...prev };
              if (esRoja) copia[p.mesa] = "pedido_nuevo";
              else if (p.espacio === "ocupada" || p.espacio === 1)
                copia[p.mesa] = "ocupada";
              else if (p.espacio === "libre") copia[p.mesa] = "libre";
              return copia;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalPedidos);
    };
  }, []);

  const irAMesa = async (num) => {
    if (typeof setMesaSeleccionada === "function") {
      setMesaSeleccionada(num);
    }
    setEstadoMesas((prev) => ({ ...prev, [num]: "ocupada" }));

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
