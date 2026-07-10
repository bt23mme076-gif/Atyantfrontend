import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Keep base at '/' so the app works at the bare root when proxied to atyant.in.
  // Emit hashed JS/CSS into /product-assets/ instead of the default /assets/
  // to avoid colliding with the content site's own /assets/ folder.
  base: '/',
  build: {
    assetsDir: 'product-assets',
  },
  server: {
    proxy: {
      // All /api/* and /auth/* calls from the browser are forwarded to the backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

