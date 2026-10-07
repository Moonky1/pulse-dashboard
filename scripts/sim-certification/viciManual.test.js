import assert from 'node:assert/strict'
import test from 'node:test'
import { createAgentHandler } from '../../api/agent.js'
import { VICI_CASES, newViciPreview, previewViciCommand } from '../../src/simulations/viciModel.js'

test('manual Callback uses the actual Dial Now command with typed digits, not Confirm Entry', () => {
  let state = newViciPreview('callback')
  for (const command of ['callbacks','logo','manual']) state = previewViciCommand(state,command)
  assert.equal(state.dialer.phase,'manual')
  state = previewViciCommand(state,'dial','202-555-0147')
  assert.equal(state.status,'started'); assert.equal(state.mistakes,1)
  state = previewViciCommand(state,'dial','2025550147')
  assert.equal(state.status,'completed'); assert.equal(state.state_version,6)
})
test('Asia is a manual routing task with a constant goal and optional, charged-once hints', () => {
  let state = newViciPreview('asia'), goal = state.challenge.goal
  state = previewViciCommand(state,'hint'); state = previewViciCommand(state,'hint')
  assert.equal(state.hints,1)
  for (const [command,value] of [['presets'],['language','Spanish'],['local'],['disposition','SPXFER']]) state = previewViciCommand(state,command,value)
  assert.equal(state.status,'started'); assert.equal(state.mistakes,1)
  state = previewViciCommand(state,'disposition','SPANISH SPEAKER')
  assert.equal(state.status,'completed'); assert.equal(state.challenge.goal,goal)
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
