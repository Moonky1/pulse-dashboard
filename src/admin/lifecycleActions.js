export const LIFECYCLE_ACTIONS = Object.freeze({
  block: Object.freeze({
    key: 'block',
    label: 'Block user',
    shortLabel: 'Block',
    requestedState: 'Blocked',
    expectedStatus: 'blocked',
    tone: 'destructive',
    consequence: 'This person will not be able to enter Pulse until the account is reactivated. Their profile and history will remain available.',
  }),
  reactivate: Object.freeze({
    key: 'reactivate',
    label: 'Reactivate user',
    shortLabel: 'Reactivate',
    requestedState: 'Active',
    expectedStatus: 'active',
    tone: 'primary',
    consequence: 'This person will be able to enter Pulse again with their current work details and access.',
  }),
  inactivate: Object.freeze({
    key: 'inactivate',
    label: 'Inactivate user',
    shortLabel: 'Inactivate',
    requestedState: 'Inactive',
    expectedStatus: 'inactive',
    tone: 'destructive',
    consequence: 'This person will no longer be able to enter Pulse. Their profile and history will remain available.',
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
    : `Account status updated to ${label}.`
}
