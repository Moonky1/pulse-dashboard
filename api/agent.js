import { createHash, randomBytes } from 'node:crypto'
import process from 'node:process'

import { createClient } from '@supabase/supabase-js'

const COOKIE = '__Host-pulse_agent'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROOM_CODE = /^\s*KK[\s-]?\d{4}\s*$/i
const PERIODS = new Set(['week', 'all_time'])

function hash(token) {
  return createHash('sha256').update(token).digest('hex')
}

function cookieToken(header = '') {
  const found = header.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`))
  const token = found?.slice(COOKIE.length + 1)
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null
}

function send(response, status, value, extra = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  })
  response.end(JSON.stringify(value))
}

function fail(response, status, message, code = 'unavailable', extra = {}) {
  send(response, status, { data: null, error: { code, message } }, extra)
}

function sameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return false
  const host = request.headers['x-forwarded-host'] || request.headers.host
  const proto = request.headers['x-forwarded-proto'] || 'https'
  try {
    const parsed = new URL(origin)
    return parsed.host === host && parsed.protocol === `${proto}:`
  } catch {
    return false
  }
}

function requestArgs(action, args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return null
  const uuid = value => typeof value === 'string' && UUID.test(value)
  const ids = value => Array.isArray(value) && value.length <= 100 && value.every(uuid)
  switch (action) {
    case 'ranking': return PERIODS.has(args.period) ? ['agent_get_go_global_ranking', { requested_period: args.period }] : null
    case 'progress': return ['agent_get_go_progress', {}]
    case 'catalog': return (args.language === null || ['en', 'es'].includes(args.language)) && Number.isInteger(args.limit) && args.limit >= 1 && args.limit <= 100 && Number.isInteger(args.offset) && args.offset >= 0
      ? ['agent_list_go_practice_catalog', { requested_language: args.language, requested_limit: args.limit, requested_offset: args.offset }] : null
    case 'metadata': return ids(args.contentIds) ? ['agent_get_go_catalog_metadata', { requested_content_ids: args.contentIds }] : null
    case 'content': return uuid(args.contentId) ? ['agent_get_go_practice_content', { requested_content_id: args.contentId }] : null
    case 'practiceStart': return uuid(args.contentId) ? ['agent_start_go_practice', { requested_content_id: args.contentId }] : null
    case 'practiceTiming': return uuid(args.attemptId) ? ['agent_get_go_practice_timing', { requested_attempt_id: args.attemptId }] : null
    case 'practiceAnswer': return uuid(args.attemptId) && uuid(args.questionId) && args.answer !== undefined
      ? ['agent_submit_go_practice_answer', { requested_attempt_id: args.attemptId, requested_question_id: args.questionId, requested_answer: args.answer }] : null
    case 'practiceReview': return uuid(args.attemptId) ? ['agent_get_go_practice_completed_review', { requested_attempt_id: args.attemptId }] : null
    case 'certificationResult': return uuid(args.attemptId) ? ['agent_get_go_certification_result', { requested_attempt_id: args.attemptId }] : null
    case 'roomJoin': return typeof args.roomCode === 'string' && ROOM_CODE.test(args.roomCode)
      ? ['agent_join_go_hosted_session', { requested_room_code: args.roomCode }] : null
    case 'roomSnapshot': return uuid(args.sessionId) ? ['agent_get_go_hosted_session', { requested_session_id: args.sessionId }] : null
    case 'roomTiming': return uuid(args.sessionId) ? ['agent_get_go_hosted_timing', { requested_session_id: args.sessionId }] : null
    case 'roomAnswer': return uuid(args.sessionId) && uuid(args.questionId) && args.answer !== undefined && Number.isInteger(args.position) && args.position >= 1
      ? ['agent_submit_go_hosted_answer', { requested_session_id: args.sessionId, requested_question_id: args.questionId, requested_answer: args.answer, expected_question_position: args.position }] : null
    default: return null
  }
}

function publicRpcError(error) {
  if (error?.code === 'P0002') return [404, 'This game is unavailable.', 'not_found']
  if (error?.code === '55000') return [409, 'This round has moved on. Refresh to continue.', 'invalid_state']
  if (error?.code === '42501' || error?.code === '28000') return [403, 'Your Pulse access is currently unavailable.', 'access_denied']
  if (['22023', '22P02'].includes(error?.code)) return [400, 'Check the details and try again.', 'invalid_request']
  return [503, 'Pulse GO is temporarily unavailable.', 'unavailable']
}

function serviceClient() {
  const url = process.env.PULSE_AGENT_SUPABASE_URL
  const key = process.env.PULSE_AGENT_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function parsedBody(request) {
  if (request.body !== undefined) return request.body
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 8192) throw new Error('body_too_large')
  }
  return JSON.parse(raw)
}

export function createAgentHandler(makeClient = serviceClient) {
  return async function agentHandler(request, response) {
    if (request.method !== 'GET' && request.method !== 'POST') return fail(response, 405, 'Method not allowed.', 'method_not_allowed', { Allow: 'GET, POST' })
    if (request.method === 'POST' && (!sameOrigin(request) || request.headers['content-type']?.split(';')[0] !== 'application/json')) {
      return fail(response, 403, 'Request not allowed.', 'request_denied')
    }
    const client = makeClient()
    if (!client) return fail(response, 503, 'Agent access is not configured here.', 'not_configured')
    let body = {}
    if (request.method === 'POST') {
      try {
        body = await parsedBody(request)
        if (!body || Array.isArray(body) || typeof body !== 'object' || JSON.stringify(body).length > 8192) throw new Error('invalid_body')
      } catch {
        return fail(response, 400, 'Check the details and try again.', 'invalid_request')
      }
    }
    const action = request.method === 'GET' ? 'profile' : body.action
    if (action === 'activate') {
      const code = typeof body.args?.code === 'string' ? body.args.code.trim() : ''
      const activationCode = typeof body.args?.activationCode === 'string' ? body.args.activationCode.trim().toLowerCase() : ''
      const pin = body.args?.pin
      if (!/^\d{4,12}$/.test(code) || !/^[0-9a-f]{16}$/.test(activationCode)
        || typeof pin !== 'string' || !/^\d{6,12}$/.test(pin)) {
        return fail(response, 400, 'Check the Agent ID, activation code and PIN.', 'invalid_request')
      }
      const { data, error } = await client.rpc('agent_activate_with_code', {
        requested_agent_code: code, requested_activation_code: activationCode, requested_pin: pin,
      })
      if (error) {
        const [status, message, publicCode] = publicRpcError(error)
        return fail(response, status, message, publicCode)
      }
      if (!data?.activated) return fail(response, 401, 'Activation failed. Check your code or ask an administrator for a new one.', 'invalid_activation')
      return send(response, 200, { data: { activated: true }, error: null })
    }
    if (action === 'login') {
      const code = typeof body.args?.code === 'string' ? body.args.code.trim() : ''
      const pin = body.args?.pin
      if (!/^\d{4,12}$/.test(code) || typeof pin !== 'string' || !/^\d{6,12}$/.test(pin)) {
        return fail(response, 401, 'Agent ID or PIN is incorrect.', 'invalid_credentials')
      }
      const token = randomBytes(32).toString('hex')
      const { data, error } = await client.rpc('agent_login_with_pin', {
        requested_agent_code: code, requested_pin: pin, requested_token_hash: hash(token),
      })
      if (error) {
        const [status, message, publicCode] = publicRpcError(error)
        return fail(response, status, message, publicCode)
      }
      if (!data?.authenticated) return fail(response, 401, 'Agent ID or PIN is incorrect.', 'invalid_credentials')
      const { data: profile, error: profileError } = await client.rpc('agent_session_profile', { requested_token_hash: hash(token) })
      if (profileError) return fail(response, 503, 'Pulse GO is temporarily unavailable.', 'unavailable')
      return send(response, 200, { data: profile, error: null }, {
        'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`,
      })
    }
    const token = cookieToken(request.headers.cookie)
    if (action === 'logout') {
      if (token) await client.rpc('agent_logout', { requested_token_hash: hash(token) })
      return send(response, 200, { data: true, error: null }, {
        'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      })
    }
    if (!token) return fail(response, 401, 'Sign in to Pulse GO to continue.', 'sign_in_required')
    const { data: profile, error: sessionError } = await client.rpc('agent_session_profile', { requested_token_hash: hash(token) })
    if (sessionError || !profile?.agent_id) {
      return fail(response, 401, 'Your Pulse GO session ended. Sign in again.', 'session_expired', {
        'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      })
    }
    if (action === 'profile') return send(response, 200, { data: profile, error: null })
    const operation = requestArgs(action, body.args)
    if (!operation) return fail(response, 400, 'Check the details and try again.', 'invalid_request')
    const [name, args] = operation
    const { data, error } = await client.rpc(name, { requested_agent_id: profile.agent_id, ...args })
    if (error) {
      const [status, message, publicCode] = publicRpcError(error)
      return fail(response, status, message, publicCode)
    }
    return send(response, 200, { data, error: null })
  }
}

export default createAgentHandler()
