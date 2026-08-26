export const LIFECYCLE_ACTIONS = Object.freeze({
  block: Object.freeze({
    key: 'block',
    label: 'Block user',
    shortLabel: 'Block',
    requestedState: 'Blocked',
    expectedStatus: 'blocked',
    tone: 'destructive',
    consequence: 'Pulse access will be restricted until an authorized reactivation. The profile and role history remain intact.',
  }),
  reactivate: Object.freeze({
    key: 'reactivate',
    label: 'Reactivate user',
    shortLabel: 'Reactivate',
    requestedState: 'Active',
    expectedStatus: 'active',
    tone: 'primary',
    consequence: 'Pulse will validate the Auth identity, organization, and active role assignments before restoring access.',
  }),
  inactivate: Object.freeze({
    key: 'inactivate',
    label: 'Inactivate user',
    shortLabel: 'Inactivate',
    requestedState: 'Inactive',
    expectedStatus: 'inactive',
    tone: 'destructive',
    consequence: 'Pulse access will become inactive. This retains the historical profile and role history; it does not delete the user or Auth identity.',
  }),
})

const ACTIONS_BY_STATUS = Object.freeze({
  active: Object.freeze(['block', 'inactivate']),
  blocked: Object.freeze(['reactivate', 'inactivate']),
  inactive: Object.freeze(['reactivate']),
  pending_approval: Object.freeze([]),
})

export function lifecycleActionsForUser(user, allowed = false) {
  if (!allowed || !user) return []
  return (ACTIONS_BY_STATUS[user.status] ?? []).map((key) => LIFECYCLE_ACTIONS[key])
}

export function isSuperAdminTarget(user) {
  return Boolean(user?.roles?.some((role) => role.key === 'super_admin' && role.scopeType === 'global'))
}

export function lifecycleSuccessMessage(action, result) {
  const label = LIFECYCLE_ACTIONS[action]?.requestedState ?? 'Updated'
  return result?.changed === false
    ? `No change was needed. The account is already ${label.toLowerCase()}.`
    : `Lifecycle updated to ${label}. The server-confirmed record has been refreshed.`
}
