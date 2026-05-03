import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,   // allow fallback if 5173 is busy — CORS now covers 5174/5175 too
    // Proxy API requests to the FastAPI backend during development
    proxy: {
      '/analyze': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
    },
  },
})
