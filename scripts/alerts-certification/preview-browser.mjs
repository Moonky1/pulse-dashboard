import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {randomBytes,randomUUID,createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {Buffer} from 'node:buffer'
import {join} from 'node:path'
import {mkdir,writeFile} from 'node:fs/promises'
const project='sgshbawggqapuyqzkyhs',origin='https://pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app',agent='06d7949a-a0bf-4068-96af-08b1d2c412e7'
if(process.argv[2]!==project)throw Error('Explicit isolated Preview required')
const keyring=createRequire(import.meta.url)('C:/Users/simon/AppData/Local/npm-cache/_npx/67eb4586ca667318/node_modules/@napi-rs/keyring')
let management
for(const account of ['supabase','access-token'])try{const value=Buffer.from(keyring.Entry.withTarget('Supabase CLI:'+account,'Supabase CLI',account).getSecret()).toString('utf8');if(/^sbp_[A-Za-z0-9]+$/.test(value)){management=value;break}}catch{/* Official CLI profile only. */}
if(!management)throw Error('Existing operator access unavailable')
async function query(sql){const r=await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+management,'Content-Type':'application/json'},body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Isolated Preview query failed: '+r.status);return r.json()}
const cli=join(process.env.APPDATA,'npm/node_modules/vercel/dist/vc.js')
// The authorized CLI supplies its existing Preview protection token. Keep it in
// memory and attach only to this exact Vercel origin, never to Supabase requests.
const protection=spawnSync(process.execPath,[cli,'curl','/','--deployment',origin,'--','--verbose','--output','NUL'],{encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024})
if(protection.status!==0)throw Error('Protected Preview access unavailable; output suppressed')
const bypass=protection.stderr.match(/x-vercel-protection-bypass:\s*([^\s]+)/i)?.[1]
if(!bypass)throw Error('Preview protection token unavailable; no bypass invented')
const {chromium}=createRequire((process.env.PULSE_PLAYWRIGHT_ROOT||'C:/Users/simon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')+'/package.json')('playwright')
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Bogota',serviceWorkers:'block'})
const opaque=randomBytes(32).toString('hex'),hash=createHash('sha256').update(opaque).digest('hex'),occurrence=randomUUID(),checks=[],errors=[],deniedOrigins=[];let seeded=false
const evidence='review-evidence.local/alerts-1';await mkdir(evidence,{recursive:true})
let schedulerEnabled
await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin===origin)return route.continue({headers:{...route.request().headers(),'x-vercel-protection-bypass':bypass}});if(url.hostname===project+'.supabase.co'||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();deniedOrigins.push(url.origin);return route.abort()})
await context.addCookies([{name:'__Host-pulse_agent',value:opaque,url:origin,httpOnly:true,secure:true,sameSite:'Lax'}])
await context.addInitScript(()=>{window.__qaAudio={contexts:0,oscillators:0};const Native=window.AudioContext;if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);window.__qaAudio.contexts++}createOscillator(){window.__qaAudio.oscillators++;return super.createOscillator()}}})
const pass=name=>{checks.push(name);console.log('PASS '+name)}
try{
 const allowed=await query(`select count(*)::int as eligible from public.agents a join public.teams t on t.id=a.team_id where a.id='${agent}' and a.agent_code='990001' and a.display_name='Agent 990001' and a.status='active' and t.is_active;`);assert.equal(allowed[0].eligible,1)
 const off=await query('select enabled from public.pulse_alert_settings');schedulerEnabled=off[0].enabled
 await query(`insert into public.agent_sessions(token_hash,agent_id,expires_at) values('${hash}','${agent}',clock_timestamp()+interval '10 minutes');`);seeded=true
 const pages=[await context.newPage(),await context.newPage()];for(const page of pages)page.on('pageerror',e=>errors.push(e.message))
 await pages[0].goto(origin+'/schedule');await pages[0].locator('.pulse-timeline article').nth(3).waitFor();await pages[0].getByRole('button',{name:'My local time',exact:true}).click();assert.match(await pages[0].locator('.pulse-time-caption').innerText(),/Bogota/)
 await pages[1].goto(origin+'/go');await pages[1].locator('.pulse-product-header--agent').waitFor();await pages[1].getByRole('link',{name:'Academy',exact:true}).first().click();await pages[1].locator('.pulse-product-header--agent').waitFor()
 const leases=await query(`select count(*)::int as total from pulse_private.pulse_alert_leases where session_hash='${hash}' and expires_at>clock_timestamp();`);assert.equal(leases[0].total,2);pass('deployed cookie API reads real Preview schedule; two Pulse tabs have server-bound leases')
 // Bounded wait for private channel joins, not a per-Agent scheduler poll.
 await new Promise(resolve=>setTimeout(resolve,2500))
 const seed=`insert into public.pulse_alert_occurrences(id,event_id,event_revision,pacific_date,phase,scheduled_at,expires_at,payload) select '${occurrence}',id,revision,(clock_timestamp() at time zone 'America/Los_Angeles')::date,'start',clock_timestamp(),clock_timestamp()+interval '90 seconds',jsonb_build_object('event',config||'{"name":"Synthetic Preview QA only"}'::jsonb,'phase','start','start_at',clock_timestamp(),'end_at',clock_timestamp()+interval '15 minutes','timezone','America/Los_Angeles') from public.pulse_schedule_events where id='a1120000-0000-4000-8000-000000000002';
 insert into public.pulse_alert_deliveries(occurrence_id,agent_id,agent_code,agent_name,team_name,pulse_open,presence_observed_at) select '${occurrence}',a.id,a.agent_code,a.display_name,t.name,true,clock_timestamp() from public.agents a join public.teams t on t.id=a.team_id where a.id='${agent}' and a.agent_code='990001';
 select realtime.send(jsonb_build_object('occurrence_id','${occurrence}','expires_at',(select expires_at from public.pulse_alert_occurrences where id='${occurrence}')),'alarm','pulse-alerts-v1',true);`
 await query(seed)
 await Promise.any(pages.map(p=>p.locator('.pulse-alert-surface').waitFor({timeout:20000})));const counts=await Promise.all(pages.map(p=>p.locator('.pulse-alert-surface').count()));assert.equal(counts[0]+counts[1],1)
 const winner=pages[counts[0]?0:1];await winner.waitForFunction(()=>window.__qaAudio.oscillators>0);const notes=await winner.evaluate(()=>window.__qaAudio.oscillators);await winner.locator('.pulse-pet--alarm').waitFor();await winner.screenshot({path:evidence+'/preview-real-alarm-390.png'})
 await query(`select realtime.send(jsonb_build_object('occurrence_id','${occurrence}','expires_at',(select expires_at from public.pulse_alert_occurrences where id='${occurrence}')),'alarm','pulse-alerts-v1',true);`)
 await new Promise(resolve=>setTimeout(resolve,800));assert.equal(await winner.evaluate(()=>window.__qaAudio.oscillators),notes);pass('real private broadcast produces one visual/Pet alarm across two tabs; duplicate does not restart audio')
 const receipts=await query(`select count(*)::int targeted,count(received_at)::int received,count(visual_at)::int visual,count(sound_at)::int sound_started,count(blocked_at)::int audio_blocked from public.pulse_alert_deliveries where occurrence_id='${occurrence}';`);assert.equal(receipts[0].targeted,1);assert.equal(receipts[0].received,1);assert.equal(receipts[0].visual,1);assert.equal(receipts[0].sound_started+receipts[0].audio_blocked,1);pass('real claimed delivery records received/visual and exactly one client playback outcome')
 await winner.locator('.pulse-alert-surface').waitFor({state:'hidden',timeout:10000});assert.equal(await winner.locator('.pulse-pet--alarm').count(),0);assert.equal(await pages[counts[0]?1:0].locator('.pulse-alert-surface').count(),0);pass('alarm expires automatically; other tab remains quiet')
 assert.deepEqual(errors,[]);assert.deepEqual(deniedOrigins,[]);pass('deployed browser uses isolated Preview only, with no Production API requests')
 await writeFile(evidence+'/preview-browser-results.json',JSON.stringify({project,origin,checks,receipts:receipts[0],schedulerEnabled,realDevices:false,secretsPrinted:false},null,2))
}finally{
 await context.close();await browser.close()
 if(seeded){await query(`delete from public.pulse_alert_deliveries where occurrence_id='${occurrence}' and agent_id='${agent}'; delete from public.pulse_alert_occurrences where id='${occurrence}'; delete from pulse_private.pulse_alert_leases where session_hash='${hash}'; delete from public.agent_sessions where token_hash='${hash}' and agent_id='${agent}';`);console.log('Removed only this run’s synthetic occurrence, receipts, connection leases and temporary session.')}
 const off=await query('select enabled from public.pulse_alert_settings');assert.equal(off[0].enabled,schedulerEnabled)
}
