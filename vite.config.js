import { defineConfig } from "vite";
import react from "@vitejs/react-refresh"; // o el plugin de react que tengas actual
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icon.png"],
      manifest: {
        name: "Pedidos QR - Cafetería",
        short_name: "PedidosQR",
        description: "Sistema de pedidos en mesa mediante QR",
        theme_color: "#2a2a2a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
