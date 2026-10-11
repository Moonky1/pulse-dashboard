import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ageLabel, aggregate, calendarDate, duration, filterAgents, groupName, groupSummaries, integrationState, number, PAUSE_FIELDS, profilePath } from './dashboardModel.js'
import { useDashboard } from './useDashboard.js'
import { ManualReportUpload } from './ManualReportUpload.jsx'
import { ReportHistory } from './ReportHistory.jsx'
import { ReportBreakdown } from './ReportBreakdown.jsx'
import { PERFORMANCE_COLUMNS } from './dashboardModel.js'
import './dashboard.css'

const TIMES = PERFORMANCE_COLUMNS
const ERRORS = { source_network_error: 'The reporting server could not be reached.', request_timeout: 'The reporting server did not respond in time.', requires_ip_validation: 'The reporting connection needs IP validation by an authorized operator.', source_auth_error: 'The reporting connection needs an authorized access review.', source_rate_limited: 'The reporting server asked Pulse to wait before trying again.' }
function Mark({ kind = 'chart' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{kind === 'refresh' ? <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></> : <><path d="M4 20h16M7 16v-5m5 5V4m5 12V8" /></>}</svg>
}
function Metric({ label, value, note, accent }) {
  return <article className={`dash-metric${accent ? ' dash-metric--accent' : ''}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}
function Metrics({ rows, available }) {
  const totals = available ? aggregate(rows) : null
  return <section className="dash-metrics" aria-label="Report overview">
    <Metric label="Agents" value={totals ? number(totals.agents) : '—'} note="In this report" />
    <Metric label="Calls" value={totals ? number(totals.calls) : '—'} note="Reported by VICIdial" />
    <Metric label="XFER" value={totals ? number(totals.xfer) : '—'} note="Canonical transfer count" accent />
    <Metric label="Talk time" value={totals ? duration(totals.talk) : '—'} note="Total across agents" />
    <Metric label="Customer time" value={totals ? duration(totals.customer) : '—'} note="VICIdial customer total" />
    <Metric label="Pause time" value={totals ? duration(totals.pause) : '—'} note="Performance report total" />
  </section>
}
function Blank({ title, children, loading = false }) {
  return <div className={`dash-blank${loading ? ' dash-blank--loading' : ''}`} role="status"><span className="dash-blank__mark"><Mark /></span><h3>{title}</h3><p>{children}</p></div>
}
function AgentName({ row, onOpen }) {
  return <button className="dash-agent" onClick={() => onOpen(row.agent_code)}><span className="dash-avatar" aria-hidden="true">{row.vici_user_name.trim().slice(0, 2)}</span><span><strong>{row.vici_user_name}</strong><small>{row.agent_code}{row.linked === false ? ' · Unlinked' : ''}</small></span></button>
}
function SortHead({ name, label, sort, setSort }) {
  return <th scope="col" aria-sort={sort.key === name ? sort.descending ? 'descending' : 'ascending' : 'none'}><button onClick={() => setSort({ key: name, descending: sort.key === name ? !sort.descending : name !== 'vici_user_name' })}>{label}<span aria-hidden="true">{sort.key === name ? sort.descending ? ' ↓' : ' ↑' : ' ↕'}</span></button></th>
}
function AgentTable({ rows, view, onOpen, sort, setSort }) {
  const pause = view === 'pause'
  const columns = pause ? [['total_seconds', 'Logged'], ['nonpause_seconds', 'Nonpause'], ['pause_seconds', 'Pause'], ...PAUSE_FIELDS] : TIMES
  return <div className="dash-table-scroll" tabIndex={0} aria-label={pause ? 'Pause breakdown table, scroll horizontally for more columns' : 'Agent performance table, scroll horizontally for more columns'}>
    <table className="dash-table"><caption className="dash-sr">{pause ? 'Pause Code Breakdown' : 'Agent Performance Detail'} · time values are hours:minutes:seconds</caption><thead><tr>
      <SortHead name="vici_user_name" label="Agent / ID" sort={sort} setSort={setSort} /><th scope="col">User group</th>
      {!pause && <><SortHead name="calls" label="Calls" sort={sort} setSort={setSort} /><SortHead name="xfer_count" label="XFER" sort={sort} setSort={setSort} /></>}
      {columns.map(([key, label]) => <SortHead key={key} name={key} label={label} sort={sort} setSort={setSort} />)}
    </tr></thead><tbody>{rows.map(row => <tr key={row.agent_code} onClick={() => onOpen(row.agent_code)}>
      <td><AgentName row={row} onOpen={onOpen} /></td><td><span className="dash-group-name">{groupName(row)}</span>{row.team_name && <small className="dash-team-name">{row.team_name}</small>}</td>
      {!pause && <><td>{number(row.calls)}</td><td className="dash-xfer">{number(row.xfer_count)}</td></>}
      {columns.map(([key]) => <td key={key}>{duration(row[key])}</td>)}
    </tr>)}</tbody></table>
  </div>
}
function MobileAgents({ rows, pause, onOpen }) {
  return <div className="dash-mobile-agents">{rows.map(row => <article className="dash-mobile-agent" key={row.agent_code}><AgentName row={row} onOpen={onOpen} /><p>{groupName(row)}</p><dl>{(pause ? [['total_seconds', 'Logged'], ['nonpause_seconds', 'Nonpause'], ['pause_seconds', 'Pause']] : [['calls', 'Calls'], ['xfer_count', 'XFER'], ['talk_seconds', 'Talk']]).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key.endsWith('seconds') ? duration(row[key]) : number(row[key])}</dd></div>)}</dl><button className="dash-text-button" onClick={() => onOpen(row.agent_code)}>View full breakdown <span aria-hidden="true">↗</span></button></article>)}</div>
}
function AgentDetail({ code, data, onClose }) {
  const dialogRef = useRef(null)
  const performance = data.performance.find(r => r.agent_code === code)
  const pause = data.pause.find(r => r.agent_code === code)
  const row = performance || pause
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  if (!row) return null
  const profile = profilePath(performance)
  const sourceFields = [...PAUSE_FIELDS, ...Object.keys(pause?.other_pause_seconds || {}).map(key => [`other:${key}`, key || 'Unlabelled pause']), ...Object.keys(pause?.unmapped_columns || {}).map(key => [`unmapped:${key}`, `Unlabelled ${key}`])]
  const pauseValues = sourceFields.map(([key, label]) => ({ key, label, value: key.startsWith('other:') ? pause?.other_pause_seconds[key.slice(6)] : key.startsWith('unmapped:') ? pause?.unmapped_columns[key.slice(9)] : pause?.[key] }))
  const maximum = Math.max(1, ...pauseValues.map(p => p.value || 0))
  return <dialog className="dash-detail" ref={dialogRef} aria-labelledby="dash-agent-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <header><div><p className="dash-eyebrow">AGENT DETAIL · {data.date}</p><h2 id="dash-agent-title">{row.vici_user_name}</h2><p>ID {row.agent_code} <span aria-hidden="true">/</span> {groupName(row)}</p></div><button className="dash-close" aria-label="Close agent detail" onClick={onClose}>×</button></header>
    <div className="dash-detail__body">
      <div className="dash-identity-note">{profile ? <Link to={profile}>Open Pulse Agent profile ↗</Link> : <span>VICIdial identity{performance?.linked ? ' · Profile unavailable' : ' · Not linked to a Pulse Agent'}</span>}</div>
      <h3>Call performance</h3>
      <p className="dash-caption">Current group: {row.current_user_group || 'Unavailable'} · Most recent group: {row.most_recent_user_group || 'Unavailable'}. All averages are reported by Vici.</p>
      {performance ? <dl className="dash-detail-grid">{[['calls', 'Calls'], ['xfer_count', 'XFER'], ...TIMES].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key.endsWith('seconds') ? duration(performance[key]) : number(performance[key])}</dd></div>)}</dl> : <p>There is no performance observation for this agent in this snapshot.</p>}
      <h3>Time &amp; Pause</h3>
      {pause ? <><dl className="dash-detail-grid dash-detail-grid--three">{[['total_seconds', 'Logged'], ['nonpause_seconds', 'Nonpause'], ['pause_seconds', 'Total pause']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{duration(pause[key])}</dd></div>)}</dl><div className="dash-pause-bars">{pauseValues.map(item => <div key={item.key}><span>{item.label}</span><div aria-hidden="true"><i style={{ width: `${100 * item.value / maximum}%` }} /></div><strong>{duration(item.value)}</strong></div>)}</div><p className="dash-caption">Pause totals come from Pause Code Breakdown and may differ from the call-performance report.</p></> : <p>No pause observation is available for this agent.</p>}
      <h3>Dispositions</h3><p className="dash-caption">Original VICIdial codes. SPANIS is not counted as Spanish XFER.</p>
      <dl className="dash-dispositions">{Object.entries(performance?.dispositions || {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{number(value)}</dd></div>)}</dl>
    </div>
  </dialog>
}
function Overview({ rows, onGroup }) {
  const groups = groupSummaries(rows)
  const maxCalls = Math.max(1, ...groups.map(g => g.calls))
  const totals = aggregate(rows)
  return <div className="dash-overview-grid"><section className="dash-panel"><header className="dash-panel-heading"><div><p className="dash-eyebrow">AT A GLANCE</p><h2>User groups</h2></div><span>{groups.length} groups</span></header><div className="dash-group-list">{groups.map((group, index) => <button className="dash-group" key={group.name} onClick={() => onGroup(group.name)}><div className="dash-group__top"><span className="dash-group__number">{String(index + 1).padStart(2, '0')}</span><span><strong>{group.name}</strong><small>{group.team || 'VICIdial user group · Pulse team not mapped'}</small></span><span className="dash-group__calls"><strong>{number(group.calls)}</strong><small>calls</small></span></div><div className="dash-group__bar" aria-hidden="true"><i style={{ width: `${100 * group.calls / maxCalls}%` }} /></div><div className="dash-group__bottom"><span>{number(group.agents)} agents</span><span>{number(group.xfer)} XFER</span><span>Pause {duration(group.pause)}</span><span aria-hidden="true">↗</span></div></button>)}</div></section>
    <section className="dash-panel dash-time-summary"><header className="dash-panel-heading"><div><p className="dash-eyebrow">TIME IN FOCUS</p><h2>Report totals</h2></div><Mark /></header><dl>{[['talk', 'Talk'], ['wait', 'Wait'], ['pause', 'Pause'], ['customer', 'Customer']].map(([key, label]) => <div key={key}><dt><i aria-hidden="true" />{label}</dt><dd>{duration(totals[key])}</dd></div>)}</dl><p className="dash-caption">Cumulative values for the selected report date. These categories are not an exclusive time split; averages remain available per agent as reported by Vici.</p></section></div>
}
function ReportContent({ data, loading, error }) {
  const [view, setView] = useState('overview')
  const [group, setGroup] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'calls', descending: true })
  const [page, setPage] = useState(0)
  const [agent, setAgent] = useState(null)
  const allPerformance = data?.performance || [], allPause = data?.pause || []
  const groups = [...new Set([...allPerformance, ...allPause].map(groupName))].sort()
  const selectedGroup = groups.includes(group) ? group : ''
  const scopedRows = filterAgents(allPerformance, { group: selectedGroup })
  const scopedPause = filterAgents(allPause, { group: selectedGroup })
  const rows = filterAgents(view === 'pause' ? allPause : allPerformance, { group: selectedGroup, search, sort: sort.key, descending: sort.descending })
  const pages = Math.max(1, Math.ceil(rows.length / 25)), currentPage = Math.min(page, pages - 1)
  const visibleRows = rows.slice(currentPage * 25, (currentPage + 1) * 25)
  const hasData = Boolean(data?.snapshot)
  const denied = error?.code === 'access_denied'
  return <>
    <Metrics rows={scopedRows} available={hasData && !denied} />
    <div className="dash-workspace-bar"><nav aria-label="Dashboard views">{[['overview', 'Overview'], ['agents', 'Agents'], ['pause', 'Time & Pause']].map(([key, label]) => <button key={key} aria-pressed={view === key} onClick={() => { setView(key); setPage(0); setSort({ key: key === 'pause' ? 'pause_seconds' : 'calls', descending: true }) }}>{label}{key === 'agents' && hasData && <span>{scopedRows.length}</span>}</button>)}</nav><label className="dash-group-filter"><span className="dash-sr">VICIdial user group</span><select aria-label="VICIdial user group" value={selectedGroup} onChange={e => { setGroup(e.target.value); setPage(0) }}><option value="">All user groups</option>{groups.map(name => <option key={name}>{name}</option>)}</select></label></div>
    {denied ? <section className="dash-panel"><Blank title="This report is restricted">Your Staff account needs access to this reporting scope. No data is shown.</Blank></section> : !hasData ? <section className="dash-panel"><header className="dash-panel-heading"><div><p className="dash-eyebrow">{view === 'pause' ? 'PAUSE CODE BREAKDOWN' : 'AGENT PERFORMANCE'}</p><h2>{view === 'pause' ? 'Time & Pause' : 'Your operation, in one place'}</h2></div><span>VICIdial reports</span></header><Blank loading={loading} title={loading ? 'Loading report…' : 'No snapshot for this date yet'}>{loading ? 'Reading the latest stored report from Pulse.' : 'Choose another report date or check the connection status above. Agents and figures will appear here after a successful sync — missing data is never displayed as zero.'}</Blank></section> : <>
      {view === 'overview' ? <Overview rows={scopedRows} onGroup={name => { setGroup(name); setView('agents'); setPage(0) }} /> : <section className="dash-panel">
        <header className="dash-panel-heading"><div><h2>{view === 'pause' ? 'Time & Pause' : 'Agents'}</h2><p>{rows.length} agents · {data.date} · hh:mm:ss</p></div><label className="dash-search"><span className="dash-sr">Search agents</span><input type="search" aria-label="Search agents" placeholder="Search name or Agent ID" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /></label></header>
        {rows.length ? <><AgentTable rows={visibleRows} view={view} sort={sort} setSort={next => { setSort(next); setPage(0) }} onOpen={setAgent} /><MobileAgents rows={visibleRows} pause={view === 'pause'} onOpen={setAgent} /><footer className="dash-table-footer"><span>{currentPage * 25 + 1}–{Math.min((currentPage + 1) * 25, rows.length)} of {rows.length} agents</span><div><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span>{currentPage + 1} / {pages}</span><button disabled={currentPage + 1 === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></footer></> : <Blank title="No agents match these filters">Try another name, Agent ID or user group.</Blank>}
      </section>}
      {agent && [...allPerformance, ...allPause].some(row => row.agent_code === agent) && <AgentDetail key={agent} code={agent} data={data} onClose={() => setAgent(null)} />}
      <ReportBreakdown performance={scopedRows} pause={scopedPause} snapshot={data.snapshot} filtered={Boolean(selectedGroup)} />
    </>}
  </>
}
export function DashboardView({ client }) {
  const { catalog, scope, date, setScope, setDate, refresh, report } = useDashboard(client)
  const [now, setNow] = useState(() => Date.now())
  const [revision, setRevision] = useState(0)
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(interval) }, [])
  const { data, error, loading } = report
  const state = integrationState(data, error || catalog.error, now)
  const sourceToday = calendarDate(scope?.source_time_zone)
  const manual = data?.snapshot?.ingestion_method === 'manual'
  return <main className="dash-main">
    <header className="dash-heading"><div><p className="dash-eyebrow"><span className="dash-brand-dot" /> OPERATIONS <span>/</span> VICIDIAL</p><h1>Auto Warranty Garrett</h1><p>Every agent. Every call. One clear view.</p></div><div className="dash-heading__status"><span className={`dash-status dash-status--${state.tone}`}><i />{state.label}</span><span>{manual ? 'Uploaded ' + new Date(data.snapshot.captured_at).toLocaleString() : ageLabel(data?.health?.last_successful_sync, now)}</span></div></header>
    <section className="dash-controls" aria-label="Report filters"><label>Reporting scope<select aria-label="Reporting scope" value={scope?.id || ''} disabled={!catalog.data.length} onChange={event => setScope(event.target.value)}>{!catalog.data.length && <option value="">{catalog.loading ? 'Loading scopes…' : 'No available scopes'}</option>}{catalog.data.map(s => <option value={s.id} key={s.id}>{s.label}</option>)}</select></label><label>Report date<input type="date" aria-label="Report date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value) }} /></label><button className="dash-today" disabled={!sourceToday} title={sourceToday ? 'Use the VICIdial source date' : 'The VICIdial server timezone must be confirmed first'} onClick={() => setDate(sourceToday)}>Today</button><div className="dash-controls__zone">{scope?.source_time_zone || 'Source timezone not confirmed'}<small>{sourceToday ? 'Date uses the reporting server timezone' : 'Initial date uses your browser calendar · select the report date explicitly'}</small></div><button className="dash-refresh" onClick={refresh} disabled={loading || catalog.loading}><Mark kind="refresh" />{loading ? 'Refreshing…' : 'Refresh'}</button></section>
    {scope?.can_import && !catalog.error && error?.code !== 'access_denied' && <ManualReportUpload key={'upload/' + report.key} client={client} scope={scope} date={date} onImported={() => { refresh(); setRevision(v => v + 1) }} />}
    {(error || catalog.error) && <div className="dash-notice" role="alert"><strong>{(error || catalog.error).code === 'access_denied' ? 'Report access unavailable' : 'Report could not refresh'}</strong><p>{(error || catalog.error).message}</p></div>}
    {!catalog.loading && !catalog.error && !catalog.data.length && <div className="dash-notice"><strong>No reporting scopes available</strong><p>Your account has no accessible reporting scope. Ask your Pulse administrator to review configuration and access.</p></div>}
    {data && <section className={`dash-connection dash-connection--${state.tone}`} aria-label="Integration status"><div><span className="dash-connection__symbol" aria-hidden="true">{state.tone === 'live' ? '↻' : '◷'}</span><div><strong>{manual ? 'Showing a manually uploaded report' : state.tone === 'live' ? 'Reporting connection is up to date' : state.tone === 'issue' ? 'Waiting for the reporting connection' : state.tone === 'delayed' ? 'Showing the last successful report' : 'Ready for the first report'}</strong><p>{manual ? 'This is a saved report, not a live connection. Uploaded by ' + (data.snapshot.uploaded_by || 'an authorized administrator') + '. Automatic collection remains separate.' : state.tone === 'issue' ? 'Pulse has not received a successful update from VICIdial. Existing snapshots remain available.' : 'This page checks stored Pulse reports every 60 seconds. Refresh does not start a VICIdial sync.'}</p></div></div><details><summary>Connection details</summary><dl><div><dt>Last successful sync</dt><dd>{data.health.last_successful_sync ? new Date(data.health.last_successful_sync).toLocaleString() : 'None yet'}</dd></div><div><dt>Last failed sync</dt><dd>{data.health.last_failed_sync ? new Date(data.health.last_failed_sync).toLocaleString() : 'None recorded'}</dd></div><div><dt>Source status</dt><dd>{data.health.last_error_category ? ERRORS[data.health.last_error_category] || 'The last source request could not be completed.' : 'No source error recorded.'}</dd></div>{data.health.halted && <div><dt>Operator review</dt><dd>Automatic source attempts are stopped until an authorized operator reviews the connection.</dd></div>}</dl></details></section>}
    <ReportContent key={report.key || 'no-scope'} data={data} loading={catalog.loading || loading} error={error || catalog.error} />
    {scope && !catalog.error && error?.code !== 'access_denied' && <ReportHistory key={'history/' + report.key} client={client} scope={scope} date={date} revision={revision} SnapshotView={ReportContent} />}
    <footer className="dash-provenance"><span><Mark /> Source: VICIdial · Agent Performance Detail + Pause Code Breakdown</span>{data?.snapshot ? <details><summary>Snapshot · {data.date}{sourceToday === data.date ? '' : ' · Historical / explicit date'}</summary><p>Performance generated: {data.snapshot.performance_generated_at?.replace('T', ' ')}<br />Pause generated: {data.snapshot.pause_generated_at?.replace('T', ' ')}<br />Source timezone: {scope?.source_time_zone || 'Unconfirmed — source clocks are not converted'}<br />Performance ingested: {data.snapshot.performance_ingested_at ? new Date(data.snapshot.performance_ingested_at).toLocaleString() : 'Not available'}<br />Pause ingested: {data.snapshot.pause_ingested_at ? new Date(data.snapshot.pause_ingested_at).toLocaleString() : 'Not available'}</p>{Boolean(data.snapshot.warnings?.length) && <p>{data.snapshot.warnings.length} source validation warning(s). Values are shown as reported; report totals may differ.</p>}</details> : <span>No report snapshot loaded</span>}</footer>
  </main>
}
