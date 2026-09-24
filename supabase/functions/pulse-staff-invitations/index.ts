import { createClient } from 'npm:@supabase/supabase-js@2.105.1'

const localOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])
const origins = () => new Set([...localOrigins, ...(Deno.env.get('PULSE_ALLOWED_ORIGINS') ?? '').split(',').map((value) => value.trim()).filter(Boolean)])
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

function publicFailureCode(error: unknown) {
  const message = String((error as { message?: string })?.message ?? '').toLowerCase()
  if (message.includes('already') || message.includes('exists')) return 'identity_conflict'
  if (message.includes('rate')) return 'delivery_rate_limited'
  return 'delivery_failed'
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

  let payload: Record<string, unknown>
  try { payload = await request.json() } catch { return reply(origin, 400, { error: 'invalid_request' }) }

  if (payload.action === 'revoke') {
    const { data, error } = await userClient.rpc('revoke_staff_invitation', { target_invitation_id: payload.invitationId, expected_updated_at: payload.expectedUpdatedAt })
    return error ? reply(origin, 400, { error: 'invitation_not_changed' }) : reply(origin, 200, { changed: Boolean(data) })
  }
  if (payload.action !== 'send' && payload.action !== 'resend') return reply(origin, 400, { error: 'invalid_action' })

  const deliveryMode = Deno.env.get('PULSE_INVITATION_DELIVERY_MODE') ?? 'disabled'
  const redirectTo = Deno.env.get('PULSE_STAFF_INVITE_REDIRECT_URL')
  if (deliveryMode === 'supabase' && !redirectTo) return reply(origin, 503, { error: 'service_unavailable' })
  const requestKey = typeof payload.requestKey === 'string' && /^[0-9a-f-]{36}$/i.test(payload.requestKey) ? payload.requestKey : crypto.randomUUID()
  const isSend = payload.action === 'send'
  const { data: rows, error: claimError } = await userClient.rpc(isSend ? 'claim_staff_invitation_send_v2' : 'claim_staff_invitation_resend_v2', isSend ? {
    requested_email: payload.email,
    requested_full_name: payload.fullName,
    requested_department_id: payload.departmentId,
    requested_campaign_id: payload.campaignId ?? null,
    requested_operating_unit_id: payload.operatingUnitId ?? null,
    requested_team_id: payload.teamId ?? null,
    requested_position_id: payload.positionId ?? null,
    requested_role_id: payload.roleId,
    requested_scope_type: payload.scopeType,
    requested_scope_department_id: payload.scopeDepartmentId ?? null,
    requested_scope_campaign_id: payload.scopeCampaignId ?? null,
    requested_scope_team_id: payload.scopeTeamId ?? null,
    requested_request_key: requestKey,
    requested_previous_invitation_id: payload.previousInvitationId ?? null,
  } : { target_invitation_id: payload.invitationId, expected_updated_at: payload.expectedUpdatedAt, requested_request_key: requestKey })
  if (claimError) {
    console.error(JSON.stringify({ event: 'staff_invitation_claim_failed', action: payload.action, code: claimError.code }))
    return reply(origin, 400, { error: 'invitation_not_created' })
  }
  const claim = Array.isArray(rows) ? rows[0] : rows
  if (!claim?.delivery_required) return reply(origin, 200, { invitationId: claim?.invitation_id, delivery: 'unchanged' })

  if (deliveryMode !== 'supabase') {
    const completion = await adminClient.rpc('complete_staff_invitation_delivery', {
      target_invitation_id: claim.invitation_id, claimed_delivery_id: claim.delivery_claim_id,
      delivery_succeeded: false, delivered_auth_user_id: null, safe_failure_code: 'delivery_deferred',
    })
    return completion.error ? reply(origin, 503, { error: 'delivery_state_unavailable' }) : reply(origin, 200, { invitationId: claim.invitation_id, delivery: 'deferred' })
  }

  const callback = new URL(redirectTo as string)
  callback.searchParams.set('flow', 'invitation')
  const invitationData = { full_name: claim.full_name, pulse_staff_invitation_id: claim.invitation_id }
  const { data: inviteData, error: inviteError } = claim.existing_auth_identity
    ? await adminClient.auth.signInWithOtp({
      email: claim.email_normalized,
      options: { shouldCreateUser: false, emailRedirectTo: callback.toString(), data: invitationData },
    })
    : await adminClient.auth.admin.inviteUserByEmail(claim.email_normalized, {
      redirectTo: callback.toString(), data: invitationData,
    })
  const authUserId = claim.existing_auth_identity ? claim.auth_user_id : inviteData?.user?.id ?? null
  const completion = await adminClient.rpc('complete_staff_invitation_delivery', {
    target_invitation_id: claim.invitation_id, claimed_delivery_id: claim.delivery_claim_id,
    delivery_succeeded: !inviteError && Boolean(authUserId), delivered_auth_user_id: authUserId,
    safe_failure_code: inviteError ? publicFailureCode(inviteError) : null,
  })
  if (completion.error) return reply(origin, 503, { error: 'delivery_state_unavailable' })
  if (inviteError) return reply(origin, 502, { error: publicFailureCode(inviteError), invitationId: claim.invitation_id })
  return reply(origin, 200, { invitationId: claim.invitation_id, delivery: isSend ? (claim.existing_auth_identity ? 'reconciled' : 'sent') : 'resent' })
})
