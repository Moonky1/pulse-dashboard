import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { assertGoPracticeDestination, resolveGoPracticeDestination } from './goPracticeDestination.js'

const projectRef = 'lhgnbcaundgjeofjrscg'
const backend = `https://${projectRef}.supabase.co`
const preview = 'https://pulse-kk-git-pulse-go-1a-practice-pulsekk.vercel.app'

test('isolated local Supabase remains the only configuration-free GO Practice target', () => {
  assert.equal(resolveGoPracticeDestination('http://127.0.0.1:54321').mode, 'local')
  assert.equal(resolveGoPracticeDestination('http://localhost:54321').allowed, true)
  assert.equal(resolveGoPracticeDestination('http://localhost:54322').allowed, false)
  assert.equal(resolveGoPracticeDestination('https://127.0.0.1:54321').allowed, false)
})

test('remote GO Practice requires the exact Pulse Dev project and Preview origin together', () => {
  const approved = { approvedProjectRef: projectRef, approvedOrigin: preview, currentOrigin: preview }
  assert.deepEqual(resolveGoPracticeDestination(backend, approved), {
    allowed: true, mode: 'remote', projectRef, origin: preview,
  })
  assert.equal(resolveGoPracticeDestination('https://wrongprojectref12345.supabase.co', approved).allowed, false)
  assert.equal(resolveGoPracticeDestination(backend, { ...approved, currentOrigin: 'https://www.pulse-kk.com' }).allowed, false)
  assert.equal(resolveGoPracticeDestination(backend, { ...approved, approvedOrigin: 'https://*.vercel.app' }).allowed, false)
  assert.equal(resolveGoPracticeDestination(backend, { ...approved, approvedOrigin: 'http://localhost:5173', currentOrigin: 'http://localhost:5173' }).allowed, false)
})

test('missing or malformed remote GO Practice configuration fails closed', () => {
  assert.equal(resolveGoPracticeDestination(backend, { currentOrigin: preview }).allowed, false)
  assert.equal(resolveGoPracticeDestination(backend, { approvedProjectRef: projectRef, currentOrigin: preview }).allowed, false)
  assert.throws(() => assertGoPracticeDestination(backend, {
    approvedProjectRef: projectRef, approvedOrigin: preview, currentOrigin: 'https://www.pulse-kk.com',
  }))
})

test('GO browser destination guard stays independent from authorization and identity', async () => {
  const source = await readFile(new URL('./goPracticeDestination.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /service_role|localStorage|super_admin|email|ALLOW_REMOTE/i)
  assert.match(source, /VITE_GO_PRACTICE_PROJECT_REF/)
  assert.match(source, /VITE_GO_PRACTICE_ORIGIN/)
})
