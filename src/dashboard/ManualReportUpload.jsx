import { useEffect, useRef, useState } from 'react'
import { csvReportDate, uploadReports } from './manualReportApi.js'
import { BatchReportUpload } from './BatchReportUpload.jsx'
import { createPortal } from 'react-dom'

export function ManualReportUpload({ client, scope, date, onImported, actionsTarget }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState({ performance: null, pause: null })
  const [dates, setDates] = useState({})
  const reads = useRef({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [batch, setBatch] = useState(false)
  const active = useRef(true)
  const form = useRef(null)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const selected = Object.keys(files).filter(key => files[key])
  const ready = selected.length > 0 && selected.every(key => dates[key])
  const mismatch = ready && new Set(selected.map(key => dates[key])).size > 1
  const reportDate = selected.map(key => dates[key]).find(Boolean) || date
  function changeMode(value) {
    if (busy) return
    reads.current = {}
    setFiles({ performance: null, pause: null }); setDates({}); setResult(null)
    setBatch(value)
  }
  async function select(key, file) {
    const token = {}; reads.current[key] = token
    setFiles(previous => ({ ...previous, [key]: file })); setDates(previous => ({ ...previous, [key]: null })); setResult(null)
    if (!file) return
    try {
      const value = await csvReportDate(file)
      if (!active.current || reads.current[key] !== token) return
      setDates(previous => ({ ...previous, [key]: value }))
      if (!value) setResult({ error: 'Use an original full-day VICIdial CSV.' })
    } catch { if (active.current && reads.current[key] === token) setResult({ error: 'Could not read this file.' }) }
  }
  async function submit(event) {
    event.preventDefault()
    if (busy || !ready || mismatch) return
    setBusy(true); setResult(null)
    const outcome = await uploadReports(client, { scopeId: scope.id, reportDate, ...files })
    if (!active.current) return
    setBusy(false); setResult(outcome)
    if (!outcome.error) {
      setFiles({ performance: null, pause: null }); setDates({}); form.current.reset()
      onImported(outcome)
    }
  }
  const saveButton = <button type="button" className="dash-refresh" disabled={busy || mismatch || (!actionsTarget && !ready)} onClick={() => { setOpen(true); if (ready) form.current.requestSubmit() }}>{busy ? 'Saving…' : actionsTarget ? ready ? 'Save to cloud' : 'Upload CSVs' : 'Upload reports'}</button>
  return <details className="dash-upload dash-panel" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>Upload CSV reports</summary>
    <nav className="dash-upload-mode" aria-label="Upload mode"><button type="button" disabled={busy} aria-pressed={!batch} onClick={()=>changeMode(false)}>One report</button><button type="button" disabled={busy} aria-pressed={batch} onClick={()=>changeMode(true)}>Multiple CSVs</button></nav>
    {batch ? <BatchReportUpload client={client} scope={scope} onImported={onImported} onBusy={setBusy} actionsTarget={actionsTarget} onOpen={()=>setOpen(true)}/> :
    <form ref={form} onSubmit={submit}>
      <p>Upload either report or both. Saved to Pulse cloud.{ready && !mismatch && <> Date: <strong>{reportDate}</strong>.</>}</p>
      <div className="dash-upload-files">{[['performance', 'Call Stats Breakdown'], ['pause', 'Pause Code Breakdown']].map(([key, label]) => <label key={key}>{label}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={e => void select(key, e.target.files?.[0] || null)} /></label>)}</div>
      {mismatch && <p role="alert">The reports must be from the same date.</p>}
      {actionsTarget ? createPortal(saveButton,actionsTarget) : saveButton}
      {result && <p role={result.error ? 'alert' : 'status'} className="dash-import-result">{result.error || (result.status === 'duplicate' ? 'Already saved.' : `Saved ${result.agents} agents · ${result.report_date}`)}</p>}
    </form>}
  </details>
}
