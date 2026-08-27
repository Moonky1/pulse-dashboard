import { roleScopeLabel } from './adminViewModel.js'

export const ROLE_SCOPE_TYPES = Object.freeze(['global', 'department', 'team'])

export function supportedScopesForRole(role) {
  return (role?.scopes ?? []).filter((scope) => ROLE_SCOPE_TYPES.includes(scope))
}

export function organizationForRoleScope(scopeType, user, directory) {
  if (scopeType === 'global') return { label: 'Global · All Pulse', departmentId: null, teamId: null, valid: true }
  if (!user?.departmentId) return { label: 'Target department is required', departmentId: null, teamId: null, valid: false }
  if (scopeType === 'department') return {
    label: `Department · ${directory?.departments?.find((department) => department.id === user.departmentId)?.name ?? 'Unknown department'}`,
    departmentId: user.departmentId,
    teamId: null,
    valid: true,
  }
  if (!user?.teamId) return { label: 'Target team is required', departmentId: user.departmentId, teamId: null, valid: false }
  return {
    label: roleScopeLabel({ scopeType: 'team', departmentId: user.departmentId, teamId: user.teamId }, directory),
    departmentId: user.departmentId,
    teamId: user.teamId,
    valid: true,
  }
}

export function roleAssignmentRequest(role, scopeType, user, directory) {
  const organization = organizationForRoleScope(scopeType, user, directory)
  if (!role?.id || !supportedScopesForRole(role).includes(scopeType) || !organization.valid) return null
  return {
    requestedRoleId: role.id,
    requestedScopeType: scopeType,
    requestedDepartmentId: organization.departmentId,
    requestedTeamId: organization.teamId,
    organization,
  }
}

export function roleMutationSuccessMessage(action, result, roleName) {
  if (action === 'remove') {
    return result?.removed === false
      ? 'No change was needed. That exact role assignment was already removed.'
      : `${roleName} was removed. The server-confirmed record has been refreshed.`
  }
  return result?.created === false
    ? 'No change was needed. That exact role assignment already exists.'
    : `${roleName} was assigned. The server-confirmed record has been refreshed.`
}

export function isSuperAdminRole(role, scopeType) {
  return role?.key === 'super_admin' && scopeType === 'global'
}
