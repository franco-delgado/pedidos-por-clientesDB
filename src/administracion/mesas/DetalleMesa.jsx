import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { emitirImpresionMesa } from "../../impresora/ticketService"; // <- IMPORTANTE: Importamos el nuevo servicio
import "./DetallesMesa.css";

function DetalleMesa({ idMesa }) {
  const [datosPedido, setDatosPedido] = useState([]);
  const [cargando, setCargando] = useState(false);

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

  const calcularTotalMesa = () => {
    return datosPedido.reduce((acumulador, item) => {
      const cantidad = Number(item["cantidad-pedida"]) || 0;
      const precio = Number(item["precio_unitario"]) || 0;
      return acumulador + precio * cantidad;
    }, 0);
  };

  const gestionarPago = async () => {
    if (datosPedido.length === 0) return;

    const totalMesa = calcularTotalMesa();

    // 1. Preguntamos primero si desea emitir el ticket
    const quiereImprimir = window.confirm(
      "¿Deseas imprimir el ticket de consumo para esta mesa?",
    );

    if (quiereImprimir) {
      try {
        emitirImpresionMesa(idMesa, datosPedido, totalMesa);
      } catch (err) {
        console.error("Error al generar la impresión del ticket:", err);
        const procederSinTicket = window.confirm(
          "Ocurrió un problema con la impresora. ¿Deseas proceder con el cobro en caja igualmente?",
        );
        // Si hay error en la impresora y el usuario cancela, frenamos todo
        if (!procederSinTicket) return;
      }
    }

    // 2. Ahora sí, confirmamos el cobro definitivo y vaciado de mesa
    const confirmar = window.confirm(
      `¿Estás seguro de cobrar el total de $${totalMesa} y vaciar la mesa ${idMesa}?`,
    );
    if (!confirmar) return;

    setCargando(true);

    try {
      const filasCaja = datosPedido.map((item) => {
        const cantidad = Number(item["cantidad-pedida"]) || 0;
        const precioUnitario = Number(item["precio_unitario"]) || 0;

        return {
          nombre_pedido: item["nombre-pedido"],
          precio_pedido: precioUnitario * cantidad,
          cantidad_pedido: cantidad,
          mesa: Number(idMesa),
        };
      });

      // Insertar en la tabla caja
      const { error: errorInsert } = await supabase
        .from("caja")
        .insert(filasCaja);

      if (errorInsert) throw errorInsert;

      // Borrar pedidos de la mesa
      const { error: errorDelete } = await supabase
        .from("pedidos_clientes")
        .delete()
        .eq("mesa", idMesa);

      if (errorDelete) throw errorDelete;

      alert("¡Cuenta cobrada con éxito y registrada en caja!");
      setDatosPedido([]);
    } catch (error) {
      console.error("Error en el proceso de cobro:", error);
      alert("Hubo un error al procesar el pago. Por favor revisá la consola.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}
    >
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
