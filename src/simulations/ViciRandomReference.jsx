import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AcademyHeader } from '../go/AcademyHeader.jsx'
import { VICI_MENU } from './viciPractice.js'
import { simulationRpc } from './simulationApi.js'
import { ViciAudio } from './ViciAudio.jsx'
import { ViciDispositionPanel } from './ViciDialer.jsx'
import { ViciActivity } from './ViciActivity.jsx'
import { appendViciActivity } from './viciActivity.js'

// Unrecorded Staff reference; random selection and grading still belong to the server.
export function ViciRandomReference() {
  const navigate=useNavigate(),lock=useRef(false)
  const [snapshot,setSnapshot]=useState(null),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(null),[entries,setEntries]=useState([])
  async function nextCall() {
    if(lock.current)return
    lock.current=true;setBusy(true);setError(null)
    try{
      const result=await simulationRpc('start_vici_random_reference',{})
      if(result.error){setError(result.error.message);return}
      setSnapshot(result.data);setSelected(null);setEntries([])
    }finally{lock.current=false;setBusy(false)}
  }
  useEffect(()=>{const timer=setTimeout(()=>void nextCall(),0);return()=>clearTimeout(timer)},[])
  async function submit() {
    if(lock.current||!selected||!snapshot||snapshot.review)return
    lock.current=true;setBusy(true);setError(null)
    try{
      const result=await simulationRpc('submit_vici_random_reference',{requested_reference_id:snapshot.reference_id,expected_state_version:snapshot.state_version,requested_request_id:crypto.randomUUID(),requested_disposition:selected})
      setEntries(current=>appendViciActivity(current,'submit','active',result.error?{error:true}:{correct:result.data.review.correct}))
      if(result.error){setError(result.error.message);return}
      setSnapshot(result.data)
    }finally{lock.current=false;setBusy(false)}
  }
  return <div className="sim-shell pulse-product-surface"><AcademyHeader/><main className="sim-main sim-main--player">
    <div className="sim-toolbar"><Link to="/academy">← Academy</Link><h1>Vici Simulator</h1><label>Practice<select value="random" onChange={e=>navigate('/academy/simulations/preview/'+e.target.value)}>{Object.entries(VICI_MENU).map(([key,item])=><option key={key} value={key}>{item.title}</option>)}</select></label><button disabled={busy} onClick={()=>void nextCall()}>Next call</button><Link className="sim-manage" to="/studio/simulations/create">Manage practices</Link></div>
    {error&&<p className="sim-error" role="alert">{error}</p>}
    {!snapshot&&!error&&<p role="status">Opening a customer call…</p>}
    {snapshot&&<>{snapshot.audio.map(clip=><ViciAudio key={snapshot.reference_id+clip.media_id} kind="staff" contentId={snapshot.content_id} clip={clip}/>)}
      <ViciDispositionPanel selected={selected} phone={snapshot.dialer.customer.phone} busy={busy||!!snapshot.review} onSelect={code=>{setSelected(code);setEntries(current=>appendViciActivity(current,'callDisposition',code))}} onSubmit={()=>void submit()}/>
      {snapshot.review&&<p className={'sim-feedback'+(snapshot.review.correct?'':' sim-feedback--retry')} role="status">{snapshot.review.correct?'Correct.':'Not correct.'} {snapshot.review.disposition} — {snapshot.review.explanation}</p>}
      <ViciActivity entries={entries}/></>}
  </main></div>
}
