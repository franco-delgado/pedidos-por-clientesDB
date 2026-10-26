import { useCallback, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MESAS } from "../config";
import { COLECCION_PEDIDOS, ESTADO, formatearDinero } from "../lib/pedidos";

const ETIQUETAS = {
  [ESTADO.LIBRE]: "Libre",
  [ESTADO.OCUPADA]: "Ocupada",
  [ESTADO.NUEVO]: "Nuevo pedido",
};

export default function Pedidos() {
  const navigate = useNavigate();
  const { pedidos, estadoMesas, cargando, sesiones } = useOutletContext();

  // Total, cantidad de ítems y si pidió la cuenta, por mesa
  const resumen = useMemo(() => {
    const r = Object.fromEntries(MESAS.map((n) => [n, { total: 0, items: 0, pideCuenta: false }]));
    pedidos.forEach((p) => {
      if (!r[p.mesa]) return;
      if (p.esCuenta) r[p.mesa].pideCuenta = true;
      else {
        r[p.mesa].total += p.subtotal;
        r[p.mesa].items += p.cantidad;
      }
    });
    return r;
  }, [pedidos]);

  // Una mesa con el QR en uso cuenta como ocupada aunque no tenga pedidos (se liberó el último ítem)
  const estadoDe = useCallback(
    (num) => {
      const estado = estadoMesas[num] || ESTADO.LIBRE;
      return estado === ESTADO.LIBRE && sesiones?.has(num) ? ESTADO.OCUPADA : estado;
    },
    [estadoMesas, sesiones],
  );

  const conteo = useMemo(
    () => ({
      libres: MESAS.filter((n) => estadoDe(n) === ESTADO.LIBRE).length,
      ocupadas: MESAS.filter((n) => estadoDe(n) === ESTADO.OCUPADA).length,
      alertas: MESAS.filter((n) => estadoMesas[n] === ESTADO.NUEVO).length,
    }),
    [estadoMesas, estadoDe],
  );

  // Al abrir la mesa se "reconocen" los pedidos nuevos (dejan de ser alerta).
  // La solicitud de cuenta sigue en rojo hasta que se cobra.
  const abrirMesa = async (num) => {
    navigate(`/administracion/mesas/${num}`);

    const nuevos = pedidos.filter((p) => p.mesa === num && p.esAlerta && !p.esCuenta);
    if (nuevos.length === 0) return;

    try {
      const lote = writeBatch(db);
      nuevos.forEach((p) => lote.update(doc(db, COLECCION_PEDIDOS, p.id), { espacio: ESTADO.OCUPADA }));
      await lote.commit();
    } catch (error) {
      console.error("No se pudieron marcar los pedidos como vistos:", error);
    }
  };

  return (
    <>
      <header className="admin-titulo">
        <h1>Mesas</h1>
        <div className="resumen-chips">
          <span className="chip chip-libre">{conteo.libres} libres</span>
          <span className="chip chip-ocupada">{conteo.ocupadas} ocupadas</span>
          <span className="chip chip-nuevo">{conteo.alertas} con alerta</span>
        </div>
      </header>

      {cargando ? (
        <div className="spinner" aria-label="Cargando" />
      ) : (
        <div className="grid-mesas">
          {MESAS.map((num) => {
            const estado = estadoDe(num);
            const { total, items, pideCuenta } = resumen[num];
            return (
              <button key={num} className={`mesa-card mesa-${estado}`} onClick={() => abrirMesa(num)}>
                <span className="mesa-num">Mesa {num}</span>
                <span className="mesa-estado">{pideCuenta ? "🛎️ Pide la cuenta" : ETIQUETAS[estado]}</span>
                {items > 0 ? (
                  <span className="mesa-total">
                    {formatearDinero(total)}
                    <small>{items} {items === 1 ? "ítem" : "ítems"}</small>
                  </span>
                ) : (
                  <span className="mesa-total mesa-total-vacio">—</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
