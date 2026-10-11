import { useEffect, useRef, useState } from 'react'
import { csvReportDate, uploadReports } from './manualReportApi.js'

export function ManualReportUpload({ client, scope, date, onImported }) {
  const [files, setFiles] = useState({ performance: null, pause: null })
  const [dates, setDates] = useState({})
  const reads = useRef({})
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const active = useRef(true)
  const form = useRef(null)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  const selected = Object.keys(files).filter(key => files[key])
  const ready = selected.length > 0 && selected.every(key => dates[key])
  const mismatch = ready && new Set(selected.map(key => dates[key])).size > 1
  const reportDate = selected.map(key => dates[key]).find(Boolean) || date
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
    if (busy || !confirmed || !ready || mismatch) return
    setBusy(true); setResult(null)
    const outcome = await uploadReports(client, { scopeId: scope.id, reportDate, ...files })
    if (!active.current) return
    setBusy(false); setResult(outcome)
    if (!outcome.error) {
      setFiles({ performance: null, pause: null }); setDates({}); setConfirmed(false); form.current.reset()
      onImported(outcome)
    }
  }
  return <details className="dash-upload dash-panel"><summary>Upload CSV reports</summary>
    <form ref={form} onSubmit={submit}>
      <p>Upload either report or both.{ready && !mismatch && <> Date: <strong>{reportDate}</strong>.</>}</p>
      <div className="dash-upload-files">{[['performance', 'Call Stats Breakdown'], ['pause', 'Pause Code Breakdown']].map(([key, label]) => <label key={key}>{label}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={e => void select(key, e.target.files?.[0] || null)} /></label>)}</div>
      <label className="dash-upload-confirm"><input type="checkbox" required checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} /><span>Complete report for {scope.label.split(' · ')[0]} · all users and campaigns in this scope.</span></label>
      {mismatch && <p role="alert">The reports must be from the same date.</p>}
      <button className="dash-refresh" disabled={busy || !confirmed || !ready || mismatch}>{busy ? 'Saving…' : 'Upload reports'}</button>
      {result && <p role={result.error ? 'alert' : 'status'} className="dash-import-result">{result.error || (result.status === 'duplicate' ? 'Already saved.' : `Saved ${result.agents} agents · ${result.report_date}`)}</p>}
    </form>
  </details>
}
