export const ROLE_SCOPE_TYPES = Object.freeze(['global', 'department', 'campaign', 'team'])

export function roleOptionKey(option) {
  return [option?.roleId, option?.scopeType, option?.departmentId ?? 'none', option?.campaignId ?? 'none', option?.teamId ?? 'none'].join(':')
}

export function assignableRoles(options = []) {
  const roles = new Map()
  options.forEach((option) => {
    if (!option?.roleId || !ROLE_SCOPE_TYPES.includes(option.scopeType)) return
    if (!roles.has(option.roleId)) roles.set(option.roleId, { id: option.roleId, key: option.roleKey, name: option.roleName })
  })
  return [...roles.values()]
}

export function roleOptionsForRole(options = [], roleId) {
  return options.filter((option) => option.roleId === roleId && ROLE_SCOPE_TYPES.includes(option.scopeType))
}

export function organizationForRoleOption(option) {
  if (option?.scopeType === 'global') return { label: 'All Pulse', departmentId: null, campaignId: null, teamId: null, valid: true }
  if (option?.scopeType === 'department' && option.departmentId) return {
    label: option.departmentName ?? 'Unknown department',
    departmentId: option.departmentId,
    campaignId: null,
    teamId: null,
    valid: true,
  }
  if (option?.scopeType === 'campaign' && option.campaignId) return {
    label: option.campaignName ?? option.campaignCode ?? 'Unknown campaign',
    departmentId: null,
    campaignId: option.campaignId,
    teamId: null,
    valid: true,
  }
  if (option?.scopeType === 'team' && option.teamId) return {
    label: option.teamName ?? 'Unknown team',
    departmentId: null,
    campaignId: null,
    teamId: option.teamId,
    valid: true,
  }
  return { label: 'Access area unavailable', departmentId: null, campaignId: null, teamId: null, valid: false }
}

export function roleAssignmentRequest(option) {
  const organization = organizationForRoleOption(option)
  if (!option?.roleId || !ROLE_SCOPE_TYPES.includes(option.scopeType) || !organization.valid) return null
  return {
    requestedRoleId: option.roleId,
    requestedScopeType: option.scopeType,
    requestedDepartmentId: organization.departmentId,
    requestedCampaignId: organization.campaignId,
    requestedTeamId: organization.teamId,
    organization,
  }
}

export function roleMutationSuccessMessage(action, result, roleName) {
  if (action === 'remove') {
    return result?.removed === false
      ? 'No change was needed. That exact role assignment was already removed.'
      : `${roleName} access was removed.`
  }
  return result?.created === false
    ? 'No change was needed. That exact role assignment already exists.'
    : `${roleName} access was added.`
}

export function isSuperAdminRole(role, scopeType) {
  return role?.key === 'super_admin' && scopeType === 'global'
}

export function roleCatalogMessage({ loading, error, options = [] }) {
  if (loading) return 'Loading assignable roles…'
  if (error) return error.message || 'Assignable roles are temporarily unavailable.'
  if (!options.length) return 'No additional access is available for this person.'
  return null
}

export function shouldCancelRoleDialogOnKey(key, submitting = false) {
  return key === 'Escape' && !submitting
}
