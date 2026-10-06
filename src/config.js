// Configuración central de la app. Cambiá los valores acá y se aplican en todas las pantallas.

export const NOMBRE_LOCAL = "TU BAR";

// Cantidad de mesas del local (se usa en cliente, administración, cocina y caja)
export const TOTAL_MESAS = 13;
export const MESAS = Array.from({ length: TOTAL_MESAS }, (_, i) => i + 1);

// IMPORTANTE: Firestore guarda la categoría de cada producto como nombre.toUpperCase()
// (ej: "CAFÉ", "PANIFICACIÓN"). Si cambiás un nombre, actualizá también los productos existentes.
export const CATEGORIAS = [
  { id: "bebidas", nombre: "Bebidas", emoji: "🥤" },
  { id: "cafe", nombre: "Café", emoji: "☕" },
  { id: "desayuno", nombre: "Desayuno", emoji: "🍳" },
  { id: "frappe", nombre: "Frappe", emoji: "🧋" },
  { id: "licuados", nombre: "Licuados", emoji: "🍓" },
  { id: "panificacion", nombre: "Panificación", emoji: "🥐" },
  { id: "picadas", nombre: "Picadas", emoji: "🧀" },
  { id: "pizza", nombre: "Pizzas", emoji: "🍕" },
  { id: "postres", nombre: "Postres", emoji: "🍰" },
  { id: "waffles", nombre: "Waffles", emoji: "🧇" },
];

export const buscarCategoria = (id) => CATEGORIAS.find((c) => c.id === id);
export const claveCategoria = (categoria) => categoria.nombre.toUpperCase();

// Datos que se muestran en el pie de página (dejá "" para ocultarlos)
export const CONTACTO = { instagram: "", telefono: "" };
export const CREDITO = {
  texto: "DELGADOWEBS",
  url: "https://franco-delgado.github.io/delgadowebs/",
};

// PIN de acceso a Administración y Cocina. Se define en el archivo .env (ver .env.example).
// Si no se define, el acceso queda libre (comportamiento anterior).
export const ADMIN_PIN = String(import.meta.env.VITE_ADMIN_PIN || "").trim();

// Ruta base de la app (para recursos de /public como el sonido de alerta)
export const RUTA_BASE = import.meta.env.BASE_URL;
