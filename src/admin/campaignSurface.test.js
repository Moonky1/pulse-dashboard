import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const areaUrl = new URL('./AdminArea.jsx', import.meta.url)
const shellUrl = new URL('./components/AdminShell.jsx', import.meta.url)
const pageUrl = new URL('./pages/AdminCampaignsPage.jsx', import.meta.url)
const hookUrl = new URL('./hooks/useCampaignCatalog.js', import.meta.url)

test('Campaigns is lazy-routed, permission-gated, and present in protected navigation', async () => {
  const [area, shell] = await Promise.all([readFile(areaUrl, 'utf8'), readFile(shellUrl, 'utf8')])
  assert.match(area, /lazy\(.*AdminCampaignsPage/)
  assert.match(area, /path="campaigns"/)
  assert.match(area, /canViewCampaigns\(permissionKeys\)/)
  assert.match(shell, /campaignsAccess.*NavLink to="\/admin\/campaigns"/s)
})

test('Campaigns foundation is read-only and uses only its protected catalog hook', async () => {
  const [page, hook] = await Promise.all([readFile(pageUrl, 'utf8'), readFile(hookUrl, 'utf8')])
  assert.match(page, /Campaign authorization scopes and mutations are not enabled/)
  assert.match(page, /No campaigns/)
  assert.match(page, /No matching campaigns/)
  assert.match(page, /Refresh/)
  assert.match(hook, /listManagedCampaigns\(supabase\)/)
  assert.doesNotMatch(`${page}\n${hook}`, /\.from\(|insert\(|update\(|delete\(|createCampaign|updateCampaign|setCampaignActive/)
})
