import assert from 'node:assert/strict'
import test from 'node:test'

import { isSuperAdminTarget, lifecycleActionsForUser, lifecycleSuccessMessage } from './lifecycleActions.js'

const actions = (status, allowed = true) => lifecycleActionsForUser({ status, roles: [] }, allowed).map((action) => action.key)

test('lifecycle actions are permission gated and contextual by server lifecycle state', () => {
  assert.deepEqual(actions('active'), ['block', 'inactivate'])
  assert.deepEqual(actions('blocked'), ['reactivate', 'inactivate'])
  assert.deepEqual(actions('inactive'), ['reactivate'])
  assert.deepEqual(actions('pending_approval'), [])
  assert.deepEqual(actions('active', false), [])
})

test('Super Admin warning uses the canonical role key and global scope', () => {
  assert.equal(isSuperAdminTarget({ roles: [{ key: 'super_admin', scopeType: 'global' }] }), true)
  assert.equal(isSuperAdminTarget({ roles: [{ key: 'super_admin', scopeType: 'team' }] }), false)
  assert.equal(isSuperAdminTarget({ roles: [{ key: 'admin', scopeType: 'global' }] }), false)
})

test('success feedback distinguishes changed and idempotent results', () => {
  assert.match(lifecycleSuccessMessage('block', { changed: true }), /Blocked/)
  assert.match(lifecycleSuccessMessage('reactivate', { changed: false }), /already active/)
})
