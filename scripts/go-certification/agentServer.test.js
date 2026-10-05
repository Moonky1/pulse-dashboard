import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'

import { createAgentHandler } from '../../api/agent.js'

const AGENT_ID = '11111111-1111-4111-8111-111111111111'
const OTHER_ID = '22222222-2222-4222-8222-222222222222'
const TOKEN = 'a'.repeat(64)

function setup(answers = {}) {
  const calls = []
  const client = { async rpc(name, args) {
    calls.push({ name, args })
    if (answers[name]) return answers[name](args)
    if (name === 'agent_session_profile') return { data: { agent_id: AGENT_ID, display_name: 'QA Agent', team_name: 'QA Team' }, error: null }
    return { data: { ok: true }, error: null }
  } }
  const handler = createAgentHandler(() => client)
  async function request(action, args = {}, { token = TOKEN, origin = 'https://preview.pulse.test', method = 'POST' } = {}) {
    const req = { method, headers: {
      host: 'preview.pulse.test', 'x-forwarded-proto': 'https', origin,
      'content-type': 'application/json', cookie: token ? `__Host-pulse_agent=${token}` : '',
    }, body: { action, args } }
    const res = { writeHead(status, headers) { this.status = status; this.headers = headers }, end(value) { this.payload = JSON.parse(value) } }
    await handler(req, res)
    return res
  }
  return { request, calls }
}

test('Agent code without PIN cannot authenticate', async () => {
  const { request, calls } = setup()
  const response = await request('login', { code: '3248' }, { token: null })
  assert.equal(response.status, 401)
  assert.equal(response.payload.error.code, 'invalid_credentials')
  assert.equal(calls.length, 0)
})

test('Agent can activate once with a one-time code and self-chosen PIN', async () => {
  const { request, calls } = setup({ agent_activate_with_code: () => ({ data: { activated: true }, error: null }) })
  const response = await request('activate', { code: '3248', activationCode: 'ABCDEF0123456789', pin: '731482' }, { token: null })
  assert.equal(response.status, 200)
  assert.equal(response.payload.data.activated, true)
  assert.equal(response.headers['Set-Cookie'], undefined)
  assert.deepEqual(calls, [{ name: 'agent_activate_with_code', args: {
    requested_agent_code: '3248', requested_activation_code: 'abcdef0123456789', requested_pin: '731482',
  } }])
})

test('invalid activation is generic and never creates a session', async () => {
  const { request, calls } = setup({ agent_activate_with_code: () => ({ data: { activated: false }, error: null }) })
  const invalid = await request('activate', { code: '3248', activationCode: '123', pin: '731482' }, { token: null })
  assert.equal(invalid.status, 400)
  assert.equal(calls.length, 0)
  const denied = await request('activate', { code: '3248', activationCode: '0000000000000000', pin: '731482' }, { token: null })
  assert.equal(denied.status, 401)
  assert.equal(denied.payload.error.code, 'invalid_activation')
  assert.equal(denied.headers['Set-Cookie'], undefined)
  assert.equal(calls.length, 1)
})

test('wrong PIN response is generic and never sets a cookie', async () => {
  const { request } = setup({ agent_login_with_pin: () => ({ data: { authenticated: false }, error: null }) })
  const response = await request('login', { code: '3248', pin: '000000' }, { token: null })
  assert.equal(response.status, 401)
  assert.equal(response.headers['Set-Cookie'], undefined)
  assert.equal(response.payload.error.message, 'Agent ID or PIN is incorrect.')
})

test('successful login stores only an opaque secure HttpOnly cookie', async () => {
  const { request, calls } = setup({ agent_login_with_pin: () => ({ data: { authenticated: true }, error: null }) })
  const response = await request('login', { code: '3248', pin: '123456' }, { token: null })
  assert.equal(response.status, 200)
  assert.match(response.headers['Set-Cookie'], /^__Host-pulse_agent=[0-9a-f]{64}; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200$/)
  assert.equal(calls[0].args.requested_agent_code, '3248')
  assert.notEqual(calls[0].args.requested_token_hash, response.headers['Set-Cookie'].split('=')[1].split(';')[0])
  assert.equal(calls[0].args.requested_pin, '123456')
  assert.equal(response.payload.data.display_name, 'QA Agent')
})

test('each protected action derives Agent identity from the cookie, not the body', async () => {
  const { request, calls } = setup()
  const response = await request('roomJoin', { roomCode: 'KK 1234', requested_agent_id: OTHER_ID })
  assert.equal(response.status, 200)
  assert.equal(calls[1].name, 'agent_join_go_hosted_session')
  assert.deepEqual(calls[1].args, { requested_agent_id: AGENT_ID, requested_room_code: 'KK 1234' })
  assert.equal(calls[0].args.requested_token_hash, createHash('sha256').update(TOKEN).digest('hex'))
})

test('valid canonical game and attempt IDs reach the protected Agent contracts', async () => {
  const operations = [
    ['metadata', { contentIds: [OTHER_ID] }, 'agent_get_go_catalog_metadata', { requested_content_ids: [OTHER_ID] }],
    ['content', { contentId: OTHER_ID }, 'agent_get_go_practice_content', { requested_content_id: OTHER_ID }],
    ['practiceStart', { contentId: OTHER_ID }, 'agent_start_go_practice', { requested_content_id: OTHER_ID }],
    ['practiceTiming', { attemptId: OTHER_ID }, 'agent_get_go_practice_timing', { requested_attempt_id: OTHER_ID }],
    ['practiceAnswer', { attemptId: OTHER_ID, questionId: AGENT_ID, answer: 0 }, 'agent_submit_go_practice_answer', { requested_attempt_id: OTHER_ID, requested_question_id: AGENT_ID, requested_answer: 0 }],
    ['practiceReview', { attemptId: OTHER_ID }, 'agent_get_go_practice_completed_review', { requested_attempt_id: OTHER_ID }],
    ['certificationResult', { attemptId: OTHER_ID }, 'agent_get_go_certification_result', { requested_attempt_id: OTHER_ID }],
    ['roomSnapshot', { sessionId: OTHER_ID }, 'agent_get_go_hosted_session', { requested_session_id: OTHER_ID }],
    ['roomTiming', { sessionId: OTHER_ID }, 'agent_get_go_hosted_timing', { requested_session_id: OTHER_ID }],
    ['roomAnswer', { sessionId: OTHER_ID, questionId: AGENT_ID, answer: false, position: 1 }, 'agent_submit_go_hosted_answer', { requested_session_id: OTHER_ID, requested_question_id: AGENT_ID, requested_answer: false, expected_question_position: 1 }],
  ]
  for (const [action, args, name, forwarded] of operations) {
    const { request, calls } = setup()
    const response = await request(action, { ...args, requested_agent_id: OTHER_ID })
    assert.equal(response.status, 200, `${action} accepts a standard UUID`)
    assert.deepEqual(calls[1], { name, args: { requested_agent_id: AGENT_ID, ...forwarded } })
  }
})

test('malformed IDs never reach Agent game contracts', async () => {
  for (const id of ['22222222-2222-4222-222222222222', 'not-a-game', `${OTHER_ID}/../admin`, null]) {
    const { request, calls } = setup()
    assert.equal((await request('metadata', { contentIds: [id] })).status, 400)
    assert.equal((await request('practiceStart', { contentId: id })).status, 400)
    assert.ok(calls.every(call => call.name === 'agent_session_profile'))
  }
})

test('browser cannot reach a Staff or unknown RPC through the Agent endpoint', async () => {
  const { request, calls } = setup()
  const response = await request('admin_provision_agent', { requested_agent_id: OTHER_ID })
  assert.equal(response.status, 400)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'agent_session_profile')
})

test('cross-origin POST and missing Agent session are denied', async () => {
  const { request, calls } = setup()
  assert.equal((await request('roomJoin', { roomCode: 'KK 1234' }, { origin: 'https://other.test' })).status, 403)
  assert.equal((await request('roomJoin', { roomCode: 'KK 1234' }, { token: null })).status, 401)
  assert.equal(calls.length, 0)
})

test('logout revokes the server session and clears only the Agent cookie', async () => {
  const { request, calls } = setup()
  const response = await request('logout')
  assert.equal(response.status, 200)
  assert.equal(calls[0].name, 'agent_logout')
  assert.match(response.headers['Set-Cookie'], /Max-Age=0$/)
})
