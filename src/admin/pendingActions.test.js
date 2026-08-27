import assert from 'node:assert/strict'
import test from 'node:test'

import { PENDING_APPROVAL_CATALOG_MESSAGE, pendingBlockSuccessMessage, pendingReviewState } from './pendingActions.js'

test('pending review actions require both lifecycle and canonical permissions', () => {
  assert.deepEqual(pendingReviewState({ status: 'pending_approval' }, { canBlock: true, canApprove: true }), {
    pending: true,
    canBlock: true,
    canApprove: true,
    approvalAvailable: false,
  })
  assert.equal(pendingReviewState({ status: 'active' }, { canBlock: true, canApprove: true }).canBlock, false)
  assert.equal(pendingReviewState({ status: 'pending_approval' }).canApprove, false)
})

test('approval remains fail-closed until a protected catalog contract exists', () => {
  const state = pendingReviewState({ status: 'pending_approval' }, { canApprove: true })
  assert.equal(state.approvalAvailable, false)
  assert.match(PENDING_APPROVAL_CATALOG_MESSAGE, /protected catalog/i)
})

test('pending block success is described only after canonical refetch', () => {
  assert.match(pendingBlockSuccessMessage(), /server-confirmed record has been refreshed/i)
})
