import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {spawnSync} from 'node:child_process'
import {Buffer} from 'node:buffer'
const project='sgshbawggqapuyqzkyhs'
if(process.argv[2]!==project||process.argv[3]!=='--synthetic-only')throw Error('Exact isolated Preview and synthetic-only authorization required')
const keyring=createRequire(import.meta.url)('C:/Users/simon/AppData/Local/npm-cache/_npx/67eb4586ca667318/node_modules/@napi-rs/keyring')
let token
for(const account of ['supabase','access-token'])try{const raw=Buffer.from(keyring.Entry.withTarget('Supabase CLI:'+account,'Supabase CLI',account).getSecret()).toString('utf8');if(/^sbp_[A-Za-z0-9]+$/.test(raw)){token=raw;break}}catch{/* Existing CLI account only. */}
if(!token)throw Error('Authorized operator unavailable')
async function query(sql){const r=await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query:sql})});if(!r.ok)throw Error('Preview setup failed: '+r.status);return r.json()}
const sql=`begin;
do $$ begin
 if (select count(*) from public.agents a join public.teams t on t.id=a.team_id where a.status='active' and t.is_active)<>3
 or (select count(*) from public.agents a join public.teams t on t.id=a.team_id where a.status='active' and t.is_active and a.agent_code in('990001','990002','990003') and a.display_name='Agent '||a.agent_code)<>3 then raise exception 'Only the three existing synthetic Agents are allowed'; end if;
 if not exists(select 1 from public.pulse_alert_settings where environment='preview') then raise exception 'Preview contract required'; end if;
end $$;
create extension if not exists pg_cron with schema pg_catalog;
commit; select extversion from pg_extension where extname='pg_cron';`
const extension=await query(sql);assert.ok(extension[0]?.extversion)
const lookup=spawnSync('cmd.exe',['/d','/c','npx','--no-install','supabase','projects','api-keys','--project-ref',project,'--output','json'],{encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024});if(lookup.status!==0)throw Error('Preview key lookup failed; output suppressed')
const key=JSON.parse(lookup.stdout).find(k=>k.name==='service_role')?.api_key,claims=JSON.parse(Buffer.from(key?.split('.')[1]||'','base64url'));assert.equal(claims.ref,project);assert.equal(claims.role,'service_role')
const response=await fetch(`https://${project}.supabase.co/rest/v1/rpc/activate_preview_pulse_alert_scheduler`,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:'{}'});if(!response.ok){const error=await response.json();throw Error('Preview scheduler activation failed: '+response.status+' '+error.code+' '+String(error.message).replace(/eyJ[A-Za-z0-9_.-]+/g,'[redacted]').slice(0,350))}await response.body?.cancel()
const proof=await query("select (select enabled from public.pulse_alert_settings) as enabled,count(*)::int as jobs,min(schedule) as schedule from cron.job where jobname='pulse-alerts-v1-'||current_database() and active;")
assert.equal(proof[0].enabled,true);assert.equal(proof[0].jobs,1)
console.log(JSON.stringify({project,syntheticAgents:3,extensionVersion:extension[0].extversion,...proof[0],productionOperations:0,secretsPrinted:false}))
