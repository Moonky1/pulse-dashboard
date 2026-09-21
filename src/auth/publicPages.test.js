import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('homepage and legal pages are public routes outside RouteGate', async () => {
  const app = await read('./AuthApp.jsx')
  const publicRouteLines = app.split('\n').filter((line) => /path="\/(?:"|privacy"|terms")/.test(line))

  assert.equal(publicRouteLines.length, 3)
  assert.match(publicRouteLines[0], /PublicHomePage/)
  assert.match(publicRouteLines[1], /PublicLegalPage kind="privacy"/)
  assert.match(publicRouteLines[2], /PublicLegalPage kind="terms"/)
  assert.doesNotMatch(publicRouteLines.join('\n'), /RouteGate|PublicOnly/)
})

test('authenticated product routes remain protected', async () => {
  const app = await read('./AuthApp.jsx')

  for (const path of ['/workspace', '/go', '/studio', '/admin/*']) {
    const line = app.split('\n').find((candidate) => candidate.includes(`path="${path}"`))
    assert.match(line, /RouteGate allow=\{\[AUTH_STATES\.ACTIVE\]\}/)
  }
})

test('public homepage presents concise Pulse entry without exposing internal data', async () => {
  const page = await read('./screens/PublicHomePage.jsx')
  const shell = await read('./components/PublicSiteShell.jsx')

  assert.match(page, /Welcome to Pulse/i)
  assert.doesNotMatch(`${page}\n${shell}`, /internal platform|One identity|checkpoint/i)
  assert.match(page, /Staff sign in/)
  assert.match(shell, /Pulse home/)
  assert.doesNotMatch(`${page}\n${shell}`, /useAuth|supabase|employee|role|permission|audit/i)
})

test('privacy and terms content accurately bound Google identity and Pulse access', async () => {
  const legal = await read('./screens/PublicLegalPage.jsx')

  assert.match(legal, /Google Sign-In provides basic identity information/)
  assert.match(legal, /does not request access to Gmail, Google Drive, Google Calendar/)
  assert.match(legal, /does not automatically grant Pulse access or permissions/)
  assert.match(legal, /does not sell staff personal information/)
  assert.match(legal, /Signing in successfully does not by itself grant access/)
  assert.match(legal, /Do not transfer, share, or allow another person to use your staff account/)
  assert.match(legal, /Last updated: September 2026/)
  assert.doesNotMatch(legal, /service_role|\bRLS\b|\bRPC\b|GDPR|CCPA|HIPAA/i)
})

test('public pages render without protected profile or auth hooks', async () => {
  const files = await Promise.all([
    read('./screens/PublicHomePage.jsx'),
    read('./screens/PublicLegalPage.jsx'),
    read('./components/PublicSiteShell.jsx'),
  ])

  assert.doesNotMatch(files.join('\n'), /useAuth|AuthProvider|loadOwnProfile|list_managed|from\(['"]users['"]\)|\.rpc\(/)
})

test('Staff entry and Workspace use finished product language', async () => {
  const [shell, workspace] = await Promise.all([
    read('./components/AuthShell.jsx'),
    read('./screens/WorkspacePage.jsx'),
  ])

  assert.match(workspace, /Pulse GO/)
  assert.match(workspace, /Studio/)
  assert.match(workspace, /Administration/)
  assert.doesNotMatch(`${shell}\n${workspace}`, /authenticated foundation|foundation ready|future checkpoint|internal platform|One identity/i)
})

test('the browser mark uses the Pulse metallic ring identity', async () => {
  const favicon = await read('../../public/favicon.svg')

  assert.match(favicon, /aria-label="Pulse"/)
  assert.match(favicon, /id="metal"/)
  assert.match(favicon, /id="pulse"/)
  assert.doesNotMatch(favicon, /vite|lightning/i)
})
