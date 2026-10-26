import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLECCION_SESIONES } from "../lib/pedidos";

/** Mesas cuyo QR está en uso (uso: administración). Devuelve un Set de números de mesa. */
export function useSesionesActivas() {
  const [mesas, setMesas] = useState([]);

  useEffect(() => {
    return onSnapshot(
      collection(db, COLECCION_SESIONES),
      (snapshot) => setMesas(snapshot.docs.map((d) => Number(d.id))),
      (error) => console.error("Error escuchando sesiones de mesa:", error),
    );
  }, []);

  return useMemo(() => new Set(mesas), [mesas]);
}
