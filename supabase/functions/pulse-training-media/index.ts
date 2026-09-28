import { createClient } from 'npm:@supabase/supabase-js@2.105.1'

const BUCKET = 'training-media'
const IMAGE_LIMIT = 2 * 1024 * 1024
const AUDIO_LIMIT = 4 * 1024 * 1024
const MAX_REQUEST_BYTES = AUDIO_LIMIT + 1024
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const kinds: Record<string, { types: string[]; max: number }> = {
  game_cover: { types: ['image/jpeg', 'image/png', 'image/webp'], max: IMAGE_LIMIT },
  question_image: { types: ['image/jpeg', 'image/png', 'image/webp'], max: IMAGE_LIMIT },
  question_audio: { types: ['audio/mpeg', 'audio/mp4'], max: AUDIO_LIMIT },
  lobby_audio: { types: ['audio/mpeg', 'audio/mp4'], max: AUDIO_LIMIT },
}
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'audio/mpeg': 'mp3', 'audio/mp4': 'm4a',
}
const localOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const allowedOrigins = () => new Set([...localOrigins,
  ...(Deno.env.get('PULSE_ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean),
  ...(Deno.env.get('PULSE_TRAINING_MEDIA_ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean),
])
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins().has(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization,apikey,x-client-info,content-type,x-pulse-action,x-pulse-content-id,x-pulse-kind,x-pulse-upload-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
})
const reply = (origin: string | null, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

async function limitedBytes(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_REQUEST_BYTES) { void reader.cancel().catch(() => {}); return null }
      chunks.push(value)
    }
  } catch { return null }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return bytes
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end))
}
function webpDimensions(bytes: Uint8Array) {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 12) !== 'WEBP') return null
  const format = ascii(bytes, 12, 16)
  if (format === 'VP8X') return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) }
  if (format === 'VP8L' && bytes[20] === 0x2f) return {
    width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
    height: 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
  }
  if (format === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return {
    width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
    height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
  }
  return null
}
function jpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0xff) { offset += 1; continue }
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (size < 2 || offset + 2 + size > bytes.length) return null
    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) return {
      height: (bytes[offset + 5] << 8) | bytes[offset + 6],
      width: (bytes[offset + 7] << 8) | bytes[offset + 8],
    }
    offset += size + 2
  }
  return null
}
function inspect(bytes: Uint8Array, mime: string) {
  if (bytes.length < 64) return null
  let dimensions: { width: number; height: number } | null = null
  if (mime === 'image/png' && bytes.length >= 24 &&
    bytes.slice(0, 8).every((value, i) => value === [137, 80, 78, 71, 13, 10, 26, 10][i]) &&
    ascii(bytes, 12, 16) === 'IHDR') dimensions = {
    width: (bytes[16] * 16777216 + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19]) >>> 0,
    height: (bytes[20] * 16777216 + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23]) >>> 0,
  }
  if (mime === 'image/jpeg') dimensions = jpegDimensions(bytes)
  if (mime === 'image/webp') dimensions = webpDimensions(bytes)
  if (mime.startsWith('image/')) return dimensions && dimensions.width >= 32 && dimensions.height >= 32 &&
    dimensions.width <= 4096 && dimensions.height <= 4096 ? dimensions : null
  if (mime === 'audio/mpeg' && (ascii(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) return { width: null, height: null }
  if (mime === 'audio/mp4' && ascii(bytes, 4, 8) === 'ftyp' &&
    ['M4A ', 'M4B ', 'isom', 'mp41', 'mp42'].includes(ascii(bytes, 8, 12))) return { width: null, height: null }
  return null
}

async function sha256(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.length)
  new Uint8Array(buffer).set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async request => {
  const origin = request.headers.get('Origin')
  if (origin && !allowedOrigins().has(origin)) return reply(origin, 403, { error: 'origin_not_allowed' })
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
  if (request.method !== 'POST') return reply(origin, 405, { error: 'method_not_allowed' })
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return reply(origin, 401, { error: 'authentication_required' })
  const url = Deno.env.get('SUPABASE_URL')
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !publicKey || !secretKey) return reply(origin, 503, { error: 'service_unavailable' })
  const user = createClient(url, publicKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } })
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: identity, error: identityError } = await user.auth.getUser()
  if (identityError || !identity.user) return reply(origin, 401, { error: 'authentication_required' })
  const { data: profile } = await admin.from('users').select('id,status').eq('auth_user_id', identity.user.id).maybeSingle()
  if (!profile || profile.status !== 'active') return reply(origin, 403, { error: 'active_staff_required' })

  // Opportunistic, narrowly scoped orphan cleanup. Pending rows cannot be
  // attached by the reference trigger; never list or delete arbitrary objects.
  const expired = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: stale } = await admin.from('training_media').select('id,storage_path')
    .eq('created_by_user_id', profile.id).eq('status', 'pending').lt('created_at', expired).limit(5)
  for (const item of stale ?? []) {
    const { error: removalError } = await admin.storage.from(BUCKET).remove([item.storage_path])
    if (!removalError) await admin.from('training_media').update({ status: 'deleted' }).eq('id', item.id).eq('status', 'pending')
  }

  const action = request.headers.get('x-pulse-action') ?? 'read'
  if (action === 'upload') {
    const contentId = request.headers.get('x-pulse-content-id') ?? ''
    const kind = request.headers.get('x-pulse-kind') ?? ''
    const uploadKey = request.headers.get('x-pulse-upload-key') ?? ''
    const mime = request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() ?? ''
    const spec = kinds[kind]
    if (!UUID.test(contentId) || !UUID.test(uploadKey) || !spec || !spec.types.includes(mime)) return reply(origin, 400, { error: 'invalid_upload' })
    const { data: canWrite, error: permissionError } = await user.rpc('can_write_training_media', { requested_content_id: contentId })
    if (permissionError || canWrite !== true) return reply(origin, 403, { error: 'studio_edit_required' })
    const bytes = await limitedBytes(request)
    if (!bytes || bytes.length > spec.max) return reply(origin, 413, { error: 'file_too_large' })
    const details = inspect(bytes, mime)
    if (!details) return reply(origin, 415, { error: 'invalid_media' })
    const digest = await sha256(bytes)
    const { data: previous, error: previousError } = await admin.from('training_media').select('id,status,storage_path,sha256,mime_type,byte_size,media_kind,bound_content_id')
      .eq('created_by_user_id', profile.id).eq('upload_key', uploadKey).maybeSingle()
    if (previousError) return reply(origin, 503, { error: 'service_unavailable' })
    if (previous && (previous.sha256 !== digest || previous.mime_type !== mime || previous.byte_size !== bytes.length ||
      previous.media_kind !== kind || previous.bound_content_id !== contentId)) return reply(origin, 409, { error: 'upload_key_reused' })
    if (previous?.status === 'ready') return reply(origin, 200, { mediaId: previous.id, kind })
    if (previous && previous.status !== 'pending') return reply(origin, 409, { error: 'upload_unavailable' })
    if (!previous) {
      const since = new Date(Date.now() - 3600000).toISOString()
      const { count, error: quotaError } = await admin.from('training_media').select('id', { count: 'exact', head: true })
        .eq('created_by_user_id', profile.id).gte('created_at', since)
      if (quotaError || count === null) return reply(origin, 503, { error: 'service_unavailable' })
      if (count >= 20) return reply(origin, 429, { error: 'upload_limit_reached' })
    }
    const mediaId = previous?.id ?? crypto.randomUUID()
    const path = previous?.storage_path ?? `training/${mediaId}/source.${extensions[mime]}`
    if (!previous) {
      const { error: claimError } = await admin.from('training_media').insert({
        id: mediaId, media_type: kind.endsWith('audio') ? 'audio' : 'image', media_kind: kind,
        storage_bucket: BUCKET, storage_path: path, mime_type: mime, byte_size: bytes.length,
        width_px: details.width, height_px: details.height, sha256: digest,
        upload_key: uploadKey, status: 'pending', bound_content_id: contentId, created_by_user_id: profile.id,
      })
      if (claimError) return reply(origin, 503, { error: 'claim_failed' })
    } else {
      // A retry may find a crashed pending upload. Remove only its exact path.
      await admin.storage.from(BUCKET).remove([path])
    }
    const { error: storageError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: mime, cacheControl: '300', upsert: false,
    })
    if (storageError) return reply(origin, 503, { error: 'storage_unavailable' })
    const { error: finalizeError } = await admin.from('training_media').update({ status: 'ready', finalized_at: new Date().toISOString() })
      .eq('id', mediaId).eq('status', 'pending')
    if (finalizeError) return reply(origin, 503, { error: 'finalize_failed' })
    return reply(origin, 200, { mediaId, kind })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return reply(origin, 400, { error: 'invalid_request' }) }
  const mediaId = String(body.mediaId ?? '')
  if (!UUID.test(mediaId)) return reply(origin, 400, { error: 'invalid_media_id' })
  if (action === 'read') {
    const contentId = String(body.contentId ?? '')
    const sessionId = body.sessionId == null ? null : String(body.sessionId)
    if (!UUID.test(contentId) || (sessionId && !UUID.test(sessionId))) return reply(origin, 400, { error: 'invalid_content_id' })
    const { data: allowed, error } = await user.rpc('can_read_training_media', {
      requested_media_id: mediaId, requested_content_id: contentId, requested_session_id: sessionId,
    })
    if (error || allowed !== true) return reply(origin, 404, { error: 'media_unavailable' })
    const { data: media } = await admin.from('training_media').select('storage_path,status').eq('id', mediaId).maybeSingle()
    if (!media || media.status !== 'ready') return reply(origin, 404, { error: 'media_unavailable' })
    const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrl(media.storage_path, 300)
    if (signError || !signed?.signedUrl) return reply(origin, 503, { error: 'storage_unavailable' })
    return reply(origin, 200, { url: signed.signedUrl, expiresIn: 300 })
  }
  if (action === 'delete') {
    const { data: allowed, error } = await user.rpc('mark_training_media_deleting', { requested_media_id: mediaId })
    if (error || allowed !== true) return reply(origin, 404, { error: 'media_unavailable' })
    const { data: media } = await admin.from('training_media').select('storage_path,status').eq('id', mediaId).maybeSingle()
    if (!media || media.status === 'deleted') return reply(origin, 200, { removed: true })
    if (media.status !== 'deleting') return reply(origin, 409, { error: 'media_in_use' })
    const { error: removeError } = await admin.storage.from(BUCKET).remove([media.storage_path])
    if (removeError) return reply(origin, 503, { error: 'storage_unavailable' })
    const { error: finishError } = await admin.rpc('finish_training_media_delete', { requested_media_id: mediaId })
    if (finishError) return reply(origin, 503, { error: 'finalize_failed' })
    return reply(origin, 200, { removed: true })
  }
  return reply(origin, 400, { error: 'invalid_action' })
})
