export const LIFECYCLE = Object.freeze({
  pending_approval: { label: 'Awaiting approval', tone: 'pending', description: 'The email is verified and the account is waiting for company approval.' },
  active: { label: 'Active', tone: 'success', description: 'This person can enter Pulse with the access shown above.' },
  blocked: { label: 'Blocked', tone: 'error', description: 'This person cannot enter Pulse until the account is reactivated.' },
  inactive: { label: 'Inactive', tone: 'neutral', description: 'The profile is saved, but the account cannot currently enter Pulse.' },
})

export function lifecycleMeta(status) {
  return LIFECYCLE[status] ?? { label: 'Unknown', tone: 'neutral', description: 'The account status is not recognized.' }
}

export function directoryMaps(directory = {}) {
  return {
    departments: new Map((directory.departments ?? []).map((item) => [item.id, item.name])),
    teams: new Map((directory.teams ?? []).map((item) => [item.id, item.name])),
  }
}

export function roleScopeLabel(role, directory = {}) {
  const maps = directoryMaps(directory)
  if (role.scopeType === 'department') return maps.departments.get(role.departmentId) ?? 'Unknown department'
  if (role.scopeType === 'campaign') return role.campaignName ?? role.campaignCode ?? 'Unknown campaign'
  if (role.scopeType === 'team') return role.teamName ?? maps.teams.get(role.teamId) ?? 'Unknown team'
  return 'All Pulse'
}

export function filterManagedUsers(users, filters = {}) {
  const query = (filters.query ?? '').trim().toLocaleLowerCase()
  return users.filter((user) => {
    const identity = [user.fullName, user.displayName, user.employeeId, user.email].filter(Boolean).join(' ').toLocaleLowerCase()
    return (!query || identity.includes(query))
      && (!filters.status || user.status === filters.status)
      && (!filters.departmentId || user.departmentId === filters.departmentId)
      && (!filters.teamId || user.primaryTeamId === filters.teamId || user.teamId === filters.teamId)
      && (!filters.roleKey || user.roles.some((role) => role.key === filters.roleKey))
  })
}

export function roleOptions(users) {
  const roles = new Map()
  users.flatMap((user) => user.roles).forEach((role) => roles.set(role.key, role.name))
  return [...roles].sort((a, b) => a[1].localeCompare(b[1]))
}
