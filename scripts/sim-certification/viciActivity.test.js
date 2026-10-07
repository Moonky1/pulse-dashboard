import assert from 'node:assert/strict'
import test from 'node:test'
import { appendViciActivity, viciActionLabel } from '../../src/simulations/viciActivity.js'
import { PAUSE_CODES } from '../../src/simulations/viciModel.js'
import { playViciClick, setViciSoundEnabled, VICI_CLICK_SOUND } from '../../src/simulations/viciSound.js'

test('numbered actions distinguish server correctness, neutral controls, and unsaved requests', () => {
  let entries=[]
  for (const [cmd,result] of [['presets',{correct:true}],['local',{correct:false}],['status',{}],['resume',{error:true}]]) entries=appendViciActivity(entries,cmd,null,result)
  assert.deepEqual(entries.map(entry=>entry.number),[1,2,3,4])
  assert.deepEqual(entries.map(entry=>entry.outcome),['correct','incorrect','done','unsaved'])
  assert.equal(appendViciActivity(entries,'submit','active',{correct:true}).at(-1).label,'SUBMIT · Active')
})
test('presentation log bounds memory and never stores raw phone, secret or expected step values', () => {
  let entries=[]
  for(let i=0;i<300;i++)entries=appendViciActivity(entries,'dial','secret-typed-phone',{correct:true,expected_value:'private-answer'})
  assert.equal(entries.length,200); assert.equal(entries[0].number,101); assert.equal(entries.at(-1).number,300)
  assert.doesNotMatch(JSON.stringify(entries),/secret|private-answer|expected_value/)
  assert.equal(viciActionLabel('disposition','untrusted-value'),'Local Closer disposition')
  assert.match(viciActionLabel('callDisposition','SPANIS'),/SPANIS - Spanish Speaker/)
  for(const [command,label] of PAUSE_CODES.flat())assert.equal(viciActionLabel(command),label)
})
test('gentle click respects mute, unsupported audio and a bounded gain and duration', () => {
  assert.ok(VICI_CLICK_SOUND.peak<=0.02); assert.ok(VICI_CLICK_SOUND.duration<=0.05)
  assert.equal(playViciClick(),false)
  const scheduled=[]
  globalThis.AudioContext=class {
    state='running'; currentTime=0; destination={}
    createOscillator(){const note={};scheduled.push(note);return {frequency:{setValueAtTime:v=>{note.frequency=v}},connect(){},disconnect(){},start:v=>{note.start=v},stop:v=>{note.stop=v}}}
    createGain(){const note=scheduled.at(-1);return {gain:{setValueAtTime(){},exponentialRampToValueAtTime:v=>{note.peak=Math.max(note.peak||0,v)}},connect(){},disconnect(){}}}
  }
  try {
    setViciSoundEnabled(false); assert.equal(playViciClick(),false); assert.equal(scheduled.length,0)
    setViciSoundEnabled(true); assert.equal(playViciClick(),true); assert.equal(scheduled[0].peak,0.018)
    assert.ok(scheduled[0].stop-scheduled[0].start<=0.051)
    assert.equal(playViciClick(),false,'duplicate gesture sound is suppressed')
  } finally {delete globalThis.AudioContext;setViciSoundEnabled(true)}
})
