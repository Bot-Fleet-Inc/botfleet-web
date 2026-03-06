import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Excalidraw is large (~2MB) — split into own lazy chunk
          'excalidraw': ['@excalidraw/excalidraw'],
          // React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
})
