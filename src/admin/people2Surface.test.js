import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const files = (names) => Promise.all(names.map((name) => readFile(new URL(name, import.meta.url), 'utf8')))

test('Team Profile is protected, relational, and links back to authoritative Staff profiles', async () => {
  const [area, page, teamBadge] = await files(['./AdminArea.jsx', './pages/AdminTeamProfilePage.jsx', './components/TeamBadge.jsx'])
  assert.match(area, /path="teams\/:teamId".*UsersRoute/s)
  assert.match(page, /useManagedUsers/)
  assert.match(page, /useBusinessCatalog/)
  assert.match(page, /Leadership/)
  assert.match(page, /Staff/)
  assert.match(page, /\/admin\/users\//)
  assert.match(page, /No recent Team activity/)
  assert.match(teamBadge, /\/admin\/teams\//)
  assert.doesNotMatch(`${page}\n${teamBadge}`, /\.from\(|raw_user_meta_data|service_role/)
})

test('Staff work and Pulse access use separate protected controls', async () => {
  const [profile, work, access, api] = await files([
    './pages/AdminUserDetailPage.jsx',
    './components/WorkDetailsAdministration.jsx',
    './components/RoleAdministration.jsx',
    './api/adminApi.js',
  ])
  assert.match(profile, /WorkDetailsAdministration/)
  assert.match(profile, /RoleAdministration/)
  assert.match(work, /updateManagedUserWorkDetails/)
  assert.match(work, /Position and operational placement are separate from Pulse access/)
  assert.match(access, /replaceManagedUserRole/)
  assert.match(api, /rpc\('update_staff_work_details'/)
  assert.match(api, /rpc\('replace_user_role'/)
  assert.doesNotMatch(`${work}\n${access}`, /\.from\(/)
})

test('normal organization surfaces hide technical codes and reuse semantic badges', async () => {
  const [organization, campaigns, positions, assignments, styles] = await files([
    './pages/AdminOrganizationPage.jsx',
    './pages/AdminCampaignsPage.jsx',
    './pages/AdminPositionsPage.jsx',
    './components/OperationalAssignments.jsx',
    './styles/admin.css',
  ])
  assert.match(organization, /TeamBadge/)
  assert.match(campaigns, /TeamBadge/)
  assert.doesNotMatch(`${organization}\n${campaigns}\n${positions}\n${assignments}`, /Technical code|Database code|scope_type/)
  assert.match(styles, /admin-team-badge--teal/)
  assert.match(styles, /admin-role-badge--iridescent/)
})
