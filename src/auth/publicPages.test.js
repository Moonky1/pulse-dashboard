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

test('invitation acceptance has concise progress and a one-time workspace welcome', async () => {
  const [callback, workspace, styles] = await Promise.all([
    read('./screens/AuthCallbackPage.jsx'),
    read('./screens/WorkspacePage.jsx'),
    read('./styles/auth.css'),
  ])

  assert.match(callback, /pulse_staff_invitation_id/)
  assert.match(callback, /Accepting your invitation/)
  assert.match(callback, /Preparing your place in Pulse/)
  assert.match(callback, /invitationAccepted: true/)
  assert.match(workspace, /Invitation accepted\. Welcome to Pulse\./)
  assert.match(workspace, /state: null/)
  assert.match(styles, /auth-workspace-notice--success/)
  assert.doesNotMatch(`${callback}\n${workspace}`, /updateUser|verifyOtp|exchangeCodeForSession|acceptOwnStaffInvitation/)
})

test('the browser mark uses the Pulse metallic ring identity', async () => {
  const favicon = await read('../../public/favicon.svg')

  assert.match(favicon, /aria-label="Pulse"/)
  assert.match(favicon, /id="metal"/)
  assert.match(favicon, /id="pulse"/)
  assert.doesNotMatch(favicon, /vite|lightning/i)
})

test('the shared Pulse orb uses size-aware optical motion with a static reduced-motion state', async () => {
  const [orb, styles, publicShell, authShell, workspace, goShell, studioShell, adminShell] = await Promise.all([
    read('../components/ui/PulseOrb.jsx'),
    read('../components/ui/ui.css'),
    read('./components/PublicSiteShell.jsx'),
    read('./components/AuthShell.jsx'),
    read('./screens/WorkspacePage.jsx'),
    read('../go-product/GoShell.jsx'),
    read('../studio/StudioShell.jsx'),
    read('../admin/components/AdminShell.jsx'),
  ])

  assert.match(orb, /pulse-orb__rim/)
  assert.match(orb, /pulse-orb__flow/)
  assert.match(styles, /--pulse-orb-primary-arc/)
  assert.match(styles, /--orb-motion-duration: 20s/)
  assert.match(styles, /\.pulse-orb--sm \.pulse-orb__spill \{ display: none; \}/)
  assert.match(styles, /:where\(a, button\):focus-visible \.pulse-orb/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.doesNotMatch(styles, /rotate\((?:132|226|229|294|298|340|346)deg\)/)

  for (const surface of [publicShell, authShell, workspace, goShell, studioShell, adminShell]) {
    assert.match(surface, /PulseOrb|<Brand/)
  }
})
