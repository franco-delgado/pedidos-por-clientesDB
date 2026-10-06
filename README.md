# Pedidos QR

Sistema de pedidos en mesa mediante QR para bares y cafeterías. React + Vite + Firebase (Firestore), con PWA y empaquetado Android (Capacitor).

## Pantallas

| Ruta | Quién la usa | Qué hace |
|---|---|---|
| `/` | Todos | Selector de perfil (útil para pruebas) |
| `/clientes/:mesa` | Cliente | Menú, carrito, pedido y cuenta. **Es la URL del QR** (ej: `/clientes/5`) |
| `/administracion/mesas` | Mozo / dueño | Estado de las 13 mesas en tiempo real, detalle, cobro e impresión |
| `/administracion/precios` | Dueño | Alta, baja y edición de productos, precios, stock y fotos |
| `/administracion/caja` | Dueño | Totales, ranking de productos, exportar CSV y cerrar caja |
| `/cocina` | Cocina | Pedidos por mesa, botón "Listo", tiempo de espera |

## Puesta en marcha

```bash
npm install
cp .env.example .env     # (en Windows: copy .env.example .env) y definí tu PIN
npm run dev              # http://localhost:5173
```

Scripts: `npm run build` · `npm run lint` · `npm run preview` · `npm run cap:sync` · `npm run cap:abrir`

## Configuración rápida (`src/config.js`)

Nombre del local, cantidad de mesas, categorías (con emoji), instagram/teléfono del pie de página.

## PIN de acceso

Definí `VITE_ADMIN_PIN` en `.env` para proteger **Administración** y **Cocina**. Es una barrera básica del lado del navegador: sirve para que un cliente curioso no entre por error, pero no reemplaza a las Reglas de Firestore (ver "Seguridad").

## Códigos QR

Cada mesa necesita su propio QR con la URL: `https://TU-DOMINIO/clientes/NÚMERO_DE_MESA`

El hosting debe redirigir todas las rutas a `index.html` (si no, abrir `/clientes/5` directamente da 404). En Firebase Hosting, en `firebase.json`:

```json
{ "hosting": { "public": "dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] } }
```

## Modelo de datos (Firestore)

- `datos` — productos: `nombre`, `precio`, `stock`, `categoria` (MAYÚSCULAS, ej. `CAFÉ`), `imagen_url`
- `pedidos_clientes` — ítems activos de cada mesa: `mesa`, `nombre_pedido`, `cantidad_pedida`, `precio_unitario`, `espacio` (`pedido_nuevo` / `ocupada`), y nuevos: `id_producto`, `creado`, `nota`, `cocina` (`pendiente` / `listo`)
- `caja` — ventas cobradas: `mesa`, `nombre_pedido`, `cantidad_pedido`, `precio_pedido` (**total de la línea**), `fecha`

## App Android (Capacitor)

```bash
npm run cap:sync     # compila y copia la web a android/
npm run cap:abrir    # abre Android Studio
```

La carpeta `android/app/src/main/assets/public` se regenera sola con cada `cap:sync`: no se edita ni se sube a git.

## Seguridad

La app usa autenticación anónima de Firebase. Las claves web de Firebase son públicas por diseño; lo que protege los datos son las **Reglas de Firestore/Storage**. Para un control real de quién puede cobrar, borrar la caja o editar precios, el siguiente paso recomendado es usar Firebase Auth con email/contraseña para el personal y restringir esas operaciones en las reglas.

## Estructura

```
src/
├── App.jsx · main.jsx · config.js · index.css
├── components/    Layout, Footer, Toast, PinGate
├── hooks/         usePedidos, useCarrito, useAlertaSonora, toastContext
├── lib/           firebase.js, pedidos.js (utilidades y formato de dinero)
├── pages/         Inicio
├── clientes/      Clientes (layout + carrito), Categorias, OpcionesPedidos, Carrito, Cuenta
├── administracion/ Administracion (layout + alertas), Pedidos, Precios, modificarOpciones, caja/, mesas/
├── cocina/        cocina
└── impresora/     ticketService
```
