import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import FooterComponent from "../FooterComponent";
import "./Clientes.css";

function Cuenta({ mesa, alVolver }) {
  const [productosPedidos, setProductosPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerConsumoMesa = async () => {
      const { data, error } = await supabase
        .from("pedidos_clientes")
        .select("id, nombre-pedido, precio_unitario, cantidad-pedida")
        .eq("mesa", mesa);

      if (error) {
        console.error("Error al obtener la cuenta:", error);
      } else if (data) {
        setProductosPedidos(data);
      }
      setCargando(false);
    };

    obtenerConsumoMesa();
  }, [mesa]);

  const calcularTotal = () => {
    return productosPedidos.reduce((acc, item) => {
      const cantidad = item["cantidad-pedida"] || 1;
      return acc + item.precio_unitario * cantidad;
    }, 0);
  };

  const gestionarPedirCuenta = async () => {
    try {
      // 1. Borrar datos guardados en la caché del navegador
      localStorage.clear(); // Borra todo el localStorage
      sessionStorage.clear(); // Borra todo el sessionStorage

      // Si guardas datos específicos, puedes usar:
      // localStorage.removeItem("tu_clave");

      // 2. Enviar mensaje a Pedidos.jsx a través de Supabase
      // Insertamos una notificación para que el Panel de Control se entere en tiempo real
      const { error } = await supabase.from("pedidos_clientes").insert([
        {
          mesa: mesa,
          "nombre-pedido": "SOLICITUD DE CUENTA",
          precio_unitario: 0,
          "cantidad-pedida": 1,
        },
      ]);

      if (error) throw error;

      // 3. Mostrar el cartel de confirmación al cliente
      alert("En un momento le entregamos la cuenta.");

      // Opcional: Redirigir al menú o recargar la pantalla tras pedir la cuenta
      alVolver();
    } catch (error) {
      console.error("Error al solicitar la cuenta:", error.message);
      alert(
        "Hubo un problema al solicitar la cuenta. Por favor, avise a un mozo.",
      );
    }
  };

  if (cargando) {
    return <div className="cuenta-cargando">Cargando cuenta...</div>;
  }

  return (
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
                    <span className="item-nombre">{item["nombre-pedido"]}</span>
                    {item["cantidad-pedida"] > 1 && (
                      <span className="item-cantidad">
                        {" "}
                        x{item["cantidad-pedida"]}
                      </span>
                    )}
                  </div>
                  <span className="item-precio">
                    $
                    {(
                      item.precio_unitario * (item["cantidad-pedida"] || 1)
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
  );
  <div className="footer">
    <FooterComponent />
  </div>;
}

export default Cuenta;
