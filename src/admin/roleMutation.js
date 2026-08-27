function roleError(code, message) {
  return { data: null, error: { code, message } }
}

function refreshWarning() {
  return {
    code: 'refresh_failed',
    message: 'The server confirmed the role change, but Pulse could not refresh the record. Reload before taking another action.',
  }
}

export async function runRoleMutation({ guard, operation, onSuccess }) {
  if (guard.current) return roleError('in_progress', 'A role action is already in progress.')
  guard.current = true
  try {
    let result
    try {
      result = await operation()
    } catch {
      return roleError('unavailable', 'Pulse could not complete the role change. No client-side change was applied.')
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
