import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
// Importamos la instancia de Firestore desde tu archivo de configuración centralizado
import { db } from "./lib/firebise"; 
// Importamos las herramientas en tiempo real nativas de Firebase
import { collection, onSnapshot } from "firebase/firestore";

// Importación de componentes de Clientes y Administración
import Clientes from "./clientes/Clientes";
import Administracion from "./administracion/Administracion";
import Precios from "./administracion/Precios";
import Pedidos from "./administracion/Pedidos";
import Caja from "./administracion/caja/Caja";
import ModificarOpciones from "./administracion/modificarOpciones";
import DetalleMesa from "./administracion/mesas/DetalleMesa";
import Cocina from "./cocina/cocina";

// MODIFICACIÓN TEMPORAL: Mantenemos tu lógica de aceptar cualquier cambio para disparar la alerta
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
        <button onClick={() => navigate("/clientes/8")}>Ser Cliente</button>
        <button onClick={() => navigate("/cocina")}>Ir a Cocina</button>
      </div>
    </div>
  );
}

function SeleccionePerfil() {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  // Escucha global en segundo plano con onSnapshot de Firebase
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const coleccionRef = collection(db, "pedidos_clientes");

    // Escuchamos los cambios en la colección de forma persistente
    const desuscribir = onSnapshot(coleccionRef, (snapshot) => {
      console.log("⚡ ¡Firebase envió datos en vivo! Procesando cambios incrementales...");

      // Con docChanges evaluamos únicamente eventos que acaban de ocurrir en la red
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const nuevoMovimiento = change.doc.data();

          if (nuevoMovimiento && esAlertaRoja(nuevoMovimiento)) {
            if (Notification.permission === "granted") {
              const titulo = `🚨 ¡Cambio en Mesa ${nuevoMovimiento.mesa || "?"}!`;
              
              // Compatibilidad para leer indistintamente campos con guion medio o bajo de forma segura
              const nombrePedido = nuevoMovimiento["nombre_pedido"] || nuevoMovimiento["nombre-pedido"] || "Actualización de estado";

              const opciones = {
                body: `Pedido: ${nombrePedido}`,
                icon: "/favicon.svg",
                tag: "pedido-alerta",
                renotify: true,
              };

              new Notification(titulo, opciones);
            } else {
              console.log(
                "⚠️ El permiso de notificación no está otorgado. Estado actual:",
                Notification.permission
              );
            }
          }
        }
      });
    }, (error) => {
      console.error("Error en la escucha global de notificaciones:", error);
    });

    // Desuscribimos el canal de comunicación activa al desmontar la app
    return () => {
      desuscribir();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ruta Principal */}
        <Route path="/" element={<MenuPrincipal />} />

        {/* 2. Ruta para el Cliente */}
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