import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createCompatibilityProfile,
  isExpectedCorporateEmail,
  normalizeCorporateEmail,
} from './compatibilityProfile.js'

test('normalizes and validates the expected corporate domain', () => {
  assert.equal(normalizeCorporateEmail(' Staff@KampaignKings.com '), 'staff@kampaignkings.com')
  assert.equal(isExpectedCorporateEmail('staff@kampaignkings.com'), true)
  assert.equal(isExpectedCorporateEmail('staff@example.com'), false)
  assert.equal(isExpectedCorporateEmail('broken'), false)
})

test('hydrates only a trusted compatibility profile', () => {
  assert.deepEqual(createCompatibilityProfile({
    legacy_user_id: 'pilot-id', name: 'Pilot', team: 'Asia', role: 'Team Leader',
    agentExt: null, rowIndex: 3, bookId: 'book',
  }), {
    legacyUserId: 'pilot-id', name: 'Pilot', team: 'asia', role: 'leader',
    agentExt: null, rowIndex: 3, bookId: 'book',
  })
  assert.throws(() => createCompatibilityProfile({ name: 'Untrusted' }))
})

