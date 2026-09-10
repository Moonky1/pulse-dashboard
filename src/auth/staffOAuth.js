export const STAFF_OAUTH_PROVIDER = 'google'
export const STAFF_OAUTH_RETURN_KEY = 'pulse_staff_oauth_return'

const ALLOWED_RETURN_ROOTS = Object.freeze(['/workspace', '/studio', '/go', '/admin'])
const INTERNAL_ORIGIN = 'https://pulse.internal'

function browserSessionStorage() {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage
}

export function normalizeStaffReturnPath(value) {
  if (typeof value !== 'string') return null
  const candidate = value.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return null

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN)
    if (url.origin !== INTERNAL_ORIGIN) return null
    const allowed = ALLOWED_RETURN_ROOTS.some((root) => url.pathname === root || url.pathname.startsWith(`${root}/`))
    return allowed ? url.pathname : null
  } catch {
    return null
  }
}

export function rememberStaffReturnPath(value, storage = browserSessionStorage()) {
  const safePath = normalizeStaffReturnPath(value)
  if (!storage) return safePath

  try {
    if (safePath) storage.setItem(STAFF_OAUTH_RETURN_KEY, safePath)
    else storage.removeItem(STAFF_OAUTH_RETURN_KEY)
  } catch {
    // A disabled storage API must not prevent authentication.
  }
  return safePath
}

export function takeStaffReturnPath(storage = browserSessionStorage()) {
  if (!storage) return null

  try {
    const safePath = readStaffReturnPath(storage)
    storage.removeItem(STAFF_OAUTH_RETURN_KEY)
    return safePath
  } catch {
    return null
  }
}

export function readStaffReturnPath(storage = browserSessionStorage()) {
  if (!storage) return null
  try {
    return normalizeStaffReturnPath(storage.getItem(STAFF_OAUTH_RETURN_KEY))
  } catch {
    return null
  }
}

export function discardStaffReturnPath(storage = browserSessionStorage()) {
  try {
    storage?.removeItem(STAFF_OAUTH_RETURN_KEY)
  } catch {
    // Best-effort cleanup only.
  }
}
