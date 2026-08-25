import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('Vercel keeps a catch-all rewrite ready for direct SPA route refreshes', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/index.html' }])
})

test('Maintenance remains an explicit standalone rollback build', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.maintenance.json', import.meta.url), 'utf8'))
  assert.equal(config.buildCommand, 'npm run build:maintenance')
  assert.equal(config.outputDirectory, 'dist-maintenance')
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/maintenance.html' }])
})
