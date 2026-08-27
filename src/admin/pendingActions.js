export const PENDING_BLOCK_ACTION = Object.freeze({
  key: 'blockPending',
  label: 'Block pending user',
  shortLabel: 'Block',
  tone: 'destructive',
  consequence: 'The pending registration will be blocked and will no longer be eligible for approval. The Auth identity and audit history remain intact.',
})

export const PENDING_APPROVAL_CATALOG_MESSAGE = 'Approval is waiting for a protected catalog of valid initial roles and organization scopes.'

export function pendingReviewState(user, { canBlock = false, canApprove = false } = {}) {
  const pending = user?.status === 'pending_approval'
  return {
    pending,
    canBlock: pending && canBlock,
    canApprove: pending && canApprove,
    approvalAvailable: false,
  }
}

export function pendingBlockSuccessMessage() {
  return 'The pending account was blocked. The server-confirmed record has been refreshed.'
}
