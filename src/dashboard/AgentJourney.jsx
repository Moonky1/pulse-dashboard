import { useEffect, useRef, useState } from 'react'
import { duration, number, PAUSE_FIELDS, PERFORMANCE_COLUMNS } from './dashboardModel.js'
import { compareAgentDays, loadAgentJourney, medal, percent, previousDate, summarizeJourney } from './performanceInsights.js'

const clock = value => value?.replace('T', ' ') || 'Unavailable'
const signed = (value, points = false) => value === null ? '—' : `${value > 0 ? '+' : ''}${points ? value.toFixed(2) + ' pp' : value.toLocaleString('en-US')}`
function DaySummary({ title, day }) {
  return <div><dt>{title}</dt><dd>{day?.status === 'observed' ? `${number(day.row.xfer_count)} XFER` : day?.status === 'absent' ? 'Not in report' : 'No report'}</dd><small>{day?.date}{day?.status === 'observed' && ` · ${number(day.row.calls)} calls · ${percent(day.conversion)}`}</small></div>
}
export function AgentJourney({ client, scope, date, code, onDenied }) {
  const [daysCount, setDaysCount] = useState(7), [state, setState] = useState({})
  const [selected, setSelected] = useState(null), [baseline, setBaseline] = useState('')
  const seq = useRef(0)
  useEffect(() => () => { seq.current++ }, [])
  async function load(count = daysCount) {
    const request = ++seq.current
    setDaysCount(count); setSelected(null); setBaseline(''); setState({ loading: true, progress: 0 })
    const result = await loadAgentJourney(client, scope, date, count, code, { current: () => seq.current === request,
      progress: complete => { if (seq.current === request) setState({ loading: true, progress: complete }) } })
    if (seq.current !== request) return
    setState(result)
    if (result.error?.code === 'access_denied') onDenied()
  }
  const days = state.days || [], summary = days.length ? summarizeJourney(days) : null
  const current = days[0], yesterday = days.find(day => day.date === previousDate(date))
  const previous = days.slice(1).find(day => day.status === 'observed')
  const comparison = compareAgentDays(current, days.find(day => day.date === baseline))
  const max = Math.max(1, ...days.filter(day => day.status === 'observed').map(day => day.row.xfer_count))
  const detail = days.find(day => day.date === selected && day.status === 'observed')
  return <section className="dash-journey" aria-label="Agent history and contribution">
    <header className="dash-insights-heading"><div><p className="dash-eyebrow">THE DAILY STORY</p><h3>History &amp; contribution</h3></div><span aria-hidden="true">📈</span></header>
    <p>One latest saved report per date, never a sum of intraday uploads. A saved cut may be incomplete: these are observed results, not certified end-of-shift totals. Identity follows exact VICIdial ID {code} within this scope, not the name.</p>
    <div className="dash-rank-filters"><label>History window<select aria-label="Agent history window" value={daysCount} disabled={state.loading} onChange={e => { const count = Number(e.target.value); setDaysCount(count); setState({}); setSelected(null); setBaseline('') }}><option value={7}>7 calendar days</option><option value={30}>30 calendar days</option></select></label><button disabled={state.loading} onClick={() => void load()}>{state.loading ? `Loading ${state.progress}/${daysCount}…` : state.days ? 'Reload agent history' : 'Load agent history'}</button></div>
    <p className="dash-caption">{previousDate(date, daysCount - 1)} → {date} · Read on demand from protected Pulse reports; no new Vici request or permanent browser storage. Best/lowest means within this window, not lifetime. The current day is re-read for this history.</p>
    {state.loading && <p role="status">Reading saved days… {state.progress}/{daysCount}</p>}
    {state.error && <p role="alert">{state.error.message}</p>}
    {summary && <>
      <dl className="dash-insight-metrics"><div><dt>Observed / active days</dt><dd>{summary.observed} / {summary.active}</dd><small>Active = calls &gt; 0</small></div><div><dt>XFER in observed days</dt><dd>{summary.observed ? number(summary.xfer) : '—'}</dd><small>{summary.observed ? number(summary.calls) : '—'} calls</small></div><div><dt>Weighted conversion</dt><dd>{percent(summary.conversion)}</dd><small>Total XFER ÷ total calls</small></div><div><dt>Weighted group contribution</dt><dd>{percent(summary.share)}</dd><small>Agent XFER ÷ group XFER on the same observed days</small></div></dl>
      <dl className="dash-insight-metrics"><DaySummary title="Selected date · latest" day={current} /><DaySummary title="Previous calendar day" day={yesterday} /><DaySummary title="Previous observed day" day={previous} /><div><dt>🏆 Top 3 / 🥇 #1 days</dt><dd>{summary.topThree} / {summary.first}</dd><small>Within that day’s source group, by XFER · active days</small></div></dl>
      <div className="dash-journey-extremes">{[['🏆 Best active day', summary.best], ['🔎 Lowest active day', summary.lowest]].map(([label, matches]) => <div key={label}><span>{label}</span><strong>{matches.length ? `${number(matches[0].row.xfer_count)} XFER` : 'Not available'}</strong><small>{matches.map(day => day.date).join(' · ') || 'No days with calls in this window'}</small></div>)}</div>
      <p className="dash-caption">{summary.noReport} dates without a report · {summary.absent} reports without this ID · {summary.zeroDays} active days with zero XFER. None of these missing observations is counted as a zero day or absence from work. Historical groups use each report’s CURRENT USER GROUP; no team membership is guessed.</p>
      <div className="dash-journey-timeline" tabIndex={0} aria-label="Daily XFER timeline">{[...days].reverse().map(day => <button key={day.date} disabled={day.status !== 'observed'} onClick={() => setSelected(day.date)} aria-label={`${day.date}: ${day.status === 'observed' ? day.row.xfer_count + ' XFER, open daily detail' : day.status === 'absent' ? 'Agent not in report' : 'No report'}`}><span className={`dash-journey-bar${day.status !== 'observed' ? ' dash-journey-bar--missing' : ''}`}><i style={{ height: day.status === 'observed' ? `${Math.max(3, day.row.xfer_count / max * 100)}%` : '0%' }} /></span><strong>{day.status === 'observed' ? number(day.row.xfer_count) : '—'}</strong><small>{day.date.slice(5)}</small><span>{day.status === 'observed' ? medal(day.rank) : 'No data'}</span></button>)}</div>
      <div className="dash-rank-filters"><label>Compare selected date with<select aria-label="Compare agent days" value={baseline} onChange={e => setBaseline(e.target.value)}><option value="">Choose an observed date</option>{days.slice(1).filter(day => day.status === 'observed').map(day => <option key={day.date}>{day.date}</option>)}</select></label></div>
      {baseline && (comparison ? <p className="dash-journey-comparison">{baseline} → {date}: Calls {signed(comparison.calls)} · XFER {signed(comparison.xfer)} · Conversion {signed(comparison.conversionPoints, true)}.{!comparison.sameGroup && ' Source group changed; these are not like-for-like group comparisons.'} Different generation times or shifts may affect this comparison.</p> : <p>No comparable agent observation on the selected date.</p>)}
      <div className="dash-history-scroll" tabIndex={0} aria-label="Agent daily records"><table className="dash-table"><caption className="dash-sr">Daily records · latest saved report per source date</caption><thead><tr><th>Date / source clock</th><th>Group / status</th><th>Calls</th><th>XFER</th><th>Conversion</th><th>Group rank</th><th>Group XFER share</th><th>Action</th></tr></thead><tbody>{days.map(day => <tr key={day.date}><td>{day.date}<small>{day.snapshot ? clock(day.snapshot.performance_generated_at) : 'No report'}</small></td><td>{day.status === 'observed' ? day.group : day.status === 'absent' ? 'ID not in report' : 'No saved report'}</td><td>{number(day.row?.calls)}</td><td>{number(day.row?.xfer_count)}</td><td>{percent(day.conversion)}</td><td>{day.rank ? medal(day.rank) : '—'}</td><td>{percent(day.xferShare)}</td><td><button disabled={day.status !== 'observed'} onClick={() => setSelected(day.date)}>Daily detail</button></td></tr>)}</tbody></table></div>
      {detail && <section className="dash-journey-daily" aria-label="Historical daily detail"><h4>{detail.date} · {detail.row.vici_user_name} · {detail.group}</h4><p>Performance: {clock(detail.snapshot.performance_generated_at)} · Pause: {clock(detail.snapshot.pause_generated_at)}. Saved cut, not a guaranteed final daily total.</p><dl className="dash-detail-grid">{[['calls', 'Calls'], ['xfer_count', 'XFER'], ...PERFORMANCE_COLUMNS].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key.endsWith('seconds') ? duration(detail.row[key]) : number(detail.row[key])}</dd></div>)}</dl><h4>Pause codes</h4>{detail.pause ? <dl className="dash-detail-grid">{[['total_seconds', 'Logged'], ['nonpause_seconds', 'Nonpause'], ['pause_seconds', 'Pause'], ...PAUSE_FIELDS, ...Object.keys(detail.pause.other_pause_seconds).map(key => [`other:${key}`, key])].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{duration(key.startsWith('other:') ? detail.pause.other_pause_seconds[key.slice(6)] : detail.pause[key])}</dd></div>)}</dl> : <p>No pause observation.</p>}<h4>Source dispositions</h4><p>SPANIS is not Spanish XFER.</p><dl className="dash-dispositions">{Object.entries(detail.row.dispositions).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{number(value)}</dd></div>)}</dl></section>}
    </>}
  </section>
}
