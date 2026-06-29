// src/administracion/Administracion.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// Ruta absoluta apuntando a tu archivo en la carpeta 'public'
const archivoAudio = "/alerta.mp3";

const esAlertaRoja = (p) => {
  if (!p) return false;
  const nombrePedido = p["nombre-pedido"] || p["nombre_pedido"] || "";
  return (
    p.espacio === "pedido_nuevo" ||
    p.espacio === 2 ||
    nombrePedido === "SOLICITUD DE CUENTA"
  );
};

function Administracion() {
  const navigate = useNavigate();
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  // ESTADO GLOBAL DE LAS MESAS (VIVE AQUÍ)
  const [estadoMesas, setEstadoMesas] = useState({});
  const audioRef = useRef(new Audio(archivoAudio));

  const reproducirAlerta = () => {
    try {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) => console.log("Audio esperando interacción activa:", e));
    } catch (audioError) {
      console.error("Error al reproducir el archivo de audio:", audioError);
    }
  };

  const cargarPedidosGlobal = async () => {
    const { data, error } = await supabase
      .from("pedidos_clientes")
      .select("mesa, nombre-pedido, espacio");

    if (!error && data) {
      const mapeo = Object.fromEntries(mesas.map((num) => [num, "libre"]));
      data.forEach((p) => {
        if (!p || p.mesa === undefined || p.mesa === null) return;
        if (esAlertaRoja(p)) {
          mapeo[p.mesa] = "pedido_nuevo";
        } else if (p.espacio === "ocupada" || p.espacio === 1) {
          if (mapeo[p.mesa] !== "pedido_nuevo") {
            mapeo[p.mesa] = "ocupada";
          }
        }
      });
      setEstadoMesas(mapeo);
    }
  };

  useEffect(() => {
    // Inicializar datos
    cargarPedidosGlobal();

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Desbloqueo de audio para móviles (iOS/Android)
    const desbloquearAudioEnMovil = () => {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          limpiarEventosDesbloqueo();
          console.log("Canal de audio autorizado.");
        })
        .catch(() => {});
    };

    const limpiarEventosDesbloqueo = () => {
      document.removeEventListener("click", desbloquearAudioEnMovil);
      document.removeEventListener("touchstart", desbloquearAudioEnMovil);
    };

    document.addEventListener("click", desbloquearAudioEnMovil);
    document.addEventListener("touchstart", desbloquearAudioEnMovil);

    // ESCUCHA PERSISTENTE: Se ejecuta siempre en segundo plano en esta sección
    const canal = supabase
      .channel("alertas-globales-administracion")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const nuevoPedido = payload.new;
            if (nuevoPedido && "mesa" in nuevoPedido) {
              // SIEMPRE SONARÁ, no importa si estás viendo el menú principal o subventanas
              if (esAlertaRoja(nuevoPedido)) {
                reproducirAlerta();

                // Notificación nativa por si minimizaste el navegador
                if (document.hidden && Notification.permission === "granted") {
                  const nombrePedido =
                    nuevoPedido["nombre-pedido"] ||
                    nuevoPedido["nombre_pedido"] ||
                    "";
                  new Notification(`🚨 ¡Alerta Mesa ${nuevoPedido.mesa}!`, {
                    body:
                      nombrePedido === "SOLICITUD DE CUENTA"
                        ? "¡Piden la cuenta!"
                        : `Pedido: ${nombrePedido}`,
                    icon: "/favicono.svg",
                  });
                }
              }

              // Actualizamos el estado compartido de las mesas
              setEstadoMesas((prevEstado) => {
                const nuevoEstado = { ...prevEstado };
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
                return nuevoEstado;
              });
            }
          } else {
            cargarPedidosGlobal();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
      limpiarEventosDesbloqueo();
    };
  }, []);

  return (
    <>
      <h2>BIENVENIDO ADMINISTRADOR</h2>
      <p className="text">
        En la opcion MODIFICAR PRECIOS podra agregar opciones o modificar los
        precios...
      </p>

      <div className="contenedor-externo">
        <button className="boton" onClick={() => navigate("/precios")}>
          modificar precios
        </button>

        {/* CORRECCIÓN: Al navegar a pedidos, le enviamos los datos actuales de las mesas por 'state' */}
        <button
          className="boton"
          onClick={() => navigate("/pedidos", { state: { estadoMesas } })}
        >
          pedidos
        </button>

        <button className="boton" onClick={() => navigate("/caja")}>
          cerrar caja
        </button>
      </div>
    </>
  );
}

export default Administracion;
