import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const AUTH_ROUTE = /^\/(?:signin|register|forgot-password|pending-approval|workspace|account-(?:blocked|inactive|error)|auth\/(?:verify|callback|reset-password))(?:[/?#].*)?$/

function authPreviewHistoryFallback() {
  const install = (middlewares) => {
    middlewares.use((request, _response, next) => {
      if (request.method === 'GET' && AUTH_ROUTE.test(request.url || '')) request.url = '/auth-preview.html'
      next()
    })
  }
  return {
    name: 'pulse-auth-preview-history-fallback',
    configureServer(server) { install(server.middlewares) },
    configurePreviewServer(server) { install(server.middlewares) },
  }
}

export default defineConfig({
  plugins: [authPreviewHistoryFallback(), react()],
  publicDir: false,
  build: {
    outDir: 'dist-auth-preview',
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, 'auth-preview.html') },
  },
})
