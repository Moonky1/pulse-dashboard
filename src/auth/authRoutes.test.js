import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { AGENT_SIGN_IN_PATH, AUTH_ENTRY_PATH, LEGACY_STAFF_PATH_REDIRECTS, STAFF_FORGOT_PASSWORD_PATH, STAFF_REGISTER_PATH, STAFF_SIGN_IN_PATH } from './authRoutes.js'

test('keeps staff and agent entry paths separate', () => {
  assert.equal(AUTH_ENTRY_PATH, '/signin')
  assert.equal(STAFF_SIGN_IN_PATH, '/signin')
  assert.equal(STAFF_REGISTER_PATH, '/register')
  assert.equal(STAFF_FORGOT_PASSWORD_PATH, '/forgot-password')
  assert.equal(AGENT_SIGN_IN_PATH, '/agent/signin')
  assert.notEqual(STAFF_SIGN_IN_PATH, AGENT_SIGN_IN_PATH)
})

test('legacy explicit staff links redirect to the simple public paths', () => {
  assert.deepEqual(LEGACY_STAFF_PATH_REDIRECTS, {
    '/staff/signin': '/signin',
    '/staff/register': '/register',
    '/staff/forgot-password': '/forgot-password',
  })
})

test('staff and agent surfaces have no chooser or cross-link', () => {
  const appSource = readFileSync(new URL('./AuthApp.jsx', import.meta.url), 'utf8')
  const shellSource = readFileSync(new URL('./components/AuthShell.jsx', import.meta.url), 'utf8')
  const signInSource = readFileSync(new URL('./screens/SignInPage.jsx', import.meta.url), 'utf8')
  const registerSource = readFileSync(new URL('./screens/RegisterPage.jsx', import.meta.url), 'utf8')
  const agentSource = readFileSync(new URL('./screens/AgentSignInPage.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(appSource, /AccessChooserPage/)
  assert.doesNotMatch(shellSource, /Designed for focused, trusted work/)
  assert.match(signInSource, /Continue with Google/)
  assert.match(signInSource, /auth-liquid-action/)
  assert.match(registerSource, /auth-liquid-action/)
  assert.doesNotMatch(signInSource, /Agent/)
  assert.doesNotMatch(agentSource, /AUTH_ENTRY_PATH|Staff|corporate/)
})
