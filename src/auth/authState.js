export const AUTH_STATES = Object.freeze({
  LOADING: 'loading',
  ANONYMOUS: 'anonymous',
  PENDING: 'authenticated_pending',
  ACTIVE: 'authenticated_active',
  BLOCKED: 'blocked',
  INACTIVE: 'inactive',
  MISSING_PROFILE: 'missing_profile',
  ERROR: 'error',
})

export function deriveAuthState({ loading, session, profile, profileError }) {
  if (loading) return AUTH_STATES.LOADING
  if (!session?.user) return AUTH_STATES.ANONYMOUS
  if (profileError) return AUTH_STATES.ERROR
  if (!profile) return AUTH_STATES.MISSING_PROFILE
  return ({
    pending_approval: AUTH_STATES.PENDING,
    active: AUTH_STATES.ACTIVE,
    blocked: AUTH_STATES.BLOCKED,
    inactive: AUTH_STATES.INACTIVE,
  })[profile.status] ?? AUTH_STATES.ERROR
}

export function routeForAuthState(state) {
  return ({
    [AUTH_STATES.ANONYMOUS]: '/signin',
    [AUTH_STATES.PENDING]: '/pending-approval',
    [AUTH_STATES.ACTIVE]: '/workspace',
    [AUTH_STATES.BLOCKED]: '/account-blocked',
    [AUTH_STATES.INACTIVE]: '/account-inactive',
    [AUTH_STATES.MISSING_PROFILE]: '/account-error',
    [AUTH_STATES.ERROR]: '/account-error',
  })[state] ?? null
}
