export const AUTH_ENTRY_PATH = '/signin'
export const STAFF_SIGN_IN_PATH = AUTH_ENTRY_PATH
export const STAFF_REGISTER_PATH = '/register'
export const STAFF_FORGOT_PASSWORD_PATH = '/forgot-password'
export const AGENT_SIGN_IN_PATH = '/agent/signin'

export const LEGACY_STAFF_PATH_REDIRECTS = Object.freeze({
  '/staff/signin': STAFF_SIGN_IN_PATH,
  '/staff/register': STAFF_REGISTER_PATH,
  '/staff/forgot-password': STAFF_FORGOT_PASSWORD_PATH,
})
