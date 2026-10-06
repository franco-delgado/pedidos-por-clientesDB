# Detalle de cambios — dónde aplicar cada uno

Leyenda: 🆕 archivo nuevo · ✏️ reemplazar el archivo completo · 🗑️ eliminar · 🔁 renombrado

Después de aplicar los cambios, en la carpeta raíz del proyecto:

```bash
npm install          # actualiza dependencias (se quitaron paquetes sin uso)
npm run lint         # debe dar 0 problemas
npm run dev
```

---

## 📁 Raíz del proyecto (`pedidos-qr-app-FB/`)

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `package.json` | Se quitaron `@supabase/supabase-js`, `@babel/core`, `@rolldown/plugin-babel` y `babel-plugin-react-compiler` (no se usaban). `@capacitor/core` pasó a `dependencies`. Scripts nuevos `cap:sync` y `cap:abrir`. Versión 1.0.0 |
| ✏️ | `package-lock.json` | Regenerado con las dependencias limpias (o borrá el tuyo y corré `npm install`) |
| ✏️ | `vite.config.js` | `base` ahora es `/` (con `./` los QR `/clientes/5` rompían al recargar). Se eliminó el caché agresivo `CacheFirst` y el caché de Firestore (podían mostrar datos viejos). `devOptions` desactivado (ya no se genera `dev-dist/`). Se quitaron referencias a archivos inexistentes (`favicon.svg`, `robots.txt`). Íconos del manifest corregidos y colores del tema actualizados |
| ✏️ | `index.html` | Favicon real (`favicon.png`), título correcto, `viewport-fit=cover` para celulares con notch, color de tema |
| ✏️ | `eslint.config.js` | Ignora `dev-dist` y `android`; reconoce `vite.config.js` como archivo de Node |
| ✏️ | `.gitignore` | Agrega `dev-dist`, `.env`, y los archivos generados por Capacitor |
| 🆕 | `.env.example` | Plantilla para el PIN de acceso (`VITE_ADMIN_PIN`). Copiala como `.env` |
| ✏️ | `README.md` | Reemplaza el texto de la plantilla de Vite por documentación real del proyecto |
| 🗑️ | `dist/` | Carpeta generada por `npm run build` |
| 🗑️ | `dev-dist/` | Generada por el modo desarrollo de la PWA |
| 🗑️ | `.idea/` | Configuración de WebStorm/IntelliJ |
| 🗑️ | `.github/modernize/` | Scripts de actualización de Java; no tienen relación con este proyecto |

> Si estos directorios ya estaban subidos a git: `git rm -r --cached dist dev-dist .idea`

## 📁 `public/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| 🗑️ | `favicono.svg`, `icono.svg` | **Eran imágenes JPEG con extensión `.svg`**: el navegador no podía mostrarlas como favicon |
| 🗑️ | `icon.jpg` | No se usaba en ningún lado |
| 🆕 | `favicon.png` (64×64) | Favicon real |
| 🆕 | `icon-192.png` (192×192) | Ícono de 192 px para el manifest (antes se declaraba el de 512 como si fuera 192) |
| — | `icon.png`, `alerta.mp3` | Sin cambios |

## 📁 `android/`

No se modifica código nativo. Sólo limpieza de archivos generados o locales (no los subas a git):

| Acción | Ruta |
|---|---|
| 🗑️ | `android/app/build/`, `android/build/`, `android/.gradle/`, `android/.idea/` |
| 🗑️ | `android/local.properties` (ruta del SDK de *tu* PC) |
| 🗑️ | `android/app/src/main/assets/public/` (se regenera con `npm run cap:sync`) |

Luego de aplicar todo: `npm run cap:sync` para que Android reciba la versión nueva.

---

## 📁 `src/` (raíz de la carpeta)

| Acción | Archivo | Qué cambió |
|---|---|---|
| 🆕 | `App.jsx` | Reemplaza a `seleccionePerfil.jsx`. Define las rutas, espera a que termine la autenticación anónima **antes** de mostrar pantallas (antes había una condición de carrera) y carga Administración/Cocina bajo demanda (el celular del cliente descarga menos código) |
| ✏️ | `main.jsx` | Ya no pinta el encabezado "TU BAR" en todas las pantallas; monta `App` y los avisos |
| 🆕 | `config.js` | Nombre del local, nº de mesas, categorías, contacto y PIN en **un solo lugar** (estaban repetidos en 5 archivos) |
| ✏️ | `index.css` | Sistema de diseño completo (colores, botones, tarjetas, formularios). Se eliminó todo el CSS sobrante de la plantilla de Vite |
| 🗑️ | `seleccionePerfil.jsx` | Reemplazado por `App.jsx` + `pages/Inicio.jsx` |
| 🗑️ | `FooterComponent.jsx` | Movido a `components/Footer.jsx` |
| 🗑️ | `datos/productos.js` (carpeta `datos/` completa) | No se importaba en ningún lado |

## 📁 `src/lib/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| 🔁 | `firebise.js` → `firebase.js` | Se corrigió el nombre (typo). Autenticación anónima simplificada y con reintento. Storage se carga sólo donde se usa |
| 🆕 | `pedidos.js` | Una sola función que lee los pedidos (con campos con guion bajo o medio), cálculo del estado de cada mesa y formato de dinero `$ 1.500` |

## 📁 `src/hooks/` (carpeta nueva)

| Archivo | Para qué sirve |
|---|---|
| 🆕 `usePedidos.js` | Escucha en tiempo real los pedidos. Lo usan Administración y Cocina (antes cada pantalla duplicaba esta lógica) |
| 🆕 `useCarrito.js` | Carrito del cliente guardado por mesa |
| 🆕 `useAlertaSonora.js` | Sonido de alerta con desbloqueo para iOS/Android |
| 🆕 `toastContext.js` | Hook `useToast()` |

## 📁 `src/components/` (carpeta nueva)

| Archivo | Para qué sirve |
|---|---|
| 🆕 `Layout.jsx` | Encabezado y pie comunes |
| 🆕 `Footer.jsx` | Pie de página (oculta Instagram/teléfono si no están cargados en `config.js`) |
| 🆕 `Toast.jsx` | Avisos no bloqueantes que reemplazan a los `alert()` |
| 🆕 `PinGate.jsx` | Pantalla de PIN para Administración y Cocina |

## 📁 `src/pages/` (carpeta nueva)

| Archivo | Qué hace |
|---|---|
| 🆕 `Inicio.jsx` | Pantalla de bienvenida rediseñada, con selector de mesa (antes el cliente siempre iba a la mesa 8) |

---

## 📁 `src/clientes/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `Clientes.jsx` | **Bug corregido:** la mesa estaba fija en 8; ahora sale de la URL del QR (`/clientes/5`). Valida que la mesa exista. Mantiene el carrito entre pantallas y muestra la barra "Ver mi pedido" en todo el recorrido |
| 🆕 | `Categorias.jsx` | Inicio del cliente con categorías en mosaico con íconos |
| ✏️ | `OpcionesPedidos.jsx` | Rutas propias (el botón *Atrás* del celular ya funciona). Stock **en vivo**. Se reemplazó el modal de cantidad por botones − / + en cada tarjeta. Buscador cuando hay más de 6 productos. Avisos de "Quedan N" |
| 🆕 | `Carrito.jsx` | Hoja inferior con el pedido. **Bug corregido:** el pedido seguía enviando `mesa: 8`. Pedido y descuento de stock en una sola operación atómica con `increment()` (antes una mesa podía pisar el stock de otra). Campo de aclaraciones para la cocina |
| ✏️ | `Cuenta.jsx` | Se actualiza en vivo y sólo lee los pedidos de su mesa. Ya no puede pedir la cuenta dos veces. Ya no ejecuta `localStorage.clear()` (borraba todo el almacenamiento del navegador); sólo vacía el carrito de la mesa |
| ✏️ | `Clientes.css` | Reescrito. Se eliminó CSS de la plantilla de Vite (`.hero`, `#next-steps`, `.counter`…) y las clases que se pisaban con las de administración (`.item-editar`, `.btn-eliminar`, `.superior`) |

## 📁 `src/administracion/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `Administracion.jsx` | Ahora es el **marco de todo el panel**: pestañas Mesas / Precios / Caja / Cocina, PIN y alertas. El sonido y las notificaciones funcionan en cualquier sección (antes sólo en la pantalla inicial). No suena al abrir la app por pedidos viejos. Insignia con la cantidad de mesas en alerta |
| ✏️ | `Pedidos.jsx` | **Bug corregido:** la mesa "pedido nuevo" no tenía color (el CSS definía `.cuenta`, el código usaba `.pedido_nuevo`). Cada mesa muestra total, cantidad de ítems y si pidió la cuenta. Contadores libres/ocupadas/alerta |
| ✏️ | `Precios.jsx` | Rutas propias por categoría; usa la lista de `config.js` |
| ✏️ | `modificarOpciones.jsx` | Las fotos se **reducen a 900 px y se comprimen** antes de subirlas. Se puede borrar el contenido de un campo numérico (antes se forzaba el "0"). Confirmación al eliminar. Todo el guardado en un solo lote. Producto nuevo arriba de la lista. Se corrigió `URL.revokeObjectURL` mal usado |
| 🗑️ | `Menu.jsx` | Código viejo de PHP (`salidadbmesas/*.php`) que no se importaba en ningún lado |
| ✏️ | `administracion.css` | Reescrito (ver Clientes.css) |

### 📁 `src/administracion/caja/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `Caja.jsx` | **Bug corregido: los totales estaban inflados.** `DetalleMesa` guarda `precio_pedido` como total de la línea (precio × cantidad) y `Caja` lo volvía a multiplicar por la cantidad. El componente se llamaba `Administracion` por error. Nuevo: lectura en vivo, unidades vendidas, ranking de lo más vendido, **exportar CSV** (se abre en Excel) y borrado en lotes (el anterior fallaba con más de 500 ventas) |

### 📁 `src/administracion/mesas/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `DetalleMesa.jsx` | **Bug corregido:** la "SOLICITUD DE CUENTA" se mostraba como producto y se guardaba en caja. Ahora se filtra, pero se elimina al cobrar. Detalle en vivo (nuevos pedidos aparecen solos). Cobro y registro en caja en una sola operación (antes, si fallaba a la mitad, quedaba la caja cargada con la mesa sin vaciar). Botón **Imprimir** separado. Se puede **quitar un ítem** cargado por error (devuelve el stock). Muestra hora y aclaraciones del cliente |
| ✏️ | `DetallesMesa.css` | Reescrito |

## 📁 `src/cocina/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `cocina.jsx` | Antes era una lista plana (incluso mostraba las solicitudes de cuenta). Ahora: tarjetas por mesa, botón **Listo** por ítem o **Todo listo**, minutos de espera (rojo a los 15 min), aclaraciones del cliente, sonido con cada pedido nuevo y sección "Listos para entregar" con *Deshacer*. Requiere el PIN |
| ✏️ | `cocina.css` | Reescrito (el contenedor tenía `height: 20px`, que rompía el diseño) |

## 📁 `src/impresora/`

| Acción | Archivo | Qué cambió |
|---|---|---|
| ✏️ | `ticketService.js` | Se escapa el texto de los productos (un nombre con `<` rompía el ticket). Usa el nombre del local de `config.js` (decía "PEDIDOS QR WEB"). Formato de dinero en pesos. El iframe se elimina cuando termina de imprimir y no al segundo |

---

## ⚠️ Puntos a revisar en tu Firebase

1. **Reglas de Firestore.** Los pedidos nuevos guardan campos extra: `id_producto`, `creado`, `nota` (y cocina escribe `cocina`). Si tus reglas limitan los campos permitidos (`hasOnly([...])`), agregalos.
2. **Seguridad real.** El PIN es una barrera del navegador. Cualquiera con la URL y las reglas actuales (sólo `request.auth != null`, que cualquier visitante cumple por ser anónimo) podría leer o borrar datos. Para proteger caja y precios, usá Firebase Auth con email/contraseña para el personal.
3. **Hosting.** Para que `/clientes/5` abra directo desde el QR, el hosting debe redirigir todo a `index.html` (ejemplo en el README).
4. **Datos viejos de `caja`.** Los totales históricos ya guardados estaban bien; lo que estaba mal era el *cálculo en pantalla*. Ahora se muestran correctos sin tocar la base.
5. **`config.js`** → completá `CONTACTO` (Instagram/teléfono) y `NOMBRE_LOCAL`.
