import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('account menu uses protected routes and moves the photo control into Profile', async () => {
  const [header, routes, page] = await Promise.all([
    read('../components/ProductHeader.jsx'), read('../auth/AuthApp.jsx'), read('../auth/screens/AccountSettingsPage.jsx'),
  ])
  assert.doesNotMatch(header, /chevron|AvatarControls|Change photo/)
  assert.match(header, /adminAccess\.state === 'allowed'/)
  assert.match(header, /to="\/settings\/profile"/)
  assert.match(header, /to="\/settings"/)
  assert.match(page, /AvatarControls/)
  assert.match(page, /Visible to signed-in Staff/)
  for (const route of ['/settings', '/settings/profile', '/staff/:profileId']) assert.match(routes, new RegExp(`path="${route}" element={<RouteGate allow=\\{\\[AUTH_STATES.ACTIVE\\]\\}`))
})

test('profile migration keeps direct Staff writes closed and public projection opt-in', async () => {
  const migration = await read('../../supabase/migrations/20261002000200_profile3_staff_identity.sql')
  assert.match(migration, /where profile\.auth_user_id = auth\.uid\(\)\s+and profile\.status = 'active'/)
  assert.match(migration, /profile\.profile_visible_to_staff\s+and pulse_private\.current_user_is_active\(\)/)
  assert.match(migration, /revoke all on function public\.update_own_staff_profile/)
  assert.match(migration, /revoke all on function public\.get_staff_public_profile/)
  assert.doesNotMatch(migration, /grant update on (table )?public\.users to authenticated/i)
})
