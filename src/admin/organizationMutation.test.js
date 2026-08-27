import assert from 'node:assert/strict'
import test from 'node:test'

import { runOrganizationMutation } from './organizationMutation.js'

test('organization mutation waits for server confirmation then refetches canonical catalogs', async () => {
  const events = []
  const result = await runOrganizationMutation({
    guard: { current: false },
    operation: async () => { events.push('rpc'); return { data: { changed: true }, error: null } },
    onSuccess: async () => { events.push('refetch'); return { error: null } },
  })
  assert.equal(result.error, null)
  assert.deepEqual(events, ['rpc', 'refetch'])
})

test('failed organization mutation never applies optimistic state or refetches', async () => {
  let refreshed = false
  const result = await runOrganizationMutation({
    guard: { current: false },
    operation: async () => ({ data: null, error: { code: 'dependencies', message: 'Blocked.' } }),
    onSuccess: async () => { refreshed = true },
  })
  assert.equal(result.error.code, 'dependencies')
  assert.equal(refreshed, false)
})

test('organization runner blocks double submission and preserves server success on refresh failure', async () => {
  let release
  const wait = new Promise((resolve) => { release = resolve })
  const guard = { current: false }
  const first = runOrganizationMutation({ guard, operation: async () => { await wait; return { data: { changed: true }, error: null } } })
  const second = await runOrganizationMutation({ guard, operation: async () => ({ data: { changed: true }, error: null }) })
  assert.equal(second.error.code, 'in_progress')
  release()
  await first
  const warning = await runOrganizationMutation({ guard: { current: false }, operation: async () => ({ data: { changed: true }, error: null }), onSuccess: async () => ({ error: { code: 'unavailable' } }) })
  assert.equal(warning.warning.code, 'refresh_failed')
})
