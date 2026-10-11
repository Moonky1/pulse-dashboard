import { duration, number, PAUSE_FIELDS, PERFORMANCE_COLUMNS, metricLabel } from './dashboardModel.js'
import { DispositionExplorer } from './DispositionExplorer.jsx'

function sum(rows, key) { return rows.length && rows.every(row => Number.isSafeInteger(row[key])) ? rows.reduce((total, row) => total + row[key], 0) : null }
function mapTotals(rows, key) {
  const names = [...new Set(rows.flatMap(row => Object.keys(row[key] || {})))].sort()
  return names.map(name => [name, rows.every(row => Number.isSafeInteger(row[key]?.[name])) ? rows.reduce((total, row) => total + row[key][name], 0) : null])
}
function Values({ title, entries, time = false }) {
  if (!entries.length) return null
  return <section><h3>{title}</h3><dl className="dash-dispositions">{entries.map(([label, value]) => <div key={label}><dt>{metricLabel(label)}</dt><dd>{time ? duration(value) : number(value)}</dd></div>)}</dl></section>
}
export function ReportBreakdown({ performance, pause, snapshot, filtered, onOpen }) {
  const mismatch = snapshot.warnings?.some(code => ['totals_mismatch', 'report_agent_sets_differ'].includes(code))
  return <section className="dash-panel dash-full-breakdown"><h2>Full breakdown</h2><p>{filtered ? 'Selected team' : 'All report agents'}</p>
    <Values title="Performance totals (hh:mm:ss)" time entries={PERFORMANCE_COLUMNS.filter(([key]) => !key.includes('_avg_')).map(([key, label]) => [label, sum(performance, key)])} />
    <h3>Dispositions</h3><DispositionExplorer rows={performance} onOpen={onOpen} />
    <Values title="Pause report totals (hh:mm:ss)" time entries={[['total_seconds', 'Logged'], ['nonpause_seconds', 'Nonpause'], ['pause_seconds', 'Pause'], ...PAUSE_FIELDS].map(([key, label]) => [label, sum(pause, key)])} />
    <Values title="Additional pause codes (hh:mm:ss)" time entries={mapTotals(pause, 'other_pause_seconds')} />
    {mismatch && <p role="status">Report totals need review.</p>}
  </section>
}
