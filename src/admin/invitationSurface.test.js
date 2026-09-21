import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('./pages/AdminInvitationsPage.jsx', import.meta.url)
const dialogUrl = new URL('./components/StaffInvitationDialog.jsx', import.meta.url)
const apiUrl = new URL('./api/adminApi.js', import.meta.url)
const edgeUrl = new URL('../../supabase/functions/pulse-staff-invitations/index.ts', import.meta.url)
const providerUrl = new URL('../auth/AuthProvider.jsx', import.meta.url)
const templateUrl = new URL('../../supabase/templates/invite.html', import.meta.url)
const supabaseConfigUrl = new URL('../../supabase/config.toml', import.meta.url)

test('Admin invitation surface uses protected contracts and guarded send, resend, revoke actions', async () => {
  const [page, dialog, api] = await Promise.all([readFile(pageUrl, 'utf8'), readFile(dialogUrl, 'utf8'), readFile(apiUrl, 'utf8')])
  assert.match(page, /Staff invitations/)
  assert.match(page, /Invite Staff/)
  assert.match(page, /resendStaffInvitation/)
  assert.match(page, /revokeStaffInvitation/)
  assert.match(dialog, /valid for 72 hours/)
  assert.match(dialog, /Personal details/)
  assert.match(dialog, /Work details/)
  assert.match(dialog, /Pulse access/)
  assert.match(page, /Invitation prepared\. Delivery is pending\./)
  assert.match(dialog, /addEventListener\('cancel'/)
  assert.doesNotMatch(`${page}\n${dialog}\n${api}`, /\.from\(['"]staff_invitations['"]\)/)
})

test('Staff invitation email has a branded, truthful and portable HTML template', async () => {
  const [template, config] = await Promise.all([readFile(templateUrl, 'utf8'), readFile(supabaseConfigUrl, 'utf8')])
  assert.match(template, /You’re invited to Pulse/)
  assert.match(template, /\.Data\.full_name/)
  assert.match(template, /Your place in Pulse is ready/)
  assert.match(template, /Accept your invitation/)
  assert.match(template, /expires in 72 hours/)
  assert.match(template, /Pulse · Kampaign Kings/)
  assert.match(template, /\{\{ \.ConfirmationURL \}\}/)
  assert.doesNotMatch(template, /script|service_role|access token/i)
  assert.match(config, /\[auth\.email\.template\.invite\]/)
  assert.match(config, /subject = "Your Pulse invitation is ready"/)
  assert.match(config, /content_path = "\.\/supabase\/templates\/invite\.html"/)
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
