export const PRODUCTION_AUTH_ORIGIN = 'https://www.pulse-kk.com'

const AUTH_PATHS = Object.freeze({
  verification: '/auth/callback?flow=verification',
  recovery: '/auth/callback?flow=recovery',
})

export function getAuthOrigin(currentOrigin = globalThis.location?.origin) {
  if (currentOrigin) {
    const { hostname } = new URL(currentOrigin)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')) return currentOrigin
  }
  return PRODUCTION_AUTH_ORIGIN
}

export function getAuthRedirect(flow, currentOrigin) {
  const path = AUTH_PATHS[flow]
  if (!path) throw new Error('Unsupported Auth redirect flow')
  return `${getAuthOrigin(currentOrigin)}${path}`
}
