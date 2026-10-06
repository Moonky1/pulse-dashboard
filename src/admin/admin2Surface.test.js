import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { canRemoveInvitation, filterCurrentInvitations } from './invitationActions.js'
import { teamVisual, teamBadgeStyle } from './visualIdentity.js'

const read = path => readFile(new URL(path, import.meta.url), 'utf8')
test('invitation cleanup is deliberately limited to obsolete unaccepted states', () => {
  for (const status of ['revoked', 'expired', 'failed']) assert.equal(canRemoveInvitation({ status }), true)
  for (const status of ['accepted', 'sent', 'pending_send']) assert.equal(canRemoveInvitation({ status }), false)
  const items = ['sent', 'pending_send', 'expired', 'revoked', 'accepted'].map(status => ({ status, fullName: status, email: 'fixture@example.test' }))
  assert.equal(filterCurrentInvitations(items, 'current').length, 2)
  assert.equal(filterCurrentInvitations(items, '').length, 5)
  assert.equal(filterCurrentInvitations(items, 'current', 'pending').length, 1)
})
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}
test('canonical Garrett gradients are distinct and maintain WCAG text contrast at every stop', () => {
  const gradients = new Set()
  for (const code of ['asia_team_a', 'asia_team_b', 'philippines', 'colombia', 'nicaragua', 'mexico_team_group_a', 'mexico_team_group_b', 'venezuela', 'central_america']) {
    const visual = teamVisual({ code, campaignCode: 'auto_warranty_garrett' })
    gradients.add(visual.gradient)
    for (const stop of visual.stops) assert.ok((luminance(visual.text) + .05) / (luminance(stop) + .05) >= 4.5, code)
    assert.equal(teamBadgeStyle({ code, campaignCode: 'auto_warranty_garrett' }).background, visual.gradient)
  }
  assert.equal(gradients.size, 9)
})
test('profile access is compact and activity is last, initially collapsed and lazily queried', async () => {
  const [profile, activity, permissions] = await Promise.all([read('./pages/AdminUserDetailPage.jsx'), read('./components/UserAuditHistory.jsx'), read('./components/RolePermissions.jsx')])
  assert.match(profile, /admin-access-card/)
  assert.match(profile, /RoleAdministration[\s\S]*?compact/)
  assert.ok(profile.lastIndexOf('<UserAuditHistory') > profile.lastIndexOf('<RemoveStaffAction'))
  assert.match(activity, /useState\(false\)/)
  assert.match(activity, /enabled: open/)
  assert.match(activity, /<svg/)
  assert.doesNotMatch(profile, /label="Operating unit"/i)
  assert.match(permissions, /permission\.description/)
})
test('removal is not a browser table deletion and retry uses the same durable request', async () => {
  const [api, dialog, sql] = await Promise.all([read('./api/admin2Api.js'), read('./components/RemoveStaffAction.jsx'), read('../../supabase/migrations/20261005000100_admin2_people_removal.sql')])
  assert.match(api, /functions\.invoke\('pulse-staff-removal'/)
  assert.doesNotMatch(api, /\.delete\(|service_role/)
  assert.match(dialog, /confirmation !== 'REMOVE'/)
  assert.match(dialog, /requestKey\.current/)
  assert.match(dialog, /Retry cleanup/)
  assert.match(sql, /pg_constraint/)
  assert.match(sql, /delete from auth\.sessions/)
  assert.match(sql, /Self-removal denied/)
  assert.match(sql, /Last active Super Admin/)
})
test('Agent directory uses bounded Staff RPC reads and never renders credential data', async () => {
  const directory = await read('./components/AgentsDirectory.jsx')
  assert.match(directory, /listAdminAgents/)
  assert.match(directory, /\/profile\/\$\{agent\.agent_code\}/)
  assert.match(directory, /30000/)
  assert.doesNotMatch(directory, /pin_hash|session_token|activation_code|agent\.id/)
})
