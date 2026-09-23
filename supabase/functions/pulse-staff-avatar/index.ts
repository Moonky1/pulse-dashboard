import { createClient } from 'npm:@supabase/supabase-js@2.105.1'

const BUCKET = 'staff-avatars'
const MAX_STORED_BYTES = 1024 * 1024
const MAX_DIMENSION = 512
const ALLOWED_SOURCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const localOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const configuredOrigins = (...names: string[]) => names.flatMap((name) => (Deno.env.get(name) ?? '').split(',').map((value) => value.trim()).filter(Boolean))
const origins = () => new Set([...localOrigins, ...configuredOrigins('PULSE_ALLOWED_ORIGINS', 'PULSE_AVATAR_ALLOWED_ORIGINS')])
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && origins().has(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
})
const reply = (origin: string | null, status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

function decodeBase64(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 1_500_000) return null
  try {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    return null
  }
}

function little24(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

export function inspectWebp(bytes: Uint8Array) {
  if (bytes.length < 30
    || String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF'
    || String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP') return null
  const format = String.fromCharCode(...bytes.slice(12, 16))
  if (format === 'VP8X') return { width: little24(bytes, 24) + 1, height: little24(bytes, 27) + 1 }
  if (format === 'VP8L' && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
    }
  }
  if (format === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff }
  }
  return null
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  if (origin && !origins().has(origin)) return reply(origin, 403, { error: 'origin_not_allowed' })
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
  if (request.method !== 'POST') return reply(origin, 405, { error: 'method_not_allowed' })
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return reply(origin, 401, { error: 'authentication_required' })

  const url = Deno.env.get('SUPABASE_URL')
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !publicKey || !secretKey) return reply(origin, 503, { error: 'service_unavailable' })
  const userClient = createClient(url, publicKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } })
  const adminClient = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return reply(origin, 401, { error: 'authentication_required' })

  let payload: Record<string, unknown>
  try { payload = await request.json() } catch { return reply(origin, 400, { error: 'invalid_request' }) }
  const { data: profile, error: profileError } = await adminClient.from('users').select('id,status,custom_avatar_path').eq('auth_user_id', userData.user.id).maybeSingle()
  if (profileError || !profile || profile.status !== 'active') return reply(origin, 403, { error: 'active_staff_required' })
  const canonicalPath = `${profile.id}/avatar.webp`

  if (payload.action === 'remove') {
    const { error: removeError } = await adminClient.storage.from(BUCKET).remove([canonicalPath])
    if (removeError) return reply(origin, 503, { error: 'storage_unavailable' })
    const { data, error } = await adminClient.rpc('clear_staff_custom_avatar', { target_auth_user_id: userData.user.id })
    if (error) return reply(origin, 503, { error: 'profile_update_failed' })
    const result = Array.isArray(data) ? data[0] : data
    return reply(origin, 200, { customAvatarPath: null, googleAvatarUrl: result?.google_avatar_url ?? null, avatarUpdatedAt: result?.avatar_updated_at ?? null })
  }

  if (payload.action !== 'upload') return reply(origin, 400, { error: 'invalid_action' })
  if (!ALLOWED_SOURCE_TYPES.has(String(payload.sourceMime ?? ''))) return reply(origin, 415, { error: 'unsupported_image_type' })
  const bytes = decodeBase64(payload.imageBase64)
  if (!bytes || bytes.length < 64) return reply(origin, 415, { error: 'invalid_image' })
  if (bytes.length > MAX_STORED_BYTES) return reply(origin, 413, { error: 'image_too_large' })
  const dimensions = inspectWebp(bytes)
  if (!dimensions || dimensions.width < 32 || dimensions.height < 32) return reply(origin, 415, { error: 'invalid_image' })
  if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) return reply(origin, 413, { error: 'image_dimensions_too_large' })

  const { error: uploadError } = await adminClient.storage.from(BUCKET).upload(canonicalPath, bytes, {
    contentType: 'image/webp', cacheControl: '3600', upsert: true,
  })
  if (uploadError) return reply(origin, 503, { error: 'storage_unavailable' })
  const { data, error } = await adminClient.rpc('set_staff_custom_avatar', { target_auth_user_id: userData.user.id })
  if (error) {
    if (!profile.custom_avatar_path) await adminClient.storage.from(BUCKET).remove([canonicalPath])
    return reply(origin, 503, { error: 'profile_update_failed' })
  }
  const result = Array.isArray(data) ? data[0] : data
  return reply(origin, 200, { customAvatarPath: result?.custom_avatar_path ?? canonicalPath, avatarUpdatedAt: result?.avatar_updated_at ?? null })
})
