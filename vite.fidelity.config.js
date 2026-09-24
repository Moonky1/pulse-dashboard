import { defineConfig } from 'vite'
import { createReadStream, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Local-only, fixed reference allowlist. Never copied to the production build.
export default defineConfig({
  publicDir: false,
  plugins: [{
    name: 'fidelity-local-references',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const names = { '/__reference/3.mp4': '1080x1080 (3).mp4', '/__reference/5.mp4': '1080x1080 (5).mp4' }
        const name = names[req.url?.split('?')[0]]
        if (!name) return next()
        const file = join(homedir(), 'Downloads', name)
        try {
          const size = statSync(file).size
          const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '')
          const start = match ? Number(match[1]) : 0
          const end = match?.[2] ? Math.min(Number(match[2]), size - 1) : size - 1
          if (start > end || start >= size) { res.writeHead(416); res.end(); return }
          res.writeHead(match ? 206 : 200, {
            'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            ...(match ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
          })
          createReadStream(file, { start, end }).pipe(res)
        } catch { res.writeHead(404); res.end('Reference not installed locally') }
      })
    },
  }],
})
