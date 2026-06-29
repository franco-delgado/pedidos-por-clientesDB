// src/impresora/ticketService.js

export function emitirImpresionMesa(idMesa, items, total) {
  // Creamos el iframe temporal aislado de React
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.bottom = "0";
  iframe.style.right = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  const fechaActual = new Date().toLocaleString();

  const filasProductos = items
    .map((item) => {
      const cantidad = Number(item["cantidad-pedida"]) || 0;
      const precio = Number(item["precio_unitario"]) || 0;
      return `
      <tr>
        <td>${cantidad} x ${item["nombre-pedido"]}</td>
        <td style="text-align: right;">$${(cantidad * precio).toFixed(2)}</td>
      </tr>
    `;
    })
    .join("");

  doc.write(`
    <html>
      <head>
        <title>Ticket Mesa ${idMesa}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            padding: 10px;
            width: 72mm;
            box-sizing: border-box;
            background: #fff;
            color: #000;
          }
          .center { text-align: center; }
          .linea { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { font-size: 11px; vertical-align: top; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="center">
          <h3 style="margin: 0;">PEDIDOS QR WEB</h3>
          <p style="margin: 2px 0;">Mesa N°: ${idMesa}</p>
          <p style="margin: 2px 0; font-size: 10px;">${fechaActual}</p>
        </div>
        <div class="linea"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Detalle</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${filasProductos}
          </tbody>
        </table>
        <div class="linea"></div>
        <div class="total">TOTAL: $${total.toFixed(2)}</div>
        <div class="linea"></div>
        <div class="center" style="font-size: 10px; margin-top: 10px;">
          <p style="margin: 0;">Gracias por su visita</p>
        </div>
      </body>
    </html>
  `);

  doc.close();

  // Desplegar diálogo de impresión del navegador
  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  // Limpieza del nodo
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 1000);
}
