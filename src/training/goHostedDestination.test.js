import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { assertGoHostedDestination, resolveGoHostedDestination } from './goHostedDestination.js'

test('Hosted GO permits only the disposable local Supabase endpoint', () => {
  assert.deepEqual(resolveGoHostedDestination('http://127.0.0.1:54321'), { allowed: true, mode: 'local' })
  assert.equal(resolveGoHostedDestination('http://localhost:54321').allowed, true)
  assert.equal(resolveGoHostedDestination('http://localhost:54322').allowed, false)
  assert.equal(resolveGoHostedDestination('https://lhgnbcaundgjeofjrscg.supabase.co').allowed, false)
  assert.equal(resolveGoHostedDestination('not-a-url').allowed, false)
})

test('Hosted GO has no remote enablement flag or identity bypass', async () => {
  assert.throws(() => assertGoHostedDestination('https://lhgnbcaundgjeofjrscg.supabase.co'))
  const source = await readFile(new URL('./goHostedDestination.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /VITE_|service_role|localStorage|email|role/i)
})
