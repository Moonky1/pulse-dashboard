import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const files = (names) => Promise.all(names.map((name) => readFile(new URL(name, import.meta.url), 'utf8')))

test('Joined Pulse is a protected Staff-profile detail with an accessible date dialog', async () => {
  const [profile, control, api, styles] = await files([
    './pages/AdminUserDetailPage.jsx',
    './components/JoinedPulseAdministration.jsx',
    './api/adminApi.js',
    './styles/admin.css',
  ])
  assert.match(profile, /formatPulseDate\(user\.pulseJoinedOn\)/)
  assert.match(profile, /JoinedPulseAdministration/)
  assert.match(control, /type="date"/)
  assert.match(control, /max=\{today\}/)
  assert.match(control, />Cancel</)
  assert.match(control, />Save</)
  assert.match(api, /rpc\('set_staff_pulse_joined_on'/)
  assert.match(styles, /admin-joined-pulse-dialog/)
  assert.doesNotMatch(`${profile}\n${control}`, /auth\.users|created_at|service_role|\.from\(/)
})

test('Joined Pulse does not clutter People, Staff Tree, or Team member cards', async () => {
  const surfaces = await files(['./pages/AdminUsersPage.jsx', './pages/AdminStaffTreePage.jsx', './pages/AdminTeamProfilePage.jsx'])
  assert.doesNotMatch(surfaces.join('\n'), /Joined Pulse|pulseJoinedOn/)
})
