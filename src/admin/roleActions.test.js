import assert from 'node:assert/strict'
import test from 'node:test'

import { assignableRoles, isSuperAdminRole, organizationForRoleOption, roleAssignmentRequest, roleCatalogMessage, roleMutationSuccessMessage, roleOptionKey, roleOptionsForRole } from './roleActions.js'

const ROLE_ID = '10000000-0000-0000-0000-000000000004'
const DEPARTMENT_ID = 'd0000000-0000-0000-0000-000000000001'
const TEAM_ID = 'e0000000-0000-0000-0000-000000000001'
const OPTIONS = [
  { roleId: ROLE_ID, roleKey: 'supervisor', roleName: 'Supervisor', scopeType: 'department', departmentId: DEPARTMENT_ID, departmentName: 'Corporate', teamId: null, teamName: null },
  { roleId: ROLE_ID, roleKey: 'supervisor', roleName: 'Supervisor', scopeType: 'team', departmentId: DEPARTMENT_ID, departmentName: 'Corporate', teamId: TEAM_ID, teamName: 'North' },
]

test('role and scope rendering comes only from exact server-returned options', () => {
  assert.deepEqual(assignableRoles(OPTIONS), [{ id: ROLE_ID, key: 'supervisor', name: 'Supervisor' }])
  assert.deepEqual(roleOptionsForRole(OPTIONS, ROLE_ID), OPTIONS)
  assert.match(roleOptionKey(OPTIONS[0]), new RegExp(ROLE_ID))
  assert.equal(organizationForRoleOption({ scopeType: 'global' }).label, 'Global · All Pulse')
  assert.equal(organizationForRoleOption(OPTIONS[0]).label, 'Department · Corporate')
  assert.equal(organizationForRoleOption(OPTIONS[1]).label, 'Team · North')
})

test('assignment request reuses one exact server-resolved grant combination', () => {
  assert.deepEqual(roleAssignmentRequest(OPTIONS[0]), {
    requestedRoleId: ROLE_ID,
    requestedScopeType: 'department',
    requestedDepartmentId: DEPARTMENT_ID,
    requestedTeamId: null,
    organization: { label: 'Department · Corporate', departmentId: DEPARTMENT_ID, teamId: null, valid: true },
  })
  assert.equal(roleAssignmentRequest({ ...OPTIONS[0], scopeType: 'planet' }), null)
  assert.equal(roleAssignmentRequest({ ...OPTIONS[1], teamId: null }), null)
})

test('role notices distinguish idempotency and privileged Super Admin assignments', () => {
  assert.match(roleMutationSuccessMessage('assign', { created: false }, 'Supervisor'), /already exists/)
  assert.match(roleMutationSuccessMessage('remove', { removed: true }, 'Supervisor'), /removed/)
  assert.equal(isSuperAdminRole({ key: 'super_admin' }, 'global'), true)
  assert.equal(isSuperAdminRole({ key: 'super_admin' }, 'team'), false)
})

test('catalog UI distinguishes loading, legitimate empty, error, and ready states', () => {
  assert.match(roleCatalogMessage({ loading: true }), /Loading/)
  assert.match(roleCatalogMessage({ loading: false, options: [] }), /No role assignments/)
  assert.equal(roleCatalogMessage({ loading: false, error: { message: 'Catalog unavailable' }, options: [] }), 'Catalog unavailable')
  assert.equal(roleCatalogMessage({ loading: false, options: OPTIONS }), null)
})
