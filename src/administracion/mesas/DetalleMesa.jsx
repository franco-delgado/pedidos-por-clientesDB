import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./DetallesMesa.css";

function DetalleMesa({ idMesa }) {
  const [datosPedido, setDatosPedido] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Función para cargar los pedidos de la mesa
  const cargarDetalle = async () => {
    if (!idMesa) return;

    const { data, error } = await supabase
      .from("pedidos_clientes")
      .select("*")
      .eq("mesa", idMesa);

    if (data) setDatosPedido(data);
  };

  useEffect(() => {
    cargarDetalle();
  }, [idMesa]);

  // CORREGIDO: Ahora sí multiplica el precio por la cantidad pedida de cada producto
  const calcularTotalMesa = () => {
    return datosPedido.reduce((acumulador, item) => {
      const cantidad = Number(item["cantidad-pedida"]) || 0;
      const precio = Number(item["precio_unitario"]) || 0;
      return acumulador + (precio * cantidad); 
    }, 0);
  };

  // Función para procesar el pago, guardar en caja y limpiar la mesa
  const gestionarPago = async () => {
    if (datosPedido.length === 0) return;

    const confirmar = window.confirm(
      `¿Estás seguro de cobrar el total de $${calcularTotalMesa()} y vaciar la mesa ${idMesa}?`,
    );
    if (!confirmar) return;

    setCargando(true);

    try {
      // 1. Preparar las filas que vamos a insertar en la tabla 'caja'
      const filasCaja = datosPedido.map((item) => {
        const cantidad = Number(item["cantidad-pedida"]) || 0;
        const precioUnitario = Number(item["precio_unitario"]) || 0;

        return {
          nombre_pedido: item["nombre-pedido"],
          precio_pedido: precioUnitario * cantidad, // Guardamos el valor total real del item en caja
          cantidad_pedido: cantidad,
          mesa: Number(idMesa),
        };
      });

      // 2. Insertar registros en la tabla 'caja'
      const { error: errorInsert } = await supabase
        .from("caja")
        .insert(filasCaja);

      if (errorInsert) throw errorInsert;

      // 3. Si se guardó bien en caja, eliminamos los pedidos de esta mesa
      const { error: errorDelete } = await supabase
        .from("pedidos_clientes")
        .delete()
        .eq("mesa", idMesa);

      if (errorDelete) throw errorDelete;

      alert("¡Cuenta cobrada con éxito y registrada en caja!");

      // 4. Limpiamos el estado local para reflejar que la mesa quedó vacía
      setDatosPedido([]);
    } catch (error) {
      console.error("Error en el proceso de cobro:", error);
      alert("Hubo un error al procesar el pago. Por favor revisá la consola.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2>Detalle de Mesa {idMesa}</h2>

      {datosPedido.length > 0 ? (
        <div>
          {datosPedido.map((item, i) => {
            const cantidad = Number(item["cantidad-pedida"]) || 0;
            const precio = Number(item["precio_unitario"]) || 0;
            return (
              <div key={i}>
                <p>
                  {cantidad}x {item["nombre-pedido"]} ${precio}
                  <span style={{ color: "gray" }}>
                    {" "}
                    (Subtotal: ${cantidad * precio})
                  </span>
                </p>
              </div>
            );
          })}

          <hr />
          <p style={{ fontSize: "1.2em" }}>
            <strong>Total a Pagar:</strong> ${calcularTotalMesa().toFixed(2)}
          </p>

          {/* Botón para efectuar el cobro */}
          <button
            onClick={gestionarPago}
            disabled={cargando}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              width: "100%",
              marginTop: "10px",
            }}
          >
            {cargando ? "Procesando..." : "Cobrar Cuenta y Vaciar Mesa"}
          </button>
        </div>
      ) : (
        <p>No hay pedidos pendientes para esta mesa.</p>
      )}
    </div>
  );
}

export default DetalleMesa;