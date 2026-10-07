import assert from 'node:assert/strict'
import test from 'node:test'
import { createAgentHandler } from '../../api/agent.js'

const id='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222'
function runtime({ allowed=true, valid=true }={}) {
  const calls=[], client={ rpc:async(name,args)=>{calls.push([name,args]);return {data:name==='agent_session_profile'?{agent_id:id}:allowed,error:null}},
    from:()=>({select(){return this},eq(){return this},async maybeSingle(){calls.push(['media']);return {data:{storage_bucket:'training-media',storage_path:'private/screen.png',status:valid?'ready':'pending',media_kind:'simulation_screen',mime_type:'image/png'},error:null}}}),
    storage:{from:()=>({async createSignedUrl(path,ttl){calls.push(['sign',path,ttl]);return {data:{signedUrl:'https://backend.test/signed'},error:null}}})},
  }
  const handler=createAgentHandler(()=>client)
  return {calls,async invoke({token='a'.repeat(64),origin='https://sim.test',args={contentId:id,mediaId:id,attemptId:id,agentId:other}}={}) {
    const response={writeHead(status){this.status=status},end(body){this.body=JSON.parse(body)}}
    await handler({method:'POST',headers:{host:'sim.test',origin,'content-type':'application/json',cookie:token?'__Host-pulse_agent='+token:''},body:{action:'simulationScreen',args}},response)
    return response
  }}
}
test('Agent screen uses verified cookie identity, ignores browser Agent ID, and signs for 120 seconds',async()=>{const r=runtime();assert.equal((await r.invoke()).status,200);assert.equal(r.calls[1][1].requested_agent_id,id);assert.deepEqual(r.calls.at(-1),['sign','private/screen.png',120])})
test('cross-origin or missing cookie cannot get a screen',async()=>{const r=runtime();assert.equal((await r.invoke({token:''})).status,401);assert.equal((await r.invoke({origin:'https://other.test'})).status,403);assert.equal(r.calls.length,0)})
test('denied current-step authorization never reads a media path or signs',async()=>{const r=runtime({allowed:false});assert.equal((await r.invoke()).status,403);assert.equal(r.calls.length,2);assert.equal(r.calls[1][0],'agent_can_read_simulation_screen')})
test('unfinished media and missing attempt cannot be signed',async()=>{const r=runtime({valid:false});assert.equal((await r.invoke()).status,404);assert.ok(!r.calls.some(c=>c[0]==='sign'));assert.equal((await r.invoke({args:{contentId:id,mediaId:id}})).status,400)})
