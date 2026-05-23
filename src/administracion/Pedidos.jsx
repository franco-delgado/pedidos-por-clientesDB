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
    const nombrePedido = p["nombre-pedido"] || p["nombre_pedido"] || "";
    return (
      p.espacio === "pedido_nuevo" ||
      p.espacio === 2 ||
      nombrePedido === "SOLICITUD DE CUENTA"
    );
  };

  const procesarEstados = (datos) => {
    if (!datos || !Array.isArray(datos)) return;
    const mapeo = Object.fromEntries(mesas.map((num) => [num, "libre"]));

    datos.forEach((p) => {
      if (!p || p.mesa === undefined || p.mesa === null) return;
      if (!mapeo.hasOwnProperty(p.mesa)) return;

      // ELIMINADO EL BLOQUEO: Evaluamos el estado real más crítico actual
      if (esAlertaRoja(p)) {
        mapeo[p.mesa] = "pedido_nuevo";
      } else if (p.espacio === "ocupada" || p.espacio === 1) {
        // Solo cambiamos a ocupada si no estaba previamente marcada como pedido nuevo en este bucle
        if (mapeo[p.mesa] !== "pedido_nuevo") {
          mapeo[p.mesa] = "ocupada";
        }
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
    cargarPedidos();

    const canal = supabase
      .channel("room-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          try {
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              const nuevoPedido = payload.new;

              if (
                nuevoPedido &&
                typeof nuevoPedido === "object" &&
                "mesa" in nuevoPedido
              ) {
                const mesaId = nuevoPedido.mesa;

                setEstadoMesas((prevEstado) => {
                  const nuevoEstado = { ...prevEstado };

                  // ELIMINADO EL IF BLOQUEADOR: Ahora permitimos actualizar el estado directamente
                  if (esAlertaRoja(nuevoPedido)) {
                    nuevoEstado[mesaId] = "pedido_nuevo";
                  } else if (
                    nuevoPedido.espacio === "ocupada" ||
                    nuevoPedido.espacio === 1
                  ) {
                    nuevoEstado[mesaId] = "ocupada";
                  } else if (nuevoPedido.espacio === "libre") {
                    nuevoEstado[mesaId] = "libre";
                  }

                  return nuevoEstado;
                });
              }
            } else {
              cargarPedidos();
            }
          } catch (error) {
            console.error("Error procesando tiempo real en móvil:", error);
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

    // Forzamos el cambio visual en el estado local de inmediato (Optimistic UI)
    // para que la app se sienta instantánea en el celular antes de viajar a la otra pantalla
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
