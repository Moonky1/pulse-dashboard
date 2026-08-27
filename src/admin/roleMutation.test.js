import assert from 'node:assert/strict'
import test from 'node:test'

import { runRoleMutation } from './roleMutation.js'

test('successful role mutation waits for the server then refetches canonical detail', async () => {
  const events = []
  const result = await runRoleMutation({
    guard: { current: false },
    operation: async () => { events.push('rpc'); return { data: { created: true }, error: null } },
    onSuccess: async () => { events.push('refetch') },
  })
  assert.equal(result.error, null)
  assert.deepEqual(events, ['rpc', 'refetch'])
})

test('failed role mutation does not refetch or update client state optimistically', async () => {
  let refreshed = false
  const result = await runRoleMutation({
    guard: { current: false },
    operation: async () => ({ data: null, error: { code: 'grant_not_allowed', message: 'Denied.' } }),
    onSuccess: async () => { refreshed = true },
  })
  assert.equal(result.error.code, 'grant_not_allowed')
  assert.equal(refreshed, false)
})

test('role mutation rejects double submit and preserves confirmed success if refresh fails', async () => {
  let release
  const pending = new Promise((resolve) => { release = resolve })
  const guard = { current: false }
  const first = runRoleMutation({ guard, operation: async () => { await pending; return { data: { removed: true }, error: null } } })
  const second = await runRoleMutation({ guard, operation: async () => ({ data: { removed: true }, error: null }) })
  assert.equal(second.error.code, 'in_progress')
  release()
  await first
  const result = await runRoleMutation({ guard: { current: false }, operation: async () => ({ data: { created: true }, error: null }), onSuccess: async () => ({ error: { code: 'unavailable' } }) })
  assert.equal(result.warning.code, 'refresh_failed')
})
