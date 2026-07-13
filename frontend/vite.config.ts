import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lobehub/icons": path.resolve(__dirname, "./src/lobehub-icons-stub.ts"),
    },
  },
  build: { outDir: "../common/dist", emptyOutDir: true },
});