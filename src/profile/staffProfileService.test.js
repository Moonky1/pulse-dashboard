import assert from 'node:assert/strict'
import test from 'node:test'

import { getStaffPublicProfile, normalizeStaffProfileDraft, updateOwnStaffProfile, validateStaffProfileDraft } from './staffProfileService.js'

test('profile draft trims optional values and validates display name, bio, and status', () => {
  assert.deepEqual(normalizeStaffProfileDraft({ displayName: '  Simón  ', bio: '  Hello team  ', presence: 'focused', visibleToStaff: true }), {
    displayName: 'Simón', bio: 'Hello team', presence: 'focused', visibleToStaff: true,
  })
  assert.equal(validateStaffProfileDraft({ displayName: 'S' }), 'Use 2–80 characters for your display name.')
  assert.equal(validateStaffProfileDraft({ bio: 'x'.repeat(281) }), 'Keep your bio within 280 characters.')
  assert.equal(validateStaffProfileDraft({ presence: 'active' }), 'Choose a valid profile status.')
  assert.equal(validateStaffProfileDraft({ displayName: '', bio: '', presence: '', visibleToStaff: false }), null)
})

test('profile updates use the caller-only RPC and never write users directly', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push([name, args]); return { data: [], error: null } } }
  await updateOwnStaffProfile(client, { displayName: '  Casey  ', bio: '', presence: '', visibleToStaff: false })
  assert.deepEqual(calls, [['update_own_staff_profile', {
    requested_display_name: 'Casey', requested_bio: null, requested_presence: null, requested_visible_to_staff: false,
  }]])
})

test('public profile read returns a single safe projection', async () => {
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'get_staff_public_profile')
    assert.deepEqual(args, { target_profile_id: 'staff-id' })
    return { data: [{ id: 'staff-id', name: 'Casey', bio: 'Hello' }], error: null }
  } }
  assert.deepEqual((await getStaffPublicProfile(client, 'staff-id')).data, { id: 'staff-id', name: 'Casey', bio: 'Hello' })
})
