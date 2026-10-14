import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { allTeamsCsv } from './all-teams-fixtures.mjs'
import { parseAgentPerformance } from '../../supabase/functions/_shared/viciReportParsers.mjs'
import { confirmedTargetReference } from '../../src/dashboard/reportingPolicy.js'
import { ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'

// Optional operator-provided CSV stays local; every external request is blocked.
const csv = process.argv[2] ? await readFile(process.argv[2], 'utf8') : allTeamsCsv()
const parsed = parseAgentPerformance(csv)
const sourceDate = parsed.source_range.from.slice(0,10)
const sourceGroups = [...new Set(parsed.rows.map(r => r.current_user_group))]
const groupCount = new Set(parsed.rows.map(r => r.current_user_group)).size
const dependencyRoot = process.env.PULSE_PLAYWRIGHT_ROOT || 'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
const { chromium } = createRequire(dependencyRoot + '/package.json')('playwright')
const server = await createServer({ configFile:false, publicDir:false, plugins:[react()], server:{ host:'127.0.0.1',port:53958,strictPort:true } })
await server.listen()
const browser = await chromium.launch({ channel:'chrome',headless:true })
const context = await browser.newContext({ viewport:{width:1440,height:1100},serviceWorkers:'block' })
const page = await context.newPage(), errors = [], external = []
page.on('pageerror', error => errors.push(error.message))
await context.route('**/*', route => {
  if (new URL(route.request().url()).origin !== 'http://127.0.0.1:53958') { external.push(new URL(route.request().url()).origin); return route.abort() }
  return route.continue()
})
const teams = page.getByRole('region',{name:'Agents by team'})
const agents = () => page.getByRole('region',{name:'Report overview'}).locator('.dash-metric').first().locator('strong')
try {
  await mkdir('review-evidence.local/dashboard-all-teams',{recursive:true})
  await page.clock.install({time:new Date(sourceDate + 'T15:00:00Z')})
  await page.goto('http://127.0.0.1:53958/scripts/dashboard-certification/review.html?mode=all-teams')
  assert.match(await page.getByLabel('Current time', {exact:true}).innerText(), /Pacific.*8:00 AM PDT/)
  assert.match(await page.getByLabel('Current time', {exact:true}).innerText(), /Colombia.*10:00 AM/)
  assert.equal(await page.getByRole('navigation',{name:'Operation',exact:true}).getByRole('button',{name:'Openers',exact:true}).getAttribute('aria-pressed'),'true')
  await page.getByRole('button',{name:'Closers',exact:true}).click()
  assert.equal(await page.getByText('Not available yet ✋',{exact:true}).isVisible(),true)
  assert.equal(await page.getByRole('button',{name:'Openers',exact:true}).getAttribute('aria-pressed'),'true')
  await page.locator('.dash-upload > summary').click()
  await page.getByLabel('Call Stats Breakdown',{exact:true}).setInputFiles({name:'general.csv',mimeType:'text/csv',buffer:Buffer.from(csv)})
  await page.getByLabel(/^I exported/).check()
  const started = performance.now()
  await page.getByRole('button',{name:'Save to cloud',exact:true}).click()
  await page.waitForFunction(count => document.querySelector('.dash-metric strong')?.textContent === String(count),parsed.rows.length)
  const elapsedMs = Math.round(performance.now()-started)
  assert.equal(await agents().innerText(),String(parsed.rows.length))
  assert.equal(await page.getByLabel('Report date',{exact:true}).inputValue(),sourceDate)
  assert.equal(await teams.getByRole('button').count(),groupCount+1)
  await page.getByRole('button',{name:'Rankings & goals',exact:true}).click()
  await page.getByRole('heading',{name:'Global rankings',exact:true}).waitFor()
  const pacePanel = page.getByRole('region',{name:'Team English pace',exact:true})
  assert.match(await pacePanel.innerText(), /Second hour · 08:00 PT/)
  const pacedAgents = parsed.rows.filter(row => confirmedTargetReference(ALL_TEAMS_SCOPE_ID,row)).length
  assert.equal(await pacePanel.locator('.dash-pace-values strong').nth(1).innerText(),(pacedAgents*3).toLocaleString('en-US'))
  await pacePanel.locator('summary').click()
  assert.equal(await pacePanel.getByRole('row').count(),10,'header, eight work hours and lunch')
  await pacePanel.screenshot({path:'review-evidence.local/dashboard-all-teams/team-pace.png'})
  await pacePanel.locator('summary').click()
  await page.getByText('24 English goal reached',{exact:true}).waitFor()
  await page.getByText('Commission goal met',{exact:true}).waitFor()
  for (const metric of ['xfer','calls','conversion','spanish','total']) {
    await page.getByLabel('Rank by',{exact:true}).selectOption(metric)
    assert.ok(await page.locator('.dash-rankings').innerText())
  }
  await page.getByLabel('Rank by',{exact:true}).selectOption('xfer')
  await page.getByLabel('Ranking order').selectOption('lowest')
  await page.getByLabel('Ranking order').selectOption('highest')
  await page.getByRole('button',{name:'Check requests',exact:true}).click()
  const reads = await page.locator('[data-request-count]').innerText()
  for (const group of sourceGroups) {
    await page.getByLabel('VICIdial user group',{exact:true}).selectOption(group)
    assert.equal(await agents().innerText(),String(parsed.rows.filter(r=>r.current_user_group===group).length))
  }
  await teams.getByRole('button',{name:/^All teams/}).click()
  assert.equal(await agents().innerText(),String(parsed.rows.length))
  await page.getByRole('heading',{name:'Global rankings',exact:true}).waitFor()
  await page.getByRole('button',{name:'Check requests',exact:true}).click()
  assert.equal(await page.locator('[data-request-count]').innerText(),reads,'group switching makes no new report reads')
  await mkdir('review-evidence.local/dashboard-all-teams',{recursive:true})
  for (const [width,height] of [[1440,1100],[390,844]]) {
    await page.setViewportSize({width,height})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    await page.screenshot({path:`review-evidence.local/dashboard-all-teams/${process.argv[2]?'real-local':'synthetic'}-${width}.png`})
  }
  // Re-upload the same isolated fixture for Saturday; no report or user is changed remotely.
  await page.clock.setSystemTime(new Date('2026-10-10T19:00:00Z'))
  await page.clock.runFor(10000)
  assert.match(await page.getByLabel('Current time', {exact:true}).innerText(), /Pacific.*Oct 10.*12:00 PM PDT/)
  assert.match(await page.getByLabel('Current time', {exact:true}).innerText(), /Colombia.*Oct 10.*2:00 PM/)
  await page.setViewportSize({width:1440,height:1100})
  if (!(await page.locator('.dash-upload').getAttribute('open') !== null)) await page.locator('.dash-upload > summary').click()
  await page.getByLabel('Call Stats Breakdown',{exact:true}).setInputFiles({name:'saturday.csv',mimeType:'text/csv',buffer:Buffer.from(csv.replaceAll(sourceDate,'2026-10-10'))})
  await page.getByLabel(/^I exported/).check()
  await page.getByRole('button',{name:'Save to cloud',exact:true}).click()
  await page.waitForFunction(() => document.querySelector('input[aria-label="Report date"]')?.value === '2026-10-10')
  await page.getByRole('button',{name:'Rankings & goals',exact:true}).click()
  await page.getByText('15 English goal reached',{exact:true}).waitFor()
  await page.getByText('Commission goal met',{exact:true}).waitFor()
  assert.match(await pacePanel.innerText(), /Fourth hour/)
  const saturdayDifference = parsed.rows.filter(row => confirmedTargetReference(ALL_TEAMS_SCOPE_ID,row)).reduce((sum,row) => sum + row.xfer_count,0) - pacedAgents * 9
  assert.equal(await pacePanel.locator('.dash-pace-values strong').nth(2).innerText(), Math.abs(saturdayDifference).toLocaleString('en-US'))
  await pacePanel.locator('summary').click()
  assert.equal(await pacePanel.getByRole('row').count(),6,'Saturday has five consecutive work hours, no lunch')
  assert.equal(await pacePanel.getByText('Lunch',{exact:true}).count(),0)
  for (const [width,height] of [[1440,1100],[390,844]]) {
    await page.setViewportSize({width,height})
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    await page.evaluate(() => window.scrollTo(0,0))
    await page.screenshot({path:`review-evidence.local/dashboard-all-teams/saturday-${width}.png`})
    await pacePanel.screenshot({path:`review-evidence.local/dashboard-all-teams/saturday-pace-${width}.png`})
  }
  assert.deepEqual(errors,[]); assert.deepEqual(external,[])
  console.log(JSON.stringify({checks:16,agents:parsed.rows.length,groups:groupCount,localUploadRenderMs:elapsedMs,externalRequests:0,result:'passed'}))
} finally { await context.close(); await browser.close(); await server.close() }
