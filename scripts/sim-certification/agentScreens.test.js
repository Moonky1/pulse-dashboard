import assert from 'node:assert/strict'
import test from 'node:test'
import { createAgentHandler } from '../../api/agent.js'

const id='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222'
function runtime({ allowed=true, valid=true, audio=false }={}) {
  const calls=[], client={ rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='agent_session_profile'?{agent_id:id}:allowed,error:null}},
    from:()=>({select(){return this},eq(){return this},async maybeSingle(){calls.push(['media']);return {data:{storage_bucket:'training-media',storage_path:audio?'private/clip.wav':'private/screen.png',status:valid?'ready':'pending',media_kind:audio?'simulation_audio':'simulation_screen',mime_type:audio?'audio/wav':'image/png'},error:null}}}),
    storage:{from:()=>({async createSignedUrl(path,ttl){calls.push(['sign',path,ttl]);return {data:{signedUrl:'https://backend.test/signed'},error:null}}})},
  }
  const handler=createAgentHandler(()=>client)
  return {calls,async invoke({token='a'.repeat(64),origin='https://sim.test',action='simulationScreen',args={contentId:id,mediaId:id,attemptId:id,agentId:other}}={}) {
    const response={writeHead(status){this.status=status},end(body){this.body=JSON.parse(body)}}
    await handler({method:'POST',headers:{host:'sim.test',origin,'content-type':'application/json',cookie:token?'__Host-pulse_agent='+token:''},body:{action,args}},response)
    return response
  }}
}
test('Agent screen uses verified cookie identity, ignores browser Agent ID, and signs for 120 seconds',async()=>{const r=runtime();assert.equal((await r.invoke()).status,200);assert.equal(r.calls[1][1].requested_agent_id,id);assert.deepEqual(r.calls.at(-1),['sign','private/screen.png',120])})
test('Random case selection uses verified Agent cookie, ignoring client case and identity',async()=>{const r=runtime();assert.equal((await r.invoke({action:'simulationRandom',args:{agentId:other,contentId:other,disposition:'DNC'}})).status,200);assert.deepEqual(r.calls[1],['agent_assign_vici_random',{requested_agent_id:id}]);assert.equal((await runtime().invoke({action:'simulationRandom',token:''})).status,401)})
test('cross-origin or missing cookie cannot get a screen',async()=>{const r=runtime();assert.equal((await r.invoke({token:''})).status,401);assert.equal((await r.invoke({origin:'https://other.test'})).status,403);assert.equal(r.calls.length,0)})
test('denied current-step authorization never reads a media path or signs',async()=>{const r=runtime({allowed:false});assert.equal((await r.invoke()).status,403);assert.equal(r.calls.length,2);assert.equal(r.calls[1][0],'agent_can_read_simulation_screen')})
test('unfinished media and missing attempt cannot be signed',async()=>{const r=runtime({valid:false});assert.equal((await r.invoke()).status,404);assert.ok(!r.calls.some(c=>c[0]==='sign'));assert.equal((await r.invoke({args:{contentId:id,mediaId:id}})).status,400)})
test('Agent audio uses cookie identity and current-cue gate, never trusts supplied Agent IDs',async()=>{const r=runtime({audio:true});assert.equal((await r.invoke({action:'simulationAudio'})).status,200);assert.equal(r.calls[1][0],'agent_can_read_vici_audio');assert.equal(r.calls[1][1].requested_agent_id,id);assert.deepEqual(r.calls.at(-1),['sign','private/clip.wav',120])})
test('denied audio never looks up its path; wrong type or anonymous request cannot sign',async()=>{const deny=runtime({audio:true,allowed:false});assert.equal((await deny.invoke({action:'simulationAudio'})).status,403);assert.equal(deny.calls.length,2);assert.equal((await runtime().invoke({action:'simulationAudio'})).status,404);assert.equal((await runtime({audio:true}).invoke({action:'simulationAudio',token:''})).status,401)})
