import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('one shared avatar resolver serves People, Profile, Staff Tree, Team Profile, and the app account menu', async () => {
  const [people, profile, tree, team, navigation, avatar] = await Promise.all([
    read('../admin/pages/AdminUsersPage.jsx'),
    read('../admin/pages/AdminUserDetailPage.jsx'),
    read('../admin/pages/AdminStaffTreePage.jsx'),
    read('../admin/pages/AdminTeamProfilePage.jsx'),
    read('../auth/components/ProductNavigation.jsx'),
    read('../components/StaffAvatar.jsx'),
  ])
  for (const surface of [people, profile, tree, team, navigation]) assert.match(surface, /StaffAvatar/)
  assert.match(avatar, /avatarCandidates/)
  assert.match(avatar, /getSignedAvatarUrl/)
  assert.match(avatar, /onError/)
})

test('browser preprocessing delegates the write to the protected avatar function', async () => {
  const [service, controls] = await Promise.all([read('./avatarService.js'), read('../components/AvatarControls.jsx')])
  assert.match(service, /functions\.invoke\('pulse-staff-avatar'/)
  assert.doesNotMatch(service, /\.storage\.from\('staff-avatars'\)\.upload/)
  assert.match(controls, /Change photo/)
  assert.match(controls, /Use Google photo|Remove custom photo/)
  assert.doesNotMatch(`${service}\n${controls}`, /avatar[_A-Za-z]*Url.*<input|service_role|Google People/i)
})

test('trusted boundary validates content and computes one canonical object path', async () => {
  const edge = await read('../../supabase/functions/pulse-staff-avatar/index.ts')
  assert.match(edge, /inspectWebp\(bytes\)/)
  assert.match(edge, /MAX_STORED_BYTES = 1024 \* 1024/)
  assert.match(edge, /MAX_DIMENSION = 512/)
  assert.match(edge, /const canonicalPath = `\$\{profile\.id\}\/avatar\.webp`/)
  assert.match(edge, /userClient\.auth\.getUser\(\)/)
  assert.doesNotMatch(edge, /payload\.(path|userId)|publicUrl/)
})
