import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { apiUrl, appUrl, localAnonKey, sql, startBrowserRuntime, startLocalApp } from '../studio-certification/local-runtime.mjs'

const browser = await startBrowserRuntime()
const server = await startLocalApp(localAnonKey())
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' })
const requests = [], unexpected = [], errors = [], passes = []
const pass = name => { passes.push(name); console.log('PASS ' + name) }

assert.equal(sql("select count(*) from auth.users where email<>'go1a.player@example.test'"), '0')
if (sql('select count(*) from auth.users') === '0') {
  sql(readFileSync(new URL('./fixtures.sql', import.meta.url), 'utf8'))
}
assert.equal(sql("select count(*) from auth.users where email='go1a.player@example.test'"), '1')
const password = randomBytes(24).toString('hex')
sql("update auth.users set encrypted_password=extensions.crypt('" + password + "',extensions.gen_salt('bf')) where email='go1a.player@example.test'")
context.on('page', page => {
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
})
await context.route('**/*', route => {
  const url = new URL(route.request().url())
  if (![appUrl, apiUrl].includes(url.origin)) { unexpected.push(url.origin + url.pathname); return route.abort('blockedbyclient') }
  requests.push({ method: route.request().method(), path: url.pathname })
  return route.continue()
})

const page = await context.newPage()
page.setDefaultTimeout(12000)
try {
  await page.goto(appUrl + '/signin')
  await page.getByLabel('Email address').fill('go1a.player@example.test')
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL('**/workspace')
  await page.getByRole('link', { name: 'Open Pulse GO' }).waitFor()
  pass('real local Staff sign-in and capability-driven Workspace entry')

  await page.getByRole('link', { name: 'Open Pulse GO' }).click()
  await page.getByRole('heading', { name: 'Train. Practice. Play.' }).waitFor()
  assert.equal(await page.getByRole('link', { name: 'Host a game' }).count(), 1)
  assert.equal(sql('select count(*) from public.training_attempts'), '0')
  assert.equal(await page.getByRole('button', { name: 'Join' }).isDisabled(), true)
  pass('GO landing exposes authorized Practice/Host and requires a complete room code to join')

  await page.getByRole('link', { name: 'Start Practice' }).click()
  await page.getByRole('heading', { name: 'Choose your challenge' }).waitFor()
  await page.getByRole('heading', { name: 'Pulse Practice: First Flight' }).waitFor()
  assert.equal(await page.getByLabel('Language').inputValue(), '')
  assert.equal(await page.getByLabel('Topic').locator('option').count(), 2)
  pass('protected content selection and server-derived filters')

  await page.getByRole('link', { name: 'Start', exact: true }).click()
  await page.getByRole('heading', { name: 'Which product are you practicing in?' }).waitFor()
  const firstAttempt = sql("select id from public.training_attempts where status='started'")
  assert.match(firstAttempt, /^[0-9a-f-]{36}$/)
  await page.reload()
  await page.getByRole('heading', { name: 'Which product are you practicing in?' }).waitFor()
  assert.equal(sql("select id from public.training_attempts where status='started'"), firstAttempt)
  assert.equal(sql('select count(*) from public.training_attempts'), '1')
  pass('hard reload safely resumes one active attempt without browser identity state')

  await page.getByRole('radio', { name: 'Pulse GO' }).check()
  await page.getByText('Answer saved.').waitFor()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('radio', { name: 'False' }).check()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByLabel('Your answer').fill('Pulse GO')
  await page.getByRole('button', { name: 'See result' }).click()
  await page.getByRole('heading', { name: '67%' }).waitFor()
  assert.equal(await page.getByText('2 of 3 correct').count(), 1)
  assert.equal(sql("select score_percent from public.training_results where attempt_id='" + firstAttempt + "'"), '66.67')
  assert.equal(sql("select count(*) from public.training_attempt_answers where attempt_id='" + firstAttempt + "'"), '3')
  pass('MC, true/false and text complete through server-owned 67% scoring')

  await page.getByRole('button', { name: 'Practice Again' }).click()
  await page.getByRole('heading', { name: 'Which product are you practicing in?' }).waitFor()
  assert.equal(sql('select count(*) from public.training_attempts'), '2')
  assert.equal(sql('select count(*) from public.training_results'), '1')
  assert.equal(sql("select attempt_number from public.training_attempts where status='started'"), '2')
  await page.reload()
  await page.getByRole('heading', { name: 'Which product are you practicing in?' }).waitFor()
  assert.equal(sql('select count(*) from public.training_attempts'), '2')
  pass('Practice Again starts attempt two, preserves history, and reload stays idempotent')

  for (const [name, width, height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]) {
    await page.setViewportSize({ width, height })
    await page.goto(appUrl + '/go')
    await page.getByRole('heading', { name: 'Train. Practice. Play.' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.goto(appUrl + '/go/practice')
    await page.getByRole('heading', { name: 'Choose your challenge' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.goto(appUrl + '/go/practice/' + sql('select id from public.training_content limit 1'))
    await page.getByRole('heading', { name: 'Which product are you practicing in?' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    pass(name + ' landing, selection, and player fit the viewport')
  }

  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement !== document.body), true)
  await page.getByRole('radio', { name: 'Pulse GO' }).focus()
  await page.keyboard.press('Space')
  assert.equal(await page.getByRole('radio', { name: 'Pulse GO' }).isChecked(), true)
  pass('keyboard focus and answer activation remain visible and functional')

  assert.deepEqual(unexpected, [])
  assert.equal(requests.some(request => /\/rest\/v1\/training_/.test(request.path)), false)
  assert.equal(requests.some(request => /pulse_go|google|sheets|room|realtime/i.test(request.path)), false)
  for (const rpc of ['get_go_capabilities','list_go_practice_catalog','get_go_practice_content','start_training_attempt','complete_training_attempt']) {
    assert.equal(requests.some(request => request.path.endsWith('/rpc/' + rpc)), true)
  }
  assert.deepEqual(errors, [])
  pass('local-only network allowlist, protected RPCs only, and clean browser console')
  console.log(JSON.stringify({ browserChecks: passes.length, requests: requests.length, rpcPaths: [...new Set(requests.filter(request => request.path.includes('/rpc/')).map(request => request.path))] }, null, 2))
} catch (error) {
  console.error('GO browser certification failed:', error.message)
  console.error('Visible text:', (await page.locator('body').innerText().catch(() => '')).slice(0,3000))
  console.error('Console:', errors)
  process.exitCode = 1
} finally {
  await browser.close()
  server.kill()
}
