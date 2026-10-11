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
const evidence = 'review-evidence.local/dashboard-retention'
await mkdir(evidence, { recursive: true })
const pass = label => { checks.push(label); console.log('PASS ' + label) }


try {
  await page.goto(url)
  await page.getByRole('heading', {name:'Auto Warranty Garrett'}).waitFor()
  assert.equal(await page.locator('.dash-retention').count(), 0)
  pass('ordinary reader has no retention controls')
  await page.goto(url + '?mode=manual')
  await page.locator('.dash-retention > summary').click()
  assert.equal(await page.getByRole('region', { name:'Retention simulation results' }).count(), 0)
  await page.getByLabel('Simulation reference date').fill('2026-10-10')
  await page.getByRole('button', {name:'Preview retention',exact:true}).click()
  await page.getByRole('region', {name:'Retention simulation results'}).waitFor()
  assert.equal(await page.locator('.dash-retention tbody tr').count(), 100)
  assert.match(await page.locator('.dash-retention-totals').textContent(), /Cleanup candidates3/)
  assert.equal(await page.getByRole('button', {name:/^(Delete|Activate|Clean now)/i}).count(), 0)
  pass('simulation shows candidates and safety protections without an execute control')
  await page.getByRole('button', {name:'More decisions'}).click()
  await page.getByText('101–103 of 103', {exact:true}).waitFor()
  assert.equal(await page.locator('.dash-retention tbody tr').count(), 3)
  await page.getByRole('button', {name:'Previous decisions'}).click()
  await page.getByText('1–100 of 103', {exact:true}).waitFor()
  pass('bounded pagination preserves the full-scope counts')
  for (const [width,height] of [[1440,1000],[390,844]]) {
    await page.setViewportSize({width,height})
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.locator('.dash-retention > summary').scrollIntoViewIfNeeded()
    await page.screenshot({path:evidence+'/retention-'+width+'.png'})
    pass('retention controls and scrollable decisions fit '+width)
  }
  await page.getByLabel('Test state').selectOption('failure')
  await page.getByRole('button', {name:'Preview retention',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'could not be verified'}).waitFor()
  assert.equal(await page.getByRole('region', {name:'Retention simulation results'}).count(), 0)
  pass('failed read clears potentially misleading prior decisions')
  await page.getByLabel('Test state').selectOption('slow')
  await page.getByRole('button', {name:'Preview retention',exact:true}).click()
  await page.getByLabel('Simulation reference date').fill('2026-10-11')
  await page.waitForTimeout(700)
  assert.equal(await page.getByRole('region', {name:'Retention simulation results'}).count(), 0)
  pass('changing simulation date rejects obsolete asynchronous results')
  await page.getByLabel('Test state').selectOption('populated')
  await page.getByRole('button', {name:'Preview retention',exact:true}).click()
  await page.getByRole('region', {name:'Retention simulation results'}).waitFor()
  assert.match(await page.getByRole('region', {name:'Retention simulation results'}).textContent(), /Reference: 2026-10-11/)
  await page.getByLabel('Test state').selectOption('denied')
  await page.getByRole('button', {name:'Preview retention',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'cannot preview retention'}).waitFor()
  assert.equal(await page.getByRole('region', {name:'Retention simulation results'}).count(), 0)
  pass('revoked access does not retain the previous plan')
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, [])
  console.log(JSON.stringify({checks:checks.length,browserErrors:errors.length,externalRequests:unexpected.length,evidence}))
} finally { await context.close(); await browser.close(); await server.close() }
