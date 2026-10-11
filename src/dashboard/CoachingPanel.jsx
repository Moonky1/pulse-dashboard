import { useMemo, useState } from 'react'
import { coachingAgents, dispositionComparisons, timeComparisons } from './dispositionInsights.js'
import { duration, number } from './dashboardModel.js'
import { percent } from './performanceInsights.js'
import { teamLabel } from './reportingPolicy.js'

export function CoachingPanel({ data, readError, onOpen }) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('attention')
  const agents = useMemo(() => readError ? [] : coachingAgents(data), [data, readError])
  if (!data?.snapshot || readError) return null
  const visible = agents.filter(({ row }) => `${row.vici_user_name} ${row.agent_code}`.toLowerCase().includes(search.trim().toLowerCase()))
  const comparison = view === 'callbk' ? dispositionComparisons(data.performance, 'CALLBK').filter(item => item.points > 0).sort((a, b) => b.points - a.points || a.row.agent_code.localeCompare(b.row.agent_code)).slice(0, 10) : timeComparisons(data, view)
  return <details className="dash-panel dash-coaching"><summary>Coaching &amp; support <span>{agents.length} to review</span></summary><div className="dash-coaching-body">
    <div className="dash-coaching-limits"><span>Break <b>25 min</b></span><span>Lunch <b>60 min</b></span><span>RR <b>20 min</b></span></div>
    <p className="dash-caption">Break = 15 + 10 min total. NI / DAIR: over 10 percentage points above the rest of the team. Review the calls before drawing conclusions.</p>
    <nav className="dash-coaching-tabs" aria-label="Coaching comparisons">{[['attention', 'Needs review'], ['talk', 'Low Talk avg'], ['dead', 'High Dead avg'], ['callback', 'Callback time'], ['callbk', 'CALLBK calls']].map(([key, label]) => <button type="button" key={key} aria-pressed={view === key} onClick={() => setView(key)}>{label}</button>)}</nav>
    {view !== 'attention' ? <><p className="dash-caption">Top 10 differences vs the rest of each agent’s team. Talk / Dead averages are weighted by calls; Callback time uses % logged time.</p><div className="dash-history-scroll"><table className="dash-table"><thead><tr><th>Agent</th><th>Calls</th><th>XFER</th><th>Agent</th><th>Rest of team</th><th>Difference</th></tr></thead><tbody>{comparison.map(item => <tr key={item.row.agent_code}><td><button type="button" onClick={() => onOpen(item.row.agent_code)}>{item.row.vici_user_name}</button><small>{teamLabel(data.scope, item.row)}</small></td><td>{number(view === 'callbk' ? item.row.calls : item.calls)}</td><td>{number(view === 'callbk' ? item.row.xfer_count : item.xfer)}</td><td>{view === 'callbk' ? `${number(item.ownCount)} · ${percent(item.ownRate)}` : view === 'callback' ? `${duration(item.value)} · ${percent(item.ownRate)}` : `${item.value}s`}</td><td>{view === 'callbk' ? percent(item.peerRate) : view === 'callback' ? percent(item.peerRate) : `${item.average.toFixed(1)}s`}</td><td>{(view === 'callbk' ? item.points : item.difference).toFixed(1)} {['callbk', 'callback'].includes(view) ? 'pp' : 's'}</td></tr>)}</tbody></table></div>{!comparison.length && <p>No comparable differences in this report.</p>}</> : <>
    {!data.pause.length && <p>No pause report for these checks.</p>}{!data.performance.length && <p>No Call Stats report for NI / DAIR checks.</p>}
    <label className="dash-search"><span className="dash-sr">Search coaching agents</span><input type="search" aria-label="Search coaching agents" placeholder="Find an agent" value={search} onChange={e => setSearch(e.target.value)} /></label>
    {!agents.length && <p>No review signals in the available data.</p>}
    {visible.slice(0, 25).map(({ row, reasons }) => <article className="dash-coaching-agent" key={row.agent_code}>
      <header><button type="button" onClick={() => onOpen(row.agent_code)}>{row.vici_user_name}</button><small>{row.agent_code} · {teamLabel(data.scope, row)}</small></header>
      <ul>{reasons.map(reason => <li key={reason.code} className={reason.kind === 'pause' ? 'dash-over-limit' : ''}><strong>{reason.code}</strong>{reason.kind === 'pause' ? <span>{duration(reason.value)} / {duration(reason.limit)} · +{duration(reason.over)} over</span> : <span>{number(reason.ownCount)} · {percent(reason.ownRate)} of calls vs {percent(reason.peerRate)} peers · +{reason.points.toFixed(1)} pp</span>}</li>)}</ul>
    </article>)}
    {visible.length > 25 && <p>{visible.length} agents · narrow the search to see the rest.</p>}
    </>}
  </div></details>
}
