export function resolveGoAccess({ loading = false, error = null, capabilities = null } = {}) {
  if (loading) return 'loading'
  if (error) return 'error'
  return capabilities?.can_practice || capabilities?.can_host ? 'allowed' : 'denied'
}

export const canPractice = (capabilities) => capabilities?.can_practice === true
export const canHost = (capabilities) => capabilities?.can_host === true
