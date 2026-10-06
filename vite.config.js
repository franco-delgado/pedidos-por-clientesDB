import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Ruta base: "/" funciona con rutas como /clientes/5 (necesario para los QR) y con Capacitor.
// Si publicás la app en una subcarpeta, definí VITE_BASE=/subcarpeta/ en el archivo .env
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icon.png", "icon-192.png", "alerta.mp3"],

      // Se cachea la app (JS, CSS, HTML, imágenes y el sonido) para que abra rápido y funcione la carga offline.
      // Firestore NO se cachea desde el service worker: usa su propia conexión en tiempo real.
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,mp3,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
      },

      manifest: {
        name: "Pedidos QR - Cafetería",
        short_name: "PedidosQR",
        description: "Sistema de pedidos en mesa mediante QR",
        theme_color: "#15110e",
        background_color: "#15110e",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],

  // Solución al error de WebSocket / HMR en desarrollo (se mantiene la configuración original)
  server: {
    host: "localhost",
    port: 5173,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
  },
});
