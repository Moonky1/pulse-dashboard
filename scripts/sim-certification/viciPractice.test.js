import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VICI_PRACTICES, newViciPractice, practiceViciCommand, viciCustomer } from '../../src/simulations/viciPractice.js'
import { practiceTemplate, validateSimulationSteps } from '../../src/simulations/templates.js'
import { viciActionLabel } from '../../src/simulations/viciActivity.js'

for(const [scenario,item] of Object.entries(VICI_PRACTICES)) test(scenario+' has a completable ordered manual practice and publishable template',()=>{
  let snapshot=newViciPractice(scenario)
  for(const command of item.commands){const value=item.values[command]==='customer-phone'?snapshot.dialer.customer.phone:item.values[command]|| (command==='submit'?'active':undefined);snapshot=practiceViciCommand(snapshot,command,value,command==='leave'?16000:0);assert.equal(snapshot.correct,true,command)}
  assert.equal(snapshot.status,'completed')
  const steps=practiceTemplate(scenario).map(step=>({...step,screen_media_id:'synthetic-local-media',hint:'Private authoring hint'}))
  assert.equal(validateSimulationSteps(steps),null)
})
test('English and SPXFER reject early departure but allow exactly 15 seconds; SPANIS has no warm handoff',()=>{
  for(const name of ['english','spxfer']){
    let snapshot=newViciPractice(name)
    for(const command of VICI_PRACTICES[name].commands.slice(0,-3))snapshot=practiceViciCommand(snapshot,command,VICI_PRACTICES[name].values[command],1000)
    assert.equal(practiceViciCommand(snapshot,'leave',null,15999).correct,false)
    assert.equal(practiceViciCommand(snapshot,'leave',null,16000).correct,true)
  }
  assert.ok(!VICI_PRACTICES.asia.commands.includes('connect'))
  assert.ok(!VICI_PRACTICES.asia.commands.includes('leave'))
  assert.equal(VICI_PRACTICES.asia.values.callDisposition,'SPANIS')
})
test('full mailbox and answering machine use A; Dead Air uses DAIR',()=>{
  assert.equal(VICI_PRACTICES.mailbox_full.values.callDisposition,'A')
  assert.equal(VICI_PRACTICES.answering.values.callDisposition,'A')
  assert.equal(VICI_PRACTICES.dead_air.values.callDisposition,'DAIR')
})
test('callback cannot skip CB, logo, number verification; 20 customers cycle with intentionally missing fields',()=>{
  let snapshot=newViciPractice('callback')
  assert.equal(practiceViciCommand(snapshot,'manual').correct,false)
  const customers=Array.from({length:20},(_,i)=>viciCustomer(i))
  assert.equal(new Set(customers.map(c=>c.phone)).size,20)
  assert.equal(customers.filter(c=>!c.payment).length,4)
  assert.equal(customers.filter(c=>!c.origination).length,4)
  for(let i=0;i<20;i++) snapshot=practiceViciCommand(snapshot,'newCustomer')
  assert.equal(snapshot.dialer.customer.index,0)
  snapshot=practiceViciCommand(snapshot,'status')
  assert.equal(practiceViciCommand(snapshot,'newCustomer').correct,false)
})
test('regional transfer dispositions never collapse into each other',()=>{
  for(const name of ['english','spxfer','asia']){
    let snapshot=newViciPractice(name)
    const item=VICI_PRACTICES[name]
    for(const command of item.commands.slice(0,-2))snapshot=practiceViciCommand(snapshot,command,item.values[command],command==='leave'?16000:0)
    for(const wrong of ['XFER','SPXFER','SPANIS'].filter(c=>c!==item.values.callDisposition))assert.equal(practiceViciCommand(snapshot,'callDisposition',wrong).correct,false)
  }
})
test('fake login sends reviewed markers only, never password text in commands or activity',()=>{
  const source=readFileSync('src/simulations/ViciLogin.jsx','utf8')
  assert.match(source,/valid\?\(phase==='phone_login'\?'training':campaign\):'invalid'/)
  assert.match(source,/setPassword\(''\)/)
  assert.equal(viciActionLabel('phoneLogin','anything-private'),'Phone Login · SUBMIT')
  assert.equal(viciActionLabel('dial','2025550147'),'Dial Now')
})
