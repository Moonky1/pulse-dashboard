import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const existing = 'https://existing-preview.example.test'
const additional = 'https://admin2-preview.example.test'
const source = stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/pulse-staff-invitations/index.ts', import.meta.url), 'utf8')).replace(/^import[^\r\n]*\r?\n/, '')
function runtime({ extraOrigin = additional, rpcError = null } = {}) {
  let handler
  const calls = []
  const env = { PULSE_ALLOWED_ORIGINS: existing, PULSE_INVITATION_ADDITIONAL_ORIGINS: extraOrigin,
    SUPABASE_URL: 'https://supabase.example.test', SUPABASE_ANON_KEY: 'public-fixture', SUPABASE_SERVICE_ROLE_KEY: 'server-fixture' }
  new Function('Deno', 'createClient', source)({ env: { get: name => env[name] }, serve: callback => { handler = callback } },
    (_url, key, options) => {
      calls.push(['createClient', key, options.global?.headers?.Authorization ?? null])
      return { rpc: async (name, args) => { calls.push([name, args]); return { data: true, error: rpcError } } }
    })
  const invoke = (origin, { method = 'OPTIONS', authorized = false } = {}) => handler(new Request('https://edge.example.test', {
    method, headers: { Origin: origin, ...(authorized ? { Authorization: 'Bearer fixture' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ action: 'revoke', invitationId: '11111111-1111-4111-8111-111111111111', expectedUpdatedAt: '2026-10-05T00:00:00Z' }) } : {}),
  }))
  return { invoke, calls }
}
test('invitation-only origin addition preserves existing and local origins', async () => {
  const app = runtime()
  for (const origin of [existing, additional, 'http://localhost:5173', 'http://127.0.0.1:5173']) {
    const result = await app.invoke(origin)
    assert.equal(result.status, 204)
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), origin)
  }
  assert.equal(app.calls.length, 0)
})
test('unconfigured and unrelated origins remain denied before any client or RPC', async () => {
  const app = runtime({ extraOrigin: '' })
  for (const origin of [additional, 'https://untrusted.example.test']) {
    const result = await app.invoke(origin)
    assert.equal(result.status, 403)
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), '')
  }
  assert.equal(app.calls.length, 0)
})
test('the new invitation origin does not replace authentication', async () => {
  const app = runtime()
  assert.equal((await app.invoke(additional, { method: 'POST' })).status, 401)
  assert.equal(app.calls.length, 0)
})
test('revocation still delegates live permissions and version checks to the caller RPC', async () => {
  const app = runtime({ rpcError: { code: '42501' } })
  assert.equal((await app.invoke(additional, { method: 'POST', authorized: true })).status, 400)
  assert.deepEqual(app.calls.filter(([name]) => name !== 'createClient').map(([name]) => name), ['revoke_staff_invitation'])
  assert.equal(app.calls[0][1], 'public-fixture')
  assert.equal(app.calls[0][2], 'Bearer fixture')
  assert.equal(app.calls[2][1].expected_updated_at, '2026-10-05T00:00:00Z')
})
