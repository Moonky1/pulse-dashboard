import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { OPENER_TEAMS, RANDOM_DISPOSITIONS } from './templates.js'
import { VICI_PRACTICES } from './viciPractice.js'
import { simulationRpc, uploadSimulationAudio, uploadSimulationScreen } from './simulationApi.js'
import { viciScreenFile } from './viciScreens.js'
import { trimAudioToWav } from '../training/audioClip.js'
import { buildViciImportPlan, MANUAL_IMPORT_PRACTICES, publishViciImportTask } from './viciImport.js'
import { useUnsavedChanges } from '../studio/hooks/useUnsavedChanges.js'

async function fullPrivateClip(file) {
  const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext
  if(!AudioContextClass)throw new Error('This browser cannot prepare clips.')
  const context=new AudioContextClass()
  let duration
  try{duration=(await context.decodeAudioData(await file.arrayBuffer())).duration}finally{await context.close()}
  if(duration<0.1||duration>60)throw new Error('Use clips of 0.1–60 seconds. Trim longer recordings in a single draft first.')
  return trimAudioToWav(file,0,duration,60)
}
export function ViciClipImporter({ options, disabled }) {
  const available=options?.teams?.filter(t=>OPENER_TEAMS.includes(t.code))||[]
  const [clips,setClips]=useState([]),[manual,setManual]=useState([]),[selectedTeams,setSelectedTeams]=useState([]),[topicId,setTopicId]=useState(''),[confirmed,setConfirmed]=useState(false)
  const [tasks,setTasks]=useState([]),[running,setRunning]=useState(false),[started,setStarted]=useState(false),[progress,setProgress]=useState([]),[message,setMessage]=useState(''),[error,setError]=useState('')
  const dialog=useRef(null),lock=useRef(false)
  useUnsavedChanges(running)
  function review(){
    setError('')
    try{setTasks(buildViciImportPlan({clips,manual,teams:available.filter(t=>selectedTeams.includes(t.id)),topicId,confirmed}));dialog.current.showModal()}catch(e){setError(e.message)}
  }
  async function publish(){
    if(lock.current||started)return
    dialog.current.close();lock.current=true;setStarted(true);setRunning(true);setError('')
    try{
      setMessage('Preparing private clips…')
      const prepared=new Map()
      for(const clip of clips)prepared.set(clip.file,await fullPrivateClip(clip.file))
      for(let index=0;index<tasks.length;index++){
        const task=tasks[index]
        setMessage(`Publishing practice ${index+1} of ${tasks.length} · ${task.team.name}`)
        await publishViciImportTask(task.clip?{...task,clip:{...task.clip,file:prepared.get(task.clip.file)}}:task,topicId,{
          rpc:(name,args)=>simulationRpc(name,args,{authoring:true}),
          screen:async(contentId,mode)=>uploadSimulationScreen(contentId,await viciScreenFile(mode)),
          audio:(contentId,file)=>uploadSimulationAudio(contentId,file,true),
        },entry=>setProgress(current=>[...current.filter(item=>item.contentId!==entry.contentId),{...entry,label:task.clip?task.clip.file.name:task.title,team:task.team.name}]))
      }
      setMessage(`Import complete: ${tasks.length} published practices.`)
    }catch(e){setError(e.message+' The batch stopped. Known drafts are linked below; check Studio before starting another batch.');setMessage('Import stopped; saved drafts and publications are preserved.')}
    finally{lock.current=false;setRunning(false)}
  }
  return <details className="sim-panel"><summary>Prepare call clips & manual practices</summary><p className="sim-caption">Staff-only preparation. Each selected team receives its own private practice. SPXFER and SPANIS stay region-specific. Existing publications and history are never overwritten.</p>
    <fieldset className="studio-fields" disabled={disabled||running||started}>
      <label>Practice topic<select aria-label="Practice topic" value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">Choose a topic</option>{options?.topics?.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
      <fieldset className="studio-checks"><legend>Opener teams</legend>{available.map(t=><label key={t.id}><input type="checkbox" checked={selectedTeams.includes(t.id)} onChange={e=>setSelectedTeams(current=>e.target.checked?[...current,t.id]:current.filter(id=>id!==t.id))}/>{t.name}</label>)}</fieldset>
      <label>Private call clips<input type="file" multiple accept="audio/*" onChange={e=>{setClips(Array.from(e.target.files||[]).map(file=>({file,disposition:'A',explanation:''})));setConfirmed(false)}}/></label>
      {clips.map((clip,index)=><fieldset key={index} className="studio-fields"><legend>Clip {index+1}: {clip.file.name} · Staff only</legend><label>{`Clip ${index+1} disposition`}<select aria-label={`Clip ${index+1} disposition`} value={clip.disposition} onChange={e=>setClips(current=>current.map((item,i)=>i===index?{...item,disposition:e.target.value}:item))}>{RANDOM_DISPOSITIONS.map(code=><option value={code} key={code}>{code}</option>)}</select></label><label>{`Clip ${index+1} explanation`}<textarea value={clip.explanation} maxLength={1000} onChange={e=>setClips(current=>current.map((item,i)=>i===index?{...item,explanation:e.target.value}:item))}/></label></fieldset>)}
      <fieldset className="studio-checks"><legend>Manual practices · optional</legend>{MANUAL_IMPORT_PRACTICES.map(s=><label key={s}><input type="checkbox" checked={manual.includes(s)} onChange={e=>setManual(current=>e.target.checked?[...current,s]:current.filter(value=>value!==s))}/>{VICI_PRACTICES[s].title}</label>)}</fieldset>
      <label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I have permission to use these clips, have removed personal data, and have reviewed each answer.</label>
      <button onClick={review}>Review preparation</button>
    </fieldset>
    {message&&<p role="status">{message}</p>}{error&&<p role="alert" className="sim-error">{error}</p>}
    {!!progress.length&&<ul>{progress.map(item=><li key={item.contentId}><Link to={'/studio/simulations/'+item.contentId}>{item.label} · {item.team} · {item.stage}</Link></li>)}</ul>}
    <dialog ref={dialog} className="sim-confirm" aria-label="Review practice preparation"><h2>Publish the reviewed practices?</h2><p>{tasks.length} new team-scoped practices. Random clips keep a generic title; answers appear only after Submit. This does not replace existing exercises.</p><button onClick={()=>dialog.current.close()}>Cancel</button><button disabled={running||started} onClick={()=>void publish()}>Publish reviewed practices</button></dialog>
  </details>
}
