// src/administracion/Administracion.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
// Importamos la referencia de la base de datos de tu archivo de configuración de Firebase
import { db } from "../lib/firebise"; 
// Importamos los módulos en tiempo real de Firestore
import { collection, getDocs, onSnapshot } from "firebase/firestore";

// Ruta absoluta apuntando a tu archivo en la carpeta 'public'
const archivoAudio = "/alerta.mp3";

const esAlertaRoja = (p) => {
  if (!p) return false;
  // En Firebase es una buena práctica usar guiones bajos (nombre_pedido)
  const nombrePedido = p["nombre_pedido"] || p["nombre-pedido"] || "";
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

  useEffect(() => {
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

    // ESCUCHA PERSISTENTE EN TIEMPO REAL CON FIRESTORE (onSnapshot)
    // Trae la carga inicial y se queda escuchando de forma eficiente cualquier cambio futuro.
    const coleccionRef = collection(db, "pedidos_clientes");
    
    const desuscribir = onSnapshot(coleccionRef, (snapshot) => {
      // Creamos un mapa inicializador con todas las mesas libres
      const mapeo = Object.fromEntries(mesas.map((num) => [num, "libre"]));
      
      // Evaluamos el estado completo de la colección de Firestore
      snapshot.docs.forEach((doc) => {
        const p = doc.data();
        if (!p || p.mesa === undefined || p.mesa === null) return;
        
        if (esAlertaRoja(p)) {
          mapeo[p.mesa] = "pedido_nuevo";
        } else if (p.espacio === "ocupada" || p.espacio === 1) {
          if (mapeo[p.mesa] !== "pedido_nuevo") {
            mapeo[p.mesa] = "ocupada";
          }
        }
      });

      // Verificamos si en los cambios (cambios incrementales) hubo una inserción o modificación de alerta roja
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const nuevoPedido = change.doc.data();
          
          if (esAlertaRoja(nuevoPedido)) {
            reproducirAlerta();

            // Notificación nativa por si minimizaste el navegador
            if (document.hidden && Notification.permission === "granted") {
              const nombrePedido = nuevoPedido["nombre_pedido"] || nuevoPedido["nombre-pedido"] || "";
              new Notification(`🚨 ¡Alerta Mesa ${nuevoPedido.mesa}!`, {
                body:
                  nombrePedido === "SOLICITUD DE CUENTA"
                    ? "¡Piden la cuenta!"
                    : `Pedido: ${nombrePedido}`,
                icon: "/favicono.svg",
              });
            }
          }
        }
      });

      // Actualizamos el estado con el nuevo mapeo procesado
      setEstadoMesas(mapeo);
    }, (error) => {
      console.error("Error en la escucha en tiempo real de Firestore:", error);
    });

    // LIMPIEZA DEL EFECTO
    return () => {
      desuscribir(); // Apaga el listener en tiempo real de Firestore al desmontar
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

        {/* Enviamos los datos actuales de las mesas por 'state' al modulo de pedidos */}
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