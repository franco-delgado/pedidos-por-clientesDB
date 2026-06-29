import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

// Importación de componentes de Clientes y Administración
import Clientes from "./clientes/Clientes";
import Administracion from "./administracion/Administracion";
import Precios from "./administracion/Precios";
import Pedidos from "./administracion/Pedidos";
import Caja from "./administracion/caja/Caja";
import ModificarOpciones from "./administracion/modificarOpciones";
import DetalleMesa from "./administracion/mesas/DetalleMesa";
import Cocina from "./cocina/cocina";

// MODIFICACIÓN TEMPORAL: Acepta cualquier cambio para asegurar que el canal dispare la alerta
const esAlertaRoja = (p) => {
  return true;
};

// Componente para el botón de volver (reutilizable en todas las rutas)
const BotonVolver = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      style={{ margin: "10px", padding: "5px 15px", cursor: "pointer" }}
    >
      ← Atrás
    </button>
  );
};

// Pantalla inicial de bienvenida
function MenuPrincipal() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <a
        href="https://franco-delgado.github.io/delgadowebs/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          textDecoration: "none",
          color: "black",
          backgroundColor: "#efefef",
          marginBottom: "20px",
          padding: "5px 15px",
          border: "1px solid #767676",
          borderRadius: "2px",
        }}
      >
        REGRESAR A LA PAGINA PRINCIPAL
      </a>
      <h2>BIENVENIDO</h2>
      <p>Seleccione su perfil para continuar:</p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <button onClick={() => navigate("/administracion")}>
          Ser Administrator
        </button>
        {/* Cambiado a /clientes/8 de forma temporal para desarrollo si entran desde el menú principal */}
        <button onClick={() => navigate("/clientes/8")}>Ser Cliente</button>
        <button onClick={() => navigate("/cocina")}>Ir a Cocina</button>
      </div>
    </div>
  );
}

function SeleccionePerfil() {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  // Escucha global con diagnósticos reforzados
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const canal = supabase
      .channel("alertas-visuales-globales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos_clientes" },
        (payload) => {
          console.log(
            "⚡ ¡Supabase envió datos en vivo! Payload completo:",
            payload,
          );

          const nuevoMovimiento = payload.new;

          if (nuevoMovimiento) {
            if (Notification.permission === "granted") {
              const titulo = `🚨 ¡Cambio en Mesa ${nuevoMovimiento.mesa || "?"}!`;
              const opciones = {
                body: `Pedido: ${nuevoMovimiento["nombre-pedido"] || "Actualización de estado"}`,
                icon: "/favicon.svg",
                tag: "pedido-alerta",
                renotify: true,
              };

              new Notification(titulo, opciones);
            } else {
              console.log(
                "⚠️ El permiso de notificación no está otorgado. Estado actual:",
                Notification.permission,
              );
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Estado de la conexión Realtime:", status);
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ruta Principal */}
        <Route path="/" element={<MenuPrincipal />} />

        {/* 2. Ruta para el Cliente CORREGIDA: Se añade /:idMesa */}
        <Route
          path="/clientes/:idMesa"
          element={
            <>
              <BotonVolver />
              <Clientes />
            </>
          }
        />

        {/* 3. Ruta Panel de Administración */}
        <Route
          path="/administracion"
          element={
            <>
              <BotonVolver />
              <Administracion />
            </>
          }
        />

        {/* 4. Ruta de Pedidos */}
        <Route
          path="/pedidos"
          element={
            <>
              <BotonVolver />
              <Pedidos setMesaSeleccionada={setMesaSeleccionada} />
            </>
          }
        />

        {/* 5. Detalle de la Mesa seleccionada */}
        <Route
          path="/DetalleMesas"
          element={
            <>
              <BotonVolver />
              <DetalleMesa idMesa={mesaSeleccionada} />
            </>
          }
        />

        {/* Otras rutas administrativas */}
        <Route
          path="/precios"
          element={
            <>
              <BotonVolver />
              <Precios />
            </>
          }
        />
        <Route
          path="/caja"
          element={
            <>
              <BotonVolver />
              <Caja />
            </>
          }
        />
        <Route
          path="/modificar-opciones"
          element={
            <>
              <BotonVolver />
              <ModificarOpciones />
            </>
          }
        />
        {/* Ruta Panel de Cocina */}
        <Route
          path="/cocina"
          element={
            <>
              <BotonVolver />
              <Cocina />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default SeleccionePerfil;
