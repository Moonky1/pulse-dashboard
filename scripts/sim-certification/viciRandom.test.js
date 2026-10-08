import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VICI_MENU, viciCustomer } from '../../src/simulations/viciPractice.js'
import { randomDispositionTemplate,RANDOM_DISPOSITIONS,validateSimulationSteps } from '../../src/simulations/templates.js'
import { VICI_CLIP_PLAN } from './viciClipPlan.mjs'

test('seven supplied clips keep the trainer-reviewed callback override and regional SPANIS',()=>{
  assert.equal(VICI_CLIP_PLAN.length,7)
  for(const item of VICI_CLIP_PLAN)assert.ok(RANDOM_DISPOSITIONS.includes(item.disposition))
  assert.equal(VICI_CLIP_PLAN.find(item=>item.file==='I cant talk right now.mp3').disposition,'CALLBK')
  assert.equal(VICI_CLIP_PLAN.find(item=>item.file==='I cant talk right now.mp3').trainerOverride,true)
  assert.equal(VICI_CLIP_PLAN.find(item=>item.disposition==='SPANIS').teams,'local-spanish-openers')
})
test('manual menu separates processes from blind audio practice',()=>{
  assert.deepEqual(Object.keys(VICI_MENU),['random','english','spxfer','asia','callback','login','mock'])
  assert.equal(VICI_MENU.random.title,'Random Dispositions')
})
test('all twenty fictional customers preserve unavailable fields as blank',()=>{
  for(let i=0;i<20;i++)for(const field of ['year','make','model','odometer','vin','email','close'])assert.equal(viciCustomer(i)[field],'')
})
test('random authoring templates have bounded reviewed codes and canonical Submit',()=>{
  for(const code of RANDOM_DISPOSITIONS){const steps=randomDispositionTemplate(code).map(s=>({...s,screen_media_id:'local-test'}));assert.equal(validateSimulationSteps(steps),null);assert.deepEqual(steps.map(s=>s.expected_value),[null,code,'submit']);assert.ok(!steps[1].prompt.includes(code))}
  assert.throws(()=>randomDispositionTemplate('SPXFER'))
})
test('Staff reference never imports local answer engine or shows source filenames',()=>{
  const source=readFileSync('src/simulations/ViciRandomReference.jsx','utf8')
  assert.doesNotMatch(source,/practiceViciCommand|\.situation|\.filename|\.expected_value/)
  assert.match(source,/submit_vici_random_reference/)
  assert.match(source,/snapshot\.review&&/)
})
