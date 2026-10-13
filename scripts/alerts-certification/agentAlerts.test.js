import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash,createHmac} from 'node:crypto'
import {Buffer} from 'node:buffer'
import {createAgentHandler} from '../../api/agent.js'
import {signAlertsToken} from '../../server/alertsToken.js'
const agentId='11111111-1111-4111-8111-111111111111',leaseId='22222222-2222-4222-8222-222222222222',occurrence='33333333-3333-4333-8333-333333333333'
const token='a'.repeat(64),secret='local-synthetic-jwt-secret-only-123456'
function setup(config={secret,url:'http://127.0.0.1:54321'},profile={agent_id:agentId}){
 const calls=[]
 const client={async rpc(name,args){calls.push({name,args});return {data:name==='agent_session_profile'?profile:name==='agent_open_pulse_alert_connection'?{lease_id:leaseId,expires_at:new Date(Date.now()+180000).toISOString(),refresh_after_seconds:120,topic:'pulse-alerts-v1'}:{ok:true},error:null}}}
 const handler=createAgentHandler(()=>client,()=>config)
 const request=async(action,args={},opts={})=>{
  const req={method:'POST',headers:{host:'preview.pulse.test','x-forwarded-proto':'https',origin:opts.origin||'https://preview.pulse.test','content-type':'application/json',cookie:opts.noCookie?'':`__Host-pulse_agent=${token}`},body:{action,args}}
  const res={writeHead(status,headers){this.status=status;this.headers=headers},end(value){this.payload=JSON.parse(value)}}
  await handler(req,res);return res
 }
 return {calls,request}
}
test('read-only Realtime token has bounded expiry and no Staff, cookie or service identity',()=>{
 const now=Date.parse('2026-10-12T16:00:00Z'),expires_at=new Date(now+180000).toISOString()
 const jwt=signAlertsToken({lease_id:leaseId,expires_at},secret,'https://preview.supabase.test',now),[header,payload,sig]=jwt.split('.')
 const claims=JSON.parse(Buffer.from(payload,'base64url'))
 assert.equal(claims.exp-claims.iat,180);assert.equal(claims.sub,leaseId);assert.equal(claims.pulse_alert_lease,leaseId)
 assert.equal(claims.role,'authenticated');assert.equal(claims.iss,'https://preview.supabase.test/auth/v1')
 assert.deepEqual(Object.keys(claims).sort(),['aud','exp','iat','iss','pulse_alert_lease','role','sub'])
 assert.equal(sig,createHmac('sha256',secret).update(header+'.'+payload).digest('base64url'))
 assert.throws(()=>signAlertsToken({lease_id:leaseId,expires_at},'short','https://preview.supabase.test',now))
 assert.throws(()=>signAlertsToken({lease_id:leaseId,expires_at:new Date(now-1).toISOString()},secret,'https://preview.supabase.test',now))
})
test('connect derives capability from verified cookie, never supplied identity',async()=>{
 const {request,calls}=setup(),r=await request('alertConnect',{connectionId:occurrence,agent_id:'spoofed',role:'service_role'})
 assert.equal(r.status,200);assert.equal(r.headers['Cache-Control'],'no-store');assert.ok(r.payload.data.token)
 assert.deepEqual(calls[1],{name:'agent_open_pulse_alert_connection',args:{requested_session_hash:createHash('sha256').update(token).digest('hex'),requested_connection_id:occurrence}})
 assert.equal(JSON.parse(Buffer.from(r.payload.data.token.split('.')[1],'base64url')).sub,leaseId)
})
test('missing signing config fails closed before creating a lease',async()=>{
 const {request,calls}=setup({}),r=await request('alertConnect',{connectionId:occurrence})
 assert.equal(r.status,503);assert.equal(r.payload.error.code,'not_configured');assert.equal(calls.length,1)
})
test('cookies and same-origin checks apply to every new Agent alert action',async()=>{
 const {request,calls}=setup()
 for(const action of ['schedule','alertConnect','alertClaim','alertReceipt','alertClose','alertPending']){
  assert.equal((await request(action,{}, {noCookie:true})).status,401)
  assert.equal((await request(action,{}, {origin:'https://outside.test'})).status,403)
 }
 assert.equal(calls.length,0)
})
test('expired verified profile never reaches alert transport',async()=>{
 const {request,calls}=setup(undefined,null)
 assert.equal((await request('alertConnect',{connectionId:occurrence})).status,401);assert.equal(calls.length,1)
})
test('claim/receipt/close bind hashes and bounded IDs while schedule uses verified Agent',async()=>{
 const {request,calls}=setup()
 for(const [action,args,expected] of [
  ['schedule',{agent_id:'spoofed'},'agent_get_pulse_schedule'],
  ['alertPending',{leaseId,sessionHash:'spoofed'},'agent_pending_pulse_alerts'],
  ['alertClaim',{leaseId,occurrenceId:occurrence,requestId:agentId,sessionHash:'spoofed'},'agent_claim_pulse_alert'],
  ['alertReceipt',{leaseId,occurrenceId:occurrence,state:'audio_blocked',agent_id:'spoofed'},'agent_record_pulse_alert_receipt'],
  ['alertClose',{leaseId,sessionHash:'spoofed'},'agent_close_pulse_alert_connection']]){
  assert.equal((await request(action,args)).status,200)
  const call=calls.at(-1);assert.equal(call.name,expected)
  if(action==='schedule')assert.equal(call.args.requested_agent_id,agentId)
  else {assert.equal(call.args.requested_session_hash,createHash('sha256').update(token).digest('hex'));assert.equal(call.args.requested_agent_id,undefined)}
 }
})
test('unbounded/malformed inputs, global send and Heard never reach service mutations',async()=>{
 const {request,calls}=setup()
 for(const [action,args] of [['alertConnect',{connectionId:'bad'}],['alertClaim',{leaseId,occurrenceId:occurrence}],['alertReceipt',{leaseId,occurrenceId:occurrence,state:'heard'}],['alertClose',{leaseId:'bad'}],['sendGlobalAlert',{}],['save_pulse_schedule_event',{}]]){
  const before=calls.length;assert.equal((await request(action,args)).status,400);assert.equal(calls.length,before+1)
 }
})
