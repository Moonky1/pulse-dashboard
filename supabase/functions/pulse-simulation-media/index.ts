import { createClient } from 'npm:@supabase/supabase-js@2.105.1'
import { inspectPng, MAX_BYTES } from './png.mjs'
import { inspectWav } from './wav.mjs'

const BUCKET = 'training-media'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const origins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173',
  ...(Deno.env.get('PULSE_SIMULATION_MEDIA_ALLOWED_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean)])
function reply(origin: string, status: number, value: object) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization,apikey,x-client-info,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS', Vary: 'Origin' } })
}
Deno.serve(async request => {
  const origin = request.headers.get('origin') || ''
  if (!origins.has(origin)) return reply('', 403, { error: 'origin_not_allowed' })
  if (request.method === 'OPTIONS') return reply(origin, 200, { ok: true })
  if (request.method !== 'POST') return reply(origin, 405, { error: 'method_not_allowed' })
  const authorization = request.headers.get('authorization') || ''
  if (!authorization.startsWith('Bearer ')) return reply(origin, 401, { error: 'sign_in_required' })
  const url = Deno.env.get('SUPABASE_URL')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const secret = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const user = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const admin = createClient(url, secret, { auth: { persistSession: false } })
  const { data: verified, error: authError } = await user.auth.getUser()
  if (authError || !verified?.user) return reply(origin, 401, { error: 'sign_in_required' })
  if (Number(request.headers.get('content-length')) > MAX_BYTES + 16384) return reply(origin, 413, { error: 'image_too_large' })
  try {
    // Enforce the real streamed size too; Content-Length is not trusted or required.
    const reader = request.body?.getReader(), chunks: Uint8Array[] = []
    let byteCount = 0
    if (!reader) return reply(origin, 400, { error: 'invalid_request' })
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      byteCount += value.length
      if (byteCount > MAX_BYTES + 16384) { await reader.cancel(); return reply(origin, 413, { error: 'image_too_large' }) }
      chunks.push(value)
    }
    const payload = new Request(request.url, { method: 'POST', headers: request.headers, body: new Blob(chunks) })
    if (request.headers.get('content-type')?.startsWith('application/json')) {
      if (byteCount > 4096) return reply(origin, 400, { error: 'invalid_request' })
      const body = await payload.json()
      if (!['read','readAudio'].includes(body.action) || !UUID.test(body.contentId || '') || !UUID.test(body.mediaId || '') || (body.attemptId != null && !UUID.test(body.attemptId))) return reply(origin, 400, { error: 'invalid_request' })
      const audio=body.action==='readAudio'
      const { data: allowed, error } = await user.rpc(audio?'can_read_vici_audio':'can_read_simulation_screen', { requested_media_id: body.mediaId, requested_content_id: body.contentId, ...(audio?{}:{requested_attempt_id: body.attemptId || null}) })
      if (error || allowed !== true) return reply(origin, 403, { error: 'screen_unavailable' })
      const { data: media } = await admin.from('training_media').select('storage_bucket,storage_path,status,media_kind,mime_type').eq('id', body.mediaId).maybeSingle()
      if (!media || media.status !== 'ready' || media.media_kind !== (audio?'simulation_audio':'simulation_screen') || media.storage_bucket !== BUCKET || media.mime_type !== (audio?'audio/wav':'image/png')) return reply(origin, 404, { error: 'screen_unavailable' })
      const { data: signed, error: signError } = await admin.storage.from(BUCKET).createSignedUrl(media.storage_path, 120)
      return signError ? reply(origin, 503, { error: 'screen_unavailable' }) : reply(origin, 200, { url: signed.signedUrl })
    }
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return reply(origin, 400, { error: 'invalid_request' })
    const body = await payload.formData(), contentId = String(body.get('contentId') || ''), file = body.get('file')
    const audio=body.get('action')==='uploadAudio'
    if (!['upload','uploadAudio'].includes(String(body.get('action'))) || audio && body.get('confirmed')!=='yes' || !UUID.test(contentId) || !(file instanceof File) || file.type !== (audio?'audio/wav':'image/png') || file.size > MAX_BYTES) return reply(origin, 400, { error: 'invalid_image' })
    const { data: writable, error: permissionError } = await user.rpc('can_write_training_media', { requested_content_id: contentId })
    if (permissionError || writable !== true) return reply(origin, 403, { error: 'draft_required' })
    const { data: content } = await admin.from('training_content').select('content_type,status').eq('id', contentId).maybeSingle()
    if (content?.content_type !== 'simulation' || content.status !== 'draft') return reply(origin, 403, { error: 'draft_required' })
    const bytes = await file.arrayBuffer()
    let dimensions
    try { dimensions = audio ? inspectWav(bytes) : await inspectPng(bytes) } catch { return reply(origin, 400, { error: 'invalid_image' }) }
    const { data: staff } = await admin.from('users').select('id').eq('auth_user_id', verified.user.id).eq('status', 'active').maybeSingle()
    if (!staff) return reply(origin, 403, { error: 'active_staff_required' })
    const mediaId = crypto.randomUUID(), path = contentId + '/' + mediaId + (audio?'.wav':'.png')
    const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(n => n.toString(16).padStart(2, '0')).join('')
    const { error: insertError } = await admin.from('training_media').insert({ id: mediaId, media_type: audio?'audio':'image', media_kind: audio?'simulation_audio':'simulation_screen', bound_content_id: contentId,
      storage_bucket: BUCKET, storage_path: path, mime_type: audio?'audio/wav':'image/png', byte_size: file.size, width_px: audio?null:dimensions.width, height_px: audio?null:dimensions.height,
      sha256, upload_key: crypto.randomUUID(), created_by_user_id: staff.id, status: 'pending' })
    if (insertError) return reply(origin, 503, { error: 'media_registration_failed' })
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: audio?'audio/wav':'image/png', upsert: false, cacheControl: '120' })
    if (uploadError) { await admin.from('training_media').update({ status: 'deleted' }).eq('id', mediaId).eq('status', 'pending'); return reply(origin, 503, { error: 'storage_unavailable' }) }
    const { error: readyError } = await admin.from('training_media').update({ status: 'ready', finalized_at: new Date().toISOString() }).eq('id', mediaId).eq('status', 'pending')
    if (readyError) { await admin.storage.from(BUCKET).remove([path]); await admin.from('training_media').update({ status: 'deleted' }).eq('id', mediaId).eq('status', 'pending'); return reply(origin, 503, { error: 'media_registration_failed' }) }
    return reply(origin, 200, { mediaId })
  } catch { return reply(origin, 503, { error: 'simulation_media_unavailable' }) }
})
