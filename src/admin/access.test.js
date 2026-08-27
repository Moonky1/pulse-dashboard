import assert from 'node:assert/strict'
import test from 'node:test'

import { canAssignRoles, canManageUsers, hasAdminUsersAccess, resolveAdminAccess } from './access.js'

test('Admin is visible only with both required canonical permissions', () => {
  assert.equal(hasAdminUsersAccess(['admin.access', 'users.view']), true)
  assert.equal(hasAdminUsersAccess(['users.view', 'admin.access', 'audit.view']), true)
})

test('Admin is hidden when either permission is absent', () => {
  assert.equal(hasAdminUsersAccess(['admin.access']), false)
  assert.equal(hasAdminUsersAccess(['users.view']), false)
  assert.equal(hasAdminUsersAccess([]), false)
})

test('direct route resolution fails closed during loading and errors', () => {
  assert.equal(resolveAdminAccess({ loading: true, permissionKeys: ['admin.access', 'users.view'] }), 'loading')
  assert.equal(resolveAdminAccess({ error: new Error('network') }), 'error')
  assert.equal(resolveAdminAccess({ permissionKeys: ['admin.access'] }), 'denied')
  assert.equal(resolveAdminAccess({ permissionKeys: ['admin.access', 'users.view'] }), 'allowed')
})

test('lifecycle controls require read access plus users.manage', () => {
  assert.equal(canManageUsers(['admin.access', 'users.view', 'users.manage']), true)
  assert.equal(canManageUsers(['admin.access', 'users.view']), false)
  assert.equal(canManageUsers(['users.manage']), false)
})

test('role controls require only the canonical roles.assign permission set', () => {
  assert.equal(canAssignRoles(['admin.access', 'users.view', 'roles.assign']), true)
  assert.equal(canAssignRoles(['admin.access', 'users.view']), false)
  assert.equal(canAssignRoles(['roles.assign', 'super_admin']), false)
})
