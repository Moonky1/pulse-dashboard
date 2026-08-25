import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist-maintenance',
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, 'maintenance.html') },
  },
})
