import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { MESAS } from "../../config";
import { formatearDinero } from "../../lib/pedidos";
import { useToast } from "../../hooks/toastContext";

const LOTE_MAXIMO = 400; // Firestore admite hasta 500 operaciones por lote

export default function Caja() {
  const toast = useToast();
  const [ventas, setVentas] = useState(null); // null = cargando
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    return onSnapshot(
      collection(db, "caja"),
      (snapshot) => setVentas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => {
        console.error("Error al cargar la caja:", error);
        toast.mostrar("No se pudo leer la caja. Revisá las Reglas de Firestore.", "error");
        setVentas([]);
      },
    );
  }, [toast]);

  const { porMesa, total, unidades, ranking } = useMemo(() => {
    const porMesa = {};
    const productos = {};
    let total = 0;
    let unidades = 0;

    (ventas || []).forEach((v) => {
      // precio_pedido ya es el TOTAL de la línea (precio unitario × cantidad)
      const monto = Number(v.precio_pedido) || 0;
      const cantidad = Number(v.cantidad_pedido) || 0;
      porMesa[v.mesa] = (porMesa[v.mesa] || 0) + monto;
      total += monto;
      unidades += cantidad;

      const nombre = v.nombre_pedido || "Sin nombre";
      productos[nombre] = productos[nombre] || { nombre, cantidad: 0, monto: 0 };
      productos[nombre].cantidad += cantidad;
      productos[nombre].monto += monto;
    });

    const ranking = Object.values(productos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);

    return { porMesa, total, unidades, ranking };
  }, [ventas]);

  const exportarCSV = () => {
    const filas = [["Fecha", "Mesa", "Producto", "Cantidad", "Total"]];
    [...(ventas || [])]
      .sort((a, b) => (a.fecha?.toMillis?.() ?? 0) - (b.fecha?.toMillis?.() ?? 0))
      .forEach((v) => {
        const fecha = v.fecha?.toDate?.().toLocaleString("es-AR") ?? "";
        filas.push([fecha, v.mesa, v.nombre_pedido, v.cantidad_pedido, v.precio_pedido]);
      });

    const texto = filas
      .map((fila) => fila.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + texto], { type: "text/csv;charset=utf-8" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `caja-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  };

  const vaciarCaja = async () => {
    if (!ventas || ventas.length === 0) return;
    const ok = window.confirm(
      "¿Cerrar la caja? Se BORRARÁ todo el historial de ventas y no se puede deshacer.\n\nTip: exportá el CSV antes de continuar.",
    );
    if (!ok) return;

    setBorrando(true);
    try {
      for (let i = 0; i < ventas.length; i += LOTE_MAXIMO) {
        const lote = writeBatch(db);
        ventas.slice(i, i + LOTE_MAXIMO).forEach((v) => lote.delete(doc(db, "caja", v.id)));
        await lote.commit();
      }
      toast.mostrar("Caja cerrada: historial eliminado.", "ok");
    } catch (error) {
      console.error("Error al vaciar la caja:", error);
      toast.mostrar("No se pudo vaciar la caja. Revisá los permisos de borrado.", "error");
    } finally {
      setBorrando(false);
    }
  };

  if (ventas === null) return <div className="spinner" aria-label="Cargando" />;

  return (
    <>
      <header className="admin-titulo">
        <h1>Caja</h1>
        <div className="acciones-fila">
          <button className="btn btn-outline" onClick={exportarCSV} disabled={ventas.length === 0}>
            ⬇️ Exportar CSV
          </button>
          <button className="btn btn-danger" onClick={vaciarCaja} disabled={ventas.length === 0 || borrando}>
            {borrando ? "Borrando…" : "Cerrar caja"}
          </button>
        </div>
      </header>

      <section className="kpis">
        <div className="card kpi kpi-principal">
          <span className="kpi-label">Total general</span>
          <strong className="kpi-valor">{formatearDinero(total)}</strong>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Unidades vendidas</span>
          <strong className="kpi-valor">{unidades}</strong>
        </div>
      </section>

      <h2 className="subtitulo">Por mesa</h2>
      <div className="caja-mesas">
        {MESAS.map((num) => (
          <div key={num} className={`card caja-mesa ${porMesa[num] ? "" : "caja-mesa-vacia"}`}>
            <span className="texto-suave">Mesa {num}</span>
            <strong>{formatearDinero(porMesa[num] || 0)}</strong>
          </div>
        ))}
      </div>

      {ranking.length > 0 && (
        <>
          <h2 className="subtitulo">Lo más vendido</h2>
          <section className="card ranking">
            {ranking.map((p, i) => (
              <div key={p.nombre} className="ranking-fila">
                <span className="ranking-pos">{i + 1}</span>
                <span className="ranking-nombre">{p.nombre}</span>
                <span className="texto-suave">{p.cantidad} u.</span>
                <strong>{formatearDinero(p.monto)}</strong>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
