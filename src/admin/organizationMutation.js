function organizationError(code, message) {
  return { data: null, error: { code, message } }
}

function refreshWarning() {
  return {
    code: 'refresh_failed',
    message: 'The server confirmed the organization change, but Pulse could not refresh the catalog. Reload before taking another action.',
  }
}

export async function runOrganizationMutation({ guard, operation, onSuccess }) {
  if (guard.current) return organizationError('in_progress', 'An organization action is already in progress.')
  guard.current = true
  try {
    let result
    try {
      result = await operation()
    } catch {
      return organizationError('unavailable', 'Pulse could not complete the organization change. No client-side change was applied.')
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
