import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://lhgnbcaundgjeofjrscg.supabase.co'

function cleanEnv(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const rawSupabaseUrl = cleanEnv(
  import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
)

const supabaseKey = cleanEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

const supabaseUrl = isValidHttpUrl(rawSupabaseUrl)
  ? rawSupabaseUrl
  : DEFAULT_SUPABASE_URL

if (!supabaseKey) {
  console.warn('Missing Supabase key. Local Supabase requests may fail, but the app will still load.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey || 'local-dev-placeholder-key'
)

export default supabase