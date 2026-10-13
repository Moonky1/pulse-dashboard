import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { allTeamsCsv, allTeamsScope } from './all-teams-fixtures.mjs'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
import { testReport } from './ui-fixtures.mjs'
import { LEGACY_ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'

// A synthetic server-side store survives browser reloads and new tabs.
// This tests the UI contract; no live user or remote write.
const reports = new Map(), identities = new Set(), reads = [], writes = []
const earlierScope = { ...allTeamsScope, id: LEGACY_ALL_TEAMS_SCOPE_ID, user_groups: allTeamsScope.user_groups.filter(g => g !== 'ADMIN') }
const earlierReport = { ...testReport('2026-10-08'), scope: earlierScope }
const historyReads = []
const origin = 'http://127.0.0.1:53959'
const server = await createServer({ configFile: false, publicDir: false, plugins: [react(), {
  name: 'local-cloud-review', configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
    if (!['/__cloud-review', '/__cloud-review-upload'].includes(req.url)) return next()
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk)
      const bytes = Buffer.concat(chunks); assert.ok(bytes.length < 11 * 1024 * 1024)
      let data
      if (req.url === '/__cloud-review') {
        const { name, args } = JSON.parse(bytes)
        if (name === 'list_vici_dashboard_scopes') data = [earlierScope, allTeamsScope]
        else if (name === 'get_vici_dashboard') {
          assert.ok([allTeamsScope.id, earlierScope.id].includes(args.requested_scope)); reads.push(args.report_date)
          data = (args.requested_scope === earlierScope.id ? args.report_date === '2026-10-08' ? earlierReport : null : reports.get(args.report_date)) || { ...testReport(args.report_date), scope: { id: args.requested_scope }, snapshot: null, performance: [], pause: [] }
        } else if (name === 'list_vici_report_history') { historyReads.push(args); data = [] }
        else if (name === 'get_vici_alert_rules') data = null
        else throw Error('Unexpected local RPC')
      } else {
        const form = await new Response(bytes, { headers: { 'Content-Type': req.headers['content-type'] } }).formData()
        const date = form.get('reportDate'); assert.equal(form.get('scopeId'), allTeamsScope.id)
        const prepared = inspectManualReports({ performanceText: await form.get('performance')?.text(), pauseText: await form.get('pause')?.text(), reportDate: date, userGroups: allTeamsScope.user_groups })
        const identity = JSON.stringify([date, prepared.pair.performance?.source_generated_at, prepared.pair.pause?.source_generated_at])
        const duplicate = identities.has(identity); identities.add(identity); writes.push({ date, duplicate })
        const prior = reports.get(date), report = prior ? structuredClone(prior) : testReport(date)
        report.scope = allTeamsScope
        report.performance = prepared.pair.performance?.rows || prior?.performance || []
        report.pause = prepared.pair.pause?.rows || prior?.pause || []
        report.snapshot.ingestion_method = 'manual'
        report.snapshot.performance_generated_at = prepared.pair.performance?.source_generated_at || prior?.snapshot.performance_generated_at || null
        report.snapshot.pause_generated_at = prepared.pair.pause?.source_generated_at || prior?.snapshot.pause_generated_at || null
        reports.set(date, report)
        // Exercise the real adapter's fallback when the save commits but its
        // follow-up read fails. Refresh must retrieve the saved date, not Today.
        data = { status: duplicate ? 'duplicate' : 'success', report_date: date, agents: (prepared.pair.performance || prepared.pair.pause).rows.length, report: null }
      }
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ data }))
    } catch { res.statusCode = 500; res.end('{"error":{"code":"local_review_failure"}}') }
  }) },
} ], server: { host: '127.0.0.1', port: 53959, strictPort: true } })
await server.listen()
const { chromium } = createRequire('C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
const page = await context.newPage(), errors = []
page.on('pageerror', e => errors.push(e.message))
const url = origin + '/scripts/dashboard-certification/review.html?mode=cloud-reload'
const dateInput = () => page.getByLabel('Report date', { exact: true })
const agents = () => page.locator('.dash-metric').first().locator('strong')
async function upload(duplicate = false) {
  if (!await page.locator('.dash-upload').evaluate(e => e.open)) await page.locator('.dash-upload > summary').click()
  await page.getByLabel('Call Stats Breakdown', { exact: true }).setInputFiles({ name: 'all-teams.csv', mimeType: 'text/csv', buffer: Buffer.from(allTeamsCsv()) })
  await page.getByRole('button', { name: 'Upload reports', exact: true }).click()
  await page.getByRole('status').filter({ hasText: duplicate ? 'Already saved in cloud' : 'agents to cloud' }).waitFor()
  await page.waitForFunction(() => document.querySelector('.dash-metric strong')?.textContent === '22')
  assert.equal(await dateInput().inputValue(), '2026-10-09')
  assert.equal(new URL(page.url()).searchParams.get('scope'), allTeamsScope.id)
}
try {
  await page.goto(url); await dateInput().fill('2026-10-12')
  await page.getByRole('heading', { name: 'No report for this date' }).waitFor()
  await upload(); assert.equal(reports.size, 1)
  await page.reload(); await page.getByText('Manual upload', { exact: true }).waitFor()
  assert.equal(await dateInput().inputValue(), '2026-10-09'); assert.equal(await agents().textContent(), '22')
  await upload(true); assert.equal(reports.size, 1); assert.equal(writes.at(-1).duplicate, true)
  await dateInput().fill('2026-10-12'); await page.getByRole('heading', { name: 'No report for this date' }).waitFor()
  await dateInput().fill('2026-10-09'); await page.getByText('Manual upload', { exact: true }).waitFor()
  const savedUrl = page.url(), peer = await context.newPage()
  await peer.goto(savedUrl); await peer.getByText('Manual upload', { exact: true }).waitFor()
  assert.equal(await peer.getByLabel('Report date', { exact: true }).inputValue(), '2026-10-09')
  assert.equal(await peer.locator('.dash-metric').first().locator('strong').textContent(), '22'); await peer.close()
  const before = reads.length; await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('.dash-controls > button.dash-refresh')?.disabled)
  assert.equal(reads.length, before + 1); assert.equal(reads.at(-1), '2026-10-09')
  await page.goto(url + '&date=2026-10-08&scope=' + earlierScope.id)
  await page.waitForFunction(() => document.querySelector('.dash-metric strong')?.textContent === '40')
  assert.equal(await dateInput().inputValue(), '2026-10-08')
  const historyResponse = page.waitForResponse(response => response.url().endsWith('/__cloud-review') && response.request().postData()?.includes('list_vici_report_history'))
  await page.locator('.dash-history > summary').click(); await historyResponse
  assert.equal(historyReads.at(-1).requested_scope, earlierScope.id)
  await page.reload(); await page.waitForFunction(() => document.querySelector('.dash-metric strong')?.textContent === '40')
  await upload(true); assert.equal(reports.size, 1)
  await mkdir('review-evidence.local/dashboard-cloud', { recursive: true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: 'review-evidence.local/dashboard-cloud/reload-' + width + '.png' })
  }
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'passed', syntheticServerStore: true, reload: true, newTab: true, duplicate: true, saveReadRecovery: true, dateSwitch: true, storedReports: reports.size, remoteWrites: 0 }))
} finally { await context.close(); await browser.close(); await server.close() }
