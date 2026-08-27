import assert from 'node:assert/strict'
import test from 'node:test'

import { assignManagedUserRole, blockManagedUser, blockPendingUser, extractGlobalPermissionKeys, getManagedUser, inactivateManagedUser, listManagedUsers, loadAssignableRoleOptions, loadOwnGlobalPermissionKeys, normalizeLifecycleMutationError, normalizePendingMutationError, normalizeRoleMutationError, reactivateManagedUser, removeManagedUserRole } from './adminApi.js'

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ROLE_ID = '10000000-0000-0000-0000-000000000009'
const ASSIGNMENT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const row = {
  id: USER_ID,
  email: 'person@example.test',
  full_name: 'Example Person',
  display_name: 'Example',
  employee_id: 'KK-000999',
  status: 'active',
  auth_email_confirmed: true,
  roles: null,
}

test('permission read follows canonical role scopes and includes active global grants only', async () => {
  const assignments = [
    { scope_type: 'global', role_scopes: { roles: { is_active: true, role_permissions: [{ permissions: { key: 'admin.access', is_active: true } }, { permissions: { key: 'users.view', is_active: true } }] } } },
    { scope_type: 'team', role_scopes: { roles: { is_active: true, role_permissions: [{ permissions: { key: 'users.manage', is_active: true } }] } } },
    { scope_type: 'global', role_scopes: { roles: { is_active: false, role_permissions: [{ permissions: { key: 'audit.view', is_active: true } }] } } },
  ]
  assert.deepEqual(extractGlobalPermissionKeys(assignments).sort(), ['admin.access', 'users.view'])
  let select = ''
  const query = {
    select(value) { select = value; return this },
    eq() { return this },
    then(resolve) { return Promise.resolve(resolve({ data: assignments, error: null })) },
  }
  const result = await loadOwnGlobalPermissionKeys({ from: () => query }, USER_ID)
  assert.match(select, /role_scopes!user_roles_role_scope_fk!inner/)
  assert.match(select, /roles!role_scopes_role_fk!inner/)
  assert.match(select, /role_permissions!role_permissions_role_fk/)
  assert.deepEqual(result.data.sort(), ['admin.access', 'users.view'])
})

test('users list normalizes successful results and null roles', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: [row], error: null } } }
  const result = await listManagedUsers(client, { status: 'pending_approval' })
  assert.equal(result.error, null)
  assert.equal(result.data[0].displayName, 'Example')
  assert.deepEqual(result.data[0].roles, [])
  assert.deepEqual(calls, [{ name: 'list_managed_users', args: { requested_status: 'pending_approval' } }])
})

test('users list sanitizes backend errors', async () => {
  const client = { rpc: async () => ({ data: null, error: { code: 'XX000', message: 'sensitive SQL' } }) }
  const result = await listManagedUsers(client)
  assert.equal(result.error.code, 'unavailable')
  assert.doesNotMatch(result.error.message, /SQL/)
})

test('user detail normalizes a successful exact result', async () => {
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'get_managed_user')
    assert.equal(args.target_user_id, USER_ID)
    return { data: [row], error: null }
  } }
  const result = await getManagedUser(client, USER_ID)
  assert.equal(result.data.id, USER_ID)
})

test('user detail rejects invalid and missing targets safely', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [], error: null } } }
  assert.equal((await getManagedUser(client, 'bad-id')).error.code, 'invalid_request')
  assert.equal(calls, 0)
  assert.equal((await getManagedUser(client, USER_ID)).error.code, 'not_found')
})

test('lifecycle operations call only their canonical RPC and normalize the result', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    const states = { block_user: 'blocked', reactivate_user: 'active', inactivate_user: 'inactive' }
    return { data: [{ id: USER_ID, status: states[name], status_changed_at: '2026-08-26T00:00:00Z', changed: true }], error: null }
  } }
  assert.equal((await blockManagedUser(client, USER_ID, ' review ')).data.status, 'blocked')
  assert.equal((await reactivateManagedUser(client, USER_ID)).data.status, 'active')
  assert.equal((await inactivateManagedUser(client, USER_ID)).data.status, 'inactive')
  assert.deepEqual(calls, [
    { name: 'block_user', args: { target_user_id: USER_ID, reason: 'review' } },
    { name: 'reactivate_user', args: { target_user_id: USER_ID, reason: null } },
    { name: 'inactivate_user', args: { target_user_id: USER_ID, reason: null } },
  ])
})

test('lifecycle operations reject malformed requests and unexpected server results', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ id: USER_ID, status: 'active', changed: true }], error: null } } }
  assert.equal((await blockManagedUser(client, 'bad-id')).error.code, 'invalid_request')
  assert.equal((await blockManagedUser(client, USER_ID, 'x'.repeat(501))).error.code, 'invalid_reason')
  assert.equal(calls, 0)
  assert.equal((await blockManagedUser(client, USER_ID)).error.code, 'unexpected_result')
})

test('lifecycle errors are sanitized into actionable public messages', () => {
  const cases = [
    [{ code: '42501', message: 'self-blocking is not allowed' }, 'self_operation'],
    [{ code: '55000', message: 'the last active Super Admin is protected' }, 'protected_super_admin'],
    [{ code: '42501', message: 'active global users.manage permission required' }, 'access_denied'],
    [{ code: '55000', message: 'target must be active' }, 'invalid_transition'],
    [{ code: '23514', message: 'target Auth identity is invalid or email does not match' }, 'auth_identity_invalid'],
    [{ code: '23514', message: 'target has no valid active role assignment' }, 'role_required'],
    [{ code: '23503', message: 'target department is missing or inactive' }, 'organization_invalid'],
    [{ code: 'XX000', message: 'sensitive SQL stack' }, 'unavailable'],
  ]
  cases.forEach(([error, code]) => {
    const normalized = normalizeLifecycleMutationError(error)
    assert.equal(normalized.code, code)
    assert.doesNotMatch(normalized.message, /SQL|stack/i)
  })
})

test('pending block calls only the canonical onboarding RPC and validates its response', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ id: USER_ID, status: 'blocked', status_changed_at: '2026-08-26T00:00:00Z' }], error: null }
  } }
  const result = await blockPendingUser(client, USER_ID, ' duplicate registration ')
  assert.equal(result.data.status, 'blocked')
  assert.deepEqual(calls, [{ name: 'block_pending_user', args: { target_user_id: USER_ID, reason: 'duplicate registration' } }])
})

test('pending block rejects malformed, stale, and unauthorized requests safely', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ id: USER_ID, status: 'active' }], error: null } } }
  assert.equal((await blockPendingUser(client, 'bad-id')).error.code, 'invalid_request')
  assert.equal((await blockPendingUser(client, USER_ID, 'x'.repeat(501))).error.code, 'invalid_reason')
  assert.equal(calls, 0)
  assert.equal((await blockPendingUser(client, USER_ID)).error.code, 'unexpected_result')
  assert.equal(normalizePendingMutationError({ code: '55000', message: 'target must be pending approval' }).code, 'stale_pending_user')
  assert.equal(normalizePendingMutationError({ code: '42501', message: 'global users.approve is required' }).code, 'access_denied')
  const hidden = normalizePendingMutationError({ code: 'XX000', message: 'sensitive SQL stack' })
  assert.equal(hidden.code, 'unavailable')
  assert.doesNotMatch(hidden.message, /SQL|stack/i)
})

test('role assignment calls only the canonical RPC with a target-bound scope', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ user_role_id: ASSIGNMENT_ID, created: true }], error: null }
  } }
  const result = await assignManagedUserRole(client, {
    targetUserId: USER_ID,
    requestedRoleId: ROLE_ID,
    requestedScopeType: 'department',
    requestedDepartmentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  })
  assert.deepEqual(result, { data: { userRoleId: ASSIGNMENT_ID, created: true }, error: null })
  assert.deepEqual(calls, [{ name: 'assign_user_role', args: {
    target_user_id: USER_ID,
    requested_role_id: ROLE_ID,
    requested_scope_type: 'department',
    requested_department_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    requested_team_id: null,
  } }])
})

test('role assignment validates local input and surfaces duplicate server success safely', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ user_role_id: ASSIGNMENT_ID, created: false }], error: null } } }
  assert.equal((await assignManagedUserRole(client, { targetUserId: 'bad', requestedRoleId: ROLE_ID, requestedScopeType: 'global' })).error.code, 'invalid_request')
  assert.equal((await assignManagedUserRole(client, { targetUserId: USER_ID, requestedRoleId: ROLE_ID, requestedScopeType: 'planet' })).error.code, 'invalid_request')
  assert.equal(calls, 0)
  assert.equal((await assignManagedUserRole(client, { targetUserId: USER_ID, requestedRoleId: ROLE_ID, requestedScopeType: 'global' })).data.created, false)
})

test('role removal addresses one exact assignment through its canonical RPC', async () => {
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'remove_user_role')
    assert.deepEqual(args, { target_user_id: USER_ID, target_user_role_id: ASSIGNMENT_ID })
    return { data: [{ user_role_id: ASSIGNMENT_ID, removed: true }], error: null }
  } }
  assert.deepEqual(await removeManagedUserRole(client, USER_ID, ASSIGNMENT_ID), { data: { userRoleId: ASSIGNMENT_ID, removed: true }, error: null })
})

test('role errors are sanitized for grant, scope, organization, self, and last-role protections', () => {
  const cases = [
    [{ code: '42501', message: 'self role changes are not allowed' }, 'self_operation'],
    [{ code: '42501', message: 'actor cannot grant requested role and scope' }, 'grant_not_allowed'],
    [{ code: '23503', message: 'requested role is inactive or invalid for scope' }, 'catalog_invalid'],
    [{ code: '23514', message: 'team role must match target team' }, 'organization_invalid'],
    [{ code: '55000', message: 'active user must retain at least one active role' }, 'protected_assignment'],
    [{ code: '55000', message: 'the last active Super Admin is protected' }, 'protected_super_admin'],
    [{ code: 'XX000', message: 'sensitive SQL stack' }, 'unavailable'],
  ]
  cases.forEach(([error, code]) => {
    const normalized = normalizeRoleMutationError(error)
    assert.equal(normalized.code, code)
    assert.doesNotMatch(normalized.message, /SQL|stack/i)
  })
})

test('assignable role catalog calls only the target-bound protected RPC', async () => {
  const calls = []
  const result = await loadAssignableRoleOptions({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'global', department_id: null, team_id: null }], error: null }
  } }, USER_ID)
  assert.deepEqual(calls, [{ name: 'list_assignable_role_options', args: { target_user_id: USER_ID } }])
  assert.deepEqual(result.data, [{ roleId: ROLE_ID, roleKey: 'admin', roleName: 'Admin', scopeType: 'global', departmentId: null, departmentName: null, teamId: null, teamName: null }])
})

test('assignable role catalog preserves legitimate empty results and sanitizes failures', async () => {
  assert.deepEqual(await loadAssignableRoleOptions({ rpc: async () => ({ data: [], error: null }) }, USER_ID), { data: [], error: null })
  const failed = await loadAssignableRoleOptions({ rpc: async () => ({ data: null, error: { code: 'XX000', message: 'sensitive SQL' } }) }, USER_ID)
  assert.equal(failed.error.code, 'unavailable')
  assert.doesNotMatch(failed.error.message, /SQL/i)
  assert.equal((await loadAssignableRoleOptions({ rpc: async () => { throw new Error('must not run') } }, 'bad-id')).error.code, 'invalid_request')
})

test('assignable role catalog drops malformed or arbitrary scope combinations', async () => {
  const data = [
    { role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'global', department_id: null, team_id: null },
    { role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'global', department_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', team_id: null },
    { role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'planet', department_id: null, team_id: null },
  ]
  const result = await loadAssignableRoleOptions({ rpc: async () => ({ data, error: null }) }, USER_ID)
  assert.equal(result.data.length, 1)
})
