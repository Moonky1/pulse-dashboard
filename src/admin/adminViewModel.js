export const LIFECYCLE = Object.freeze({
  pending_approval: { label: 'Pending approval', tone: 'pending', description: 'Registration is verified and awaiting an authorized approval decision.' },
  active: { label: 'Active', tone: 'success', description: 'The account can access Pulse according to its assigned roles and scopes.' },
  blocked: { label: 'Blocked', tone: 'error', description: 'Pulse access is restricted until an authorized reactivation.' },
  inactive: { label: 'Inactive', tone: 'neutral', description: 'The company profile is retained, but application access is inactive.' },
})

export function lifecycleMeta(status) {
  return LIFECYCLE[status] ?? { label: 'Unknown', tone: 'neutral', description: 'The lifecycle state is not recognized.' }
}

export function directoryMaps(directory = {}) {
  return {
    departments: new Map((directory.departments ?? []).map((item) => [item.id, item.name])),
    teams: new Map((directory.teams ?? []).map((item) => [item.id, item.name])),
  }
}

export function roleScopeLabel(role, directory = {}) {
  const maps = directoryMaps(directory)
  if (role.scopeType === 'department') return `Department · ${maps.departments.get(role.departmentId) ?? 'Unknown department'}`
  if (role.scopeType === 'campaign') return `Campaign · ${role.campaignName ?? role.campaignCode ?? 'Unknown campaign'}`
  if (role.scopeType === 'team') return `Team · ${maps.teams.get(role.teamId) ?? 'Unknown team'}`
  return 'Global · All Pulse'
}

export function filterManagedUsers(users, filters = {}) {
  const query = (filters.query ?? '').trim().toLocaleLowerCase()
  return users.filter((user) => {
    const identity = [user.fullName, user.displayName, user.employeeId, user.email].filter(Boolean).join(' ').toLocaleLowerCase()
    return (!query || identity.includes(query))
      && (!filters.status || user.status === filters.status)
      && (!filters.departmentId || user.departmentId === filters.departmentId)
      && (!filters.teamId || user.teamId === filters.teamId)
      && (!filters.roleKey || user.roles.some((role) => role.key === filters.roleKey))
  })
}

export function roleOptions(users) {
  const roles = new Map()
  users.flatMap((user) => user.roles).forEach((role) => roles.set(role.key, role.name))
  return [...roles].sort((a, b) => a[1].localeCompare(b[1]))
}
