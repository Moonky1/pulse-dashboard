import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const origin = 'https://pulse-preview.example.test'
const operator = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'
const requestKey = '33333333-3333-4333-8333-333333333333'
const source = stripTypeScriptTypes(readFileSync(new URL('../../supabase/functions/pulse-staff-removal/index.ts', import.meta.url), 'utf8')).replace(/^import[^\r\n]*\r?\n/, '')
function runtime({ signedIn = true, prepareError = null, kind = 'purge', authError = null, avatar = null, alreadyDone = false, mediaError = null } = {}) {
  let handler
  const calls = []
  const environment = { PULSE_STAFF_REMOVAL_ALLOWED_ORIGINS: origin, SUPABASE_URL: 'https://supabase.example.test', SUPABASE_ANON_KEY: 'public-fixture', SUPABASE_SERVICE_ROLE_KEY: 'server-fixture' }
  const user = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: operator } : null }, error: signedIn ? null : {} }) },
    rpc: async (name, args) => { calls.push([name, args]); return { data: { kind, removed: true }, error: prepareError } },
  }
  const admin = {
    rpc: async (name, args) => {
      calls.push([name, args])
      return { data: name === 'get_staff_removal_cleanup' ? { auth_user_id: userId, kind, avatar_path: avatar, auth_done: alreadyDone, media_done: alreadyDone } : true, error: null }
    },
    auth: { admin: {
      deleteUser: async id => { calls.push(['deleteUser', id]); return { error: authError } },
      updateUserById: async (id, args) => { calls.push(['banUser', id, args]); return { error: authError } },
    } },
    storage: { from: bucket => ({ remove: async paths => { calls.push(['removeMedia', bucket, paths]); return { error: mediaError } } }) },
  }
  new Function('Deno', 'createClient', source)({ env: { get: name => environment[name] }, serve: callback => { handler = callback } }, (_url, key) => key === 'public-fixture' ? user : admin)
  return { calls, invoke: async (body = { userId, requestKey, version: '2026-10-05T00:00:00Z', confirmation: 'REMOVE' }, options = {}) => handler(new Request('https://edge.example.test', { method: 'POST', headers: { Origin: origin, Authorization: 'Bearer fixture', 'Content-Type': 'application/json', ...options.headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })) }
}
test('wrong origin and invalid Auth are rejected before any destructive contract', async () => {
  const deniedOrigin = runtime()
  assert.equal((await deniedOrigin.invoke({}, { headers: { Origin: 'https://untrusted.example.test' } })).status, 403)
  assert.equal(deniedOrigin.calls.length, 0)
  const deniedIdentity = runtime({ signedIn: false })
  assert.equal((await deniedIdentity.invoke()).status, 401)
  assert.equal(deniedIdentity.calls.length, 0)
})
test('malformed, unconfirmed and oversized requests cannot prepare removal', async () => {
  const app = runtime()
  for (const payload of ['[]', 'null', '{', { userId, requestKey, version: '2026-10-05', confirmation: 'YES' }, { userId: 'bad', requestKey, version: '2026-10-05', confirmation: 'REMOVE' }]) assert.equal((await app.invoke(payload)).status, 400)
  assert.equal((await app.invoke(' '.repeat(4097))).status, 413)
  assert.equal(app.calls.length, 0)
})
test('server permission denial never reaches privileged Auth cleanup', async () => {
  const app = runtime({ prepareError: { code: '42501' } })
  assert.equal((await app.invoke()).status, 403)
  assert.deepEqual(app.calls.map(([name]) => name), ['prepare_staff_removal'])
})
test('dependency-free removal deletes Auth and only the canonical own avatar', async () => {
  const app = runtime({ avatar: `${userId}/avatar.webp` })
  assert.equal((await (await app.invoke()).json()).cleanupPending, false)
  assert.deepEqual(app.calls.map(([name]) => name), ['prepare_staff_removal', 'get_staff_removal_cleanup', 'deleteUser', 'removeMedia', 'complete_staff_removal_cleanup'])
  assert.deepEqual(app.calls.find(([name]) => name === 'removeMedia'), ['removeMedia', 'staff-avatars', [`${userId}/avatar.webp`]])
})
test('historical removal bans Auth rather than deleting immutable attribution', async () => {
  const app = runtime({ kind: 'historical' })
  assert.equal((await (await app.invoke()).json()).cleanupPending, false)
  assert.equal(app.calls.find(([name]) => name === 'banUser')[2].ban_duration, '876000h')
  assert.ok(!app.calls.some(([name]) => name === 'deleteUser'))
})
test('Auth or media failures remain explicitly pending and never report full completion', async () => {
  const failedAuth = runtime({ authError: { status: 503 } })
  assert.equal((await (await failedAuth.invoke()).json()).cleanupPending, true)
  const failedMedia = runtime({ avatar: `${userId}/avatar.webp`, mediaError: { status: 503 } })
  assert.equal((await (await failedMedia.invoke()).json()).cleanupPending, true)
  const foreignMedia = runtime({ avatar: `${operator}/avatar.webp` })
  assert.equal((await (await foreignMedia.invoke()).json()).cleanupPending, true)
  assert.ok(!foreignMedia.calls.some(([name]) => name === 'removeMedia'))
})
test('completed cleanup and an already-deleted Auth identity are idempotent', async () => {
  const completed = runtime({ alreadyDone: true })
  assert.equal((await (await completed.invoke()).json()).cleanupPending, false)
  assert.ok(!completed.calls.some(([name]) => name === 'deleteUser' || name === 'removeMedia'))
  const alreadyDeleted = runtime({ authError: { status: 404 } })
  assert.equal((await (await alreadyDeleted.invoke()).json()).cleanupPending, false)
})
