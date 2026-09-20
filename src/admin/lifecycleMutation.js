function lifecycleError(code, message) {
  return { data: null, error: { code, message } }
}

function refreshWarning() {
  return {
    code: 'refresh_failed',
    message: 'The account change was confirmed, but Pulse could not refresh the record. Reload before taking another action.',
  }
}

export async function runLifecycleMutation({ guard, action, targetUserId, reason, operations, onSuccess }) {
  if (guard.current) return lifecycleError('in_progress', 'An account action is already in progress.')
  const operation = operations[action]
  if (!operation) return lifecycleError('invalid_action', 'The requested account action is not supported.')

  guard.current = true
  try {
    let result
    try {
      result = await operation(targetUserId, reason)
    } catch {
      return lifecycleError('unavailable', 'Pulse could not complete the account action. No change was applied.')
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
