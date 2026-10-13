import {useEffect,useRef,useState} from 'react'
import {supabase} from '../utils/supabase.js'
import {useAdminPermissions} from '../admin/AdminAccessContext.js'
import {usePulseAlerts} from './alertsContext.js'
import {EventEditor} from './AdminAlertsPage.jsx'
import {clockLabel,dateInZone,pacificInstant} from './scheduleModel.js'
export function PublicScheduleAdminContent({client=supabase,permissionKeys}){
 const {preview,now}=usePulseAlerts(),[events,setEvents]=useState([]),[history,setHistory]=useState([]),[editing,setEditing]=useState(null),[sending,setSending]=useState(null),[message,setMessage]=useState('')
 const manage=permissionKeys.includes('alerts.manage'),view=permissionKeys.includes('alerts.view')
 async function reload(){const result=await client.rpc('get_pulse_schedule');if(result.error){setMessage('Schedule could not load.');return}setEvents(result.data.events);if(view){const sent=await client.rpc('list_public_pulse_notices');setHistory(sent.error?[]:sent.data||[])}}
 useEffect(()=>{let active=true;Promise.all([client.rpc('get_pulse_schedule'),view?client.rpc('list_public_pulse_notices'):Promise.resolve({data:[]})]).then(([schedule,sent])=>{if(!active)return;if(schedule.error)setMessage('Schedule could not load.');else setEvents(schedule.data?.events||[]);setHistory(sent.error?[]:sent.data||[])}).catch(()=>{if(active)setMessage('Schedule could not load.')});return()=>{active=false}},[client,view])
 const time=value=>clockLabel(pacificInstant(dateInZone(now),value))
 return <main className="pulse-alert-admin"><header className="pulse-schedule-heading"><div><span className="pulse-alert-kicker">ADMINISTRATION</span><h1>Schedule &amp; alerts</h1><p>Send a reminder to everyone with the Schedule page open.</p><a href="/schedule" target="_blank" rel="noreferrer">Open the public schedule ↗</a></div></header>
  {message && <p role="status">{message}</p>}
  <div className="pulse-admin-event-grid">{events.map(event=><article className="pulse-admin-event" key={event.id}><header><h2>{event.config.name}</h2><span>{event.config.enabled?'On':'Off'}</span></header><p className="pulse-admin-time">{time(event.config.start)}–{time(event.config.end)}</p><p>Pacific Time · {event.config.days.map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d-1]).join(' · ')}</p><div><button onClick={()=>void preview(event.config)}>Test sound</button>{manage && <><button onClick={()=>setEditing(event)}>Edit schedule</button><button disabled={!event.config.enabled} onClick={()=>setSending(event)}>Send alert</button></>}</div></article>)}</div>
  {view && <details className="pulse-public-send-history"><summary>Recent alerts</summary>{!history.length?<p>No alerts sent yet.</p>:history.map(item=><p key={item.id}>{item.payload.event.name} · {new Date(item.scheduled_at).toLocaleString()}</p>)}</details>}
  {editing && <EventEditor event={editing} client={client} preview={preview} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);void reload()}}/>}
  {sending && <SendNotice event={sending} client={client} onClose={()=>setSending(null)} onSent={()=>{setSending(null);setMessage('Alert sent to Schedule.');void reload()}}/>}
 </main>
}
function SendNotice({event,client,onClose,onSent}){
 const dialog=useRef(null),[phase,setPhase]=useState('start'),[busy,setBusy]=useState(false),[error,setError]=useState(''),requestId=useRef(crypto.randomUUID())
 useEffect(()=>{const node=dialog.current;node.showModal();return()=>node.close()},[])
 async function send(e){e.preventDefault();if(busy)return;setBusy(true);try{const result=await client.rpc('send_public_pulse_notice',{requested_event_id:event.id,requested_phase:phase,requested_request_id:requestId.current,confirmed:true});if(result.error)setError(result.error.code==='55000'?'Wait a few seconds before sending another alert.':'Could not send. Try again.');else onSent()}catch{setError('Could not send. Try again.')}finally{setBusy(false)}}
 return <dialog ref={dialog} className="pulse-event-editor" aria-labelledby="pulse-send-title" onCancel={e=>{e.preventDefault();if(!busy)onClose()}}><form onSubmit={send}><h2 id="pulse-send-title">Send {event.config.name}?</h2><p>Everyone with the public Schedule page open can receive this sound and message. No login is required.</p><label>Reminder<select aria-label="Reminder" value={phase} disabled={busy} onChange={e=>{setPhase(e.target.value);requestId.current=crypto.randomUUID()}}><option value="start">Starts now</option><option value="pre">In {event.config.pre_minutes} minutes</option><option value="end">Return to work</option></select></label>{error && <p role="alert">{error}</p>}<footer><button type="button" onClick={onClose} disabled={busy}>Cancel</button><button disabled={busy}>{busy?'Sending…':'Send to Schedule'}</button></footer></form></dialog>
}
export function PublicScheduleAdminPage(){const {permissionKeys}=useAdminPermissions();return <PublicScheduleAdminContent permissionKeys={permissionKeys}/>}
