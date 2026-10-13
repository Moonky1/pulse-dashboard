import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react'
import {useLocation} from 'react-router-dom'
import {useGoIdentity} from '../go-product/useGoIdentity.js'
import {PulseAlertsContext} from './alertsContext.js'
import {createAlertsTransport} from './alertsTransport.js'
import {PulseAlarmAudio} from './alarmAudio.js'
import {PACIFIC,alertTitle,clockLabel} from './scheduleModel.js'
import './alerts.css'
const readPref=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}}
const savePref=(key,value)=>{try{localStorage.setItem(key,value)}catch{/* Optional device preference. */}}
export function PulseAlertsProvider({children}){
 const identity=useGoIdentity()
 const transport=useMemo(()=>createAlertsTransport(identity.kind),[identity.kind])
 return <PulseAlertsRuntime key={identity.kind+'/'+(identity.agent?.agent_id||'')} identity={identity} transport={transport}>{children}</PulseAlertsRuntime>
}
export function PulseAlertsRuntime({children,identity,transport,audioOverride}){
 const [schedule,setSchedule]=useState(null),[error,setError]=useState(null),[alert,setAlert]=useState(null)
 const [armed,setArmed]=useState(()=>readPref('pulse_alert_audio_v1','')==='armed'),[timezone,setTimezone]=useState(()=>{const zone=readPref('pulse_alert_zone_v1',PACIFIC);try{new Intl.DateTimeFormat('en-US',{timeZone:zone});return zone}catch{return PACIFIC}})
 const [now,setNow]=useState(Date.now),offset=useRef(0),lease=useRef(null),seen=useRef(new Set()),queue=useRef([]),playing=useRef(false)
 const audio=useRef(audioOverride||new PulseAlarmAudio()),active=useRef(true),endTimer=useRef(null),endsAt=useRef(0),alertSurface=useRef(null),{pathname}=useLocation()
 useLayoutEffect(()=>{
  if(!alert || !alertSurface.current)return
  const element=alertSurface.current,style=document.documentElement.style
  const place=()=>{const bounds=element.getBoundingClientRect();style.setProperty('--pulse-alarm-pet-x',bounds.right-90+'px');style.setProperty('--pulse-alarm-pet-y',bounds.bottom-100+'px')}
  place();const observer=new ResizeObserver(place);observer.observe(element);window.addEventListener('resize',place)
  return()=>{observer.disconnect();window.removeEventListener('resize',place);style.removeProperty('--pulse-alarm-pet-x');style.removeProperty('--pulse-alarm-pet-y')}
 },[alert])
 const arm=useCallback(async()=>{const ok=await audio.current.arm();if(ok){setArmed(true);savePref('pulse_alert_audio_v1','armed')}return ok},[])
 const reloadSchedule=useCallback(async()=>{try{const result=await transport.schedule();if(active.current && !result.error && result.data)setSchedule(result.data)}catch{/* Existing schedule stays readable on a transient reload failure. */}},[transport])
 const changeZone=zone=>{try{new Intl.DateTimeFormat('en-US',{timeZone:zone});setTimezone(zone);savePref('pulse_alert_zone_v1',zone)}catch{/* Invalid stored zone. */}}
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()+offset.current),1000);return ()=>clearInterval(timer)},[])
 useEffect(()=>{if(!['agent','staff'].includes(identity.kind))return;const gesture=e=>{if(e.isTrusted)void arm()};window.addEventListener('pointerdown',gesture,{once:true});window.addEventListener('keydown',gesture,{once:true});return()=>{window.removeEventListener('pointerdown',gesture);window.removeEventListener('keydown',gesture)}},[identity.kind,arm])
 useEffect(()=>{
  active.current=true
  if(!['agent','staff'].includes(identity.kind))return
  let alive=true,connectionId=crypto.randomUUID(),currentLease,renewing=false
  const seenIds=seen.current,player=audio.current
  async function refreshSchedule(){try{const result=await transport.schedule();if(alive && !result.error && result.data){setSchedule(result.data);const at=Date.parse(result.data.server_now);if(Number.isFinite(at))offset.current=at-Date.now()}else if(alive)setError(result.error?.message||'Schedule unavailable.')}catch{if(alive)setError('Schedule unavailable.')}}
  async function receive(signal){
   if(!alive || !signal?.occurrence_id || !(Date.parse(signal.expires_at)>Date.now()+offset.current) || seenIds.has(signal.occurrence_id))return
   seenIds.add(signal.occurrence_id);if(seenIds.size>200)seenIds.delete(seenIds.values().next().value)
   const leaseId=currentLease.lease_id,requestId=crypto.randomUUID()
   let claim
   // One idempotent retry can recover a lost HTTP response without replaying sound.
   for(let attempt=0;attempt<2;attempt++){try{claim=await transport.claim(leaseId,signal.occurrence_id,requestId);if(!claim.error)break}catch{/* Bounded retry only. */}}
   if(alive && claim?.data && queue.current.length<10){queue.current.push({...claim.data,leaseId});startNext()}
  }
  async function renew(){if(identity.kind!=='agent'||renewing)return;renewing=true;try{
   const result=await transport.connect(connectionId)
   if(!alive){if(result.data)void transport.close(result.data.lease_id);return}
   if(result.error || !result.data){setError('Sound alerts are temporarily unavailable. Your schedule is still available.');return}
   currentLease=result.data;lease.current=currentLease
   await transport.subscribe(currentLease,receive,()=>void refreshSchedule())
   const pending=await transport.pending(currentLease.lease_id);if(alive && !pending.error)for(const signal of pending.data||[])void receive(signal)
  }catch{if(alive)setError('Sound alerts are temporarily unavailable. Your schedule is still available.')}finally{renewing=false}}
  function startNext(){if(playing.current || !alive)return;let item;while(queue.current.length){item=queue.current.shift();if(Date.parse(item.expires_at)>Date.now()+offset.current)break;item=null}if(!item)return
   playing.current=true;setAlert(item)
   const duration=Math.min(30,item.payload.event.duration_seconds*item.payload.event.repeat)*1000
   endsAt.current=Date.now()+duration
   void transport.receipt(item.leaseId,item.id,'visual_displayed').then(async outcome=>{
    if(!alive || outcome.error || Date.now()>=endsAt.current)return
    const started=audio.current.play(item.payload.event)
    await transport.receipt(item.leaseId,item.id,started?'sound_started':'audio_blocked')
   }).catch(()=>{/* No forged receipt on failed delivery. */})
   endTimer.current=setTimeout(finish,duration)
  }
  function finish(){clearTimeout(endTimer.current);player.stop();setAlert(null);playing.current=false;endsAt.current=0;startNext()}
  void refreshSchedule();void renew()
  const timer=setInterval(()=>void renew(),120000),resume=()=>{if(document.visibilityState==='visible'){if(endsAt.current && Date.now()>=endsAt.current)finish();void refreshSchedule();void renew()}}
  document.addEventListener('visibilitychange',resume)
  window.addEventListener('pageshow',resume)
  return()=>{alive=false;active.current=false;clearInterval(timer);clearTimeout(endTimer.current);endsAt.current=0;playing.current=false;queue.current=[];seenIds.clear();player.stop();document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);transport.destroy();if(currentLease)void transport.close(currentLease.lease_id);lease.current=null}
 },[identity.kind,identity.agent?.agent_id,transport])
 useEffect(()=>{
  if(!alert)return
  const title=document.title;document.title='🚨 '+alertTitle(alert.payload)+' — Pulse'
  let notification
  if(document.hidden && typeof Notification!=='undefined' && Notification.permission==='granted')try{notification=new Notification(alertTitle(alert.payload),{body:clockLabel(Date.parse(alert.payload.start_at))+' Pacific Time',tag:'pulse-'+alert.id})}catch{/* Visual alert remains available. */}
  return()=>{document.title=title;notification?.close()}
 },[alert,pathname])
 const preview=async config=>{if(playing.current)return;await arm();audio.current.play(config);const duration=Math.min(30,Math.max(1,config.duration_seconds*config.repeat))*1000;endsAt.current=Date.now()+duration;setAlert({id:'local-preview',payload:{event:config,phase:'start',start_at:new Date().toISOString(),end_at:new Date(Date.now()+duration).toISOString()}});clearTimeout(endTimer.current);endTimer.current=setTimeout(()=>{audio.current.stop();endsAt.current=0;if(active.current)setAlert(null)},duration)}
 const value={schedule,alert,error,armed,arm,timezone,setTimezone:changeZone,now,preview,reloadSchedule}
 return <PulseAlertsContext.Provider value={value}>{children}{alert && <aside ref={alertSurface} className="pulse-alert-surface" role="alert"><span className="pulse-alert-kicker">PULSE · {alert.id==='local-preview'?'ON THIS DEVICE':'SCHEDULE'}</span><h2>{alertTitle(alert.payload)}</h2><p>{clockLabel(Date.parse(alert.payload.start_at),timezone)}–{clockLabel(Date.parse(alert.payload.end_at),timezone)}</p><strong>{alert.payload.phase==='end'?'Time to get back':`Return at ${clockLabel(Date.parse(alert.payload.end_at),timezone)}`}</strong><small>Pacific Time · {clockLabel(Date.parse(alert.payload.start_at))}–{clockLabel(Date.parse(alert.payload.end_at))}</small></aside>}</PulseAlertsContext.Provider>
}
