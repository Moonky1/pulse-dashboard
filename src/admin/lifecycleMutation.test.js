import assert from 'node:assert/strict'
import test from 'node:test'

import { runLifecycleMutation } from './lifecycleMutation.js'

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

test('successful mutation waits for server result and post-success refetch', async () => {
  const events = []
  const result = await runLifecycleMutation({
    guard: { current: false },
    action: 'block',
    targetUserId: USER_ID,
    reason: 'reviewed',
    operations: { block: async () => { events.push('rpc'); return { data: { status: 'blocked' }, error: null } } },
    onSuccess: async () => { events.push('refetch') },
  })
  assert.equal(result.error, null)
  assert.deepEqual(events, ['rpc', 'refetch'])
})

test('failed mutation does not refetch or expose a client-side state change', async () => {
  let refreshed = false
  const result = await runLifecycleMutation({
    guard: { current: false },
    action: 'inactivate',
    targetUserId: USER_ID,
    operations: { inactivate: async () => ({ data: null, error: { code: 'access_denied', message: 'Denied.' } }) },
    onSuccess: async () => { refreshed = true },
  })
  assert.equal(result.error.code, 'access_denied')
  assert.equal(refreshed, false)
})

test('double submit is rejected while the first RPC is pending', async () => {
  let release
  const pending = new Promise((resolve) => { release = resolve })
  let calls = 0
  const guard = { current: false }
  const input = {
    guard,
    action: 'reactivate',
    targetUserId: USER_ID,
    operations: { reactivate: async () => { calls += 1; await pending; return { data: { status: 'active' }, error: null } } },
  }
  const first = runLifecycleMutation(input)
  const second = await runLifecycleMutation(input)
  assert.equal(second.error.code, 'in_progress')
  assert.equal(calls, 1)
  release()
  await first
  assert.equal(guard.current, false)
})

test('unexpected operation failures are sanitized and release the submit guard', async () => {
  const guard = { current: false }
  const result = await runLifecycleMutation({
    guard,
    action: 'block',
    targetUserId: USER_ID,
    operations: { block: async () => { throw new Error('sensitive network internals') } },
  })
  assert.equal(result.error.code, 'unavailable')
  assert.doesNotMatch(result.error.message, /sensitive|network/i)
  assert.equal(guard.current, false)
})

test('a confirmed mutation remains successful when its refetch fails', async () => {
  const result = await runLifecycleMutation({
    guard: { current: false },
    action: 'block',
    targetUserId: USER_ID,
    operations: { block: async () => ({ data: { status: 'blocked', changed: true }, error: null }) },
    onSuccess: async () => ({ data: null, error: { code: 'unavailable' } }),
  })
  assert.equal(result.error, null)
  assert.equal(result.data.status, 'blocked')
  assert.equal(result.warning.code, 'refresh_failed')
  assert.match(result.warning.message, /server confirmed/i)
})
