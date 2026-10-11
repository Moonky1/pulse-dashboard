import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const root = process.env.PULSE_PLAYWRIGHT_ROOT || 'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
const { chromium } = createRequire(root + '/package.json')('playwright')
const server = await createServer({ configFile: false, plugins: [react()], server: { host: '127.0.0.1', port: 53956, strictPort: true } })
await server.listen()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' })
const page = await context.newPage(), errors = [], unexpected = []
page.on('pageerror', error => errors.push(error.message))
await context.route('**/*', route => {
  if (new URL(route.request().url()).origin !== 'http://127.0.0.1:53956') { unexpected.push(route.request().url()); return route.abort() }
  return route.continue()
})
const loaded = async () => { await page.getByRole('button', { name: 'Refresh', exact: true }).waitFor(); await page.waitForFunction(() => !document.querySelector('.dash-refresh')?.disabled) }
const teams = page.getByRole('region', { name: 'Agents by team' })
try {
  await page.goto('http://127.0.0.1:53956/scripts/dashboard-certification/review.html?mode=asia-teams'); await loaded()
  await page.getByLabel('Report date', { exact: true }).fill('2026-10-09'); await loaded()
  assert.match(await teams.innerText(), /Asia A\s+30 agents\s+OpenersAsia/)
  assert.equal(await teams.getByRole('button').count(), 1)
  await teams.getByRole('button').click()
  assert.equal(await page.getByLabel('VICIdial user group').inputValue(), 'OpenersAsia')
  await page.getByLabel('Reporting scope').selectOption('2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285'); await loaded()
  assert.match(await teams.innerText(), /Asia B\s+17 agents\s+OpenersAsia1/)
  assert.doesNotMatch(await teams.innerText(), /Asia A|34 agents/)
  await page.getByRole('button', { name: 'Agents', exact: false }).filter({ hasText: /^Agents17$/ }).click()
  assert.match(await page.locator('.dash-table tbody tr').first().innerText(), /Asia B\s+OpenersAsia1/)
  await page.getByRole('button', { name: 'Rankings & goals', exact: true }).click()
  await page.getByText('17 assigned · 0 without a confirmed goal', { exact: true }).waitFor()
  await page.getByLabel('Report date', { exact: true }).fill('2026-10-08'); await loaded()
  assert.match(await teams.innerText(), /Asia B\s+17 agents/)
  assert.equal(await page.locator('.dash-metric').first().locator('strong').innerText(), '17')
  assert.equal(await page.locator('.dash-metric').nth(1).locator('strong').innerText(), '—')
  assert.equal(await page.getByRole('button', { name: 'Time & Pause', exact: true }).getAttribute('aria-pressed'), 'true')
  await mkdir('review-evidence.local/dashboard-asia', { recursive: true })
  for (const [width, height] of [[1440, 1100], [390, 844]]) {
    await page.setViewportSize({ width, height })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: `review-evidence.local/dashboard-asia/asia-b-${width}.png` })
  }
  await page.getByLabel('Report date', { exact: true }).fill('2026-10-01'); await loaded()
  assert.equal(await teams.count(), 0)
  await page.getByText('No report for this date', { exact: true }).waitFor()
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, [])
  console.log(JSON.stringify({ checks: 8, result: 'passed', browserErrors: 0, externalRequests: 0 }))
} finally { await context.close(); await browser.close(); await server.close() }
