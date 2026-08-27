export const PENDING_BLOCK_ACTION = Object.freeze({
  key: 'blockPending',
  label: 'Block pending user',
  shortLabel: 'Block',
  tone: 'destructive',
  consequence: 'The pending registration will be blocked and will no longer be eligible for approval. The Auth identity and audit history remain intact.',
})

export const PENDING_APPROVAL_ACTION = Object.freeze({
  key: 'approvePending',
  label: 'Approve user',
  consequence: 'Pulse will activate this verified account, generate its employee ID, and create the exact initial role assignment shown below.',
})

export function pendingApprovalOptionKey(option = {}) {
  return [option.departmentId, option.teamId ?? 'none', option.roleId, option.scopeType].join(':')
}

export function resolvePendingApprovalSelection(options = [], selection = {}) {
  const requestedKey = String(selection.optionKey ?? '')
  const exact = options.find((option) => pendingApprovalOptionKey(option) === requestedKey)
  if (!exact || exact.departmentId !== selection.departmentId || (exact.teamId ?? '') !== (selection.teamId ?? '')) return null
  return exact
}

export function pendingApprovalChoices(options = [], departmentId = '', teamId = '') {
  const departments = [...new Map(options.map((option) => [option.departmentId, option])).values()]
  const teams = [...new Map(options
    .filter((option) => option.departmentId === departmentId && option.teamId)
    .map((option) => [option.teamId, option])).values()]
  const roleOptions = options.filter((option) => option.departmentId === departmentId && (option.teamId ?? '') === teamId)
  return { departments, teams, roleOptions }
}

export function pendingApprovalCatalogState({ loading = false, error = null, options = [] } = {}) {
  if (loading) return 'loading'
  if (error) return 'error'
  if (!options.length) return 'empty'
  return 'ready'
}

export function pendingReviewState(user, { canBlock = false, canApprove = false, approvalOptionCount = 0 } = {}) {
  const pending = user?.status === 'pending_approval'
  return {
    pending,
    canBlock: pending && canBlock,
    canApprove: pending && canApprove,
    approvalAvailable: pending && canApprove && approvalOptionCount > 0,
  }
}

export function pendingBlockSuccessMessage() {
  return 'The pending account was blocked. The server-confirmed record has been refreshed.'
}

export function pendingApprovalSuccessMessage() {
  return 'The pending account was approved. The server-confirmed record has been refreshed.'
}
