export function invitationOptionKey(option = {}) {
  return [option.roleId, option.scopeType, option.departmentId, option.campaignId, option.teamId].map((value) => value ?? '').join(':')
}

export function invitationRoleOptions(options = [], departmentId = '', campaignId = '', teamId = '') {
  return options.filter((option) => (
    option.scopeType === 'global'
    || (option.scopeType === 'campaign' && option.campaignId === campaignId)
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
  const campaign = values.campaignId ? options.campaigns.find((item) => item.id === values.campaignId) : null
  const operatingUnit = values.operatingUnitId ? options.operatingUnits.find((item) => item.id === values.operatingUnitId && item.campaignId === values.campaignId) : null
  const team = values.teamId ? options.teams.find((item) => item.id === values.teamId && item.campaignId === values.campaignId && item.operatingUnitId === (values.operatingUnitId || null)) : null
  const position = values.positionId ? options.positions.find((item) => item.id === values.positionId) : null
  if (!option || !department || (values.campaignId && !campaign) || (values.operatingUnitId && !operatingUnit) || (values.teamId && !team) || (values.positionId && !position)) return null
  if (!values.campaignId && (values.operatingUnitId || values.teamId)) return null
  if (values.campaignId && !position) return null
  if (values.operatingUnitId && !team) return null
  return {
    email: values.email.trim().toLowerCase(),
    fullName: values.fullName.trim(),
    departmentId: department.id,
    campaignId: campaign?.id ?? null,
    operatingUnitId: operatingUnit?.id ?? null,
    teamId: team?.id ?? null,
    positionId: position?.id ?? null,
    roleId: option.roleId,
    scopeType: option.scopeType,
    scopeDepartmentId: option.departmentId,
    scopeCampaignId: option.campaignId,
    scopeTeamId: option.teamId,
    previousInvitationId: values.previousInvitationId ?? null,
  }
}

export function invitationStatusLabel(status) {
  return ({ pending_send: 'Sending', sent: 'Sent', accepted: 'Accepted', revoked: 'Revoked', expired: 'Expired', failed: 'Delivery failed' })[status] ?? 'Unknown'
}
