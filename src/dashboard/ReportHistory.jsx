import { useEffect, useRef, useState } from 'react'
import { compareSnapshots, DELTA_FIELDS, loadHistory, loadSnapshot } from './reportHistory.js'
import { duration, number, metricLabel } from './dashboardModel.js'
const clock = value => value?.replace('T', ' ') || '—'
const delta = (value, time = false) => value === null ? '—' : (value < 0 ? '−' : value > 0 ? '+' : '') + (time ? duration(Math.abs(value)) : number(Math.abs(value)))
function DifferenceList({ title, values, time }) {
  return <><h4>{title}</h4><dl className="dash-dispositions">{Object.entries(values).map(([key, value]) => <div key={key}><dt>{time ? metricLabel(key) : key}</dt><dd>{delta(value, time)}</dd></div>)}</dl></>
}
export function ReportHistory({ client, scope, date, revision, SnapshotView: snapshotView }) {
  const SnapshotView = snapshotView
  const [open, setOpen] = useState(false), [offset, setOffset] = useState(0)
  const [history, setHistory] = useState({ rows: [], loading: false })
  const [before, setBefore] = useState(''), [after, setAfter] = useState('')
  const [detail, setDetail] = useState(null), [comparison, setComparison] = useState(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const active = useRef(true)
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (!open) return
    let current = true
    void loadHistory(client, scope.id, date, offset).then(result => { if (current) setHistory({ ...result, loading: false }) })
    return () => { current = false }
  }, [client, scope.id, date, offset, open, revision])
  function page(next) {
    setBefore(''); setAfter(''); setHistory({ rows: [], loading: true }); setOffset(next)
  }
  async function inspect(id) {
    setBusy(true); setError(''); setDetail(null); setComparison(null)
    const result = await loadSnapshot(client, scope.id, date, id)
    if (!active.current) return
    setBusy(false)
    if (result.error) { setError(result.error); return }
    setDetail(result.data)
  }
  async function compare() {
    setBusy(true); setError(''); setDetail(null); setComparison(null)
    const [a, b] = await Promise.all([loadSnapshot(client, scope.id, date, before), loadSnapshot(client, scope.id, date, after)])
    if (!active.current) return
    setBusy(false)
    if (a.error || b.error) { setError(a.error || b.error); return }
    try { setComparison({ rows: compareSnapshots(a.data, b.data), before: a.data.snapshot, after: b.data.snapshot }) }
    catch (e) { setError(e.message) }
  }
  const rows = history.rows || []
  const filtered = comparison?.rows.filter(row => (row.code + ' ' + row.name).toLocaleLowerCase().includes(search.toLocaleLowerCase())) || []
  return <details className="dash-history dash-panel" onToggle={e => setOpen(e.currentTarget.open)}><summary>History & comparisons <span>{date}</span></summary>
    {open && <div className="dash-history-body">
      <p>Each version keeps its full report data. Source clocks are VICIdial local time; uploaded time uses your browser timezone. Repeated identical exports do not create a new version.</p>
      <p className="dash-caption">These are cumulative daily counters, not separate call batches. Differences are only comparable within the same date and scope. No original CSV file is stored.</p>
      {history.error && <p role="alert">{history.error}</p>}
      {!history.error && !rows.length && <p role="status">{history.loading ? 'Loading versions…' : 'No stored versions for this date.'}</p>}
      {rows.length > 0 && <><div className="dash-history-scroll" tabIndex={0} aria-label="Upload history"><table className="dash-table"><thead><tr><th>Performance generated</th><th>Pause generated</th><th>Uploaded / captured</th><th>Origin / uploader</th><th>Agents</th><th>Calls</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{clock(row.performance_generated_at)}</td><td>{clock(row.pause_generated_at)}</td><td>{new Date(row.captured_at).toLocaleString()}</td><td>{row.ingestion_method === 'manual' ? 'Manual' : 'Automatic'}<small>{row.uploaded_by || 'Server collector'}</small></td><td>{number(row.agents)}</td><td>{number(row.calls)}</td><td><button disabled={busy} onClick={() => inspect(row.id)}>Open version</button></td></tr>)}</tbody></table></div>
        <div className="dash-compare-controls"><button disabled={!offset || busy} onClick={() => page(Math.max(0, offset - 50))}>Newer versions</button><button disabled={!history.more || busy} onClick={() => page(offset + 50)}>Older versions</button><span>Versions {offset + 1}–{offset + rows.length}</span></div>
        <div className="dash-compare-controls">{[['Baseline version', before, setBefore], ['Comparison version', after, setAfter]].map(([label, value, change]) => <label key={label}>{label}<select aria-label={label} value={value} disabled={busy} onChange={e => change(e.target.value)}><option value="">Choose a version</option>{rows.map(row => <option key={row.id} value={row.id}>{clock(row.performance_generated_at)} · Pause {clock(row.pause_generated_at)}</option>)}</select></label>)}<button className="dash-refresh" disabled={busy || !before || !after || before === after} onClick={compare}>{busy ? 'Loading…' : 'Compare versions'}</button></div></>}
      {error && <p role="alert">{error}</p>}
      {detail && <section className="dash-history-selected"><h2>Stored version · {clock(detail.snapshot.performance_generated_at)}</h2><p>Pause: {clock(detail.snapshot.pause_generated_at)}. This does not replace the latest report.</p><SnapshotView key={detail.snapshot.id} data={detail} loading={false} error={null} /></section>}
      {comparison && <section className="dash-comparison"><h2>Differences between versions</h2><p>{clock(comparison.before.performance_generated_at)} → {clock(comparison.after.performance_generated_at)}</p><p>{comparison.rows.filter(r => r.status === 'Matched').length} matched agents · {comparison.rows.filter(r => r.status === 'Added').length} added · {comparison.rows.filter(r => r.status === 'Not in later report').length} absent from later report</p><p className="dash-caption">New or missing agents are not treated as zero. Negative differences indicate revised or reset counters, not negative work. Source averages are not subtracted to invent interval averages.</p>
        <label>Search comparison<input type="search" aria-label="Search comparison" value={search} onChange={e => setSearch(e.target.value)} /></label>
        {filtered.map(row => <details key={row.code} className="dash-delta-agent"><summary>{row.name} · {row.code} <span>{row.status}{row.decreased ? ' · Counter decreased' : ''} · Calls {delta(row.metrics.calls)} · XFER {delta(row.metrics.xfer_count)}</span></summary><dl className="dash-detail-grid">{DELTA_FIELDS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{delta(row.metrics[key], key.endsWith('_seconds'))}</dd></div>)}</dl><DifferenceList title="Disposition changes" values={row.dispositions} /><DifferenceList title="Pause changes (hh:mm:ss)" values={row.pauses} time /><DifferenceList title="Additional pause codes" values={row.otherPauses} time /><DifferenceList title="Unlabelled source columns" values={row.unnamedPauses} time /></details>)}
      </section>}
    </div>}
  </details>
}
