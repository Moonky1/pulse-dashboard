import {spawnSync} from 'node:child_process'
import {Buffer} from 'node:buffer'
const project='sgshbawggqapuyqzkyhs'
const result=spawnSync('cmd.exe',['/d','/c','npx','--no-install','supabase','projects','api-keys','--project-ref',project,'--output','json'],{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024})
if(result.status!==0)throw Error('Preview key lookup failed; key output suppressed')
const key=JSON.parse(result.stdout).find(k=>k.name==='anon')?.api_key
const claims=JSON.parse(Buffer.from(key?.split('.')[1]||'','base64url'))
if(claims.ref!==project || claims.role!=='anon')throw Error('Unexpected Preview public key scope')
const checks=[]
for(const [name,args] of [['get_pulse_schedule',{}],['agent_get_pulse_schedule',{requested_agent_id:'11111111-1111-4111-8111-111111111111'}],['list_pulse_alert_occurrences',{}],['pulse_alert_scheduler_tick',{}],['agent_pending_pulse_alerts',{requested_session_hash:'a'.repeat(64),requested_lease_id:'11111111-1111-4111-8111-111111111111'}]]){
 const response=await fetch('https://'+project+'.supabase.co/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(10000)})
 await response.body?.cancel()
 if(![401,403].includes(response.status))throw Error(name+' not denied: '+response.status)
 checks.push({rpc:name,anonymousDenied:response.status})
}
console.log(JSON.stringify({project,checks,remoteWrites:0,keysPrinted:false}))
