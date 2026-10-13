import {spawnSync} from 'node:child_process'
import {Buffer} from 'node:buffer'
import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
const project='sgshbawggqapuyqzkyhs'
const result=spawnSync('cmd.exe',['/d','/c','npx','--no-install','supabase','projects','api-keys','--project-ref',project,'--output','json'],{encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024});if(result.status!==0)throw Error('Preview public key lookup failed; output suppressed')
const key=JSON.parse(result.stdout).find(k=>k.name==='anon')?.api_key,claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));assert.equal(claims.ref,project);assert.equal(claims.role,'anon')
const client=createClient('https://'+project+'.supabase.co',key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
try{
 const schedule=await client.rpc('get_public_pulse_schedule');assert.equal(schedule.error,null);assert.equal(schedule.data.events.length,5);assert.ok(!('agents' in schedule.data));console.log('PASS no account, cookie or Agent ID needed to read the schedule')
 for(const [name,args] of [['send_public_pulse_notice',{requested_event_id:schedule.data.events[0].id,requested_phase:'start',requested_request_id:'11111111-1111-4111-8111-111111111111',confirmed:true}],['list_public_pulse_notices',{}],['get_pulse_alert_report',{requested_occurrence_id:'11111111-1111-4111-8111-111111111111'}]]){const denied=await client.rpc(name,args);assert.ok(denied.error);console.log('PASS anonymous visitor denied '+name)}
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Anonymous subscription timed out')),12000);client.channel('pulse-schedule-notices-v1',{config:{private:true}}).on('broadcast',{event:'notice'},()=>{}).subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve()}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timer);reject(Error('Anonymous subscription failed: '+status))}})})
 console.log('PASS real Preview notice channel connects anonymously; no login or identity lease')
}finally{await client.removeAllChannels()}
