import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { assertGoHostedDestination, resolveGoHostedDestination } from './goHostedDestination.js'

const projectRef = 'sgshbawggqapuyqzkyhs'
const backend = `https://${projectRef}.supabase.co`
const preview = 'https://pulse-kk-git-pulse-go-1b-hosted-sessions-pulsekk.vercel.app'

test('isolated local Supabase remains the only configuration-free Hosted GO target', () => {
  assert.equal(resolveGoHostedDestination('http://127.0.0.1:54321').mode, 'local')
  assert.equal(resolveGoHostedDestination('http://localhost:54321').allowed, true)
  assert.equal(resolveGoHostedDestination('http://localhost:54322').allowed, false)
  assert.equal(resolveGoHostedDestination('https://127.0.0.1:54321').allowed, false)
})

test('remote Hosted GO requires the exact Pulse Preview project and branch origin together', () => {
  const approved = { approvedProjectRef: projectRef, approvedOrigin: preview, currentOrigin: preview }
  assert.deepEqual(resolveGoHostedDestination(backend, approved), {
    allowed: true, mode: 'remote', projectRef, origin: preview,
  })
  assert.equal(resolveGoHostedDestination('https://lhgnbcaundgjeofjrscg.supabase.co', approved).allowed, false)
  assert.equal(resolveGoHostedDestination(backend, { ...approved, currentOrigin: 'https://www.pulse-kk.com' }).allowed, false)
  assert.equal(resolveGoHostedDestination(backend, { ...approved, approvedOrigin: 'https://*.vercel.app' }).allowed, false)
  assert.equal(resolveGoHostedDestination(backend, { ...approved, approvedOrigin: 'http://localhost:5173', currentOrigin: 'http://localhost:5173' }).allowed, false)
})

test('missing or malformed remote Hosted GO configuration fails closed', () => {
  assert.equal(resolveGoHostedDestination(backend, { currentOrigin: preview }).allowed, false)
  assert.equal(resolveGoHostedDestination(backend, { approvedProjectRef: projectRef, currentOrigin: preview }).allowed, false)
  assert.equal(resolveGoHostedDestination('not-a-url').allowed, false)
  assert.throws(() => assertGoHostedDestination(backend, {
    approvedProjectRef: projectRef, approvedOrigin: preview, currentOrigin: 'https://www.pulse-kk.com',
  }))
})

test('Hosted GO destination guard stays independent from authorization and identity', async () => {
  const source = await readFile(new URL('./goHostedDestination.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /service_role|localStorage|super_admin|email|ALLOW_REMOTE/i)
  assert.match(source, /VITE_GO_HOSTED_PROJECT_REF/)
  assert.match(source, /VITE_GO_HOSTED_ORIGIN/)
})
