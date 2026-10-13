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
export function alertTitle(payload){const c=payload.event;if(payload.phase==='pre')return `${c.name} in ${c.pre_minutes} minutes`;if(payload.phase==='end')return c.type==='shift'?'Shift complete':'Return to production';return c.type==='lunch'?'Lunch time':c.type==='break'?'Break time':c.type==='shift'?'Shift starts':c.name}
