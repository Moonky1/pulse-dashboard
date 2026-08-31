import assert from 'node:assert/strict'
import test from 'node:test'

import { auditActionLabel, auditSummary, formatAuditTime } from './auditViewModel.js'

test('known audit actions have stable human labels', () => {
  assert.equal(auditActionLabel('role.assigned'), 'Role assigned')
  assert.equal(auditActionLabel('department.deactivated'), 'Department deactivated')
})

test('unknown events degrade safely without hiding their action', () => {
  assert.equal(auditActionLabel('policy.reconciled'), 'Policy Reconciled')
  assert.match(auditSummary({ action: 'policy.reconciled' }), /Pulse system.*protected record/)
  assert.equal(formatAuditTime('not-a-date'), 'Time unavailable')
})
