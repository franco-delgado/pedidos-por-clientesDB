import { useCallback, useEffect, useState } from "react";

const claveStorage = (mesa) => `carrito_mesa_${mesa}`;

function leerCarrito(mesa) {
  try {
    const crudo = localStorage.getItem(claveStorage(mesa));
    const datos = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

// Carrito del cliente, guardado por mesa en el navegador.
export function useCarrito(mesa) {
  const [items, setItems] = useState(() => leerCarrito(mesa));

  useEffect(() => {
    try {
      localStorage.setItem(claveStorage(mesa), JSON.stringify(items));
    } catch {
      /* sin almacenamiento disponible: el carrito sólo vive en memoria */
    }
  }, [mesa, items]);

  const agregar = useCallback((producto, cantidad = 1) => {
    const stock = Number(producto.stock) || 0;
    setItems((prev) => {
      const existente = prev.find((i) => i.id_producto === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.id_producto === producto.id
            ? { ...i, stock, cantidad: Math.min(i.cantidad + cantidad, stock) }
            : i,
        );
      }
      return [
        ...prev,
        {
          id_producto: producto.id,
          nombre: producto.nombre,
          precio_unitario: Number(producto.precio) || 0,
          cantidad: Math.min(cantidad, stock),
          stock,
        },
      ];
    });
  }, []);

  // Si la cantidad llega a 0 el producto sale del carrito
  const cambiarCantidad = useCallback((idProducto, delta, maximo) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id_producto !== idProducto) return [i];
        const nueva = i.cantidad + delta;
        if (nueva <= 0) return [];
        return [{ ...i, cantidad: Math.min(nueva, maximo ?? i.stock) }];
      }),
    );
  }, []);

  const quitar = useCallback(
    (idProducto) => setItems((prev) => prev.filter((i) => i.id_producto !== idProducto)),
    [],
  );

  const vaciar = useCallback(() => setItems([]), []);

  const cantidadDe = (idProducto) =>
    items.find((i) => i.id_producto === idProducto)?.cantidad || 0;

  return {
    items,
    agregar,
    cambiarCantidad,
    quitar,
    vaciar,
    cantidadDe,
    cantidadTotal: items.reduce((a, i) => a + i.cantidad, 0),
    total: items.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0),
  };
}
