import assert from 'node:assert/strict'
import test from 'node:test'
import { createAgentHandler } from '../../api/agent.js'
import { VICI_CASES, newViciPreview, previewViciCommand } from '../../src/simulations/viciModel.js'

test('Dial Now starts a live call; only Hangup, disposition and Submit complete it', () => {
  let state = newViciPreview('callback')
  assert.equal(state.dialer.pause_menu,false)
  state = previewViciCommand(state,'manual')
  assert.equal(state.dialer.phase,'manual')
  state = previewViciCommand(state,'dial','202-555-0147')
  assert.equal(state.status,'started'); assert.equal(state.mistakes,1)
  state = previewViciCommand(state,'dial','2025550147')
  assert.equal(state.status,'started'); assert.equal(state.dialer.phase,'live')
  state = previewViciCommand(state,'hangup')
  assert.equal(state.dialer.phase,'call_disposition')
  state = previewViciCommand(state,'callDisposition','NI')
  assert.equal(state.status,'started')
  state = previewViciCommand(state,'submit','active')
  assert.equal(state.status,'completed'); assert.equal(state.dialer.is_paused,false)
})
test('pause codes open only from unpaused status; checked Submit returns paused', () => {
  let state = newViciPreview('callback')
  state = previewViciCommand(state,'status')
  assert.equal(state.dialer.is_paused,false); assert.equal(state.dialer.pause_menu,false)
  state = previewViciCommand(state,'status')
  assert.equal(state.dialer.pause_menu,true)
  state = previewViciCommand(state,'callbacks')
  assert.equal(state.dialer.is_paused,true); assert.equal(state.mistakes,0)
  for (const [cmd,value] of [['manual'],['dial','2025550147'],['hangup'],['callDisposition','A'],['submit','paused']]) state=previewViciCommand(state,cmd,value)
  assert.equal(state.status,'completed'); assert.equal(state.dialer.is_paused,true)
})
test('Asia rejects SPXFER routing, then requires XFER and Submit with no goal or hints', () => {
  let state = newViciPreview('asia')
  assert.equal(state.challenge.goal,undefined); assert.equal(state.hints,undefined)
  for (const [command,value] of [['presets'],['language','Spanish'],['local'],['disposition','SPXFER']]) state = previewViciCommand(state,command,value)
  assert.equal(state.status,'started'); assert.equal(state.mistakes,1)
  state = previewViciCommand(state,'disposition','SPANISH SPEAKER')
  assert.equal(state.status,'started'); assert.equal(state.dialer.phase,'call_disposition')
  state=previewViciCommand(state,'callDisposition','XFER')
  state=previewViciCommand(state,'submit','active')
  assert.equal(state.status,'completed')
  assert.equal(Object.keys(VICI_CASES).length,2)
})
test('manual command and assignment derive identity only from the verified cookie', async () => {
  const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',calls=[]
  const handler=createAgentHandler(()=>({rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='agent_session_profile'?{agent_id:id}:{ok:true},error:null}}}))
  async function request(action,args,origin='https://vici.test') {
    const response={writeHead(status){this.status=status},end(value){this.data=JSON.parse(value)}}
    await handler({method:'POST',headers:{host:'vici.test',origin,'content-type':'application/json',cookie:'__Host-pulse_agent='+'a'.repeat(64)},body:{action,args}},response)
    return response
  }
  assert.equal((await request('simulationAssign',{requested_agent_id:other})).status,200)
  assert.deepEqual(calls.at(-1),['agent_assign_vici_challenge',{requested_agent_id:id}])
  assert.equal((await request('simulationCommand',{attemptId:other,version:2,requestId:other,command:'dial',value:'2025550147',requested_agent_id:other})).status,200)
  assert.equal(calls.at(-1)[1].requested_agent_id,id)
  assert.equal((await request('simulationCommand',{attemptId:other,version:2,requestId:other,command:'complete'})).status,400)
  assert.equal((await request('simulationAssign',{},'https://other.test')).status,403)
})
