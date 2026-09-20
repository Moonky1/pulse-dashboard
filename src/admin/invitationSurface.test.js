import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('./pages/AdminInvitationsPage.jsx', import.meta.url)
const dialogUrl = new URL('./components/StaffInvitationDialog.jsx', import.meta.url)
const apiUrl = new URL('./api/adminApi.js', import.meta.url)
const edgeUrl = new URL('../../supabase/functions/pulse-staff-invitations/index.ts', import.meta.url)
const providerUrl = new URL('../auth/AuthProvider.jsx', import.meta.url)

test('Admin invitation surface uses protected contracts and guarded send, resend, revoke actions', async () => {
  const [page, dialog, api] = await Promise.all([readFile(pageUrl, 'utf8'), readFile(dialogUrl, 'utf8'), readFile(apiUrl, 'utf8')])
  assert.match(page, /Staff invitations/)
  assert.match(page, /Invite Staff/)
  assert.match(page, /resendStaffInvitation/)
  assert.match(page, /revokeStaffInvitation/)
  assert.match(dialog, /valid for 72 hours/)
  assert.match(dialog, /Employment/)
  assert.match(dialog, /Authorization/)
  assert.match(page, /Invitation prepared\. Delivery is pending\./)
  assert.match(dialog, /addEventListener\('cancel'/)
  assert.doesNotMatch(`${page}\n${dialog}\n${api}`, /\.from\(['"]staff_invitations['"]\)/)
})

test('trusted delivery stays in the Edge Function and is disabled by default', async () => {
  const [edge, provider] = await Promise.all([readFile(edgeUrl, 'utf8'), readFile(providerUrl, 'utf8')])
  assert.match(edge, /inviteUserByEmail/)
  assert.match(edge, /PULSE_INVITATION_DELIVERY_MODE/)
  assert.match(edge, /deliveryMode !== 'supabase'/)
  assert.match(edge, /SUPABASE_SECRET_KEY/)
  assert.match(edge, /origin_not_allowed/)
  assert.match(provider, /acceptOwnStaffInvitation/)
  assert.ok(provider.indexOf('acceptOwnStaffInvitation(client)') < provider.indexOf('createPendingProfile(client, pendingProfileName)'), 'invitation acceptance gets the first chance to create and activate atomically')
  assert.match(provider, /reissue_required/)
  assert.doesNotMatch(provider, /pulse-link-current-user/)
})
