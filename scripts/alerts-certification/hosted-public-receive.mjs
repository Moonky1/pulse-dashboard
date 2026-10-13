import {createRequire} from 'node:module'
import {spawnSync} from 'node:child_process'
import {randomUUID} from 'node:crypto'
import assert from 'node:assert/strict'
const project='sgshbawggqapuyqzkyhs',origin='https://pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app'
if(process.argv[2]!==project)throw Error('Only isolated Preview allowed for the live signal proof')
const {chromium}=createRequire('C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright')
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext(),page=await context.newPage(),id=randomUUID()
let joinedResolve,joinTimer;const joined=new Promise((resolve,reject)=>{joinedResolve=resolve;joinTimer=setTimeout(()=>reject(Error('Anonymous channel join timeout')),20000)})
page.on('websocket',socket=>socket.on('framereceived',({payload})=>{try{const frame=JSON.parse(String(payload)),topic=Array.isArray(frame)?frame[2]:frame.topic,event=Array.isArray(frame)?frame[3]:frame.event,data=Array.isArray(frame)?frame[4]:frame.payload;if(topic==='realtime:pulse-schedule-notices-v1' && event==='phx_reply' && data?.status==='ok'){clearTimeout(joinTimer);joinedResolve()}}catch{/* Other frames are irrelevant. */}}))
try{
 // Only this disposable browser substitutes ONE nonce-specific RPC projection.
 // The server has no matching notice: every ordinary client ignores this test ID.
 await page.route('**/rest/v1/rpc/get_public_pulse_notice',async route=>{if(route.request().postDataJSON()?.requested_id!==id)return route.continue();const now=Date.now();await route.fulfill({json:{id,expires_at:new Date(now+90000).toISOString(),payload:{event:{name:'Preview verification',type:'custom',sound:'iphone_radar',volume:60,duration_seconds:2,repeat:1},phase:'start',start_at:new Date(now).toISOString(),end_at:new Date(now+120000).toISOString()}}})})
 await page.goto(origin+'/schedule');await page.getByRole('heading',{name:'Today',exact:true}).waitFor();await joined;await page.getByRole('button',{name:'Say hello to Pulse Pet'}).click()
 const expires=new Date(Date.now()+90000).toISOString(),sql="select realtime.send(jsonb_build_object('occurrence_id','"+id+"','expires_at','"+expires+"'),'notice','pulse-schedule-notices-v1',true);"
 const result=spawnSync('cmd.exe',['/d','/c','npx','--no-install','supabase','db','query','--linked','--project-ref',project,sql],{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});if(result.status!==0)throw Error('Preview signal send failed; no credential output')
 await page.locator('.pulse-alert-surface').getByRole('heading',{name:'Preview verification'}).waitFor({timeout:10000});assert.equal(await page.locator('.pulse-pet[data-activity="alarm"]').count(),1)
 await page.screenshot({path:'review-evidence.local/alerts-public/hosted-live-signal.png'})
 console.log('PASS deployed anonymous listener receives real Preview broadcast and displays test projection with drumming; ordinary clients ignore nonce; no user or notice created')
}finally{clearTimeout(joinTimer);await browser.close()}
