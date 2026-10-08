import test from 'node:test'
import assert from 'node:assert/strict'
import { buildViciImportPlan, publishViciImportTask, MANUAL_IMPORT_PRACTICES } from '../../src/simulations/viciImport.js'
import { OPENER_TEAMS } from '../../src/simulations/templates.js'
const teams=OPENER_TEAMS.map((code,i)=>({code,id:`34000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name:code}))
const topicId='20880000-0000-4000-8000-000000000001'
const clip={file:{name:'private.mp3',size:8000},disposition:'A',explanation:'Reviewed greeting.'}
const plan=args=>buildViciImportPlan({clips:[clip],manual:[],teams,topicId,confirmed:true,...args})
test('batch preparation keeps per-team scopes and separate regional workflows',()=>{
  assert.equal(plan().length,8)
  assert.equal(plan({clips:[{...clip,disposition:'SPANIS'}]}).length,5)
  assert.equal(plan({clips:[],manual:['spxfer']}).length,3)
  assert.equal(plan({clips:[],manual:['asia']}).length,5)
  assert.equal(plan({clips:[],manual:MANUAL_IMPORT_PRACTICES}).length,40)
})
test('batch rejects missing attestation, foreign teams, unknown answers and unreviewed clips',()=>{
  for(const args of [{confirmed:false},{teams:[{...teams[0],code:'closers'}]},{teams:[teams[0],teams[0]]},{clips:[{...clip,disposition:'SPXFER'}]},{clips:[{...clip,explanation:''}]},{clips:[{...clip,disposition:'SPANIS'}],teams:teams.filter(t=>['colombia','venezuela','central_america'].includes(t.code))}])assert.throws(()=>plan(args))
})
test('batch authoring uses exact draft CAS and private media before publication',async()=>{
  const calls=[],events=[],contentId='90880000-0000-4000-8000-000000000001'
  await publishViciImportTask(plan({teams:[teams[0]]})[0],topicId,{rpc:async(name,args)=>{calls.push({name,args});return{data:name==='get_studio_capabilities'?{can_publish:true}:{id:contentId,updated_at:String(calls.length)}}},screen:async()=> 'screen',audio:async()=> 'private-media'},e=>events.push(e))
  assert.deepEqual(calls.map(c=>c.name),['create_simulation_draft','get_studio_capabilities','replace_simulation_steps','configure_vici_random_case','configure_vici_audio','publish_training_content'])
  assert.equal(calls[0].args.requested_scope_type,'team')
  assert.equal(calls[1].args.requested_content_id,contentId)
  assert.equal(calls[2].args.expected_updated_at,'1')
  assert.equal(calls[3].args.expected_updated_at,'3')
  assert.equal(calls[4].args.requested_cue,'customer')
  assert.equal(calls[5].args.expected_updated_at,'5')
  assert.deepEqual(events.map(e=>e.stage),['draft','published'])
})

test('create-only Staff retains a known draft without uploading or publishing',async()=>{
  const calls=[],events=[],contentId='90880000-0000-4000-8000-000000000001'
  await assert.rejects(publishViciImportTask(plan({teams:[teams[0]]})[0],topicId,{rpc:async(name)=>{calls.push(name);return{data:name==='create_simulation_draft'?{id:contentId,updated_at:'1'}:{can_publish:false}}},screen:async()=>assert.fail('No upload allowed'),audio:async()=>assert.fail('No upload allowed')},e=>events.push(e)),/Publishing is not permitted/)
  assert.deepEqual(calls,['create_simulation_draft','get_studio_capabilities'])
  assert.deepEqual(events,[{contentId,stage:'draft'}])
})
test('a denied authoring operation stops without publication or hidden retries',async()=>{
  const calls=[]
  await assert.rejects(publishViciImportTask(plan({teams:[teams[0]]})[0],topicId,{rpc:async(name)=>{calls.push(name);return{error:{message:'Denied'}}}},()=>{}),/Denied/)
  assert.deepEqual(calls,['create_simulation_draft'])
})
