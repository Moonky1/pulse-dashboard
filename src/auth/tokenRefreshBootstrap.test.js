import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// Execute the provider's actual event callback without duplicating its policy
// or requiring browser authentication/storage in this unit regression test.
const source = (await readFile(new URL('./AuthProvider.jsx', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const marker = 'client.auth.onAuthStateChange('
const start = source.indexOf(marker) + marker.length
const end = source.indexOf('\n    })\n    void bootstrap()', start)
assert.ok(start >= marker.length && end > start, 'provider event callback is present')
const callbackSource = source.slice(start, end + '\n    }'.length)

function harness(initialKey) {
  const key = { current: initialKey }
  const sessions = []
  const resolutions = []
  const resolve = session => { resolutions.push(session); key.current = session?.access_token ?? 'anonymous' }
  const callback = new Function('sessionKey', 'setSession', 'resolveProfile',
    `const active = true; return (${callbackSource});`)(key, session => sessions.push(session), resolve)
  return { key, sessions, resolutions, callback, resolve }
}

test('initial TOKEN_REFRESHED hydrates the profile instead of skipping bootstrap', () => {
  const current = harness(null)
  const session = { access_token: 'synthetic-refreshed-token', user: { id: 'synthetic-staff' } }
  current.callback('TOKEN_REFRESHED', session)
  assert.deepEqual(current.resolutions, [session])
  assert.deepEqual(current.sessions, [])
  assert.equal(current.key.current, session.access_token)
})

test('refresh from anonymous state resolves a newly present identity', () => {
  const current = harness('anonymous')
  const session = { access_token: 'synthetic-token', user: { id: 'synthetic-staff' } }
  current.callback('TOKEN_REFRESHED', session)
  assert.deepEqual(current.resolutions, [session])
})

test('normal refresh keeps the hydrated identity without another profile request', () => {
  const current = harness('synthetic-old-token')
  const session = { access_token: 'synthetic-new-token', user: { id: 'synthetic-staff' } }
  current.callback('TOKEN_REFRESHED', session)
  assert.deepEqual(current.resolutions, [])
  assert.deepEqual(current.sessions, [session])
  assert.equal(current.key.current, session.access_token)
})

test('sign-out and initial anonymous events still resolve empty identity', () => {
  const current = harness('synthetic-token')
  current.callback('SIGNED_OUT', null)
  assert.deepEqual(current.resolutions, [null])
  assert.equal(current.key.current, 'anonymous')
  current.callback('INITIAL_SESSION', null)
  assert.deepEqual(current.resolutions, [null, null])
})
