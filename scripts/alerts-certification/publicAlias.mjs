import {spawnSync} from 'node:child_process'
import {join} from 'node:path'
const domain='pulse-kk-git-pulse-alerts-1-schedule-pet-pulsekk.vercel.app',team='team_L2YnnJNTfvc3WNjry7wSngSV',project='prj_AXTdi9dmYYadU08qwuKGvt82M4hg'
function api(path,body){const cli=join(process.env.APPDATA,'npm/node_modules/vercel/dist/vc.js'),args=[cli,'api',path,'--raw'];if(body)args.push('-X','PATCH','--input','-');const r=spawnSync(process.execPath,args,{input:body?JSON.stringify(body):undefined,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});if(r.status!==0)throw Error('Preview alias operation failed; response suppressed');return JSON.parse(r.stdout)}
const alias=api('/v4/aliases/'+domain+'?teamId='+team)
if(alias.alias!==domain||alias.projectId!==project)throw Error('Unexpected alias; no changes made')
console.log(JSON.stringify({domain,id:alias.uid||alias.id,projectId:alias.projectId,existingPublicException:!!Object.values(alias.protectionBypass||{}).find(v=>v.scope==='alias-protection-override')}))
if(process.argv.includes('--public')){
 api('/aliases/'+(alias.uid||alias.id)+'/protection-bypass?teamId='+team,{override:{scope:'alias-protection-override',action:'create'}})
 const response=await fetch('https://'+domain+'/schedule',{redirect:'manual'});if(response.status!==200)throw Error('Public Preview still requires platform access: '+response.status)
 console.log(JSON.stringify({publicPreview:true,status:response.status,productionChanges:0,otherAliasesChanged:0,secretsExposed:false}))
}
