function approvalError(code, message) {
  return { data: null, error: { code, message } }
}

function refreshWarning() {
  return {
    code: 'refresh_failed',
    message: 'The server confirmed approval, but Pulse could not refresh the record. Reload before taking another action.',
  }
}

export async function runPendingApprovalMutation({ guard, operation, onSuccess }) {
  if (guard.current) return approvalError('in_progress', 'A pending approval is already in progress.')
  guard.current = true
  try {
    let result
    try {
      result = await operation()
    } catch {
      return approvalError('unavailable', 'Pulse could not complete approval. No client-side change was applied.')
    }
    if (result.error) return result
    try {
      const refreshed = await onSuccess?.(result.data)
      if (refreshed?.error) return { ...result, warning: refreshWarning() }
    } catch {
      return { ...result, warning: refreshWarning() }
    }
    return result
  } finally {
    guard.current = false
  }
}
