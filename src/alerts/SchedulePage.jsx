import {usePulseAlerts} from './alertsContext.js'
import {todaySchedule,PACIFIC,localZone,clockLabel,dateLabel,dateInZone} from './scheduleModel.js'
import {PulseOrb} from '../components/ui/PulseOrb.jsx'
import {PulsePet} from '../pet/PulsePet.jsx'
import {usePetVisibility} from '../pet/usePetVisibility.js'
import '../components/ProductHeader.css'

export function ScheduleContent(){
 const {schedule,error,now,timezone,setTimezone}=usePulseAlerts(),today=todaySchedule(schedule,now),zone=localZone()
 const saturday=new Date(today.date+'T12:00:00Z').getUTCDay()===6
 const label=event=>event.config.type==='shift'?'Work hours':event.config.type==='lunch'?'Lunch':event.config.name
 return <main className="pulse-schedule">
  <header className="pulse-schedule-heading"><div><span className="pulse-alert-kicker">AUTO WARRANTY</span><h1>Today</h1><p>{dateLabel(now)}{saturday?' · No breaks':''}</p></div><div className="pulse-schedule-clock"><span>Pacific Time <strong>{clockLabel(now)}</strong></span>{zone!==PACIFIC && <span>Local time <strong>{clockLabel(now,zone)}</strong></span>}</div></header>
  <nav className="pulse-zone-toggle" aria-label="Time display"><button aria-pressed={timezone===PACIFIC} onClick={()=>setTimezone(PACIFIC)}>Pacific Time</button><button aria-pressed={timezone!==PACIFIC} onClick={()=>setTimezone(zone)}>My local time</button></nav>
  {!schedule?<p role="status">{error?'Schedule could not load. Please refresh.':'Loading…'}</p>:<section className="pulse-today-schedule" aria-label="Today's schedule">{today.events.map(event=><article key={event.id}><h2>{label(event)}</h2><div><strong>{clockLabel(event.start,timezone)}–{clockLabel(event.end,timezone)}</strong>{dateInZone(event.start,timezone)!==today.date && <small>{dateLabel(event.start,timezone)}</small>}{dateInZone(event.end,timezone)!==dateInZone(event.start,timezone) && <small>Until {dateLabel(event.end,timezone)}</small>}</div></article>)}{!today.events.length && <p>No shift today.</p>}</section>}
 </main>
}
export function SchedulePage(){const {alert}=usePulseAlerts(),[visible]=usePetVisibility();return <div className="pulse-product-surface pulse-schedule-shell"><header className="pulse-public-schedule-header"><PulseOrb size="sm" active/><strong>Pulse</strong></header><ScheduleContent/>{visible && <PulsePet actions={[]} pathname="/schedule" alarm={alert}/>}</div>}
