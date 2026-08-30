import assert from 'node:assert/strict'
import test from 'node:test'

import { canApprovePendingUsers, canAssignRoles, canBlockPendingUsers, canManageDepartments, canManageTeams, canManageUsers, canViewAudit, canViewDepartments, canViewTeams, canViewUserHistory, hasAdminUsersAccess, resolveAdminAccess } from './access.js'

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

test('pending review controls match the deployed RPC permission contracts', () => {
  assert.equal(canBlockPendingUsers(['admin.access', 'users.view', 'users.approve']), true)
  assert.equal(canBlockPendingUsers(['admin.access', 'users.view']), false)
  assert.equal(canApprovePendingUsers(['admin.access', 'users.view', 'users.approve', 'roles.assign']), true)
  assert.equal(canApprovePendingUsers(['admin.access', 'users.view', 'users.approve']), false)
  assert.equal(canApprovePendingUsers(['users.approve', 'roles.assign', 'super_admin']), false)
})

test('organization surfaces require admin access plus exact canonical view permission', () => {
  assert.equal(canViewDepartments(['admin.access', 'departments.view']), true)
  assert.equal(canViewDepartments(['departments.view']), false)
  assert.equal(canViewTeams(['admin.access', 'teams.view']), true)
  assert.equal(canViewTeams(['admin.access', 'departments.view']), false)
  assert.equal(resolveAdminAccess({ permissionKeys: ['admin.access', 'departments.view'] }), 'allowed')
  assert.equal(resolveAdminAccess({ permissionKeys: ['admin.access', 'teams.view'] }), 'allowed')
})

test('organization mutation controls require manage and supporting read permissions', () => {
  assert.equal(canManageDepartments(['admin.access', 'departments.view', 'departments.manage']), true)
  assert.equal(canManageDepartments(['admin.access', 'departments.manage']), false)
  assert.equal(canManageTeams(['admin.access', 'teams.view', 'teams.manage', 'departments.view']), true)
  assert.equal(canManageTeams(['admin.access', 'teams.view', 'teams.manage']), false)
  assert.equal(canManageTeams(['super_admin', 'teams.manage', 'departments.view']), false)
})

test('audit and user history require exact canonical permission combinations', () => {
  assert.equal(canViewAudit(['admin.access', 'audit.view']), true)
  assert.equal(canViewAudit(['audit.view']), false)
  assert.equal(canViewUserHistory(['admin.access', 'users.view', 'audit.view']), true)
  assert.equal(canViewUserHistory(['admin.access', 'audit.view']), false)
  assert.equal(resolveAdminAccess({ permissionKeys: ['admin.access', 'audit.view'] }), 'allowed')
})
