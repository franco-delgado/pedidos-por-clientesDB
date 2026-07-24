// src/administracion/Pedidos.jsx
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebise"; 
import { 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  where, 
  getDocs,
  writeBatch 
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import "./administracion.css";

function Pedidos({ setMesaSeleccionada }) {
  const mesas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const navigate = useNavigate();
  const location = useLocation();

  // Tomamos el estado que nos envió Administracion.jsx, o iniciamos vacío si no hay
  const [estadoMesas, setEstadoMesas] = useState(
    location.state?.estadoMesas || {},
  );

  // Escucha activa en TIEMPO REAL con onSnapshot de Firebase
  useEffect(() => {
    const q = collection(db, "pedidos_clientes");

    const desuscribir = onSnapshot(q, (snapshot) => {
      setEstadoMesas((prev) => {
        const copia = { ...prev };

        snapshot.docChanges().forEach((change) => {
          const p = change.doc.data();

          if (change.type === "added" || change.type === "modified") {
            const nombrePedido = p["nombre-pedido"] || p["nombre_pedido"] || "";
            
            const esRoja =
              p.espacio === "pedido_nuevo" ||
              p.espacio === 2 ||
              nombrePedido === "SOLICITUD DE CUENTA";

            if (esRoja) {
              copia[p.mesa] = "pedido_nuevo";
            } else if (p.espacio === "ocupada" || p.espacio === 1) {
              copia[p.mesa] = "ocupada";
            } else if (p.espacio === "libre") {
              copia[p.mesa] = "libre";
            }
          } 

          // MANEJAR DOCUMENTOS ELIMINADOS
          // Al vaciar los pedidos de la mesa desde DetalleMesa, la devolvemos a 'libre'
          if (change.type === "removed") {
            copia[p.mesa] = "libre";
          }
        });

        return copia;
      });
    });

    // Desuscribimos la escucha en tiempo real al desmontar para proteger los recursos
    return () => desuscribir();
  }, []);

  const irAMesa = async (num) => {
    if (typeof setMesaSeleccionada === "function") {
      setMesaSeleccionada(num);
    }
    setEstadoMesas((prev) => ({ ...prev, [num]: "ocupada" }));

    try {
      // Buscamos los documentos activos que pertenecen a la mesa seleccionada
      const q = query(
        collection(db, "pedidos_clientes"),
        where("mesa", "==", num)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Inicializamos un lote (Batch) para procesar todas las actualizaciones juntas
        const batch = writeBatch(db);
        let hayCambios = false;

        querySnapshot.docs.forEach((documento) => {
          const datosDoc = documento.data();
          const nombrePedido = datosDoc["nombre-pedido"] || datosDoc["nombre_pedido"] || "";

          // Excluimos las solicitudes de cuenta del cambio automático según las reglas de tu app
          if (nombrePedido !== "SOLICITUD DE CUENTA") {
            const docRef = doc(db, "pedidos_clientes", documento.id);
            batch.update(docRef, { espacio: "ocupada" });
            hayCambios = true;
          }
        });

        // Solo impactamos la base de datos si encontramos registros válidos para actualizar
        if (hayCambios) {
          await batch.commit();
        }
      }

    } catch (error) {
      console.error("Error al actualizar el estado de la mesa mediante lote en Firebase:", error);
    }

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