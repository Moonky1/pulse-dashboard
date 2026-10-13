/* eslint-disable react-refresh/only-export-components */
import {createRoot} from 'react-dom/client'
import {BrowserRouter,Link,useLocation} from 'react-router-dom'
import {PulseAlertsRuntime} from '../../src/alerts/PulseAlertsProvider.jsx'
import {SchedulePage} from '../../src/alerts/SchedulePage.jsx'
import {PublicScheduleAdminContent} from '../../src/alerts/PublicScheduleAdmin.jsx'
import {PulseAlarmAudio} from '../../src/alerts/alarmAudio.js'
import '../../src/design/globals.css'
const base={timezone:'America/Los_Angeles',enabled:true,pre_enabled:true,start_enabled:true,end_enabled:true,pre_minutes:5,sound:'critical_alarm',volume:90,duration_seconds:8,repeat:1}
const events=[['Shift','shift','07:00','17:00',[1,2,3,4,5]],['Break 1','break','09:00','09:15',[1,2,3,4,5]],['Lunch','lunch','12:00','13:00',[1,2,3,4,5]],['Break 2','break','14:30','14:40',[1,2,3,4,5]],['Saturday','shift','09:00','14:00',[6]]].map(([name,type,start,end,days],i)=>({id:'a1120000-0000-4000-8000-'+String(i+1).padStart(12,'0'),revision:1,config:{...base,name,type,start,end,days}}))
const notices=new Map(),checks={sent:[],privateCalls:0,played:0};let onNotice,onSchedule
const failedReads=new Set()
const transport={schedule:async()=>({data:{events,server_now:new Date().toISOString()},error:null}),notice:async id=>failedReads.delete(id)?{error:{message:'Transient failure'}}:{data:notices.get(id)||null},publicPending:async()=>({data:[...notices.values()].filter(n=>Date.parse(n.expires_at)>Date.now()).map(n=>({occurrence_id:n.id,expires_at:n.expires_at}))}),subscribePublic:async(fn,schedule)=>{onNotice=fn;onSchedule=schedule;for(const n of notices.values())void fn({occurrence_id:n.id,expires_at:n.expires_at})},destroy(){onNotice=null;onSchedule=null},connect(){checks.privateCalls++;throw Error('No identities allowed')},receipt(){checks.privateCalls++;throw Error('No tracking allowed')}}
const client={async rpc(name,args){if(name==='get_pulse_schedule')return transport.schedule();if(name==='list_public_pulse_notices')return {data:[...notices.values()].map(n=>({...n,scheduled_at:new Date().toISOString()}))};if(name==='save_pulse_schedule_event'){const e=events.find(e=>e.id===args.requested_id);e.config=args.requested_config;e.revision++;onSchedule?.();return {data:e}}if(name==='send_public_pulse_notice'){checks.sent.push(args);const e=events.find(e=>e.id===args.requested_event_id),id=crypto.randomUUID(),at=Date.now(),n={id,expires_at:new Date(at+90000).toISOString(),payload:{event:e.config,phase:args.requested_phase,start_at:new Date(at).toISOString(),end_at:new Date(at+900000).toISOString()}};notices.set(id,n);onNotice?.({occurrence_id:id,expires_at:n.expires_at});return {data:{id}}}throw Error('Unexpected private RPC '+name)}}
const audio=new URLSearchParams(location.search).has('nativeAudio')?new PulseAlarmAudio():{arm:async()=>true,play:()=>{checks.played++;return true},stop(){}}
window.publicReview={checks,emit({id=crypto.randomUUID(),fail=false,signal=true}={}){const at=Date.now(),n={id,expires_at:new Date(at+90000).toISOString(),payload:{event:events[1].config,phase:'start',start_at:new Date(at).toISOString(),end_at:new Date(at+900000).toISOString()}};notices.set(id,n);if(fail)failedReads.add(id);if(signal)onNotice?.({occurrence_id:id,expires_at:n.expires_at});return id},forge(){onNotice?.({occurrence_id:crypto.randomUUID(),expires_at:new Date(Date.now()+90000).toISOString(),payload:{event:{name:'Forged'}}})}}
window.publicReview.audioState=()=>audio.context?.state||null
window.publicReview.audioNodes=()=>audio.nodes?.length||0
window.publicReview.prepareAudio=sounds=>audio.prepare(sounds)
window.publicReview.playAudio=sound=>audio.playAsync({sound,volume:80,duration_seconds:2,repeat:1})
window.publicReview.loadedAudio=()=>[...audio.buffers.keys()]
function Review(){const {pathname}=useLocation(),kind=pathname==='/admin/alerts'?'staff':'public';return <PulseAlertsRuntime key={kind} identity={{kind}} transport={transport} audioOverride={audio}><nav style={{display:'flex',gap:20,padding:12}}><Link to="/schedule">Public tab</Link><Link to="/admin/alerts">Admin fixture</Link></nav>{kind==='public'?<SchedulePage/>:<PublicScheduleAdminContent client={client} permissionKeys={['alerts.manage','alerts.view']}/>}</PulseAlertsRuntime>}
createRoot(document.getElementById('root')).render(<BrowserRouter><Review/></BrowserRouter>)
