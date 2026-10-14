import { useEffect, useRef, useState } from 'react'
import { prepareReportBatch, runReportBatch } from './batchReports.js'
import { createPortal } from 'react-dom'

export function BatchReportUpload({ client, scope, onImported, onBusy, actionsTarget, onOpen, selection: datasetSelection, validSelection = true }) {
  const form = useRef(null)
  const [selection, setSelection] = useState({performance:[],pause:[]})
  const [jobs, setJobs] = useState(null), [results,setResults] = useState({})
  const [busy,setBusy] = useState(false), [error,setError] = useState('')
  const [next,setNext] = useState(0)
  const active = useRef(true), stopped = useRef(false), lastSaved = useRef(null)
  useEffect(() => {active.current=true;return ()=>{active.current=false;stopped.current=true;onBusy(false)}},[onBusy])
  function select(type, files) {
    setSelection(previous=>({...previous,[type]:Array.from(files)}))
    setJobs(null);setResults({});setNext(0);setError('');lastSaved.current=null
  }
  async function submit(event) {
    event.preventDefault()
    if (busy || !validSelection) return
    setBusy(true);onBusy(true);setError('');stopped.current=false
    try {
      const queue = jobs || await prepareReportBatch(selection)
      if (!active.current) return
      setJobs(queue)
      const outcome = await runReportBatch({client,scopeId:scope.id,selection:datasetSelection,jobs:queue,start:next,
        shouldContinue:()=>active.current && !stopped.current,
        onResult:(index,result)=>{
          if (!active.current) return
          setResults(previous=>({...previous,[index]:result}))
          if (!result.error) lastSaved.current=result
        }})
      if (!active.current) return
      setNext(outcome.next)
      if (outcome.failed) setError('Paused at the failed file. Saved reports are kept; retry continues here.')
      if (lastSaved.current) onImported(lastSaved.current)
    } catch (e) { if (active.current) setError(e.message || 'Could not prepare this batch.') }
    finally { if (active.current) { setBusy(false);onBusy(false) } }
  }
  const count=selection.performance.length+selection.pause.length
  const complete=jobs && next===jobs.length
  const saveButton = <button type="button" className="dash-refresh" disabled={busy || (!actionsTarget && !count) || complete} onClick={()=>{onOpen?.();if(count) form.current.requestSubmit()}}>{busy ? 'Saving to cloud…' : complete ? 'Saved to cloud ✓' : next || Object.keys(results).length ? 'Continue upload' : count ? 'Save to cloud' : 'Upload CSVs'}</button>
  return <form ref={form} onSubmit={submit} className="dash-batch-upload">
    <p>Choose multiple dates or cuts · up to 20 CSV files.</p>
    <div className="dash-upload-files">{[['performance','Call Stats CSV files'],['pause','Pause Code CSV files']].map(([type,label])=><label key={type}>{label}<input type="file" multiple accept=".csv,text/csv" disabled={busy} onChange={e=>select(type,e.target.files)}/></label>)}</div>
    {actionsTarget && createPortal(saveButton,actionsTarget)}
    <div className="dash-batch-actions"><button type="submit" className="dash-refresh" disabled={busy || !count || complete}>{busy ? 'Uploading…' : complete ? 'Reports uploaded ✓' : next || Object.keys(results).length ? 'Continue upload' : 'Upload reports'}</button>{busy && <button type="button" onClick={()=>{stopped.current=true}}>Stop after current file</button>}<span role="status">{busy || jobs ? `${Object.values(results).filter(r=>!r.error).length} / ${jobs?.length || 0} reports saved` : `${count} files selected`}</span></div>
    {error && <p role="alert">{error}</p>}
    {jobs && <ol className="dash-batch-list" aria-label="Upload results">{jobs.map((job,index)=><li key={index}><div><strong>{job.reportDate}</strong><span>{job.files.join(' + ')}</span></div><span className={results[index]?.error ? 'dash-over-limit' : ''}>{results[index]?.error || (results[index] ? results[index].status==='duplicate' ? 'Already saved' : 'Saved ✓' : 'Waiting')}</span></li>)}</ol>}
  </form>
}
