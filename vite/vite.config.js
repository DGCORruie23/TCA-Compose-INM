import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración base de Vite
export default defineConfig({
  plugins: [react()],
  server: {
    cors: true, //comentar cuando se ponga en produccion
    host: '0.0.0.0',
    port: 5173,
  },
  base: '/',
})