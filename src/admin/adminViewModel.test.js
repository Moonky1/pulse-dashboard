import assert from 'node:assert/strict'
import test from 'node:test'

import { filterManagedUsers, lifecycleMeta, roleScopeLabel } from './adminViewModel.js'

test('lifecycle states expose readable labels, not color alone', () => {
  assert.equal(lifecycleMeta('pending_approval').label, 'Pending approval')
  assert.match(lifecycleMeta('blocked').description, /restricted/)
})

test('role scopes clearly distinguish global, department, Campaign, and team access', () => {
  const directory = { departments: [{ id: 'd1', name: 'Corporate' }], teams: [{ id: 't1', name: 'North' }] }
  assert.equal(roleScopeLabel({ scopeType: 'global' }, directory), 'Global · All Pulse')
  assert.equal(roleScopeLabel({ scopeType: 'department', departmentId: 'd1' }, directory), 'Department · Corporate')
  assert.equal(roleScopeLabel({ scopeType: 'campaign', campaignName: 'Garrett' }, directory), 'Campaign · Garrett')
  assert.equal(roleScopeLabel({ scopeType: 'team', teamId: 't1' }, directory), 'Team · North')
})

test('user filtering supports identity, lifecycle, organization, and role', () => {
  const users = [{ fullName: 'Ada Admin', displayName: 'Ada', employeeId: 'KK-000100', email: 'ada@example.test', status: 'active', departmentId: 'd1', teamId: null, roles: [{ key: 'admin' }] }]
  assert.equal(filterManagedUsers(users, { query: '000100', status: 'active', departmentId: 'd1', roleKey: 'admin' }).length, 1)
  assert.equal(filterManagedUsers(users, { query: 'other' }).length, 0)
})
