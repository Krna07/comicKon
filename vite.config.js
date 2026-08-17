import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Local dev only — in production the baseURL in comicApi.js points directly to Render
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/panels': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
