import assert from 'node:assert/strict'
import test from 'node:test'

import { extractGlobalPermissionKeys, getManagedUser, listManagedUsers, loadOwnGlobalPermissionKeys } from './adminApi.js'

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
