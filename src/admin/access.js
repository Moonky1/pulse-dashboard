export const ADMIN_USERS_PERMISSIONS = Object.freeze(['admin.access', 'users.view'])
export const ADMIN_USERS_MANAGE_PERMISSIONS = Object.freeze([...ADMIN_USERS_PERMISSIONS, 'users.manage'])
export const ADMIN_ROLES_ASSIGN_PERMISSIONS = Object.freeze([...ADMIN_USERS_PERMISSIONS, 'roles.assign'])
export const ADMIN_PENDING_BLOCK_PERMISSIONS = Object.freeze([...ADMIN_USERS_PERMISSIONS, 'users.approve'])
export const ADMIN_PENDING_APPROVE_PERMISSIONS = Object.freeze([...ADMIN_PENDING_BLOCK_PERMISSIONS, 'roles.assign'])
export const ADMIN_DEPARTMENTS_VIEW_PERMISSIONS = Object.freeze(['admin.access', 'departments.view'])
export const ADMIN_DEPARTMENTS_MANAGE_PERMISSIONS = Object.freeze([...ADMIN_DEPARTMENTS_VIEW_PERMISSIONS, 'departments.manage'])
export const ADMIN_TEAMS_VIEW_PERMISSIONS = Object.freeze(['admin.access', 'teams.view'])
export const ADMIN_TEAMS_MANAGE_PERMISSIONS = Object.freeze([...ADMIN_TEAMS_VIEW_PERMISSIONS, 'teams.manage', 'departments.view'])

function hasEvery(permissionKeys, required) {
  const keys = new Set(permissionKeys)
  return required.every((permission) => keys.has(permission))
}

export function hasAdminUsersAccess(permissionKeys = []) {
  return hasEvery(permissionKeys, ADMIN_USERS_PERMISSIONS)
}

export function canManageUsers(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_USERS_MANAGE_PERMISSIONS.every((permission) => keys.has(permission))
}

export function canAssignRoles(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_ROLES_ASSIGN_PERMISSIONS.every((permission) => keys.has(permission))
}

export function canBlockPendingUsers(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_PENDING_BLOCK_PERMISSIONS.every((permission) => keys.has(permission))
}

export function canApprovePendingUsers(permissionKeys = []) {
  const keys = new Set(permissionKeys)
  return ADMIN_PENDING_APPROVE_PERMISSIONS.every((permission) => keys.has(permission))
}

export function canViewDepartments(permissionKeys = []) {
  return hasEvery(permissionKeys, ADMIN_DEPARTMENTS_VIEW_PERMISSIONS)
}

export function canManageDepartments(permissionKeys = []) {
  return hasEvery(permissionKeys, ADMIN_DEPARTMENTS_MANAGE_PERMISSIONS)
}

export function canViewTeams(permissionKeys = []) {
  return hasEvery(permissionKeys, ADMIN_TEAMS_VIEW_PERMISSIONS)
}

export function canManageTeams(permissionKeys = []) {
  return hasEvery(permissionKeys, ADMIN_TEAMS_MANAGE_PERMISSIONS)
}

export function hasAnyAdminSurfaceAccess(permissionKeys = []) {
  return hasAdminUsersAccess(permissionKeys)
    || canViewDepartments(permissionKeys)
    || canViewTeams(permissionKeys)
}

export function resolveAdminAccess({ loading = false, error = null, permissionKeys = [] } = {}) {
  if (loading) return 'loading'
  if (error) return 'error'
  return hasAnyAdminSurfaceAccess(permissionKeys) ? 'allowed' : 'denied'
}
