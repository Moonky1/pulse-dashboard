import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist-ui-preview',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(import.meta.dirname, 'ui-preview.html'),
    },
  },
})
