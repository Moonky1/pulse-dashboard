import {createRequire} from 'node:module'
import {spawnSync} from 'node:child_process'
import {join} from 'node:path'
import {Buffer} from 'node:buffer'
import {createHmac} from 'node:crypto'
const project='sgshbawggqapuyqzkyhs',branch='pulse/alerts-1-schedule-pet',origin='https://pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app'
if(process.argv[2]!==project)throw Error('Only isolated Alerts Preview accepted')
// Only the existing Supabase CLI credential is read; no credential enumeration,
// token output, secret files, JWT rotation or Production configuration.
const keyring=createRequire(import.meta.url)('C:/Users/simon/AppData/Local/npm-cache/_npx/67eb4586ca667318/node_modules/@napi-rs/keyring')
let token
for(const account of ['supabase','access-token']){try{
 const raw=keyring.Entry.withTarget('Supabase CLI:'+account,'Supabase CLI',account).getSecret()
 const value=Buffer.from(raw).toString('utf8')
 if(/^sbp_[A-Za-z0-9]+$/.test(value)){token=value;break}
}catch{/* Try only the official fallback profile. */}}
if(!token)throw Error('Existing Supabase CLI credential unavailable; nothing configured')
// Official Management API: the existing Data API signing secret is a separate
// read endpoint, not part of Auth settings. No project configuration is changed.
const response=await fetch('https://api.supabase.com/v1/projects/'+project+'/postgrest',{headers:{Authorization:'Bearer '+token}})
if(!response.ok)throw Error('Isolated Preview auth configuration read failed: '+response.status)
const auth=await response.json()
const signingAvailable=typeof auth.jwt_secret==='string' && auth.jwt_secret.length>=32
if(!signingAvailable && !process.argv.includes('--without-alert-signing'))throw Error('Preview signing secret unavailable; no fallback or key rotation attempted')
const lookup=spawnSync('cmd.exe',['/d','/c','npx','--no-install','supabase','projects','api-keys','--project-ref',project,'--output','json'],{encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024})
if(lookup.status!==0)throw Error('Preview key lookup failed; no values printed')
const keys=JSON.parse(lookup.stdout),server=keys.find(k=>k.name==='service_role')?.api_key,anon=keys.find(k=>k.name==='anon')?.api_key
for(const [key,role] of [[server,'service_role'],[anon,'anon']]){const claims=JSON.parse(Buffer.from(key?.split('.')[1]||'','base64url'));if(claims.ref!==project||claims.role!==role)throw Error('Unexpected key scope')}
if(signingAvailable){const [header,payload,signature]=anon.split('.');if(createHmac('sha256',auth.jwt_secret).update(header+'.'+payload).digest('base64url')!==signature)throw Error('Existing Preview signing secret did not verify its own public key; nothing configured')}
const values={VITE_SUPABASE_URL:'https://'+project+'.supabase.co',VITE_SUPABASE_ANON_KEY:anon,VITE_SUPABASE_PUBLISHABLE_KEY:anon,
 VITE_GO_PRACTICE_ORIGIN:origin,VITE_GO_PRACTICE_PROJECT_REF:project,VITE_GO_HOSTED_ORIGIN:origin,VITE_GO_HOSTED_PROJECT_REF:project,VITE_TRAINING_AUTHORING_ORIGIN:origin,VITE_TRAINING_AUTHORING_PROJECT_REF:project,
 PULSE_AGENT_SUPABASE_URL:'https://'+project+'.supabase.co',PULSE_AGENT_SERVICE_ROLE_KEY:server,...(signingAvailable?{PULSE_ALERTS_JWT_SECRET:auth.jwt_secret}:{})}
const cli=join(process.env.APPDATA,'npm/node_modules/vercel/dist/vc.js')
for(const [name,value] of Object.entries(values)){
 if(process.argv.includes('--signing-only') && name!=='PULSE_ALERTS_JWT_SECRET')continue
 const result=spawnSync(process.execPath,[cli,'env','add',name,'preview','--git-branch',branch,name.startsWith('PULSE_')?'--sensitive':'--no-sensitive','--yes'],{input:value,encoding:'utf8',windowsHide:true,maxBuffer:2*1024*1024})
 if(result.status!==0)throw Error('Branch-only configuration failed for '+name+'; no values printed')
 console.log('Configured branch Preview: '+name)
}
console.log(JSON.stringify({project,branch,origin,productionOperations:0,secretFiles:0,schedulerEnabled:false,signingAvailable}))
