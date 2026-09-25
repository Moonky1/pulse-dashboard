import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { canRecoverPassword, connectedGoogleAccount } from './accountViewModel.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Google status uses trusted provider identity without exposing tokens', () => {
  const google = connectedGoogleAccount({
    app_metadata: { providers: ['email', 'google'] },
    identities: [{ provider: 'google', identity_data: { email: 'simon@example.test', access_token: 'private' } }],
  })
  assert.deepEqual(google, { connected: true, email: 'simon@example.test' })
  assert.deepEqual(connectedGoogleAccount({ app_metadata: { providers: ['google'] } }), { connected: true, email: null })
  assert.deepEqual(connectedGoogleAccount({ app_metadata: { providers: ['email'] }, identities: [] }), { connected: false, email: null })
})

test('password recovery entry is shown only for an email sign-in method', () => {
  assert.equal(canRecoverPassword({ email: 'simon@example.test', app_metadata: { providers: ['email', 'google'] } }), true)
  assert.equal(canRecoverPassword({ email: 'simon@example.test', app_metadata: { providers: ['google'] } }), false)
  assert.equal(canRecoverPassword({ app_metadata: { providers: ['email'] } }), false)
})

test('PRODUCT-1 routes are protected and keep operational data disconnected', async () => {
  const [routes, dashboard, settings, workspace, tree] = await Promise.all([
    read('./AuthApp.jsx'), read('./screens/DashboardPage.jsx'), read('./screens/SettingsPage.jsx'),
    read('./screens/WorkspacePage.jsx'), read('../admin/pages/AdminStaffTreePage.jsx'),
  ])
  for (const path of ['/dashboard', '/profile', '/settings']) assert.match(routes, new RegExp(`path="${path}" element=\\{<RouteGate allow=\\{\\[AUTH_STATES.ACTIVE\\]\\}`))
  assert.match(dashboard, /Operational data is not connected/)
  assert.doesNotMatch(dashboard, /Math\.random|from\('transfers'\)|fakeKpi/)
  assert.doesNotMatch(settings, /access_token|refresh_token|disconnect\(/)
  assert.doesNotMatch(workspace, /<Badge[^>]*>Ready|auth-workspace-people-link/)
  assert.doesNotMatch(tree, /RoleBadge|person\.roles\?\.\[0\]/)
})
