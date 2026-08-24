import assert from 'node:assert/strict'
import test from 'node:test'

import { authenticateLinkedStaff, loadLinkedStaffProfile } from './staffAuthFlow.js'

const trustedProfile = {
  legacy_user_id: 'pilot-id', name: 'Pilot', team: 'Asia', role: 'Team Leader',
  agentExt: null, rowIndex: 3, bookId: 'book',
}

function mockSupabase({ signInError = null, linkData = { ok: true, profile: trustedProfile }, linkError = null } = {}) {
  let signOutCalls = 0
  return {
    client: {
      auth: {
        signInWithPassword: async () => ({ error: signInError }),
        signOut: async () => { signOutCalls += 1; return { error: null } },
      },
      functions: { invoke: async () => ({ data: linkData, error: linkError }) },
    },
    signOutCalls: () => signOutCalls,
  }
}

test('wrong password fails without profile hydration', async () => {
  const mock = mockSupabase({ signInError: new Error('invalid') })
  assert.deepEqual(await authenticateLinkedStaff(mock.client, 'pilot@kampaignkings.com', 'wrong'), { ok: false, code: 'INVALID_CREDENTIALS' })
})

test('unlinked Auth user is signed out and cannot create Pulse identity', async () => {
  const mock = mockSupabase({ linkData: { ok: false } })
  assert.deepEqual(await authenticateLinkedStaff(mock.client, 'pilot@kampaignkings.com', 'password'), { ok: false, code: 'PROFILE_NOT_LINKED' })
  assert.equal(mock.signOutCalls(), 1)
})

test('linked Auth user hydrates only the trusted returned profile', async () => {
  const mock = mockSupabase()
  const result = await authenticateLinkedStaff(mock.client, 'pilot@kampaignkings.com', 'password')
  assert.equal(result.ok, true)
  assert.equal(result.profile.legacyUserId, 'pilot-id')
  assert.equal(result.profile.team, 'asia')
})

test('existing authenticated session uses the idempotent link lookup', async () => {
  const mock = mockSupabase()
  assert.equal((await loadLinkedStaffProfile(mock.client)).legacyUserId, 'pilot-id')
})

