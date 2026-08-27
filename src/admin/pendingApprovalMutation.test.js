import assert from 'node:assert/strict'
import test from 'node:test'

import { runPendingApprovalMutation } from './pendingApprovalMutation.js'

test('pending approval applies no optimistic state and refetches only after server success', async () => {
  const order = []
  const result = await runPendingApprovalMutation({
    guard: { current: false },
    operation: async () => { order.push('server'); return { data: { status: 'active' }, error: null } },
    onSuccess: async () => { order.push('refetch'); return { error: null } },
  })
  assert.deepEqual(order, ['server', 'refetch'])
  assert.equal(result.data.status, 'active')
})

test('pending approval failure never refetches or invents client state', async () => {
  let refreshed = false
  const result = await runPendingApprovalMutation({
    guard: { current: false },
    operation: async () => ({ data: null, error: { code: 'stale_pending_user', message: 'Refresh.' } }),
    onSuccess: async () => { refreshed = true },
  })
  assert.equal(result.error.code, 'stale_pending_user')
  assert.equal(refreshed, false)
})

test('pending approval guard and refresh failures remain safe', async () => {
  assert.equal((await runPendingApprovalMutation({ guard: { current: true } })).error.code, 'in_progress')
  const guard = { current: false }
  const result = await runPendingApprovalMutation({
    guard,
    operation: async () => ({ data: { status: 'active' }, error: null }),
    onSuccess: async () => { throw new Error('offline') },
  })
  assert.equal(result.warning.code, 'refresh_failed')
  assert.equal(guard.current, false)
})
