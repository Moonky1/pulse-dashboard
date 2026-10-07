import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'pulse-public-search-files',
    generateBundle() {
      // Keep publicDir disabled: source training captures are not public assets.
      for (const fileName of ['robots.txt', 'sitemap.xml']) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL('./public/' + fileName, import.meta.url), 'utf8') })
      }
    },
  }],
  publicDir: false,
})
