import React, { useState, useEffect } from "react";
// Importamos la instancia de la base de datos de tu archivo de configuración de Firebase
import { db } from "../lib/firebise"; 
// Importamos las funciones necesarias de Firestore
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import FooterComponent from "../FooterComponent";
import "./Clientes.css";

function Cuenta({ mesa, alVolver }) {
  const [productosPedidos, setProductosPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerConsumoMesa = async () => {
      try {
        const coleccionRef = collection(db, "pedidos_clientes");
        // Creamos la consulta equivalente a .eq("mesa", mesa)
        // Aseguramos que 'mesa' sea evaluado como número
        const consulta = query(coleccionRef, where("mesa", "==", Number(mesa)));
        const snapshot = await getDocs(consulta);

        const data = snapshot.docs.map((doc) => {
          const item = doc.data();
          return {
            id: doc.id,
            mesa: item.mesa,
            // Soporte dinámico para guión bajo o medio
            nombre_pedido: item["nombre_pedido"] || item["nombre-pedido"] || "",
            precio_unitario: item.precio_unitario || 0,
            cantidad_pedida: item["cantidad_pedida"] || item["cantidad-pedida"] || 1,
            espacio: item.espacio
          };
        });

        // Filtramos para no meter la propia solicitud de cuenta como un "plato cobrable" en el ticket
        const consumosReales = data.filter(p => p.nombre_pedido !== "SOLICITUD DE CUENTA");

        setProductosPedidos(consumosReales);
      } catch (error) {
        console.error("Error al obtener la cuenta de Firestore:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerConsumoMesa();
  }, [mesa]);

  const calcularTotal = () => {
    return productosPedidos.reduce((acc, item) => {
      const cantidad = item.cantidad_pedida;
      return acc + item.precio_unitario * cantidad;
    }, 0);
  };

  const gestionarPedirCuenta = async () => {
    try {
      // 1. Borrar datos guardados en la caché del navegador
      localStorage.clear(); 
      sessionStorage.clear(); 

      // 2. Enviar mensaje/alerta insertando un nuevo documento en Firestore
      const coleccionRef = collection(db, "pedidos_clientes");
      await addDoc(coleccionRef, {
        mesa: Number(mesa),
        nombre_pedido: "SOLICITUD DE CUENTA",
        precio_unitario: 0,
        cantidad_pedida: 1,
        espacio: "pedido_nuevo" // Campo clave para gatillar la alerta visual/sonora del administrador
      });

      // 3. Mostrar el cartel de confirmación al cliente
      alert("En un momento le entregamos la cuenta.");

      // Redirigir al menú o recargar la pantalla tras pedir la cuenta
      alVolver();
    } catch (error) {
      console.error("Error al solicitar la cuenta:", error.message);
      alert(
        "Hubo un problema al solicitar la cuenta. Por favor, avise a un mozo."
      );
    }
  };

  if (cargando) {
    return <div className="cuenta-cargando">Cargando cuenta...</div>;
  }

  return (
    <div className="cuenta-layout">
      <div className="cuenta-contenedor">
        <button onClick={alVolver} className="btn-volver">
          ← Volver al Menú
        </button>

        <header className="cuenta-header">
          <h2>Resumen de Cuenta - Mesa {mesa}</h2>
        </header>

        <main className="cuenta-principal">
          {productosPedidos.length === 0 ? (
            <p className="cuenta-vacia">
              Aún no has realizado ningún pedido en esta mesa.
            </p>
          ) : (
            <>
              <div className="ticket-contenedor">
                {productosPedidos.map((item) => (
                  <div key={item.id} className="ticket-item">
                    <div className="item-detalles">
                      <span className="item-nombre">{item.nombre_pedido}</span>
                      {item.cantidad_pedida > 1 && (
                        <span className="item-cantidad">
                          {" "}x{item.cantidad_pedida}
                        </span>
                      )}
                    </div>
                    <span className="item-precio">
                      $
                      {(
                        item.precio_unitario * item.cantidad_pedida
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}

                <div className="ticket-total">
                  <span>TOTAL:</span>
                  <span className="total-monto">
                    ${calcularTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <button onClick={gestionarPedirCuenta} className="btn-pedir-cuenta">
                🛎️ PEDIR CUENTA
              </button>
            </>
          )}
        </main>
      </div>
      
      {/* FooterComponent integrado correctamente dentro del flujo JSX */}
      <div className="footer">
        <FooterComponent />
      </div>
    </div>
  );
}

export default Cuenta;