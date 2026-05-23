import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// Vite inyectará correctamente la base del sitio o la ruta local del WebView de Android
const archivoAudio = "./alerta.mp3";

// Función auxiliar para detectar si el pedido es una alerta roja
const esAlertaRoja = (p) => {
  if (!p) return false;
  // Protección para guiones medios o bajos según el formato de la base de datos
  const nombrePedido = p["nombre-pedido"] || p["nombre_pedido"] || "";
  return (
    p.espacio === "pedido_nuevo" ||
    p.espacio === 2 ||
    nombrePedido === "SOLICITUD DE CUENTA"
  );
};

// Componente para el botón de volver (reutilizable)
const BotonVolver = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Volver</button>;
};

function Administracion() {
  const navigate = useNavigate();

  // CORREGIDO: Usamos useRef para mantener una única instancia del audio con la ruta correcta
  const audioRef = useRef(new Audio(archivoAudio));

  useEffect(() => {
    // 1. Solicitar permiso para las notificaciones del sistema
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // TRUCO PARA MÓVILES: Desbloquear el canal de audio del celular al primer toque en la pantalla
    const desbloquearAudioEnMovil = () => {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause(); // Lo pausamos de inmediato, ya quedó autorizado por el navegador
          audioRef.current.currentTime = 0;
        })
        .catch((err) => console.log("Esperando interacción activa:", err));

      // Removemos el evento para que no se ejecute en cada clic posterior
      document.removeEventListener("click", desbloquearAudioEnMovil);
    };
    document.addEventListener("click", desbloquearAudioEnMovil);

    // 2. Escuchar cambios globales en tiempo real
    const canal = supabase
      .channel("alertas-administracion")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          const nuevoPedido = payload.new;
          if (esAlertaRoja(nuevoPedido)) {
            ejecutarAlerta(nuevoPedido);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          const pedidoModificado = payload.new;
          if (esAlertaRoja(pedidoModificado)) {
            ejecutarAlerta(pedidoModificado);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
      document.removeEventListener("click", desbloquearAudioEnMovil);
    };
  }, []);

  const ejecutarAlerta = (pedido) => {
    // CORREGIDO: Reproducir sonido usando la referencia mutada de forma segura
    try {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch((e) =>
          console.log(
            "Audio bloqueado por el navegador hasta que interactúes con la página:",
            e,
          ),
        );
    } catch (audioError) {
      console.error("Error al reproducir el archivo de audio:", audioError);
    }

    // Notificación de escritorio si está minimizado
    if (document.hidden && Notification.permission === "granted") {
      const nombrePedido =
        pedido["nombre-pedido"] || pedido["nombre_pedido"] || "";
      new Notification(`🚨 ¡Alerta Mesa ${pedido.mesa}!`, {
        body:
          nombrePedido === "SOLICITUD DE CUENTA"
            ? "¡Están pidiendo la cuenta!"
            : `Nuevo pedido: ${nombrePedido || "Ver detalles"}`,
        icon: "/favicon.svg",
      });
    }
  };

  return (
    <>
      <h2>BIENVENIDO ADMINISTRADOR</h2>
      <p className="text">
        En la opcion MODIFICAR PRECIOS podra agregar opciones o modificar los
        precios. En la opcion PEDIDOS usted podra ver los pedidos de los
        clientes si antes de llegar a este punto usted ya ingreso en la opcion
        SER CLIENTE podra ver su pedido. En la opcion cerrar caja podremos ver
        el total que se rea que se vendio por cada mesa en la jornada.
      </p>

      <div className="contenedor-externo">
        <button className="boton" onClick={() => navigate("/precios")}>
          modificar precios
        </button>
        <button className="boton" onClick={() => navigate("/pedidos")}>
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
