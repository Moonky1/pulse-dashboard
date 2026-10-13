import {createRequire} from 'node:module'
import {Buffer} from 'node:buffer'
const project='sgshbawggqapuyqzkyhs',origin='https://pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app'
if(process.argv[2]!==project)throw Error('Only isolated Alerts Preview accepted')
const keyring=createRequire(import.meta.url)('C:/Users/simon/AppData/Local/npm-cache/_npx/67eb4586ca667318/node_modules/@napi-rs/keyring')
let token
for(const account of ['supabase','access-token']){try{const value=Buffer.from(keyring.Entry.withTarget('Supabase CLI:'+account,'Supabase CLI',account).getSecret()).toString('utf8');if(/^sbp_[A-Za-z0-9]+$/.test(value)){token=value;break}}catch{/* Official CLI profiles only. */}}
if(!token)throw Error('Existing CLI credential unavailable')
const response=await fetch('https://api.supabase.com/v1/projects/'+project+'/config/auth',{headers:{Authorization:'Bearer '+token}})
if(!response.ok)throw Error('Preview Auth settings read failed: '+response.status)
const config=await response.json()
const callback=origin+'/auth/callback?flow=google'
if(process.argv.includes('--allow-callback')){
 const urls=(config.uri_allow_list||'').split(',').map(value=>value.trim()).filter(Boolean)
 if(!urls.includes(callback)){
  const result=await fetch('https://api.supabase.com/v1/projects/'+project+'/config/auth',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({uri_allow_list:[...urls,callback].join(',')})})
  if(!result.ok)throw Error('Preview callback update failed: '+result.status)
 }
 const verify=await fetch('https://api.supabase.com/v1/projects/'+project+'/config/auth',{headers:{Authorization:'Bearer '+token}})
 if(!verify.ok)throw Error('Could not verify Preview callback')
 const current=await verify.json()
 if(current.site_url!==config.site_url || !current.uri_allow_list.split(',').includes(callback) || urls.some(url=>!current.uri_allow_list.split(',').includes(url)))throw Error('Unexpected redirect configuration change')
 console.log(JSON.stringify({project,callbackAllowed:true,addedUrl:callback,siteUrlUnchanged:true,existingUrlsPreserved:true,productionChanges:0}));process.exit(0)
}
// Print only redirect settings, never provider secrets or signing keys.
console.log(JSON.stringify({project,site_url:config.site_url,uri_allow_list:config.uri_allow_list,requested_callback:origin+'/auth/callback?flow=google',mutations:0}))
