export const PACIFIC='America/Los_Angeles'
const parts=(value,zone)=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]))
export const localZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone || PACIFIC
export function dateInZone(value,zone=PACIFIC){const p=parts(value,zone);return `${p.year}-${p.month}-${p.day}`}
const localEpoch=p=>Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)
export function pacificInstant(date,time){
 const target=Date.parse(date+'T'+time+':00Z')
 const offsets=[...new Set([-18,0,18].map(h=>{const at=target+h*3600000;return localEpoch(parts(at,PACIFIC))-at}))]
 const candidates=offsets.map(offset=>target-offset)
 const exact=candidates.filter(at=>localEpoch(parts(at,PACIFIC))===target).sort((a,b)=>b-a)
 return exact[0] ?? candidates.filter(at=>localEpoch(parts(at,PACIFIC))>target).sort((a,b)=>a-b)[0]
}
export function todaySchedule(schedule,now){
 const date=dateInZone(now),day=new Date(date+'T12:00:00Z').getUTCDay()||7
 const events=(schedule?.events||[]).filter(e=>e.config.enabled && e.config.days.includes(day)).map(e=>({...e,start:pacificInstant(date,e.config.start),end:pacificInstant(date,e.config.end)})).sort((a,b)=>a.start-b.start)
 const shift=events.find(e=>e.config.type==='shift'),active=events.filter(e=>e.start<=now && e.end>now).sort((a,b)=>(a.config.type==='shift')-(b.config.type==='shift'))[0]
 const boundaries=events.flatMap(e=>[{event:e,at:e.start,phase:'start',label:e.config.type==='shift'?'Shift starts':e.config.name+' starts'},{event:e,at:e.end,phase:'end',label:e.config.type==='shift'?'Shift complete':'Return to production'}]).filter(b=>b.at>now).sort((a,b)=>a.at-b.at)
 const status=active?active.config.type==='break'?'Break time':active.config.type==='lunch'?'Lunch time':'Working time':shift && now>=shift.end?'Shift complete':events.length?'Before your shift':'No shift today'
 return {date,events,active,next:boundaries[0]||null,status}
}
export function clockLabel(at,zone=PACIFIC){return new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(at))}
export function dateLabel(at,zone=PACIFIC){return new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'long',month:'short',day:'numeric'}).format(new Date(at))}
export function countdown(at,now){const seconds=Math.max(0,Math.ceil((at-now)/1000));return `${Math.floor(seconds/3600)?Math.floor(seconds/3600)+':':''}${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
export function scheduleFocus(schedule,now){
 const today=todaySchedule(schedule,now),shift=today.events.find(e=>e.config.type==='shift')
 const upcoming=()=>{const next=nextShift(schedule,now);return next?{title:'Next shift',at:next.start-5*60000,shiftAt:next.start,hint:'Log in and be in Manage, ready to dial.'}:{title:'No shift scheduled',hint:'Enjoy your day off.'}}
 if(!shift)return upcoming()
 if(now<shift.start){const loginAt=shift.start-5*60000;return {title:now<loginAt?'Log in':'Ready to dial',at:now<loginAt?loginAt:shift.start,hint:now<loginAt?'Log in five minutes before your shift.':'Log in now. Be in Manage and ready to dial.'}}
 if(today.active && ['break','lunch'].includes(today.active.config.type))return {title:'Go active',at:today.active.end,hint:today.active.config.type==='lunch'?'Return from lunch and get ready to dial.':'Return from your break and get ready to dial.'}
 if(today.next)return {title:today.next.event.config.type==='shift'?'End of shift':today.next.event.config.name,at:today.next.at,hint:'Up next'}
 return upcoming()
}
export function nextShift(schedule,now){const date=dateInZone(now),candidates=[];for(let offset=0;offset<8;offset++){const day=new Date(date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+offset);const key=day.toISOString().slice(0,10),weekday=day.getUTCDay()||7;for(const e of schedule?.events||[])if(e.config.enabled && e.config.type==='shift' && e.config.days.includes(weekday)){const start=pacificInstant(key,e.config.start);if(start>now)candidates.push({...e,start})}}return candidates.sort((a,b)=>a.start-b.start)[0]||null}
export function timelineRows(schedule,now){
 const today=todaySchedule(schedule,now),shift=today.events.find(e=>e.config.type==='shift');if(!shift)return []
 const weekday=new Date(today.date+'T12:00:00Z').getUTCDay()
 // Presentation only: the approved weekday 4–5 PM Pacific hour is OT.
 // Keep the real shift end, alert configuration and Saturday schedule unchanged.
 const otStart=pacificInstant(today.date,'16:00'),hasOT=weekday>=1 && weekday<=5 && shift.config.end==='17:00' && shift.start<otStart
 const rows=[{id:'login',name:'Log in',start:shift.start-5*60000,end:shift.start,login:true},...today.events.map(e=>({...e,name:e.config.type==='shift'?'Work hours':e.config.name,end:hasOT && e.id===shift.id?otStart:e.end})),...(hasOT?[{id:'overtime',name:'OT',start:otStart,end:shift.end,range:true,overtime:true}]:[]),{id:'finish',name:'End of shift',start:shift.end,end:shift.end}]
 return rows.sort((a,b)=>a.start-b.start).map(row=>({...row,state:row.start>now?(row.start-now<=5*60000?'soon':'upcoming'):row.end<=now?'past':today.active?.id===row.id || row.login || row.overtime && today.active?.id===shift.id?'active':'past'}))
}
export function timelinePosition(rows,now){if(!rows.length)return 0;const next=rows.findIndex(row=>row.start>now);if(next<0)return rows.length-1;if(next===0)return 0;const before=rows[next-1];return next-1+Math.max(0,Math.min(1,(now-before.start)/(rows[next].start-before.start)))}
export function schedulePetActivity(schedule,now){if(!schedule)return 'idle';const today=todaySchedule(schedule,now),shift=today.events.find(e=>e.config.type==='shift');if(!shift || now>=shift.end)return 'sleep';if(['break','lunch'].includes(today.active?.config.type))return today.active.config.type;return now>=shift.start?'working':'idle'}
export function alertTitle(payload){const c=payload.event;if(payload.phase==='pre')return c.type==='shift'?'Log in · ready to dial':`${c.name} in ${c.pre_minutes} minutes`;if(payload.phase==='end')return c.type==='shift'?'End of shift':'Go active';return c.type==='lunch'?'Lunch time':c.type==='break'?'Break time':c.type==='shift'?'Start dialing':c.name}
export function alertAction(payload,zone=PACIFIC){if(payload.phase==='end')return payload.event.type==='shift'?'See you next shift':'Return to dial now';if(payload.event.type==='shift')return payload.phase==='pre'?`Be in Manage and ready to dial at ${clockLabel(Date.parse(payload.start_at),zone)}`:'Join your daily team meeting';return `Return at ${clockLabel(Date.parse(payload.end_at),zone)}`}
