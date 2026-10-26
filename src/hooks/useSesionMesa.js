import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { COLECCION_SESIONES } from "../lib/pedidos";

export const SESION = Object.freeze({
  CARGANDO: "cargando",
  LIBRE: "libre", // nadie hizo pedidos: cualquiera puede usar el QR
  MIA: "mia", // este dispositivo ya hizo el primer pedido
  OCUPADA: "ocupada", // otro dispositivo tiene la mesa
  ERROR: "error",
});

/**
 * Escucha en vivo quién es el dueño de la mesa.
 * El dueño se identifica con el uid de la sesión anónima de Firebase, que el navegador
 * conserva al cerrar y volver a abrir la página.
 */
export function useSesionMesa(mesa) {
  const [datos, setDatos] = useState({ mesa: null, estado: SESION.CARGANDO });

  useEffect(() => {
    return onSnapshot(
      doc(db, COLECCION_SESIONES, String(mesa)),
      (snap) => {
        const uid = auth.currentUser?.uid;
        const estado = !snap.exists()
          ? SESION.LIBRE
          : snap.data().uid === uid
            ? SESION.MIA
            : SESION.OCUPADA;
        setDatos({ mesa, estado });
      },
      (error) => {
        console.error("Error al leer la sesión de la mesa:", error);
        setDatos({ mesa, estado: SESION.ERROR });
      },
    );
  }, [mesa]);

  return datos.mesa === mesa ? datos.estado : SESION.CARGANDO;
}
