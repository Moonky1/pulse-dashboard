import assert from 'node:assert/strict'
import test from 'node:test'

import { avatarCandidates, avatarInitials, AVATAR_INPUT_MAX_BYTES, validateAvatarFile } from './avatarModel.js'

test('resolves custom photo before Google and then deterministic initials', () => {
  assert.deepEqual(avatarCandidates({ customAvatarUrl: 'signed-custom', googleAvatarUrl: 'trusted-google' }), ['signed-custom', 'trusted-google'])
  assert.deepEqual(avatarCandidates({ googleAvatarUrl: 'trusted-google' }), ['trusted-google'])
  assert.deepEqual(avatarCandidates({}), [])
  assert.equal(avatarInitials('Simón Zapata Franco'), 'SF')
  assert.equal(avatarInitials('Pulse'), 'PU')
  assert.equal(avatarInitials(''), 'P')
})

test('accepts only JPEG, PNG, and WebP inputs within the client preprocessing limit', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateAvatarFile({ type, size: 42 }), null)
  assert.equal(validateAvatarFile({ type: 'image/svg+xml', size: 42 }).code, 'unsupported_type')
  assert.equal(validateAvatarFile({ type: 'text/html', size: 42 }).code, 'unsupported_type')
  assert.equal(validateAvatarFile({ type: 'image/png', size: AVATAR_INPUT_MAX_BYTES + 1 }).code, 'input_too_large')
  assert.equal(validateAvatarFile({ type: 'image/png', size: 0 }).code, 'empty_file')
})
