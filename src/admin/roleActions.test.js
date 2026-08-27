import assert from 'node:assert/strict'
import test from 'node:test'

import { isSuperAdminRole, organizationForRoleScope, roleAssignmentRequest, roleMutationSuccessMessage, supportedScopesForRole } from './roleActions.js'

const USER = { departmentId: 'd1', teamId: 't1' }
const DIRECTORY = { departments: [{ id: 'd1', name: 'Corporate' }], teams: [{ id: 't1', name: 'North' }] }
const ROLE = { id: '10000000-0000-4000-8000-000000000001', key: 'supervisor', name: 'Supervisor', scopes: ['department', 'team'] }

test('only catalog-supported Global, Department, and Team scopes are rendered', () => {
  assert.deepEqual(supportedScopesForRole({ scopes: ['global', 'department', 'team', 'planet'] }), ['global', 'department', 'team'])
  assert.equal(organizationForRoleScope('global', USER, DIRECTORY).label, 'Global · All Pulse')
  assert.equal(organizationForRoleScope('department', USER, DIRECTORY).label, 'Department · Corporate')
  assert.equal(organizationForRoleScope('team', USER, DIRECTORY).label, 'Team · North')
})

test('assignment requests bind organization scope to the canonical target profile', () => {
  assert.deepEqual(roleAssignmentRequest(ROLE, 'department', USER, DIRECTORY), {
    requestedRoleId: ROLE.id,
    requestedScopeType: 'department',
    requestedDepartmentId: 'd1',
    requestedTeamId: null,
    organization: { label: 'Department · Corporate', departmentId: 'd1', teamId: null, valid: true },
  })
  assert.equal(roleAssignmentRequest(ROLE, 'global', USER, DIRECTORY), null)
  assert.equal(roleAssignmentRequest(ROLE, 'team', { departmentId: 'd1', teamId: null }, DIRECTORY), null)
})

test('role notices distinguish idempotency and privileged Super Admin assignments', () => {
  assert.match(roleMutationSuccessMessage('assign', { created: false }, 'Supervisor'), /already exists/)
  assert.match(roleMutationSuccessMessage('remove', { removed: true }, 'Supervisor'), /removed/)
  assert.equal(isSuperAdminRole({ key: 'super_admin' }, 'global'), true)
  assert.equal(isSuperAdminRole({ key: 'super_admin' }, 'team'), false)
})
