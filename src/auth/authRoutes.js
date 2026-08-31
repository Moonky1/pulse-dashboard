export const AUTH_ENTRY_PATH = '/signin'
export const STAFF_SIGN_IN_PATH = '/staff/signin'
export const STAFF_REGISTER_PATH = '/staff/register'
export const STAFF_FORGOT_PASSWORD_PATH = '/staff/forgot-password'
export const AGENT_SIGN_IN_PATH = '/agent/signin'

export const LEGACY_STAFF_PATH_REDIRECTS = Object.freeze({
  '/register': STAFF_REGISTER_PATH,
  '/forgot-password': STAFF_FORGOT_PASSWORD_PATH,
})
