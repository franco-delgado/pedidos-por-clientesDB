import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Verifica que apunte bien a tu archivo de supabase
import Caja from "./caja/Caja";
import Pedidos from "./Pedidos";
import Precios from "./Precios";

// CORREGIDO: Ruta directa a la raíz pública
const sonidoAlerta = new Audio("../../public/alerta.mp3");
// CORREGIDO: Importación nativa de Vite para que resuelva la ruta del archivo sin fallos
import archivoAudio from "../../public/alerta.mp3";

// Instanciamos el audio usando el archivo importado

// Función auxiliar para detectar si el pedido es una alerta roja
const esAlertaRoja = (p) =>
  p.espacio === "pedido_nuevo" ||
  p.espacio === 2 ||
  p["nombre-pedido"] === "SOLICITUD DE CUENTA";

// Componente para el botón de volver (reutilizable)
const BotonVolver = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Volver</button>;
};

function Administracion() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Solicitar permiso para las notificaciones del sistema
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

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
    };
  }, []);

  const ejecutarAlerta = (pedido) => {
    // Reproducir sonido
    sonidoAlerta.currentTime = 0;
    sonidoAlerta
      .play()
      .catch((e) =>
        console.log(
          "Audio bloqueado por el navegador hasta que interactúes con la página:",
          e,
        ),
      );

    // Notificación de escritorio si está minimizado
    if (document.hidden && Notification.permission === "granted") {
      new Notification(`🚨 ¡Alerta Mesa ${pedido.mesa}!`, {
        body:
          pedido["nombre-pedido"] === "SOLICITUD DE CUENTA"
            ? "¡Están pidiendo la cuenta!"
            : `Nuevo pedido: ${pedido["nombre-pedido"] || "Ver detalles"}`,
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
