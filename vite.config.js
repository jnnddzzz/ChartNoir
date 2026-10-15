import { defineConfig } from "vite";

export default defineConfig({
  // Rutas relativas: la web funciona igual en Vercel, Netlify o una subcarpeta.
  base: "./",
  build: {
    target: "es2020",
    // Three.js pesa ~600 kB sin comprimir; avisamos solo si algo crece de verdad.
    chunkSizeWarningLimit: 800,
  },
});
