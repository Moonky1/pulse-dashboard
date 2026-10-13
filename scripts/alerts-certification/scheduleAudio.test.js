import test from 'node:test'
import assert from 'node:assert/strict'
import {todaySchedule,scheduleFocus,schedulePetActivity,nextShift,timelineRows,timelinePosition,pacificInstant,clockLabel,dateInZone,countdown,alertTitle,alertAction,PACIFIC} from '../../src/alerts/scheduleModel.js'
import {SOUND_FILES} from '../../src/alerts/soundFiles.js'
import {PulseAlarmAudio,SOUNDS} from '../../src/alerts/alarmAudio.js'
const event=(name,type,start,end,days=[1,2,3,4,5])=>({id:name,config:{name,type,start,end,days,enabled:true}})
const schedule={events:[event('Shift','shift','07:00','17:00'),event('Break 1','break','09:00','09:15'),event('Lunch','lunch','12:00','13:00'),event('Break 2','break','14:30','14:40'),event('Saturday','shift','09:00','14:00',[6])]}
test('weekday shift, both breaks and lunch resolve from configured data, not browser alarm timers',()=>{
 for(const [time,status,next] of [['06:40','Before your shift','Shift starts'],['07:00','Working time','Break 1 starts'],['09:00','Break time','Return to production'],['09:15','Working time','Lunch starts'],['12:00','Lunch time','Return to production'],['13:00','Working time','Break 2 starts'],['14:30','Break time','Return to production'],['14:40','Working time','Shift complete'],['17:00','Shift complete',undefined]]){
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
 assert.equal(alertTitle({event:c,phase:'pre'}),'Break 1 in 5 minutes');assert.equal(alertTitle({event:c,phase:'start'}),'Break time');assert.equal(alertTitle({event:c,phase:'end'}),'Go active')
})
test('left countdown covers 6:55 login, 7:00 dial, 8:55 Saturday login and break/lunch returns',()=>{
 for(const [date,time,title,target] of [['2026-10-12','06:50','Log in','06:55'],['2026-10-12','06:55','Ready to dial','07:00'],['2026-10-12','09:05','Go active','09:15'],['2026-10-12','12:30','Go active','13:00'],['2026-10-17','08:50','Log in','08:55'],['2026-10-17','08:55','Ready to dial','09:00']]){const focus=scheduleFocus(schedule,pacificInstant(date,time));assert.equal(focus.title,title);assert.equal(focus.at,pacificInstant(date,target))}
 assert.equal(scheduleFocus(schedule,pacificInstant('2026-10-12','17:01')).title,'Next shift');assert.equal(nextShift(schedule,pacificInstant('2026-10-12','17:01')).start,pacificInstant('2026-10-13','07:00'))
 const p={event:{type:'shift'},phase:'pre',start_at:'2026-10-12T14:00:00Z'};assert.equal(alertTitle(p),'Log in · ready to dial');assert.match(alertAction(p),/ready to dial at 7:00 AM/);assert.equal(alertAction({event:{type:'break'},phase:'end'}),'Return to dial now')
})
test('Schedule Pet follows Pacific shift, break, lunch and sleep without identity/preferences',()=>{
 for(const [time,state] of [['06:50','idle'],['07:00','working'],['09:05','break'],['09:15','working'],['12:30','lunch'],['13:00','working'],['17:00','sleep']])assert.equal(schedulePetActivity(schedule,pacificInstant('2026-10-12',time)),state)
 assert.equal(schedulePetActivity(schedule,pacificInstant('2026-10-17','12:00')),'working');assert.equal(schedulePetActivity(schedule,pacificInstant('2026-10-18','12:00')),'sleep')
})
test('weekday OT is 4–5 PM Pacific in the timeline only; Saturday and real shift end stay unchanged',()=>{
 const before=JSON.stringify(schedule),date='2026-10-13',now=pacificInstant(date,'16:30'),rows=timelineRows(schedule,now),ot=rows.find(row=>row.name==='OT')
 assert.equal(ot.start,pacificInstant(date,'16:00'));assert.equal(ot.end,pacificInstant(date,'17:00'));assert.equal(ot.state,'active')
 assert.equal(rows.find(row=>row.name==='Work hours').end,ot.start)
 assert.equal(rows.find(row=>row.name==='End of shift').start,ot.end)
 assert.equal(clockLabel(ot.start,'America/Bogota'),'6:00 PM');assert.equal(clockLabel(ot.end,'America/Bogota'),'7:00 PM')
 assert.equal(todaySchedule(schedule,now).events.find(e=>e.config.type==='shift').end,ot.end)
 assert.equal(scheduleFocus(schedule,now).title,'End of shift');assert.equal(schedulePetActivity(schedule,now),'working')
 assert.equal(timelineRows(schedule,pacificInstant(date,'15:56')).find(row=>row.name==='OT').state,'soon')
 assert.equal(timelineRows(schedule,pacificInstant(date,'17:00')).find(row=>row.name==='OT').state,'past')
 assert.equal(timelineRows(schedule,pacificInstant('2026-10-17','12:00')).some(row=>row.name==='OT'),false)
 assert.equal(JSON.stringify(schedule),before)
})
function context(){const c={state:'suspended',currentTime:0,destination:{},gains:[],oscillators:[],resume:async()=>{c.state='running'}};c.createOscillator=()=>{const o={frequency:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){this.disconnected=true},start(){},stop(at){if(Number.isFinite(at))this.end=at}};c.oscillators.push(o);return o};c.createGain=()=>{const g={gain:{setValueAtTime(){},linearRampToValueAtTime(value){c.gains.push(value)},exponentialRampToValueAtTime(){}},connect(){},disconnect(){this.disconnected=true}};return g};return c}
test('original library respects Pulse gain, finite duration, one audio context and cleanup',async()=>{
 const ctx=context(),audio=new PulseAlarmAudio(()=>ctx),config={sound:'double_alert',volume:50,duration_seconds:4,repeat:2}
 assert.equal(audio.play(config),false);assert.equal(await audio.arm(),true)
 for(const [sound] of SOUNDS.filter(([key])=>!SOUND_FILES[key])){assert.equal(audio.play({...config,sound}),true);assert.ok(ctx.oscillators.every(o=>o.end<=8));assert.ok(ctx.gains.every(g=>g>=0 && g<=.11))}
 audio.play({...config,duration_seconds:100,repeat:100});assert.ok(ctx.oscillators.every(o=>o.end<=30));audio.stop();assert.equal(audio.nodes.length,0);assert.ok(ctx.oscillators.every(o=>o.disconnected))
 assert.equal(audio.play({...config,volume:0}),false);ctx.state='suspended';assert.equal(audio.play(config),false)
})
test('next shift skips Sunday; timeline moves towards lunch and highlights five-minute approach',()=>{
 assert.equal(nextShift(schedule,pacificInstant('2026-10-16','17:01')).start,pacificInstant('2026-10-17','09:00'));assert.equal(nextShift(schedule,pacificInstant('2026-10-17','14:01')).start,pacificInstant('2026-10-19','07:00'))
 const before=pacificInstant('2026-10-12','11:30'),near=pacificInstant('2026-10-12','11:56'),at=pacificInstant('2026-10-12','12:00'),rows=timelineRows(schedule,before)
 assert.ok(timelinePosition(rows,near)>timelinePosition(rows,before));assert.equal(timelineRows(schedule,near).find(row=>row.name==='Lunch').state,'soon');assert.equal(timelineRows(schedule,at).find(row=>row.name==='Lunch').state,'active')
})
test('provided MP3s decode/cache once, play at bounded gain and stop pending async playback',async()=>{
 const ctx=context();let loads=0;ctx.decodeAudioData=async()=>({duration:9});ctx.createBufferSource=()=>({connect(){},disconnect(){},start(){},stop(at){this.end=at}})
 const audio=new PulseAlarmAudio(()=>ctx,async()=>{loads++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}});await audio.arm();await audio.prepare(Object.keys(SOUND_FILES));assert.equal(loads,3)
 for(const sound of Object.keys(SOUND_FILES)){assert.equal(await audio.playAsync({sound,volume:70,duration_seconds:8,repeat:1}),true);assert.equal(audio.nodes[0].end,8);assert.equal(audio.nodes[0].loop,true)}assert.equal(loads,3);assert.ok(ctx.gains.every(value=>value>=0 && value<=.7))
 const pending=audio.playAsync({sound:'iphone_radar',volume:70,duration_seconds:8,repeat:1});audio.stop();assert.equal(await pending,false)
})
test('browser refusing audio is a normal fallback, never retried on play',async()=>{
 let attempts=0;const audio=new PulseAlarmAudio(()=>{attempts++;throw Error('blocked')})
 assert.equal(await audio.arm(),false);for(let i=0;i<10;i++)assert.equal(audio.play({}),false);assert.equal(attempts,1)
})
