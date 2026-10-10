import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

// Local component contract tests; no Auth fixture, network backend, or real user mutation.
const root = process.env.PULSE_PLAYWRIGHT_ROOT || 'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
const { chromium } = createRequire(root + '/package.json')('playwright')
const server = await createServer({ configFile: false, plugins: [react()], server: { host: '127.0.0.1', port: 53951, strictPort: true } })
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
const evidence = 'review-evidence.local/dashboard-ui'
await mkdir(evidence, { recursive: true })
const pass = label => { checks.push(label); console.log('PASS ' + label) }
async function mode(value) { await page.getByLabel('Test state').selectOption(value); await page.getByRole('button', { name: 'Refresh', exact: true }).click() }
async function loaded() { await page.getByRole('button', { name: 'Refresh', exact: true }).waitFor({ state: 'visible' }); await page.waitForFunction(() => !document.querySelector('.dash-refresh')?.disabled) }
try {
  await page.clock.install()
  await page.goto(url)
  await loaded()
  assert.equal(await page.getByRole('button', { name: 'Today', exact: true }).isDisabled(), true)
  assert.equal(await page.locator('.dash-metric').nth(0).locator('strong').textContent(), '40')
  pass('real component renders 40 explicitly synthetic agents; unknown timezone disables Today')
  for (const [width, height] of [[1440, 1000], [1180, 820], [820, 1180], [390, 844]]) {
    await page.setViewportSize({ width, height })
    await page.getByRole('button', { name: 'Overview', exact: true }).click()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.screenshot({ path: `${evidence}/overview-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: /^Agents/ }).click()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    const visible = width < 600 ? '.dash-mobile-agents .dash-agent' : '.dash-table .dash-agent'
    await page.locator(visible).first().click()
    await page.getByRole('dialog').waitFor()
    assert.equal(await page.getByRole('dialog').evaluate(d => d.scrollWidth <= d.clientWidth), true)
    await page.screenshot({ path: `${evidence}/detail-${width}.png`, fullPage: false })
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    await page.getByRole('button', { name: 'Time & Pause', exact: true }).click()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    pass(`${width}x${height}: overview, agents, native detail dialog, pause view fit; Escape closes`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: /^Agents/ }).click()
  assert.equal(await page.locator('.dash-table tbody tr').count(), 25)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  assert.equal(await page.locator('.dash-table tbody tr').count(), 15)
  await page.getByLabel('Search agents').fill('01000')
  assert.equal(await page.locator('.dash-table tbody tr').count(), 1)
  await page.locator('.dash-table .dash-agent').click()
  assert.equal(await page.getByRole('link', { name: 'Open Pulse Agent profile ↗' }).getAttribute('href'), '/profile/01000')
  await page.getByRole('button', { name: 'Close agent detail' }).click()
  await page.getByLabel('Search agents').fill('nothing-matches')
  await page.getByRole('heading', { name: 'No agents match these filters' }).waitFor()
  await page.getByLabel('Search agents').fill('')
  await page.getByLabel('VICIdial user group').selectOption('ReviewGroupA')
  assert.equal(await page.locator('.dash-table tbody tr').count(), 20)
  await page.getByRole('columnheader', { name: /^Calls/ }).getByRole('button').click()
  assert.match(await page.locator('.dash-table tbody tr').first().innerText(), /Sample Agent 01/)
  pass('pagination, leading-zero ID search, linked profile, no-match, group filter and numeric sorting')
  await mode('failure'); await loaded()
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('.dash-table tbody tr').count(), 20)
  pass('failed refresh preserves the existing scoped snapshot')
  await mode('denied'); await loaded()
  await page.getByRole('heading', { name: 'This report is restricted' }).waitFor()
  assert.equal(await page.locator('.dash-agent').count(), 0)
  pass('permission revocation clears observations and stops exposing agent details')
  await mode('populated'); await loaded()
  await page.getByRole('button', { name: /^Agents/ }).click()
  await page.getByLabel('Report date', { exact: true }).fill('2026-10-01')
  await loaded()
  await page.getByRole('heading', { name: 'No snapshot for this date yet' }).waitFor()
  assert.equal(await page.locator('.dash-metric').nth(0).locator('strong').textContent(), '—')
  pass('date change clears prior observations and missing data is never zero')
  await page.getByLabel('Report date', { exact: true }).fill('2026-10-09'); await loaded()
  await page.getByLabel('Reporting scope').selectOption('10000000-0000-4000-8000-000000000002'); await loaded()
  await page.getByRole('button', { name: /^Agents/ }).click()
  assert.match(await page.locator('.dash-table tbody tr').first().innerText(), /Other scope/)
  pass('scope switching does not retain a previous scope report')
  await page.getByRole('button', { name: 'Check requests' }).click()
  const before = Number(await page.locator('[data-request-count]').textContent())
  await page.clock.fastForward(61000); await loaded()
  await page.getByRole('button', { name: 'Check requests' }).click()
  assert.equal(Number(await page.locator('[data-request-count]').textContent()), before + 1)
  pass('60-second refresh performs one protected report read, no Vici calls')
  await page.goto(url + '?mode=empty'); await loaded()
  await page.getByRole('heading', { name: 'No snapshot for this date yet' }).waitFor()
  await page.getByText('Connection issue', { exact: true }).waitFor()
  await page.screenshot({ path: `${evidence}/empty-state.png`, fullPage: true })
  await page.goto(url + '?mode=no-scopes'); await loaded()
  await page.getByText('No reporting scopes available', { exact: true }).waitFor()
  pass('initial connection failure and absent authorized scope are explicit empty states')
  assert.deepEqual(unexpected, []); assert.deepEqual(errors, [])
  console.log(JSON.stringify({ checks: checks.length, externalRequests: unexpected.length, pageErrors: errors.length, result: 'passed' }))
} catch (error) {
  await page.screenshot({ path: `${evidence}/failure.png`, fullPage: true })
  console.error(error.message)
  console.error((await page.locator('body').innerText()).slice(-1500))
  process.exitCode = 1
} finally { await browser.close(); await server.close() }
