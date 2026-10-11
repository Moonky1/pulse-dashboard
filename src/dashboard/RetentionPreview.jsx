import { useEffect, useRef, useState } from 'react'
import { browserDate, number, validDate } from './dashboardModel.js'
import { loadRetention, RETENTION_REASONS } from './retentionApi.js'

const labels = { retain: 'Keep', candidate: 'Cleanup candidate', protected: 'Protected', metadata: 'Audit only' }
const clock = value => value?.replace('T', ' ') || '—'
export function RetentionPreview({ client, scope }) {
  const [date, setDate] = useState(browserDate), [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const request = useRef(0)
  useEffect(() => () => { request.current++ }, [])
  function changeDate(value) {
    request.current++; setDate(value); setResult(null); setError(''); setBusy(false)
  }
  async function simulate(offset = 0) {
    const id = ++request.current
    setBusy(true); setError(''); setResult(null)
    const response = await loadRetention(client, scope.id, date, offset)
    if (id !== request.current) return
    setBusy(false); setResult(response.data || null); setError(response.error || '')
  }
  return <details className="dash-retention dash-panel"><summary>Storage & retention <span>Preview only · no deletion</span></summary>
    <div className="dash-retention-body">
      <h2>See what the 7 / 90 day policy would keep</h2>
      <p>All cuts for the most recent 7 source dates, including the reference date. From day 8 through day 90, keep the latest valid report pair per date and reporting scope.</p>
      <p>Safety exceptions: running/leased records, future-dated or incomplete reports, the latest successful pair for a scope, and versions referenced by duplicate records remain protected. Failed/duplicate audit metadata is not purged here.</p>
      <p className="dash-retention-notice"><strong>Simulation only. Nothing is deleted or scheduled.</strong> The reference date is hypothetical, not VICIdial’s confirmed Today. The initial value uses your browser calendar. {scope.source_time_zone ? `Configured source timezone: ${scope.source_time_zone}.` : 'Source timezone is still unconfirmed; automatic cleanup cannot be activated yet.'}</p>
      <div className="dash-compare-controls"><label>Simulation reference date<input aria-label="Simulation reference date" type="date" min="1900-01-01" max="2200-12-31" value={date} onChange={e => changeDate(e.target.value)} /></label><button className="dash-refresh" disabled={busy || !validDate(date)} onClick={() => simulate()}>{busy ? 'Calculating…' : 'Preview retention'}</button></div>
      {error && <p role="alert">{error}</p>}
      {result && <section aria-label="Retention simulation results">
        <p>Scope: {scope.label} · Reference: {result.as_of_date}. Detailed window: {result.policy.recent_from}–{result.as_of_date}. Daily window starts: {result.policy.daily_from}.</p>
        <dl className="dash-retention-totals">{[['retain', 'Keep'], ['candidates', 'Cleanup candidates'], ['protected', 'Protected'], ['metadata', 'Audit only']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{number(result.totals[key])}</dd></div>)}</dl>
        <p className="dash-caption">{number(result.totals.versions)} records evaluated across all dates in this scope, not just the report date above. A candidate is not an executed deletion. No disk-space savings are guaranteed by this preview.</p>
        {result.rows.length ? <><div className="dash-history-scroll" tabIndex={0} aria-label="Retention decisions"><table className="dash-table"><thead><tr><th>Report date</th><th>Performance / Pause generated</th><th>Rows (Performance / Pause)</th><th>Status</th><th>Decision / reason</th></tr></thead><tbody>{result.rows.map(row => <tr key={row.id}><td>{row.report_date}</td><td>{clock(row.performance_generated_at)}<small>{clock(row.pause_generated_at)}</small></td><td>{row.performance_rows === null ? '—' : number(row.performance_rows)} / {row.pause_rows === null ? '—' : number(row.pause_rows)}</td><td>{row.status}</td><td><strong className={'dash-retention-' + row.decision}>{labels[row.decision]}</strong><small>{RETENTION_REASONS[row.reason][1]}</small></td></tr>)}</tbody></table></div><div className="dash-compare-controls"><button disabled={!result.offset || busy} onClick={() => simulate(Math.max(0, result.offset - 100))}>Previous decisions</button><span>{result.offset + 1}–{result.offset + result.rows.length} of {result.totals.versions}</span><button disabled={!result.more || busy} onClick={() => simulate(result.offset + 100)}>More decisions</button></div></> : <p role="status">No stored records for this scope.</p>}
      </section>}
    </div>
  </details>
}
