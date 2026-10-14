import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { allTeamsCsv, allTeamsScope } from './all-teams-fixtures.mjs'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
import { testReport } from './ui-fixtures.mjs'
import { validateDatasetSelection } from '../../supabase/functions/_shared/viciDatasetSelection.mjs'
import { DATASET_ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'
const source = {...allTeamsScope,id:DATASET_ALL_TEAMS_SCOPE_ID,user_groups:[...allTeamsScope.user_groups,'Monitors'],campaigns:['Openers2','Openers3','Openers5','Openers6']}
const scopes=[source], reports=new Map(), identities=new Map(), writes=[]
const origin='http://127.0.0.1:53963'
const server=await createServer({configFile:false,publicDir:false,plugins:[react(),{name:'local-dataset-store',configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
  if(!['/__cloud-review','/__cloud-review-upload'].includes(req.url)) return next()
  try{
    const chunks=[];for await(const chunk of req) chunks.push(chunk)
    const bytes=Buffer.concat(chunks);assert.ok(bytes.length<11*1024*1024)
    let data
    if(req.url==='/__cloud-review'){
      const {name,args}=JSON.parse(bytes)
      if(name==='list_vici_dashboard_scopes') data=scopes
      else if(name==='get_vici_dashboard') data=reports.get(args.requested_scope+'/'+args.report_date)||{...testReport(args.report_date),scope:scopes.find(s=>s.id===args.requested_scope),snapshot:null,performance:[],pause:[]}
      else if(name==='list_vici_report_history') data=[]
      else if(name==='get_vici_alert_rules') data=null
      else throw Error('Unexpected RPC')
    }else{
      const form=await new Response(bytes,{headers:{'Content-Type':req.headers['content-type']}}).formData()
      const selection=validateDatasetSelection(JSON.parse(form.get('selection')),source.campaigns);assert.ok(selection)
      assert.equal(form.get('scopeId'),source.id)
      const date=form.get('reportDate'), prepared=inspectManualReports({performanceText:await form.get('performance')?.text(),pauseText:await form.get('pause')?.text(),reportDate:date,userGroups:source.user_groups})
      const groups=[...new Set((prepared.pair.performance||prepared.pair.pause).rows.map(r=>r.current_user_group))].sort()
      const all=source.user_groups.filter(g=>!['ADMIN','Monitors','OpenersTraining'].includes(g)).every(g=>groups.includes(g))
      const identity=JSON.stringify([selection.kind,selection.campaigns,all?source.user_groups:groups])
      let saved=identities.get(identity)
      if(!saved){saved={...source,id:randomUUID(),parent_scope_id:source.id,dataset_kind:selection.kind,campaigns:selection.campaigns,user_groups:all?source.user_groups:groups,label:(selection.kind==='run_test'?'Run test · OP5 / OP6':'All teams · '+selection.campaigns.map(c=>c.replace('Openers','OP')).join(' / '))};identities.set(identity,saved);scopes.unshift(saved)}
      const key=saved.id+'/'+date,prior=reports.get(key),report=prior?structuredClone(prior):testReport(date)
      report.scope=saved;report.performance=prepared.pair.performance?.rows||prior?.performance||[];report.pause=prepared.pair.pause?.rows||prior?.pause||[];report.snapshot.ingestion_method='manual';reports.set(key,report);writes.push(selection)
      data={status:prior?'duplicate':'success',report_date:date,agents:(prepared.pair.performance||prepared.pair.pause).rows.length,scope_id:saved.id,parent_scope_id:source.id,dataset_kind:selection.kind,scope:saved,report:writes.length===1?report:null}
    }
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data}))
  }catch{res.statusCode=500;res.end('{"error":{"code":"local_review_failure"}}')}
})}}],server:{host:'127.0.0.1',port:53963,strictPort:true}})
await server.listen()
const {chromium}=createRequire('C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright')
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort())
const url=origin+'/scripts/dashboard-certification/review.html?mode=cloud-reload&date=2026-10-09'
async function open(){if(!await page.locator('.dash-upload').evaluate(el=>el.open)) await page.locator('.dash-upload > summary').click()}
async function upload(){
  await open();await page.getByLabel('Call Stats Breakdown',{exact:true}).setInputFiles({name:'all-teams.csv',mimeType:'text/csv',buffer:Buffer.from(allTeamsCsv())})
  assert.equal(await page.getByRole('button',{name:'Upload reports',exact:true}).isEnabled(),false)
  await page.getByLabel(/^I exported/).check();await page.getByRole('button',{name:'Upload reports',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.dash-metric strong')?.textContent==='22')
}
try{
  await page.goto(url);await page.getByRole('heading',{name:'No report for this date'}).waitFor();await upload()
  const globalId=new URL(page.url()).searchParams.get('scope');assert.notEqual(globalId,source.id)
  await page.reload();await page.waitForFunction(()=>document.querySelector('.dash-metric strong')?.textContent==='22')
  await page.getByRole('button',{name:'Run test · OP5 / OP6',exact:true}).click();await page.getByRole('heading',{name:'No report for this date'}).waitFor()
  assert.equal(await page.locator('.dash-metric strong').first().textContent(),'—');await upload()
  const testId=new URL(page.url()).searchParams.get('scope');assert.notEqual(testId,globalId)
  assert.equal(await page.locator('.dash-team-pace').count(),0);assert.equal(await page.getByRole('button',{name:'Rankings & goals',exact:true}).count(),0)
  await page.reload();await page.waitForFunction(()=>document.querySelector('.dash-metric strong')?.textContent==='22')
  assert.equal(await page.getByRole('button',{name:'Run test · OP5 / OP6',exact:true}).getAttribute('aria-pressed'),'true')
  await page.getByRole('button',{name:'Openers',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.dash-metric strong')?.textContent==='22')
  assert.equal(await page.getByLabel('Saved report',{exact:true}).inputValue(),globalId)
  await open();await page.getByLabel('OP5',{exact:true}).uncheck();await page.getByLabel('OP6',{exact:true}).uncheck();await upload()
  assert.deepEqual(writes.at(-1).campaigns,['Openers2','Openers3']);assert.equal(reports.size,3)
  const partialUrl=page.url(),peer=await context.newPage();await peer.goto(partialUrl);await peer.waitForFunction(()=>document.querySelector('.dash-metric strong')?.textContent==='22');await peer.close()
  await mkdir('review-evidence.local/dashboard-datasets',{recursive:true})
  for(const width of [1440,390]){await page.setViewportSize({width,height:1000});await open();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'review-evidence.local/dashboard-datasets/upload-'+width+'.png',fullPage:true})}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'passed',reload:true,newTab:true,runTestIsolation:true,campaignAttestation:true,saveReadRecovery:true,viewports:[1440,390],storedDatasets:reports.size,remoteWrites:0}))
}finally{await context.close();await browser.close();await server.close()}
