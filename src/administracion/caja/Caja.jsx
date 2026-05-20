import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; // Asegurate de que la ruta a tu archivo supabase sea la correcta

function Administracion() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Función para traer el historial de cobros desde Supabase
  const cargarVentas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase.from("caja").select("*");

      if (error) throw error;

      if (data) setVentas(data);
    } catch (error) {
      console.error("Error al cargar los datos de caja:", error);
      alert(
        "No se pudieron cargar las ventas. Revisá las políticas RLS de la tabla 'caja'.",
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  // LÓGICA: Sumamos los totales acumulados agrupándolos por número de mesa
  const totalesPorMesa = ventas.reduce((acc, curr) => {
    const numeroMesa = curr.mesa; // Es un número (ej: 5)
    const cantidad = Number(curr.cantidad_pedido) || 0;
    const precio = Number(curr.precio_pedido) || 0;
    const subtotalRegistro = cantidad * precio;

    acc[numeroMesa] = (acc[numeroMesa] || 0) + subtotalRegistro;
    return acc;
  }, {});

  // Suma total histórica de todas las mesas juntas
  const totalFinal = Object.values(totalesPorMesa).reduce((a, b) => a + b, 0);

  // Función para vaciar por completo el historial de caja
  const eliminarHistorialCaja = async () => {
    const confirmar = window.confirm(
      "¿ESTÁS SEGURO? Esta acción borrará TODO el historial de recaudación de la caja definitivamente.",
    );
    if (!confirmar) return;

    try {
      // Al hacer un delete sin .eq(), PostgreSQL podría bloquearlo por seguridad,
      // así que usamos un filtro que abarque a todos (id mayor a 0)
      const { error } = await supabase.from("caja").delete().gt("id", 0);

      if (error) throw error;

      alert("Historial de caja eliminado.");
      setVentas([]); // Vaciamos el estado local de la app
    } catch (error) {
      console.error("Error al eliminar la caja:", error);
      alert(
        "No se pudo eliminar el historial. Comprobá los permisos de DELETE en la tabla 'caja'.",
      );
    }
  };

  // Formateador de moneda argentina
  const formatearDinero = (valor) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(valor);

  if (cargando)
    return (
      <p style={{ textAlign: "center", marginTop: "5px" }}>
        Cargando datos de caja...
      </p>
    );

  return (
    <div className="administracion-container">
      <header className="superior">
        <h1>TU BAR - Panel de Control</h1>
      </header>

      <div className="contenedor-mesas">
        {/* Generamos las 13 mesas usando el índice numérico puro */}
        {Array.from({ length: 13 }, (_, i) => {
          const numeroMesa = i + 1; // 1, 2, 3... hasta 13
          const total = totalesPorMesa[numeroMesa] || 0;

          return (
            <div key={numeroMesa} className="subContenedor">
              <span className="nombre">MESA {numeroMesa}:</span>
              <span className="totalmesa">{formatearDinero(total)}</span>
            </div>
          );
        })}
      </div>

      <div className="contFinal">
        <p className="totalTexto">TOTAL GENERAL:</p>
        <p className="totalNum">{formatearDinero(totalFinal)}</p>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button className="boton-eliminar" onClick={eliminarHistorialCaja}>
          Eliminar Historial de Caja
        </button>
      </div>
    </div>
  );
}

export default Administracion;
