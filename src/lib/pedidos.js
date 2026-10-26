import { MESAS } from "../config";

export const COLECCION_PEDIDOS = "pedidos_clientes";
// Una "sesión" por mesa: indica qué dispositivo (uid anónimo) está usando el QR.
// Se crea con el primer pedido y se borra al "Cobrar y liberar mesa".
export const COLECCION_SESIONES = "mesas_sesion";
export const SOLICITUD_CUENTA = "SOLICITUD DE CUENTA";

export const ESTADO = Object.freeze({
  LIBRE: "libre",
  OCUPADA: "ocupada",
  NUEVO: "pedido_nuevo",
});

// Convierte un documento de Firestore a un objeto uniforme.
// Acepta campos con guion bajo (actual) o con guion medio (datos viejos).
export function normalizarPedido(id, d) {
  const nombre = d.nombre_pedido ?? d["nombre-pedido"] ?? "";
  const cantidad = Number(d.cantidad_pedida ?? d["cantidad-pedida"]) || 1;
  const precio = Number(d.precio_unitario) || 0;
  const esCuenta = nombre === SOLICITUD_CUENTA;
  const esAlerta = esCuenta || d.espacio === "pedido_nuevo" || d.espacio === 2;

  return {
    id,
    mesa: Number(d.mesa),
    nombre,
    cantidad,
    precio,
    subtotal: cantidad * precio,
    espacio: d.espacio,
    esCuenta,
    esAlerta,
    nota: d.nota || "",
    cocina: d.cocina || "pendiente",
    idProducto: d.id_producto || null,
    creadoMs: d.creado?.toMillis?.() ?? null,
  };
}

// Estado de cada mesa a partir de todos los pedidos activos
export function calcularEstadoMesas(pedidos) {
  const mapa = Object.fromEntries(MESAS.map((n) => [n, ESTADO.LIBRE]));
  pedidos.forEach((p) => {
    if (!(p.mesa in mapa)) return;
    if (p.esAlerta) mapa[p.mesa] = ESTADO.NUEVO;
    else if (mapa[p.mesa] !== ESTADO.NUEVO) mapa[p.mesa] = ESTADO.OCUPADA;
  });
  return mapa;
}

const formatoDinero = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const formatearDinero = (valor) => formatoDinero.format(Number(valor) || 0);

export const formatearHora = (ms) =>
  ms ? new Date(ms).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";
