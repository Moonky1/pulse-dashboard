import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDatasetSelection } from '../../supabase/functions/_shared/viciDatasetSelection.mjs'
import { datasetCatalog, importSource, decorateReport } from '../../src/dashboard/reportDatasets.js'
import { confirmedTargetReference, isEnglishXfer } from '../../src/dashboard/reportingPolicy.js'
import { uploadReports } from '../../src/dashboard/manualReportApi.js'
import { DATASET_ALL_TEAMS_SCOPE_ID as root } from '../../src/dashboard/allTeamsScope.js'
import { createViciImportHandler } from '../../supabase/functions/pulse-vici-import/handler.mjs'
import { fixture } from './parserFixtures.mjs'
const campaigns = ['Openers2','Openers3','Openers5','Openers6']
const child = 'dd910000-0000-4000-8000-000000000005'
const scope = {id:root,label:'All teams',user_groups:['FixtureGroup'],campaigns,can_import:true}
const selected = {kind:'run_test',campaigns:['Openers6','Openers5'],confirmed:true}
test('campaign selection requires explicit attestation and exact run-test campaigns',()=>{
  assert.deepEqual(validateDatasetSelection(selected,campaigns),{...selected,campaigns:['Openers5','Openers6']})
  for(const value of [{...selected,confirmed:false},{...selected,campaigns:['Openers5']},{...selected,campaigns:['Openers5','Openers5']},{...selected,actor:'forged'},{...selected,kind:'unknown'},{...selected,campaigns:['Unknown']}]) assert.equal(validateDatasetSelection(value,campaigns),null)
})
test('test and normal catalogs do not mix; source metadata does not assign test goals',()=>{
  const testScope = {...scope,id:child,parent_scope_id:root,dataset_kind:'run_test'}
  const catalog = [scope,testScope]
  assert.deepEqual(datasetCatalog(catalog,'run_test'),[testScope])
  assert.deepEqual(datasetCatalog(catalog,'general'),[scope])
  assert.equal(importSource(catalog,testScope),scope)
  const data = decorateReport({scope:{id:child}},catalog)
  assert.equal(isEnglishXfer(data.scope),true)
  assert.equal(confirmedTargetReference(data.scope,{current_user_group:'OpenersCO'}),'')
})
function harness(){
  const writes=[]
  const client={auth:{getUser:async()=>({data:{user:{id:'verified'}}})},rpc:async(name,args)=>{
    if(name==='list_vici_dashboard_scopes') return {data:[scope,{...scope,id:child,parent_scope_id:root,dataset_kind:'run_test'}]}
    if(name==='get_vici_dashboard') return {data:null}
    assert.equal(name,'import_vici_dataset');writes.push(args)
    return {data:{status:'success',scope_id:child,parent_scope_id:root,dataset_kind:args.requested_kind,report_date:args.report_date}}
  }}
  const env = name=>({PULSE_VICI_IMPORT_ALLOWED_ORIGINS:'https://preview.example.test',SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service'})[name]
  return {handler:createViciImportHandler({env,createClient:()=>client}),writes}
}
function request(selection=selected,parent=root){
  const body=new FormData();body.set('scopeId',parent);body.set('reportDate','2026-10-09');body.set('confirmedScope','yes');body.set('selection',JSON.stringify(selection));body.set('performance',new File([fixture('performance')],'test.csv'))
  return new Request('https://example.test/import',{method:'POST',headers:{Origin:'https://preview.example.test',Authorization:'Bearer test-session'},body})
}
test('Edge uses verified actor, canonical parent and dedicated RPC; no role claims',async()=>{
  const h=harness(),r=await h.handler(request());assert.equal(r.status,200)
  assert.equal(h.writes[0].actor_auth_id,'verified');assert.deepEqual(h.writes[0].requested_campaigns,['Openers5','Openers6']);assert.equal(h.writes[0].requested_scope,root)
  assert.equal((await r.json()).scope.parent_scope_id,root)
})
test('invalid attestation and recursive child source cannot reach writer',async()=>{
  for(const [selection,parent] of [[{...selected,confirmed:false},root],[selected,child],[{...selected,campaigns:['Openers5']},root]]) {
    const h=harness(),r=await h.handler(request(selection,parent));assert.equal(r.status,400);assert.equal(h.writes.length,0)
  }
})
test('upload response selects committed dataset, not original source; saved state survives read failure',async()=>{
  const h=harness()
  const client={functions:{invoke:async(_name,{body})=>({data:await (await h.handler(new Request('https://example.test/import',{method:'POST',headers:{Origin:'https://preview.example.test',Authorization:'Bearer test-session'},body}))).json()})}}
  const result=await uploadReports(client,{scopeId:root,reportDate:'2026-10-09',performance:new File([fixture('performance')],'test.csv'),selection:selected})
  assert.equal(result.status,'success');assert.equal(result.scope_id,child);assert.equal(result.report,null);assert.equal(result.scope.dataset_kind,'run_test')
})
