import assert from 'node:assert/strict'
import test from 'node:test'

import { blockManagedUser, extractGlobalPermissionKeys, getManagedUser, inactivateManagedUser, listManagedUsers, loadOwnGlobalPermissionKeys, normalizeLifecycleMutationError, reactivateManagedUser } from './adminApi.js'

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
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
  const client = { rpc: async () => ({ data: [row], error: null }) }
  const result = await listManagedUsers(client)
  assert.equal(result.error, null)
  assert.equal(result.data[0].displayName, 'Example')
  assert.deepEqual(result.data[0].roles, [])
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
