import { useEffect, useRef, useState } from 'react'
import { uploadReports } from './manualReportApi.js'

export function ManualReportUpload({ client, scope, date, onImported }) {
  const [files, setFiles] = useState({ performance: null, pause: null })
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const active = useRef(true)
  const form = useRef(null)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  async function submit(event) {
    event.preventDefault()
    if (busy || !confirmed) return
    setBusy(true); setResult(null)
    const outcome = await uploadReports(client, { scopeId: scope.id, reportDate: date, ...files })
    if (!active.current) return
    setBusy(false); setResult(outcome)
    if (!outcome.error) {
      setFiles({ performance: null, pause: null }); setConfirmed(false); form.current.reset()
      onImported()
    }
  }
  return <details className="dash-upload dash-panel"><summary>Upload CSV reports <span>Admin / Super Admin</span></summary>
    <form ref={form} onSubmit={submit}>
      <p>Upload both original VICIdial CSV exports for <strong>{date}</strong>, from 00:00:00 to 23:59:59. Each upload keeps a separate version. Exact duplicates are not counted twice.</p>
      <p className="dash-caption">Export scope: {scope.label}. User groups: {scope.user_groups.join(', ')}. Campaigns: {scope.campaigns.join(', ') || 'Use the configured report scope'}.</p>
      <div className="dash-upload-files">{[['performance', '1. Agent Performance Detail'], ['pause', '2. Pause Code Breakdown']].map(([key, label]) => <label key={key}>{label}<input type="file" accept=".csv,text/csv" required disabled={busy} onChange={e => { setFiles(previous => ({ ...previous, [key]: e.target.files?.[0] || null })); setResult(null) }} /><small>Original CSV · up to 5 MiB</small></label>)}</div>
      <label className="dash-upload-confirm"><input type="checkbox" required checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} /><span>I exported both files using these campaign and user-group filters, all users, and the full day shown above. Campaign filters are not included in the CSV itself.</span></label>
      <button className="dash-refresh" disabled={busy || !confirmed || !files.performance || !files.pause}>{busy ? 'Validating and saving…' : 'Validate & save reports'}</button>
      <p className="dash-caption">Files are validated on the server. Report data and upload history are saved; original CSV files are not retained. Automatic connection status is unchanged.</p>
      {result && <p role={result.error ? 'alert' : 'status'} className="dash-import-result">{result.error || (result.status === 'duplicate' ? 'These report data were already stored. No duplicate figures were created.' : `Saved ${result.agents} agents for ${date}. Open History to compare versions. The latest source-generated report remains selected by default.`)}</p>}
    </form>
  </details>
}
