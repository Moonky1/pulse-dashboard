export const AUTH_ENTRY_PATH = '/signin'
export const STAFF_SIGN_IN_PATH = AUTH_ENTRY_PATH
export const STAFF_REGISTER_PATH = '/register'
export const STAFF_FORGOT_PASSWORD_PATH = '/forgot-password'
export const AGENT_SIGN_IN_PATH = '/agent/signin'

export function agentReturnPath(requestedPath) {
  if (['/go', '/go/practice', '/go/progress', '/academy'].includes(requestedPath)) return requestedPath
  if (/^\/go\/(?:practice|room)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedPath)
    || /^\/academy\/[a-z0-9-]+$/i.test(requestedPath)
    || /^\/profile\/[0-9]{4,12}$/.test(requestedPath)) return requestedPath
  return '/go'
}

export const LEGACY_STAFF_PATH_REDIRECTS = Object.freeze({
  '/staff/signin': STAFF_SIGN_IN_PATH,
  '/staff/register': STAFF_REGISTER_PATH,
  '/staff/forgot-password': STAFF_FORGOT_PASSWORD_PATH,
})
