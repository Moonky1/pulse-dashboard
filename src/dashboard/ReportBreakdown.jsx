import { duration, number, PAUSE_FIELDS, PERFORMANCE_COLUMNS, metricLabel } from './dashboardModel.js'
const WARNINGS = {
  unnamed_columns: 'The CSV contains columns without names. Numeric values are retained under their source column position; their meaning is not inferred.',
  extra_disposition_columns: 'Additional disposition codes from this export are included.',
  extra_pause_columns: 'Additional pause codes from this export are included.',
  unmapped_totals_not_comparable: 'Some unlabelled columns contain blank cells; their totals cannot be independently reconciled.',
  report_agent_sets_differ: 'The two automatic exports contain different agent sets.',
  missing_totals: 'The source TOTALS row was missing.',
  totals_mismatch: 'One or more source totals differ from their agent rows.',
}
function sum(rows, key) { return rows.every(row => Number.isSafeInteger(row[key])) ? rows.reduce((total, row) => total + row[key], 0) : null }
function mapTotals(rows, key) {
  const names = [...new Set(rows.flatMap(row => Object.keys(row[key] || {})))].sort()
  return names.map(name => [name, rows.every(row => Number.isSafeInteger(row[key]?.[name])) ? rows.reduce((total, row) => total + row[key][name], 0) : null])
}
function Values({ title, entries, time = false }) {
  return <section><h3>{title}</h3><dl className="dash-dispositions">{entries.map(([label, value]) => <div key={label}><dt>{metricLabel(label)}</dt><dd>{time ? duration(value) : number(value)}</dd></div>)}</dl></section>
}
export function ReportBreakdown({ performance, pause, snapshot, filtered }) {
  const verification = snapshot.validation_summary
  return <section className="dash-panel dash-full-breakdown"><h2>Complete report breakdown</h2><p>{filtered ? 'Selected user group' : 'All report agents'} · {performance.length} performance observations · {pause.length} pause observations</p>
    <Values title="Performance totals (hh:mm:ss)" time entries={PERFORMANCE_COLUMNS.filter(([key]) => !key.includes('_avg_')).map(([key, label]) => [label, sum(performance, key)])} />
    <Values title="Every disposition code" entries={mapTotals(performance, 'dispositions')} />
    <p className="dash-caption">XFER and SPANIS are independent. {performance.some(r => Object.hasOwn(r.dispositions, 'SPXFER')) ? 'SPXFER is displayed as supplied.' : 'This report does not include SPXFER; Spanish transfers cannot be determined from SPANIS.'}</p>
    <Values title="Pause report totals (hh:mm:ss)" time entries={[['total_seconds', 'Logged'], ['nonpause_seconds', 'Nonpause'], ['pause_seconds', 'Pause'], ...PAUSE_FIELDS].map(([key, label]) => [label, sum(pause, key)])} />
    <Values title="Additional pause codes (hh:mm:ss)" time entries={mapTotals(pause, 'other_pause_seconds')} />
    <Values title="Unlabelled pause columns (hh:mm:ss)" time entries={mapTotals(pause, 'unmapped_columns')} />
    <p className="dash-caption">Blank cells are unavailable, not zero. Performance pause and Pause Breakdown are separate source measures. Time categories may overlap; they are not summed into an invented total.</p>
    {verification && <details><summary>Source totals & validation · complete uploaded files</summary><p>These totals cover the complete upload, regardless of the group filter above. Averages below are Vici’s TOTALS averages, never a sum of agent averages.</p>{['performance', 'pause'].map(type => <div key={type}><h3>{type === 'performance' ? 'Agent Performance Detail' : 'Pause Code Breakdown'}</h3><p>{verification[type].agents} agents · {verification[type].reconciled_fields} additive totals reconciled</p><Values title="Original source totals" entries={Object.entries(verification[type].totals).filter(([key, value]) => typeof value === 'number' && !key.endsWith('_seconds'))} /><Values title="Original source times and averages (hh:mm:ss)" time entries={Object.entries(verification[type].totals).filter(([key]) => key.endsWith('_seconds'))} /></div>)}</details>}
    {snapshot.warnings?.length > 0 && <aside className="dash-source-warnings"><h3>Source notes</h3><ul>{snapshot.warnings.map(code => <li key={code}>{WARNINGS[code] || 'An additional source validation note is present.'}</li>)}</ul></aside>}
  </section>
}
