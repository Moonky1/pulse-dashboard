import assert from 'node:assert/strict'
import test from 'node:test'

import { getAuthOrigin, getAuthRedirect, PRODUCTION_AUTH_ORIGIN } from './authRedirects.js'

test('uses www as the production canonical Auth origin', () => {
  assert.equal(PRODUCTION_AUTH_ORIGIN, 'https://www.pulse-kk.com')
  assert.equal(getAuthOrigin('https://pulse-kk.com'), PRODUCTION_AUTH_ORIGIN)
  assert.equal(getAuthRedirect('verification', 'https://pulse-kk.com'), 'https://www.pulse-kk.com/auth/callback?flow=verification')
  assert.equal(getAuthRedirect('recovery', 'https://www.pulse-kk.com'), 'https://www.pulse-kk.com/auth/callback?flow=recovery')
})

test('keeps localhost redirects local for controlled testing', () => {
  assert.equal(getAuthOrigin('http://127.0.0.1:4175'), 'http://127.0.0.1:4175')
  assert.equal(getAuthRedirect('recovery', 'https://pulse-auth-git-preview.vercel.app'), 'https://pulse-auth-git-preview.vercel.app/auth/callback?flow=recovery')
  assert.throws(() => getAuthRedirect('unknown'), /Unsupported/)
})
