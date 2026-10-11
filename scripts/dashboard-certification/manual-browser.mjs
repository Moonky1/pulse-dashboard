import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { fixture } from './parserFixtures.mjs'

// Local component contract tests; no Auth fixture, network backend, or real user mutation.
const root = process.env.PULSE_PLAYWRIGHT_ROOT || 'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
const { chromium } = createRequire(root + '/package.json')('playwright')
const server = await createServer({ configFile: false, publicDir: false, plugins: [react()], server: { host: '127.0.0.1', port: 53951, strictPort: true } })
await server.listen()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' })
const page = await context.newPage(), errors = [], unexpected = [], checks = []
page.on('pageerror', e => errors.push(e.message))
await context.route('**/*', route => {
  if (new URL(route.request().url()).origin !== 'http://127.0.0.1:53951') { unexpected.push(new URL(route.request().url()).origin); return route.abort() }
  return route.continue()
})
const url = 'http://127.0.0.1:53951/scripts/dashboard-certification/review.html'
const evidence = 'review-evidence.local/dashboard-manual'
await mkdir(evidence, { recursive: true })
const pass = label => { checks.push(label); console.log('PASS ' + label) }

try {
  await page.goto(url + '?mode=manual')
  await page.getByLabel('Report date', { exact: true }).fill('2026-10-09')
  await page.locator('.dash-upload > summary').click()
  const inputs = page.locator('.dash-upload input[type=file]')
  await inputs.nth(0).setInputFiles({ name: 'performance.csv', mimeType: 'text/csv', buffer: Buffer.from(fixture('performance')) })
  await inputs.nth(1).setInputFiles({ name: 'pause.csv', mimeType: 'text/csv', buffer: Buffer.from(fixture('pause').replace('"TOTALS', '"invalid')) })
  await page.locator('.dash-upload input[type=checkbox]').check()
  await page.getByRole('button', { name: 'Upload reports' }).click()
  await page.getByRole('alert').filter({ hasText: 'format could not be verified' }).waitFor()
  assert.equal(await page.locator('.dash-metric').first().locator('strong').textContent(), '40')
  pass('invalid upload preserves current report and displays safe error')
  await inputs.nth(1).setInputFiles({ name: 'pause.csv', mimeType: 'text/csv', buffer: Buffer.from(fixture('pause')) })
  await page.getByRole('button', { name: 'Upload reports' }).click()
  await page.getByRole('status').filter({ hasText: 'Saved 40 agents' }).waitFor()
  await page.getByText('Manual upload', { exact: true }).waitFor()
  assert.equal(await inputs.nth(0).inputValue(), '')
  assert.equal(await page.locator('.dash-upload input[type=checkbox]').isChecked(), false)
  pass('successful upload refreshes manual provenance and clears file selections')
  await page.locator('.dash-history > summary').click()
  await page.locator('.dash-history-scroll tbody tr').first().waitFor()
  assert.equal(await page.locator('.dash-history-scroll tbody tr').count(), 2)
  await page.getByLabel('Baseline version').selectOption('20000000-0000-4000-8000-000000000001')
  await page.getByLabel('Comparison version').selectOption('20000000-0000-4000-8000-000000000002')
  await page.getByRole('button', { name: 'Compare versions', exact: true }).click()
  await page.getByRole('heading', { name: 'Differences between versions' }).waitFor()
  await page.getByLabel('Search comparison').fill('01000')
  assert.equal(await page.locator('.dash-delta-agent').count(), 1)
  assert.match(await page.locator('.dash-delta-agent summary').textContent(), /Calls \+5/)
  await page.locator('.dash-delta-agent summary').click()
  pass('history retains both generations; per-agent comparison subtracts cumulative totals')
  for (const [width, height] of [[1440,1000],[390,844]]) {
    await page.setViewportSize({ width,height })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.locator('.dash-comparison').scrollIntoViewIfNeeded()
    await page.screenshot({ path: evidence + '/comparison-' + width + '.png' })
    await page.locator('.dash-upload').scrollIntoViewIfNeeded()
    await page.screenshot({ path: evidence + '/upload-' + width + '.png' })
    pass('manual workflow fits viewport ' + width)
  }
  await page.setViewportSize({ width:1440,height:1000 })
  await page.getByRole('button', { name: 'Open version', exact:true }).last().click()
  await page.locator('.dash-history-selected').waitFor()
  assert.match(await page.locator('.dash-history-selected > h2').textContent(), /10:00:00/)
  await page.locator('.dash-history-selected').getByRole('button', { name:/^Agents/ }).click()
  await page.locator('.dash-history-selected .dash-agent').first().click()
  await page.getByRole('dialog').getByText('Pause avg', {exact:true}).waitFor()
  await page.keyboard.press('Escape')
  pass('older full report and all source averages remain readable')
  for (const first of ['performance', 'pause']) {
    await page.goto(url + '?mode=staff-upload')
    await page.getByLabel('Report date', { exact: true }).fill('2026-10-11')
    await page.getByRole('heading', { name: 'No report for this date' }).waitFor()
    await page.getByRole('button', { name: 'Check requests' }).click()
    const initialReads = await page.locator('[data-request-count]').textContent()
    assert.equal(await page.locator('.dash-retention').count(), 0)
    assert.equal(await page.getByText('Admin / Super Admin', { exact: true }).count(), 0)
    for (const type of [first, first === 'performance' ? 'pause' : 'performance']) {
      const upload = page.locator('.dash-upload')
      if (!(await upload.evaluate(el => el.open))) await upload.locator(':scope > summary').click()
      await upload.locator('input[type=file]').nth(type === 'performance' ? 0 : 1).setInputFiles({ name: type + '.csv', mimeType: 'text/csv', buffer: Buffer.from(fixture(type)) })
      await upload.locator('input[type=checkbox]').check()
      const start = performance.now()
      await page.getByRole('button', { name: 'Upload reports', exact: true }).click()
      await page.getByText('Manual upload', { exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('.dash-upload input[type=file]').value === '')
      assert.equal(await page.getByLabel('Report date', { exact: true }).inputValue(), '2026-10-09')
      const elapsed = performance.now() - start
      assert.ok(elapsed < 2000, 'local upload/render target: ' + elapsed)
      console.log(JSON.stringify({ localUploadRenderMs: Math.round(elapsed), first, type, syntheticBackend: true }))
      if (type === first && first === 'pause') {
        assert.equal(await page.locator('.dash-metric').nth(1).locator('strong').textContent(), '—')
        assert.equal(await page.getByRole('button', { name: 'Time & Pause', exact: true }).getAttribute('aria-pressed'), 'true')
      } else {
        assert.equal(await page.locator('.dash-metric').nth(1).locator('strong').textContent(), '28')
      }
    }
    await page.getByRole('button', { name: 'Check requests' }).click()
    assert.equal(await page.locator('[data-request-count]').textContent(), initialReads, 'inline upload response needs no extra browser report read')
    await page.getByRole('button', { name: 'Time & Pause', exact: true }).click()
    assert.equal(await page.locator('.dash-table tbody tr').count(), 2)
    await page.locator('.dash-breakdown-disclosure > summary').click()
    await page.getByRole('heading', { name: 'Full breakdown' }).waitFor()
    await page.screenshot({ path: evidence + '/independent-' + first + '.png', fullPage: true })
    pass(first + ' first: independent upload, inferred date, preserved other side, non-admin Staff, no invented zero or extra report read')
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(unexpected, [])
  console.log(JSON.stringify({checks:checks.length, browserErrors:errors.length, externalRequests:unexpected.length,evidence}))
} finally { await context.close(); await browser.close(); await server.close() }
