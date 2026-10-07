import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveOwnStaffProfile } from './pulseAuthService.js'
import { clearInvitationGoogle, hasVerifiedGoogleIdentity, readInvitationGoogle, rememberInvitationGoogle } from './invitationSetup.js'

const user = { id: 'fixture-auth', email: 'invite@example.test', email_confirmed_at: '2026-10-06', user_metadata: { name: 'Invited Person' } }
function harness({ profile = null, setup = null, setupError = null } = {}) {
  const calls = []
  const query = { select() { return this }, eq() { return this }, async maybeSingle() { return { data: profile, error: null } } }
  return { calls, client: { from() { return query }, async rpc(name) {
    calls.push(name)
    if (name === 'get_own_staff_invitation_setup') return { data: setup, error: setupError }
    if (name === 'create_pending_profile') return { data: { status: 'pending_approval' }, error: null }
    throw new Error('Unexpected automatic write: ' + name)
  } } }
}
test('opening an invitation only reads setup; it never accepts or creates a Staff profile', async () => {
  const current = harness({ setup: { id: 'invite', status: 'ready' } })
  const result = await resolveOwnStaffProfile(current.client, user)
  assert.equal(result.data, null)
  assert.equal(result.invitationSetup.status, 'ready')
  assert.deepEqual(current.calls, ['get_own_staff_invitation_setup'])
})
test('an expired invitation stays on the reissue screen without activation', async () => {
  const current = harness({ setup: { status: 'reissue_required' }, profile: { status: 'pending_approval' } })
  assert.equal((await resolveOwnStaffProfile(current.client, user)).invitationSetup.status, 'reissue_required')
  assert.deepEqual(current.calls, ['get_own_staff_invitation_setup'])
})
test('noninvited registration still creates only a pending profile; metadata cannot grant an invitation', async () => {
  const current = harness()
  const result = await resolveOwnStaffProfile(current.client, { ...user, user_metadata: { name: 'Test', pulse_staff_invitation_id: 'forged' } })
  assert.equal(result.data.status, 'pending_approval')
  assert.deepEqual(current.calls, ['get_own_staff_invitation_setup', 'create_pending_profile'])
})
test('existing active, inactive and blocked identities never enter invitation setup', async () => {
  for (const status of ['active', 'inactive', 'blocked']) {
    const current = harness({ profile: { status } })
    assert.equal((await resolveOwnStaffProfile(current.client, user)).data.status, status)
    assert.deepEqual(current.calls, [])
  }
})
test('a missing setup contract fails closed and unverified identities cannot read setup', async () => {
  const current = harness({ setupError: { code: 'PGRST202' } })
  assert.ok((await resolveOwnStaffProfile(current.client, user)).error)
  assert.deepEqual(current.calls, ['get_own_staff_invitation_setup'])
  const unverified = harness()
  await resolveOwnStaffProfile(unverified.client, { ...user, email_confirmed_at: null })
  assert.deepEqual(unverified.calls, [])
})
test('Google return stores only a routing hint, not a token, password or access proposal', () => {
  const values = new Map()
  const storage = { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key), removeItem: key => values.delete(key) }
  rememberInvitationGoogle({ id: 'invite', email: user.email, role: 'admin' }, user, storage)
  assert.deepEqual(readInvitationGoogle(storage), { id: 'invite', authUserId: user.id })
  assert.doesNotMatch([...values.values()].join(''), /email|role|token|password/)
  clearInvitationGoogle(storage)
  assert.equal(readInvitationGoogle(storage), null)
})
test('a displayed Google connection must match the canonical verified email', () => {
  const identity = { provider: 'google', identity_data: { email: user.email, email_verified: true } }
  assert.equal(hasVerifiedGoogleIdentity({ ...user, identities: [identity] }), true)
  assert.equal(hasVerifiedGoogleIdentity({ ...user, identities: [{ ...identity, identity_data: { email: 'other@example.test', email_verified: true } }] }), false)
  assert.equal(hasVerifiedGoogleIdentity({ ...user, identities: [{ ...identity, identity_data: { email: user.email } }] }), false)
})
