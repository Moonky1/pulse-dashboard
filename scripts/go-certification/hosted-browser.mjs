import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { apiUrl, appUrl, localAnonKey, sql, startBrowserRuntime, startLocalApp } from '../studio-certification/local-runtime.mjs'

assert.equal(sql("select count(*) from auth.users"), '0', 'Hosted browser fixture requires an empty disposable database')
sql(readFileSync(new URL('./hosted-fixtures.sql', import.meta.url), 'utf8'))
const password = randomBytes(24).toString('hex')
sql("update auth.users set encrypted_password=extensions.crypt('" + password + "',extensions.gen_salt('bf')) where email ~ '^go1b[.]' ")

const browser = await startBrowserRuntime()
const server = await startLocalApp(localAnonKey())
const contexts = []
const requests = [], unexpected = [], errors = [], sockets = [], passes = []
const pass = name => { passes.push(name); console.log('PASS ' + name) }

async function newPlayer(email, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' })
  contexts.push(context)
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (![appUrl, apiUrl].includes(url.origin)) {
      unexpected.push(url.origin + url.pathname)
      return route.abort('blockedbyclient')
    }
    requests.push({ method: route.request().method(), path: url.pathname })
    return route.continue()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => errors.push(email + ': ' + error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(email + ': ' + message.text()) })
  page.on('websocket', socket => sockets.push(socket.url()))
  await page.goto(appUrl + '/signin')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL('**/workspace')
  await page.getByRole('link', { name: 'Open Pulse GO' }).click()
  await page.getByRole('heading', { name: 'Train. Practice. Play.' }).waitFor()
  return page
}

try {
  // Local GoTrue is intentionally exercised one sign-in at a time; the browser
  // contexts remain fully independent and concurrently connected afterwards.
  const host = await newPlayer('go1b.host@example.test')
  const playerOne = await newPlayer('go1b.player1@example.test')
  const playerTwo = await newPlayer('go1b.player2@example.test')
  pass('three independent authenticated Staff browser contexts open Pulse GO')

  assert.equal(await host.getByRole('link', { name: 'Start Practice' }).count(), 0)
  assert.equal(await host.getByRole('link', { name: 'Host a game' }).count(), 1)
  assert.equal(await playerOne.getByRole('link', { name: 'Host a game' }).count(), 0)
  assert.equal(await playerOne.getByRole('link', { name: 'Start Practice' }).count(), 1)
  pass('go.host and go.play remain independently capability gated')

  await host.getByRole('link', { name: 'Host a game' }).click()
  await host.getByRole('heading', { name: 'Choose the challenge' }).waitFor()
  await host.getByRole('heading', { name: 'Hosted Quiz Alpha' }).waitFor()
  await host.getByRole('button', { name: 'Create room' }).click()
  await host.waitForURL('**/go/host/*')
  const roomCode = (await host.locator('.go-room-code strong').innerText()).trim()
  assert.match(roomCode, /^KK \d{4}$/)
  assert.equal(sql('select count(*) from public.go_sessions'), '1')
  assert.equal(sql('select count(*) from public.training_attempts'), '0')
  pass('host explicitly creates one server-coded lobby without starting attempts')

  for (const page of [playerOne, playerTwo]) {
    await page.getByLabel('Game code').fill(roomCode.replace(' ', '-').toLowerCase())
    await page.getByRole('button', { name: 'Join' }).click()
    await page.waitForURL('**/go/room/*')
    await page.getByText('You’re in.').waitFor()
  }
  await host.getByText('Player One').waitFor()
  await host.getByText('Player Two').waitFor()
  await host.getByRole('heading', { name: '2 players ready' }).waitFor()
  assert.equal(sql('select count(*) from public.go_session_participants'), '2')
  assert.equal(sql("select count(*) from public.go_session_memberships where member_kind='participant'"), '2')
  pass('Realtime lobby shows two privacy-safe player markers without reload')

  await playerOne.reload()
  await playerOne.getByText('You’re in.').waitFor()
  assert.equal(sql('select count(*) from public.go_session_participants'), '2')
  pass('player reload reconnects to canonical lobby without duplicate membership')

  await host.getByRole('button', { name: 'Start game' }).click()
  await host.getByRole('heading', { name: 'Which launch word is correct?' }).waitFor()
  await playerOne.getByRole('heading', { name: 'Which launch word is correct?' }).waitFor()
  await playerTwo.getByRole('heading', { name: 'Which launch word is correct?' }).waitFor()
  assert.equal(sql("select count(*) from public.training_attempts where source_mode='go_hosted'"), '2')
  pass('host start synchronizes current question and creates exactly two hosted attempts')

  await playerOne.getByRole('radio', { name: 'Alpha' }).check()
  await playerOne.getByRole('button', { name: 'Submit answer' }).click()
  await playerOne.getByText('Answer locked ✓').waitFor()
  await host.getByText('1/2 answered').waitFor()
  await playerTwo.getByRole('radio', { name: 'Beta' }).check()
  await playerTwo.getByRole('button', { name: 'Submit answer' }).click()
  await host.getByText('2/2 answered').waitFor()
  assert.equal(sql('select count(*) from public.training_attempt_answers'), '2')
  pass('answers lock once and host receives aggregate answered progress only')

  await host.getByRole('button', { name: 'Next question' }).click()
  await playerOne.getByRole('heading', { name: 'Pulse scores hosted games on the server.' }).waitFor()
  await playerTwo.getByRole('heading', { name: 'Pulse scores hosted games on the server.' }).waitFor()
  await playerOne.getByRole('radio', { name: 'True' }).check()
  await playerOne.getByRole('button', { name: 'Submit answer' }).click()
  await playerTwo.getByRole('radio', { name: 'True' }).check()
  await playerTwo.getByRole('button', { name: 'Submit answer' }).click()
  await host.getByText('2/2 answered').waitFor()
  await playerOne.reload()
  await playerOne.getByText('Answer locked ✓').waitFor()
  pass('hard reload restores the authoritative active question and submitted state')

  await host.getByRole('button', { name: 'Next question' }).click()
  await playerOne.getByRole('heading', { name: 'Type the launch word.' }).waitFor()
  await playerTwo.getByRole('heading', { name: 'Type the launch word.' }).waitFor()
  await playerOne.getByLabel('Your answer').fill('Alpha')
  await playerOne.getByRole('button', { name: 'Submit answer' }).click()
  await playerTwo.getByLabel('Your answer').fill('Beta')
  await playerTwo.getByRole('button', { name: 'Submit answer' }).click()
  await host.getByText('2/2 answered').waitFor()
  await host.getByRole('button', { name: 'Finish game' }).click()
  await host.getByRole('heading', { name: 'That’s a wrap!' }).waitFor()
  await playerOne.getByRole('heading', { name: 'Outstanding run' }).waitFor()
  await playerTwo.getByRole('heading', { name: 'Keep building' }).waitFor()
  assert.equal(await playerOne.getByText('3 of 3 correct').count(), 1)
  assert.equal(await playerTwo.getByText('1 of 3 correct').count(), 1)
  pass('server completion synchronizes personal achievement results and host aggregate summary')

  assert.equal(sql("select count(*) from public.go_sessions where status='completed'"), '1')
  assert.equal(sql("select count(*) from public.training_attempts where source_mode='go_hosted' and status='completed'"), '2')
  assert.equal(sql('select count(*) from public.training_attempt_answers'), '6')
  assert.equal(sql('select count(*) from public.training_results'), '2')
  assert.equal(sql('select count(*) from public.training_result_topics'), '2')
  assert.equal(sql("select count(*) from public.training_learners where learner_kind<>'staff'"), '0')
  pass('canonical attempts, answers, results, topics, and Staff learner identities are exact')

  for (const [name, page, width, height, path] of [
    ['desktop', host, 1440, 1000, '/go'],
    ['tablet', playerOne, 820, 1180, '/go'],
    ['mobile', playerTwo, 390, 844, '/go'],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto(appUrl + path)
    await page.getByRole('heading', { name: 'Train. Practice. Play.' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement !== document.body), true)
    pass(name + ' GO landing fits and preserves keyboard focus')
  }

  assert.deepEqual(unexpected, [])
  assert.equal(requests.some(request => /\/rest\/v1\/(training_|go_session_memberships)/.test(request.path)), false)
  for (const rpc of ['get_go_capabilities','list_go_host_catalog','create_go_hosted_session','join_go_hosted_session','get_go_hosted_session','start_go_hosted_session','submit_go_hosted_answer','advance_go_hosted_session']) {
    assert.equal(requests.some(request => request.path.endsWith('/rpc/' + rpc)), true, rpc + ' was not observed')
  }
  assert.equal(sockets.some(url => url.startsWith(apiUrl.replace('http','ws') + '/realtime/')), true)
  assert.deepEqual(errors, [])
  pass('protected RPC network, authorized Realtime, no external origins, and clean console')
  console.log(JSON.stringify({ browserChecks: passes.length, requests: requests.length, realtimeSockets: sockets.length, rpcPaths: [...new Set(requests.filter(request => request.path.includes('/rpc/')).map(request => request.path))] }, null, 2))
} catch (error) {
  console.error('GO hosted browser certification failed:', error.message)
  for (const [index, context] of contexts.entries()) {
    const pages = context.pages()
    if (pages[0]) console.error('Context ' + index + ':', (await pages[0].locator('body').innerText().catch(() => '')).slice(0,1800))
  }
  console.error('Console:', errors)
  process.exitCode = 1
} finally {
  await Promise.all(contexts.map(context => context.close().catch(() => {})))
  await browser.close()
  server.kill()
}
