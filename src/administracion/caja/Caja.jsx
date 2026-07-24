import { useState, useEffect } from "react";
import { db } from "../../lib/firebise"; // Mantenemos tu ruta al archivo de configuración
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";

function Administracion() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Función para traer el historial de cobros desde Firebase
  const cargarVentas = async () => {
    try {
      setCargando(true);
      
      // 1. Obtenemos la referencia directa a la colección "caja"
      const querySnapshot = await getDocs(collection(db, "caja"));

      // 2. Mapeamos los documentos para construir el array de objetos
      const listaVentas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 3. Guardamos las ventas en el estado
      setVentas(listaVentas);

    } catch (error) {
      console.error("Error al cargar los datos de caja:", error);
      alert(
        "No se pudieron cargar las ventas. Revisá las Reglas de Seguridad (Rules) de la colección 'caja' en Firebase."
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
    const numeroMesa = curr.mesa; 
    // Ojo acá: si en Firebase migraste los campos con guiones modificá estos strings por "cantidad-pedido", etc.
    const cantidad = Number(curr.cantidad_pedido) || 0;
    const precio = Number(curr.precio_pedido) || 0;
    const subtotalRegistro = cantidad * precio;

    acc[numeroMesa] = (acc[numeroMesa] || 0) + subtotalRegistro;
    return acc;
  }, {});

  // Suma total histórica de todas las mesas juntas
  const totalFinal = Object.values(totalesPorMesa).reduce((a, b) => a + b, 0);

  // Función para vaciar por completo el historial de caja en Firebase
  const eliminarHistorialCaja = async () => {
    const confirmar = window.confirm(
      "¿ESTÁS SEGURO? Esta acción borrará TODO el historial de recaudación de la caja definitivamente.",
    );
    if (!confirmar) return;

    try {
      setCargando(true);

      // 1. Traemos todos los documentos actuales de la colección "caja"
      const querySnapshot = await getDocs(collection(db, "caja"));
      
      if (querySnapshot.empty) {
        alert("La caja ya está vacía.");
        return;
      }

      // 2. Usamos un Batch (lote) para borrar todos los documentos de forma eficiente y en una sola operación
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach((documento) => {
        const docRef = doc(db, "caja", documento.id);
        batch.delete(docRef);
      });

      // 3. Impactamos los borrados en Firebase
      await batch.commit();

      alert("Historial de caja eliminado de Firebase exitosamente.");
      setVentas([]); // Vaciamos el estado local de la app
    } catch (error) {
      console.error("Error al eliminar la caja:", error);
      alert(
        "No se pudo eliminar el historial. Comprobá las Reglas de Seguridad (Rules) para permisos de DELETE en Firebase.",
      );
    } finally {
      setCargando(false);
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
        Procesando datos de caja...
      </p>
    );

  return (
    <div className="administracion-container">
      <header className="superior">
        <h1>TU BAR - Panel de Control</h1>
      </header>

      <div className="contenedor-mesas">
        {Array.from({ length: 13 }, (_, i) => {
          const numeroMesa = i + 1; 
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