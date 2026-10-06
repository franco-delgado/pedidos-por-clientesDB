import { NOMBRE_LOCAL } from "../config";
import { formatearDinero } from "../lib/pedidos";

const escapar = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * Imprime el ticket de una mesa (papel térmico de 80 mm).
 * `items`: [{ nombre, cantidad, precio }]  ·  `total`: número
 */
export function emitirImpresionMesa(idMesa, items, total) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "0",
    right: "0",
    width: "0",
    height: "0",
    border: "none",
  });
  document.body.appendChild(iframe);

  const limpiar = () => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  };

  const filas = items
    .map(
      (item) => `
      <tr>
        <td>${item.cantidad} x ${escapar(item.nombre)}</td>
        <td class="der">${formatearDinero(item.cantidad * item.precio)}</td>
      </tr>`,
    )
    .join("");

  const doc = iframe.contentWindow.document;
  doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Ticket Mesa ${escapar(idMesa)}</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 10px; width: 72mm; box-sizing: border-box; background: #fff; color: #000; }
      h3 { margin: 0; }
      p { margin: 2px 0; }
      .centro { text-align: center; }
      .linea { border-top: 1px dashed #000; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { font-size: 11px; vertical-align: top; text-align: left; }
      .der { text-align: right; }
      .total { font-size: 14px; font-weight: bold; margin-top: 10px; text-align: right; }
    </style>
  </head>
  <body>
    <div class="centro">
      <h3>${escapar(NOMBRE_LOCAL)}</h3>
      <p>Mesa N°: ${escapar(idMesa)}</p>
      <p style="font-size: 10px;">${new Date().toLocaleString("es-AR")}</p>
    </div>
    <div class="linea"></div>
    <table>
      <thead><tr><th>Detalle</th><th class="der">Total</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <div class="linea"></div>
    <div class="total">TOTAL: ${formatearDinero(total)}</div>
    <div class="linea"></div>
    <p class="centro" style="font-size: 10px; margin-top: 10px;">Gracias por su visita</p>
  </body>
</html>`);
  doc.close();

  // Se elimina el iframe recién cuando termina la impresión (con un respaldo por si el evento no llega)
  iframe.contentWindow.onafterprint = limpiar;
  setTimeout(limpiar, 60000);

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}
