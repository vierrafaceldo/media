import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".trycloudflare.com"],
    host: true, // Exposes the project to your local network
    proxy: {
      // Forwards all /api and /media requests to your Node backend
      '/api': 'http://127.0.0.1:5000',
      '/media': 'http://127.0.0.1:5000'
    }
  },
})