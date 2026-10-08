import { useEffect, useState } from 'react'
import { simulationAudioUrl } from './simulationApi.js'

export function ViciAudio({ kind, contentId, attemptId, clip, startedAt, busy, onIntro }) {
  const [state,setState]=useState({url:null,error:null})
  useEffect(()=>{
    let active=true
    const load=async()=>{try{const url=await simulationAudioUrl(kind,contentId,clip.media_id,attemptId);if(active)setState({url,error:null})}catch(e){if(active)setState({url:null,error:e.message})}}
    const first=setTimeout(load,0),refresh=setInterval(load,90000)
    return()=>{active=false;clearTimeout(first);clearInterval(refresh)}
  },[kind,contentId,attemptId,clip.media_id])
  return <section className="sim-audio" aria-label={clip.cue==='advisor'?'Advisor introduction audio':'Customer call audio'}><strong>{clip.cue==='advisor'?'Service Advisor':'Customer call'}</strong>{state.error?<p role="alert">{state.error}</p>:state.url?<audio controls src={state.url} preload="none" onPlay={()=>{if(clip.cue==='advisor'&&!startedAt&&!busy)onIntro()}}/>:<span>Loading private audio…</span>}</section>
}
