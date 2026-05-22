import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./administracion.css";

function Pedidos({ setMesaSeleccionada }) {
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const [estadoMesas, setEstadoMesas] = useState({});
  const navigate = useNavigate();

  const esAlertaRoja = (p) =>
    p.espacio === "pedido_nuevo" ||
    p.espacio === 2 ||
    p["nombre-pedido"] === "SOLICITUD DE CUENTA";

  const procesarEstados = (datos) => {
    const mapeo = Object.fromEntries(mesas.map((num) => [num, "libre"]));
    datos.forEach((p) => {
      if (mapeo[p.mesa] === "pedido_nuevo") return;
      if (esAlertaRoja(p)) mapeo[p.mesa] = "pedido_nuevo";
      else if (p.espacio === "ocupada" || p.espacio === 1)
        mapeo[p.mesa] = "ocupada";
    });
    setEstadoMesas(mapeo);
  };

  const cargarPedidos = async () => {
    const { data, error } = await supabase
      .from("pedidos_clientes")
      .select("mesa, nombre-pedido, espacio");
    if (!error && data) procesarEstados(data);
  };

  // Se eliminó el useEffect del sonido.
  // Ahora este useEffect solo gestiona la carga inicial y la suscripción en tiempo real para refrescar la pantalla.
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

  const irAMesa = async (num) => {
    setMesaSeleccionada(num);

    // CORRECCIÓN: Se cambió .not("nombre-pedido", "eq", ...) por .neq()
    // Esto evita que tire error de argumentos inválidos en el cliente de Supabase.
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
