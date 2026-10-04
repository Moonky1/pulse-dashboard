import { createClient } from 'npm:@supabase/supabase-js@2.105.1'

const BUCKET = 'training-media'
const MAX_BYTES = 4_194_304
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const configuredOrigins = (...names: string[]) => names.flatMap(name =>
  (Deno.env.get(name) ?? '').split(',').map(value => value.trim()).filter(Boolean))
const origins = () => new Set([
  'http://localhost:5173', 'http://127.0.0.1:5173',
  ...configuredOrigins('PULSE_ALLOWED_ORIGINS', 'PULSE_TRAINING_MEDIA_ALLOWED_ORIGINS'),
])
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && origins().has(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
})
const reply = (origin: string | null, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

function validAudio(bytes: Uint8Array, mime: string) {
  if (mime !== 'audio/wav' || bytes.length < 44 || bytes.length > MAX_BYTES) return false
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const label = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4))
  return bytes.length <= 44 + 2 * 22050 * 60 &&
    label(0) === 'RIFF' && label(8) === 'WAVE' && label(12) === 'fmt ' &&
    label(36) === 'data' && header.getUint32(4, true) === bytes.length - 8 &&
    header.getUint32(16, true) === 16 && header.getUint16(20, true) === 1 &&
    header.getUint16(22, true) === 1 && header.getUint32(24, true) === 22050 &&
    header.getUint16(34, true) === 16 && header.getUint32(40, true) === bytes.length - 44
}

Deno.serve(async request => {
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
  let file: File | null = null
  try {
    if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
      const form = await request.formData()
      payload = { action: form.get('action'), contentId: form.get('contentId') }
      file = form.get('file') instanceof File ? form.get('file') as File : null
    } else payload = await request.json()
  } catch { return reply(origin, 400, { error: 'invalid_request' }) }

  if (payload.action === 'read') {
    if (!UUID.test(String(payload.mediaId)) || !UUID.test(String(payload.contentId)) ||
      (payload.sessionId != null && !UUID.test(String(payload.sessionId)))) return reply(origin, 400, { error: 'invalid_request' })
    const { data: allowed, error: permissionError } = await userClient.rpc('can_read_training_media', {
      requested_media_id: payload.mediaId, requested_content_id: payload.contentId,
      requested_session_id: payload.sessionId ?? null,
    })
    if (permissionError || !allowed) return reply(origin, 403, { error: 'media_unavailable' })
    const { data: media, error: mediaError } = await adminClient.from('training_media')
      .select('storage_path,mime_type,status,media_kind').eq('id', payload.mediaId).maybeSingle()
    if (mediaError || !media || media.status !== 'ready' || media.media_kind !== 'question_audio') return reply(origin, 404, { error: 'media_unavailable' })
    const { data: signed, error: signedError } = await adminClient.storage.from(BUCKET).createSignedUrl(media.storage_path, 600)
    if (signedError || !signed?.signedUrl) return reply(origin, 503, { error: 'media_unavailable' })
    return reply(origin, 200, { url: signed.signedUrl, mimeType: media.mime_type })
  }

  if (payload.action === 'delete') {
    if (!UUID.test(String(payload.mediaId))) return reply(origin, 400, { error: 'invalid_request' })
    const { data: marked, error: markError } = await userClient.rpc('mark_training_media_deleting', {
      requested_media_id: payload.mediaId,
    })
    if (markError) return reply(origin, markError.code === '55000' ? 409 : 403, { error: 'media_cannot_be_deleted' })
    if (!marked) return reply(origin, 404, { error: 'media_unavailable' })
    const { data: media, error: mediaError } = await adminClient.from('training_media')
      .select('storage_path,status').eq('id', payload.mediaId).maybeSingle()
    if (mediaError || !media) return reply(origin, 503, { error: 'media_unavailable' })
    if (media.status === 'deleted') return reply(origin, 200, { deleted: true })
    if (media.status !== 'deleting') return reply(origin, 503, { error: 'media_unavailable' })
    const { error: removeError } = await adminClient.storage.from(BUCKET).remove([media.storage_path])
    if (removeError) return reply(origin, 503, { error: 'storage_unavailable' })
    const { error: finishError } = await adminClient.rpc('finish_training_media_delete', {
      requested_media_id: payload.mediaId,
    })
    if (finishError) return reply(origin, 503, { error: 'media_cleanup_failed' })
    return reply(origin, 200, { deleted: true })
  }

  if (payload.action !== 'upload' || !UUID.test(String(payload.contentId)) || !file) return reply(origin, 400, { error: 'invalid_request' })
  if (file.size > MAX_BYTES) return reply(origin, 413, { error: 'audio_too_large' })
  const mime = file.type
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!validAudio(bytes, mime)) return reply(origin, 415, { error: 'invalid_audio' })
  const { data: allowed, error: permissionError } = await userClient.rpc('can_write_training_media', { requested_content_id: payload.contentId })
  if (permissionError || !allowed) return reply(origin, 403, { error: 'studio_edit_required' })
  const { data: profile, error: profileError } = await adminClient.from('users').select('id,status')
    .eq('auth_user_id', userData.user.id).maybeSingle()
  if (profileError || !profile || profile.status !== 'active') return reply(origin, 403, { error: 'active_staff_required' })

  const mediaId = crypto.randomUUID()
  const path = `${payload.contentId}/${mediaId}.wav`
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(value => value.toString(16).padStart(2, '0')).join('')
  const { error: insertError } = await adminClient.from('training_media').insert({
    id: mediaId, media_type: 'audio', media_kind: 'question_audio',
    storage_bucket: BUCKET, storage_path: path, mime_type: mime,
    created_by_user_id: profile.id, bound_content_id: payload.contentId,
    byte_size: bytes.length, sha256, upload_key: mediaId, status: 'pending',
  })
  if (insertError) return reply(origin, 503, { error: 'media_registration_failed' })
  const { error: uploadError } = await adminClient.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime, upsert: false, cacheControl: '3600',
  })
  if (uploadError) {
    await adminClient.from('training_media').update({ status: 'deleted' }).eq('id', mediaId).eq('status', 'pending')
    return reply(origin, 503, { error: 'storage_unavailable' })
  }
  const { error: readyError } = await adminClient.from('training_media')
    .update({ status: 'ready', finalized_at: new Date().toISOString() }).eq('id', mediaId).eq('status', 'pending')
  if (readyError) {
    await adminClient.storage.from(BUCKET).remove([path])
    await adminClient.from('training_media').update({ status: 'deleted' }).eq('id', mediaId).eq('status', 'pending')
    return reply(origin, 503, { error: 'media_registration_failed' })
  }
  return reply(origin, 200, { mediaId })
})
