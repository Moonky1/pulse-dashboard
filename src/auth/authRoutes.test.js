import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { agentReturnPath, AGENT_SIGN_IN_PATH, AUTH_ENTRY_PATH, LEGACY_STAFF_PATH_REDIRECTS, STAFF_FORGOT_PASSWORD_PATH, STAFF_REGISTER_PATH, STAFF_SIGN_IN_PATH } from './authRoutes.js'

test('Agent sign-in returns to the requested player profile, progress, game or Academy guide', () => {
  for (const path of ['/go', '/go/practice', '/go/progress', '/profile/990001', '/academy', '/agent/settings', '/academy/product-knowledge',
    '/go/practice/11111111-1111-4111-8111-111111111111', '/go/room/11111111-1111-4111-8111-111111111111']) {
    assert.equal(agentReturnPath(path), path)
  }
})

test('Agent sign-in rejects external destinations and Staff-only paths', () => {
  for (const path of [null, '', 'https://other.test/go', '//other.test/go', '/studio', '/dashboard', '/admin/agents',
    '/go/host', '/profile/invalid', '/profile/990001/../admin', '/academy/../../studio', '/go/room/' + '-'.repeat(36)]) {
    assert.equal(agentReturnPath(path), '/go')
  }
})

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
  const agentHeaderSource = readFileSync(new URL('../go-product/AgentGoHeader.jsx', import.meta.url), 'utf8')
  const workspaceSource = readFileSync(new URL('./screens/WorkspacePage.jsx', import.meta.url), 'utf8')
  const callbackSource = readFileSync(new URL('./screens/AuthCallbackPage.jsx', import.meta.url), 'utf8')
  const providerSource = readFileSync(new URL('./AuthProvider.jsx', import.meta.url), 'utf8')
  const authStyles = readFileSync(new URL('./styles/auth.css', import.meta.url), 'utf8')

  assert.doesNotMatch(appSource, /AccessChooserPage/)
  assert.doesNotMatch(shellSource, /Designed for focused, trusted work/)
  assert.match(signInSource, /Continue with Google/)
  assert.match(registerSource, /Continue with Google/)
  assert.match(signInSource, /rememberStaffReturnPath/)
  assert.match(registerSource, /rememberStaffReturnPath/)
  assert.equal(signInSource.match(/auth-trace-action/g)?.length, 2)
  assert.equal(registerSource.match(/auth-trace-action/g)?.length, 2)
  assert.match(workspaceSource, /pulse-launcher-app/)
  assert.match(workspaceSource, /Administration/)
  assert.match(workspaceSource, /to="\/academy"/)
  assert.match(workspaceSource, /to="\/dashboard".*status="PREVIEW"/)
  assert.match(appSource, /path="\/dashboard".*AUTH_STATES\.ACTIVE/)
  assert.doesNotMatch(workspaceSource, /Ready|Choose an app|auth-workspace-people-link/)
  assert.match(appSource, /path="\/academy".*GoPlayerGate/)
  assert.match(appSource, /path="\/academy\/:id".*GoPlayerGate/)
  assert.doesNotMatch(authStyles, /auth-trace-loop|auth-trace-action::after/)
  assert.doesNotMatch(signInSource, /Agent/)
  assert.doesNotMatch(agentSource, /AUTH_ENTRY_PATH|corporate|to="\/signin"/)
  assert.match(agentSource, /signOutStaff/)
  assert.match(agentSource, /Sign out of Staff and continue/)
  assert.match(agentHeaderSource, /to="\/academy"/)
  assert.doesNotMatch(agentHeaderSource, /to="\/(?:dashboard|studio)"/)
  assert.doesNotMatch(agentSource, /Google|OAuth|signInGoogle/)
  assert.match(callbackSource, /Google sign-in was not completed/)
  assert.match(callbackSource, /readStaffReturnPath/)
  assert.match(providerSource, /resolveOwnStaffProfile/)
  assert.match(readFileSync(new URL('./pulseAuthService.js', import.meta.url), 'utf8'), /createPendingProfile/)
  assert.doesNotMatch(`${signInSource}\n${registerSource}\n${providerSource}`, /endsWith\([^)]*kampaignkings|assign.*role|service_role/i)
})
