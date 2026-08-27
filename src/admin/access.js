export const ADMIN_USERS_PERMISSIONS = Object.freeze(['admin.access', 'users.view'])
export const ADMIN_USERS_MANAGE_PERMISSIONS = Object.freeze([...ADMIN_USERS_PERMISSIONS, 'users.manage'])
export const ADMIN_ROLES_ASSIGN_PERMISSIONS = Object.freeze([...ADMIN_USERS_PERMISSIONS, 'roles.assign'])

export function hasAdminUsersAccess(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_USERS_PERMISSIONS.every((permission) => keys.has(permission))
}

export function canManageUsers(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_USERS_MANAGE_PERMISSIONS.every((permission) => keys.has(permission))
}

export function canAssignRoles(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_ROLES_ASSIGN_PERMISSIONS.every((permission) => keys.has(permission))
}

export function resolveAdminAccess({ loading = false, error = null, permissionKeys = [] } = {}) {
  if (loading) return 'loading'
  if (error) return 'error'
  return hasAdminUsersAccess(permissionKeys) ? 'allowed' : 'denied'
}
