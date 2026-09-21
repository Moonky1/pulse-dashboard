export function invitationOptionKey(option = {}) {
  return [option.roleId, option.scopeType, option.departmentId, option.campaignId, option.teamId].map((value) => value ?? '').join(':')
}

export function invitationRoleOptions(options = [], departmentId = '', teamId = '') {
  return options.filter((option) => (
    option.scopeType === 'global'
    || option.scopeType === 'campaign'
    || (option.scopeType === 'department' && option.departmentId === departmentId)
    || (option.scopeType === 'team' && option.teamId === teamId)
  ))
}

export function invitationScopeLabel(option = {}, catalogs = {}) {
  if (option.scopeType === 'global') return 'All Pulse'
  if (option.scopeType === 'campaign') return option.campaignName ?? option.campaignCode ?? 'Unknown campaign'
  if (option.scopeType === 'department') return catalogs.departments?.find((item) => item.id === option.departmentId)?.name ?? 'Unknown department'
  return catalogs.teams?.find((item) => item.id === option.teamId)?.name ?? 'Unknown team'
}

export function staffInvitationProposal(values, options) {
  const option = options.roleOptions.find((item) => invitationOptionKey(item) === values.optionKey)
  const department = options.departments.find((item) => item.id === values.departmentId)
  const team = values.teamId ? options.teams.find((item) => item.id === values.teamId && item.departmentId === values.departmentId) : null
  const position = values.positionId ? options.positions.find((item) => item.id === values.positionId) : null
  if (!option || !department || (values.teamId && !team) || (values.positionId && !position)) return null
  return {
    email: values.email.trim().toLowerCase(),
    fullName: values.fullName.trim(),
    departmentId: department.id,
    teamId: team?.id ?? null,
    positionId: position?.id ?? null,
    roleId: option.roleId,
    scopeType: option.scopeType,
    scopeDepartmentId: option.departmentId,
    scopeCampaignId: option.campaignId,
    scopeTeamId: option.teamId,
  }
}

export function invitationStatusLabel(status) {
  return ({ pending_send: 'Sending', sent: 'Sent', accepted: 'Accepted', revoked: 'Revoked', expired: 'Expired', failed: 'Delivery failed' })[status] ?? 'Unknown'
}
