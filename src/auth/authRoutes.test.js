import assert from 'node:assert/strict'
import test from 'node:test'

import { AGENT_SIGN_IN_PATH, AUTH_ENTRY_PATH, LEGACY_STAFF_PATH_REDIRECTS, STAFF_FORGOT_PASSWORD_PATH, STAFF_REGISTER_PATH, STAFF_SIGN_IN_PATH } from './authRoutes.js'

test('keeps staff and agent entry paths separate', () => {
  assert.equal(AUTH_ENTRY_PATH, '/signin')
  assert.equal(STAFF_SIGN_IN_PATH, '/staff/signin')
  assert.equal(STAFF_REGISTER_PATH, '/staff/register')
  assert.equal(STAFF_FORGOT_PASSWORD_PATH, '/staff/forgot-password')
  assert.equal(AGENT_SIGN_IN_PATH, '/agent/signin')
  assert.notEqual(STAFF_SIGN_IN_PATH, AGENT_SIGN_IN_PATH)
})

test('legacy public staff links redirect to their route-separated equivalents', () => {
  assert.deepEqual(LEGACY_STAFF_PATH_REDIRECTS, {
    '/register': '/staff/register',
    '/forgot-password': '/staff/forgot-password',
  })
})
