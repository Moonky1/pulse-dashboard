const PUBLIC_PATHS = new Set(['/', '/privacy', '/terms'])
export function searchMetadata(hostname, pathname) {
  const production = hostname === 'www.pulse-kk.com' || hostname === 'pulse-kk.com'
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  const indexable = production && PUBLIC_PATHS.has(path)
  return { robots: indexable ? 'index, follow' : 'noindex, nofollow', canonical: indexable ? 'https://www.pulse-kk.com' + path : null }
}
