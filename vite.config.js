import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icon.png"], // Asegurate de que estos archivos estén en la carpeta /public
      manifest: {
        name:```
3.  **Subir a GitHub:** Una vez que hagas el `git push` y tu sitio se actualice en la web (Netlify, Vercel, etc.), entrá desde tu **Redmi Note 14 Pro**.

> **Pro-Tip de Xiaomi:** Si al entrar al sitio no te aparece el banner automático de "Instalar", recordá ir a los **3start_url: "/",
    scope: "/",
    icons: [
      {
        src: "icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable", // Esto permite que MIUI adapte el ícono a formas circulares o cuadradas
      },
      {
        src: "icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
  devOptions: {
    enabled: true, // Esto te permite probar la PWA mientras usas npm run dev
  },
}),
],
base: "./ puntos de Chrome** > **Instalar aplicación**. Al tener el `display: "standalone"`, una vez instalada se abrirá como una app nativa, ocup", 
});