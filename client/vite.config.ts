import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El backend (Express) corre en el puerto 4000. En desarrollo, Vite reenvía /api
// (y las imágenes subidas) para que el navegador solo hable con un origen y no
// haya problemas de CORS.
const BACKEND = 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  // El chunk de three.js (~1 MB) solo se descarga en las páginas 3D (carga diferida).
  build: { chunkSizeWarningLimit: 1100 },
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/uploads': BACKEND,
    },
  },
})
