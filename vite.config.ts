import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/victory")) return "charts";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react-router") || id.includes("node_modules/react/")) {
            return "react-vendor";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    open: false,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/media/uploads": "http://127.0.0.1:8000",
    },
  },
});
