import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/proxy': {
        target: 'https://app.cuandollegarosario.com/api/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, '')
      },
      '/api/gobierno': {
        target: 'https://ws.rosario.gob.ar/ubicaciones/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gobierno/, '')
      }
    }
  }
})