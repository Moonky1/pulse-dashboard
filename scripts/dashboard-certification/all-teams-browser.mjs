import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { allTeamsCsv } from './all-teams-fixtures.mjs'
import { ALL_TEAMS_GROUPS } from '../../src/dashboard/allTeamsScope.js'
import { parseAgentPerformance } from '../../supabase/functions/_shared/viciReportParsers.mjs'

// Optional operator-provided CSV stays local; every external request is blocked.
const csv = process.argv[2] ? await readFile(process.argv[2], 'utf8') : allTeamsCsv()
const parsed = parseAgentPerformance(csv)
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
  await page.goto('http://127.0.0.1:53958/scripts/dashboard-certification/review.html?mode=all-teams')
  await page.locator('.dash-upload > summary').click()
  await page.getByLabel('Call Stats Breakdown',{exact:true}).setInputFiles({name:'general.csv',mimeType:'text/csv',buffer:Buffer.from(csv)})
  await page.getByRole('checkbox',{name:/Complete report for All teams/}).check()
  const started = performance.now()
  await page.getByRole('button',{name:'Upload reports',exact:true}).click()
  await page.waitForFunction(count => document.querySelector('.dash-metric strong')?.textContent === String(count),parsed.rows.length)
  const elapsedMs = Math.round(performance.now()-started)
  assert.equal(await agents().innerText(),String(parsed.rows.length))
  assert.equal(await page.getByLabel('Report date',{exact:true}).inputValue(),'2026-10-09')
  assert.equal(await teams.getByRole('button').count(),groupCount+1)
  await page.getByRole('button',{name:'Rankings & goals',exact:true}).click()
  await page.getByRole('heading',{name:'Global rankings',exact:true}).waitFor()
  for (const metric of ['xfer','calls','conversion','spanish','total']) {
    await page.getByLabel('Rank by',{exact:true}).selectOption(metric)
    assert.ok(await page.locator('.dash-rankings').innerText())
  }
  await page.getByLabel('Rank by',{exact:true}).selectOption('xfer')
  await page.getByLabel('Ranking order').selectOption('lowest')
  await page.getByLabel('Ranking order').selectOption('highest')
  await page.getByRole('button',{name:'Check requests',exact:true}).click()
  const reads = await page.locator('[data-request-count]').innerText()
  for (const group of ALL_TEAMS_GROUPS) {
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
  assert.deepEqual(errors,[]); assert.deepEqual(external,[])
  console.log(JSON.stringify({checks:12,agents:parsed.rows.length,groups:groupCount,localUploadRenderMs:elapsedMs,externalRequests:0,result:'passed'}))
} finally { await context.close(); await browser.close(); await server.close() }
