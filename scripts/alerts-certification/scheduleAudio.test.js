import test from 'node:test'
import assert from 'node:assert/strict'
import {todaySchedule,pacificInstant,clockLabel,dateInZone,countdown,alertTitle,PACIFIC} from '../../src/alerts/scheduleModel.js'
import {PulseAlarmAudio,SOUNDS} from '../../src/alerts/alarmAudio.js'
const event=(name,type,start,end,days=[1,2,3,4,5])=>({id:name,config:{name,type,start,end,days,enabled:true}})
const schedule={events:[event('Shift','shift','06:45','17:00'),event('Break 1','break','09:00','09:15'),event('Lunch','lunch','12:00','13:00'),event('Break 2','break','14:30','14:40'),event('Saturday','shift','08:45','14:00',[6])]}
test('weekday shift, both breaks and lunch resolve from configured data, not browser alarm timers',()=>{
 for(const [time,status,next] of [['06:40','Before your shift','Shift starts'],['06:45','Working time','Break 1 starts'],['09:00','Break time','Return to production'],['09:15','Working time','Lunch starts'],['12:00','Lunch time','Return to production'],['13:00','Working time','Break 2 starts'],['14:30','Break time','Return to production'],['14:40','Working time','Shift complete'],['17:00','Shift complete',undefined]]){
  const day=todaySchedule(schedule,pacificInstant('2026-10-12',time));assert.equal(day.status,status);assert.equal(day.next?.label,next)
 }
})
test('Saturday has one continuous shift; Sunday has no fabricated shift',()=>{
 assert.equal(todaySchedule(schedule,pacificInstant('2026-10-17','09:00')).events.length,1)
 assert.equal(todaySchedule(schedule,pacificInstant('2026-10-17','14:00')).status,'Shift complete')
 assert.equal(todaySchedule(schedule,pacificInstant('2026-10-18','09:00')).status,'No shift today')
})
test('Pacific DST and fold/gap conversion matches PostgreSQL standard-time resolution',()=>{
 for(const [date,time,iso] of [['2026-03-07','09:00','2026-03-07T17:00:00.000Z'],['2026-03-08','09:00','2026-03-08T16:00:00.000Z'],['2026-03-08','02:30','2026-03-08T10:30:00.000Z'],['2026-11-01','01:30','2026-11-01T09:30:00.000Z'],['2026-11-01','09:00','2026-11-01T17:00:00.000Z']])assert.equal(new Date(pacificInstant(date,time)).toISOString(),iso)
})
test('Managua, Bogota and Manila are display only; next local calendar date is accurate',()=>{
 const at=pacificInstant('2026-10-12','12:00')
 assert.equal(clockLabel(at,PACIFIC),'12:00 PM');assert.equal(clockLabel(at,'America/Managua'),'1:00 PM');assert.equal(clockLabel(at,'America/Bogota'),'2:00 PM');assert.equal(clockLabel(at,'Asia/Manila'),'3:00 AM');assert.equal(dateInZone(at,'Asia/Manila'),'2026-10-13')
 assert.equal(countdown(at,at-61000),'01:01');assert.equal(countdown(at,at+1),'00:00')
})
test('pre/start/return text is human readable',()=>{
 const c={name:'Break 1',type:'break',pre_minutes:5}
 assert.equal(alertTitle({event:c,phase:'pre'}),'Break 1 in 5 minutes');assert.equal(alertTitle({event:c,phase:'start'}),'Break time');assert.equal(alertTitle({event:c,phase:'end'}),'Return to production')
})
function context(){const c={state:'suspended',currentTime:0,destination:{},gains:[],oscillators:[],resume:async()=>{c.state='running'}};c.createOscillator=()=>{const o={frequency:{},connect(){},disconnect(){this.disconnected=true},start(){},stop(at){if(Number.isFinite(at))this.end=at}};c.oscillators.push(o);return o};c.createGain=()=>{const g={gain:{setValueAtTime(){},linearRampToValueAtTime(value){c.gains.push(value)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){this.disconnected=true}};return g};return c}
test('original library respects Pulse gain, finite duration, one audio context and cleanup',async()=>{
 const ctx=context(),audio=new PulseAlarmAudio(()=>ctx),config={sound:'double_alert',volume:50,duration_seconds:4,repeat:2}
 assert.equal(audio.play(config),false);assert.equal(await audio.arm(),true)
 for(const [sound] of SOUNDS){assert.equal(audio.play({...config,sound}),true);assert.ok(ctx.oscillators.every(o=>o.end<=8));assert.ok(ctx.gains.every(g=>g===.065))}
 audio.play({...config,duration_seconds:100,repeat:100});assert.ok(ctx.oscillators.every(o=>o.end<=30));audio.stop();assert.equal(audio.nodes.length,0);assert.ok(ctx.oscillators.every(o=>o.disconnected))
 assert.equal(audio.play({...config,volume:0}),false);ctx.state='suspended';assert.equal(audio.play(config),false)
})
test('browser refusing audio is a normal fallback, never retried on play',async()=>{
 let attempts=0;const audio=new PulseAlarmAudio(()=>{attempts++;throw Error('blocked')})
 assert.equal(await audio.arm(),false);for(let i=0;i<10;i++)assert.equal(audio.play({}),false);assert.equal(attempts,1)
})
