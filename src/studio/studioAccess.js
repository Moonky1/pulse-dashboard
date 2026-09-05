export const STUDIO_VIEW_PERMISSION = 'studio.view'
export const STUDIO_CREATE_PERMISSION = 'studio.create'

export function resolveStudioAccess({ loading = false, error = null, permissionKeys = [] } = {}) {
  if (loading) return 'loading'
  if (error) return 'error'
  return permissionKeys.includes(STUDIO_VIEW_PERMISSION) ? 'allowed' : 'denied'
}

export function canCreateStudioContent(permissionKeys = []) {
  return permissionKeys.includes(STUDIO_CREATE_PERMISSION)
}
