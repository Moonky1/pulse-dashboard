const LOCAL_SUPABASE_ORIGINS = new Set([
  'http://localhost:54321',
  'http://127.0.0.1:54321',
  'http://[::1]:54321',
])

export function resolveGoPracticeDestination(supabaseUrl) {
  try {
    const url = new URL(supabaseUrl)
    const allowed = LOCAL_SUPABASE_ORIGINS.has(url.origin) && (url.pathname === '/' || url.pathname === '')
    return Object.freeze({ allowed, mode: allowed ? 'local' : 'blocked' })
  } catch {
    return Object.freeze({ allowed: false, mode: 'blocked' })
  }
}

export function assertGoPracticeDestination(supabaseUrl) {
  if (!resolveGoPracticeDestination(supabaseUrl).allowed) {
    throw new Error('GO Practice mutations require the isolated local Supabase destination.')
  }
}
