import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLECCION_PEDIDOS, normalizarPedido } from "../lib/pedidos";

/** Pedidos de UNA mesa en tiempo real (null = cargando). */
export function usePedidosMesa(mesa) {
  const [pedidos, setPedidos] = useState(null);

  useEffect(() => {
    const consulta = query(collection(db, COLECCION_PEDIDOS), where("mesa", "==", mesa));
    return onSnapshot(
      consulta,
      (snapshot) => {
        const lista = snapshot.docs
          .map((d) => normalizarPedido(d.id, d.data()))
          .sort((a, b) => (a.creadoMs ?? Infinity) - (b.creadoMs ?? Infinity));
        setPedidos(lista);
      },
      (error) => {
        console.error("Error al obtener los pedidos de la mesa:", error);
        setPedidos([]);
      },
    );
  }, [mesa]);

  return pedidos;
}
