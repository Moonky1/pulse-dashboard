import { createClient } from 'npm:@supabase/supabase-js@2.105.1'

const allowed = () => new Set((Deno.env.get('PULSE_STAFF_REMOVAL_ALLOWED_ORIGINS') ?? '').split(',').map(v => v.trim()).filter(Boolean))
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async request => {
  const origin = request.headers.get('origin')
  const headers = { 'Access-Control-Allow-Origin': origin && allowed().has(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin',
    'Cache-Control': 'no-store', 'Content-Type': 'application/json' }
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers })
  if (!origin || !allowed().has(origin)) return reply(403, { error: 'request_denied' })
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' })
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'sign_in_required' })
  if (Number(request.headers.get('content-length') ?? 0)>4096) return reply(413, { error: 'invalid_request' })
  const url = Deno.env.get('SUPABASE_URL')
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY')
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !publicKey || !secret) return reply(503, { error: 'service_unavailable' })
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const userClient = createClient(url,publicKey,{ ...options,global: { headers: { Authorization: authorization } } })
  const adminClient = createClient(url,secret,options)
  const identity = await userClient.auth.getUser()
  if (identity.error || !identity.data.user) return reply(401, { error: 'sign_in_required' })
  let payload: Record<string, unknown>
  try {
    const body = await request.text()
    if (new TextEncoder().encode(body).length>4096) return reply(413,{ error: 'invalid_request' })
    payload = JSON.parse(body)
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') return reply(400,{ error: 'invalid_request' })
  } catch { return reply(400,{ error: 'invalid_request' }) }
  if (!uuid.test(String(payload.userId)) || !uuid.test(String(payload.requestKey)) ||
      payload.confirmation !== 'REMOVE' || typeof payload.version !== 'string' || payload.version.length>80) {
    return reply(400,{ error: 'invalid_request' })
  }
  const prepared = await userClient.rpc('prepare_staff_removal',{
    target_user_id: payload.userId,expected_updated_at: payload.version,
    requested_confirmation: payload.confirmation,request_key: payload.requestKey,
  })
  if (prepared.error) return reply(prepared.error.code==='42501' ? 403 : 409,
    { error: 'removal_not_applied', code: prepared.error.code })
  const cleanup = await adminClient.rpc('get_staff_removal_cleanup',{
    request_key: payload.requestKey,operator_auth_id: identity.data.user.id,
  })
  if (cleanup.error || !cleanup.data) return reply(200,{ removed: true,cleanupPending: true })
  const job = cleanup.data
  let authDone = Boolean(job.auth_done)
  let mediaDone = Boolean(job.media_done)
  if (!authDone) {
    const result = job.kind==='purge'
      ? await adminClient.auth.admin.deleteUser(job.auth_user_id)
      : await adminClient.auth.admin.updateUserById(job.auth_user_id,{ ban_duration: '876000h' })
    authDone = !result.error || job.kind==='purge' && result.error.status===404
  }
  if (!mediaDone) {
    // Canonical path was captured before clearing the profile; no user-supplied path.
    if (!job.avatar_path) mediaDone = true
    else if (job.avatar_path===`${payload.userId}/avatar.webp`) {
      const result = await adminClient.storage.from('staff-avatars').remove([job.avatar_path])
      mediaDone = !result.error
    }
  }
  const completed = await adminClient.rpc('complete_staff_removal_cleanup',{
    request_key: payload.requestKey,operator_auth_id: identity.data.user.id,auth_done: authDone,media_done: mediaDone,
  })
  return reply(200,{ removed: true,kind: prepared.data.kind,
    cleanupPending: !authDone || !mediaDone || Boolean(completed.error) })
})
