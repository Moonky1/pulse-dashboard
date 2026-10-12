import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { fixture } from './parserFixtures.mjs'
const root = process.env.PULSE_PLAYWRIGHT_ROOT || 'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
const {chromium}=createRequire(root+'/package.json')('playwright')
const server=await createServer({configFile:false,publicDir:false,plugins:[react()],server:{host:'127.0.0.1',port:53961,strictPort:true}})
await server.listen()
const browser=await chromium.launch({channel:'chrome',headless:true})
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'})
const page=await context.newPage(),errors=[],external=[]
page.on('pageerror',e=>errors.push(e.message))
await context.route('**/*',route=>{if(new URL(route.request().url()).origin!=='http://127.0.0.1:53961'){external.push(route.request().url());return route.abort()}return route.continue()})
const csv=(type,date)=>({name:type+'-'+date+'.csv',mimeType:'text/csv',buffer:Buffer.from(fixture(type).replaceAll('2026-10-09',date))})
const open=async()=>{await page.goto('http://127.0.0.1:53961/scripts/dashboard-certification/review.html?mode=staff-upload');await page.locator('.dash-upload > summary').click();await page.getByRole('button',{name:'Multiple CSVs',exact:true}).click()}
try {
  await mkdir('review-evidence.local/dashboard-batch',{recursive:true})
  await open()
  await page.getByLabel('Call Stats CSV files',{exact:true}).setInputFiles([csv('performance','2026-10-09'),csv('performance','2026-10-08')])
  await page.getByLabel('Pause Code CSV files',{exact:true}).setInputFiles(csv('pause','2026-10-09'))
  await page.getByRole('button',{name:'Save to cloud',exact:true}).click()
  await page.getByText('2 / 2 reports saved',{exact:true}).waitFor()
  await page.getByRole('button',{name:'One report',exact:true}).click()
  await page.getByLabel('Call Stats Breakdown',{exact:true}).setInputFiles(csv('performance','2026-10-09'))
  await page.getByRole('button',{name:'Multiple CSVs',exact:true}).click()
  await page.getByRole('button',{name:'One report',exact:true}).click()
  assert.equal(await page.getByRole('button',{name:'Upload reports',exact:true}).isEnabled(),false)
  await page.getByRole('button',{name:'Multiple CSVs',exact:true}).click()
  await page.getByLabel('Call Stats CSV files',{exact:true}).setInputFiles([
    csv('performance','2026-10-08'),
    {...csv('performance','2026-10-09'),buffer:Buffer.from(fixture('performance').replaceAll('TOTALS','broken'))}
  ])
  await page.getByRole('button',{name:'Save to cloud',exact:true}).click()
  await page.getByRole('alert').filter({hasText:'Paused at the failed file'}).waitFor()
  assert.equal(await page.getByText('1 / 2 reports saved',{exact:true}).isVisible(),true)
  assert.equal(await page.getByRole('button',{name:'Continue upload',exact:true}).isEnabled(),true)
  await open()
  await page.getByLabel('Call Stats CSV files',{exact:true}).setInputFiles([csv('performance','2026-10-09'),csv('performance','2026-10-08')])
  await page.getByLabel('Pause Code CSV files',{exact:true}).setInputFiles(csv('pause','2026-10-09'))
  await page.getByRole('button',{name:'Save to cloud',exact:true}).click()
  await page.getByText('2 / 2 reports saved',{exact:true}).waitFor()
  assert.equal(await page.getByRole('list',{name:'Upload results'}).locator('li').count(),2)
  assert.equal(await page.getByRole('textbox',{name:'Report date',exact:true}).inputValue(),'2026-10-09')
  assert.equal(await page.locator('.dash-metric strong').first().innerText(),'2')
  assert.match(await page.locator('.dash-batch-list li').first().innerText(),/2026-10-08/)
  await page.locator('.dash-batch-upload').scrollIntoViewIfNeeded()
  await page.screenshot({path:'review-evidence.local/dashboard-batch/saved.png'})
  await page.setViewportSize({width:390,height:844})
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  await page.screenshot({path:'review-evidence.local/dashboard-batch/saved-mobile.png'})
  await page.setViewportSize({width:1440,height:1000})
  await open()
  await page.getByLabel('Call Stats CSV files',{exact:true}).setInputFiles([csv('performance','2026-10-08'),csv('performance','2026-10-09')])
  await page.getByRole('button',{name:'Save to cloud',exact:true}).click()
  await page.getByText('1 / 2 reports saved',{exact:true}).waitFor()
  assert.equal(await page.getByRole('button',{name:'One report',exact:true}).isEnabled(),false)
  await page.getByRole('button',{name:'Stop after current file',exact:true}).click()
  await page.getByRole('button',{name:'Continue upload',exact:true}).waitFor()
  await page.getByRole('button',{name:'Continue upload',exact:true}).click()
  await page.getByText('2 / 2 reports saved',{exact:true}).waitFor()
  await page.goto('http://127.0.0.1:53961/scripts/dashboard-certification/review.html?mode=insights')
  await page.getByRole('button',{name:'Rankings & goals',exact:true}).click()
  const low=page.locator('.dash-rank-card--review')
  assert.equal(await low.locator('li').count(),3)
  assert.match(await low.getByRole('heading').innerText(),/Lowest XFER/)
  assert.equal(await low.locator('img').first().evaluate(e=>e.complete && e.naturalWidth>0),true)
  await low.scrollIntoViewIfNeeded()
  await page.screenshot({path:'review-evidence.local/dashboard-batch/lowest.png'})
  assert.deepEqual(errors,[]);assert.deepEqual(external,[])
  console.log('PASS multi-date cloud queue, paired and optional files, dashboard refresh, retained progress, stop/resume, mobile, lowest-three emoji, no external requests')
} finally {await context.close();await browser.close();await server.close()}
