import {usePulseAlerts} from './alertsContext.js'
import {todaySchedule,scheduleFocus,countdown,PACIFIC,localZone,clockLabel,dateLabel,dateInZone} from './scheduleModel.js'
import {PulseOrb} from '../components/ui/PulseOrb.jsx'
import {PulsePet} from '../pet/PulsePet.jsx'
import {usePetVisibility} from '../pet/usePetVisibility.js'
import '../components/ProductHeader.css'

export function ScheduleContent(){
 const {schedule,error,now,timezone,setTimezone}=usePulseAlerts(),today=todaySchedule(schedule,now),focus=scheduleFocus(schedule,now),zone=localZone(),shift=today.events.find(e=>e.config.type==='shift')
 const saturday=new Date(today.date+'T12:00:00Z').getUTCDay()===6
 const label=event=>event.config.type==='shift'?'Work hours':event.config.type==='lunch'?'Lunch':event.config.name
 return <main className="pulse-schedule">
  <header className="pulse-schedule-heading"><div><span className="pulse-alert-kicker">AUTO WARRANTY</span><h1>Today</h1><p>{dateLabel(now)}{saturday?' · No breaks':''}</p></div><div className="pulse-schedule-clock"><span>Pacific Time <strong>{clockLabel(now)}</strong></span>{zone!==PACIFIC && <span>Local time <strong>{clockLabel(now,zone)}</strong></span>}</div></header>
  <aside className="pulse-meeting-reminder"><strong>Don't forget your daily team meeting.</strong><span>Join your team's meeting before dialing.</span></aside>
  <nav className="pulse-zone-toggle" aria-label="Time display"><button aria-pressed={timezone===PACIFIC} onClick={()=>setTimezone(PACIFIC)}>Pacific Time</button><button aria-pressed={timezone!==PACIFIC} onClick={()=>setTimezone(zone)}>My local time</button></nav>
  {!schedule?<p role="status">{error?'Schedule could not load. Please refresh.':'Loading…'}</p>:<div className="pulse-schedule-grid"><section className="pulse-next-event" aria-label="Next reminder"><span className="pulse-alert-kicker">{focus.title==='Go active'?'RETURN BY':'UP NEXT'}</span><h2>{focus.title}</h2>{focus.at && <><strong className="pulse-countdown">{countdown(focus.at,now)}</strong><p>{clockLabel(focus.at,timezone)} · {timezone===PACIFIC?'Pacific Time':'Local time'}</p></>}<p>{focus.hint}</p><span className="pulse-next-orbit" aria-hidden="true">◉</span></section><section className="pulse-timeline" aria-label="Today's schedule"><h2>Your schedule</h2>{shift && <article><span className="pulse-event-dot"/><div><h3>Log in</h3><p>{clockLabel(shift.start-5*60000,timezone)}</p><small>Manage · Ready to dial</small></div></article>}{today.events.map(event=><article key={event.id}><span className="pulse-event-dot"/><div><h3>{label(event)}</h3><p>{clockLabel(event.start,timezone)}–{clockLabel(event.end,timezone)}</p>{dateInZone(event.start,timezone)!==today.date && <small>{dateLabel(event.start,timezone)}</small>}{dateInZone(event.end,timezone)!==dateInZone(event.start,timezone) && <small>Until {dateLabel(event.end,timezone)}</small>}</div></article>)}{!today.events.length && <p>No shift today.</p>}</section></div>}
 </main>
}
export function SchedulePage(){const {alert}=usePulseAlerts(),[visible]=usePetVisibility();return <div className="pulse-product-surface pulse-schedule-shell"><header className="pulse-public-schedule-header"><PulseOrb size="sm" active/><strong>Pulse</strong></header><ScheduleContent/>{visible && <PulsePet actions={[]} pathname="/schedule" alarm={alert}/>}</div>}
