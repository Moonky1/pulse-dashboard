import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const areaUrl = new URL('./AdminArea.jsx', import.meta.url)
const shellUrl = new URL('./components/AdminShell.jsx', import.meta.url)
const pageUrl = new URL('./pages/AdminCampaignsPage.jsx', import.meta.url)
const hookUrl = new URL('./hooks/useCampaignCatalog.js', import.meta.url)
const roleDialogUrl = new URL('./components/RoleActionDialog.jsx', import.meta.url)
const pendingDialogUrl = new URL('./components/PendingApprovalDialog.jsx', import.meta.url)
const roleActionsUrl = new URL('./roleActions.js', import.meta.url)
const pendingActionsUrl = new URL('./pendingActions.js', import.meta.url)

test('Campaigns is lazy-routed, permission-gated, and present in protected navigation', async () => {
  const [area, shell] = await Promise.all([readFile(areaUrl, 'utf8'), readFile(shellUrl, 'utf8')])
  assert.match(area, /lazy\(.*AdminCampaignsPage/)
  assert.match(area, /path="campaigns"/)
  assert.match(area, /canViewCampaigns\(permissionKeys\)/)
  assert.match(shell, /campaignsAccess.*NavLink to="\/admin\/campaigns"/s)
})

test('Campaigns foundation is read-only and uses only its protected catalog hook', async () => {
  const [page, hook] = await Promise.all([readFile(pageUrl, 'utf8'), readFile(hookUrl, 'utf8')])
  assert.match(page, /Campaign administration remains read-only/)
  assert.match(page, /No campaigns/)
  assert.match(page, /No matching campaigns/)
  assert.match(page, /Refresh/)
  assert.match(hook, /listManagedCampaigns\(supabase\)/)
  assert.doesNotMatch(`${page}\n${hook}`, /\.from\(|insert\(|update\(|delete\(|createCampaign|updateCampaign|setCampaignActive/)
})

test('Campaign authorization UI selects exact backend options and keeps employment separate', async () => {
  const [roleDialog, pendingDialog, roleActions, pendingActions] = await Promise.all([
    readFile(roleDialogUrl, 'utf8'),
    readFile(pendingDialogUrl, 'utf8'),
    readFile(roleActionsUrl, 'utf8'),
    readFile(pendingActionsUrl, 'utf8'),
  ])
  assert.match(roleActions, /Campaign ·/)
  assert.match(roleActions, /requestedCampaignId/)
  assert.match(roleActions, /campaignId.*roleOptionKey|roleOptionKey[\s\S]*campaignId/)
  assert.match(roleDialog, /Confirm role action/)
  assert.match(roleDialog, /roleScopeLabel/)
  assert.match(roleDialog, /organizationForRoleOption\(option\)\.label/)
  assert.doesNotMatch(roleDialog, /type=["']text["'].*campaign|campaign.*type=["']text["']/i)
  assert.match(pendingDialog, /Employment placement/)
  assert.match(pendingDialog, /Authorization scope/)
  assert.match(pendingDialog, /campaignName/)
  assert.match(pendingDialog, /addEventListener\('cancel'/)
  assert.match(pendingActions, /campaignId/)
})
