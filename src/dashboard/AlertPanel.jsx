import { useEffect, useRef, useState } from 'react'
import { ALERT_METRICS, evaluateAlerts, loadAlertConfig, loadAlertHistory, saveAlertConfig, validAlertRules } from './alertRules.js'
import { duration } from './dashboardModel.js'

function RuleList({ rules }) {
  return <ul className="dash-rule-list">{ALERT_METRICS.map(metric => {
    const rule = rules.find(r => r.id === metric.id)
    return <li key={metric.id}><strong>{metric.label}</strong><span>{rule.enabled ? `${metric.comparison} ${duration(rule.threshold_seconds)}` : 'Disabled'}{!rule.enabled && rule.threshold_seconds !== null ? ` · saved limit ${duration(rule.threshold_seconds)}` : ''}</span></li>
  })}</ul>
}
function AlertResults({ data, config, readError }) {
  const [group, setGroup] = useState(''), [search, setSearch] = useState(''), [view, setView] = useState('attention'), [page, setPage] = useState(0)
  const enabled = config.rules.filter(r => r.enabled).length
  const agents = !readError ? evaluateAlerts(data, config) : []
  const groups = [...new Set(agents.map(r => r.group))].sort()
  const selected = groups.includes(group) ? group : ''
  const filtered = agents.filter(r => (!selected || r.group === selected) && `${r.code} ${r.name}`.toLowerCase().includes(search.trim().toLowerCase()) &&
    (view === 'all' || r.checks.some(c => c.state !== 'within')))
  const lastPage = Math.max(0, Math.ceil(filtered.length / 25) - 1), current = Math.min(page, lastPage)
  if (readError) return <p role="status">The report could not refresh. Alert evaluation is unavailable until the report is verified again.</p>
  if (!data?.snapshot) return <p role="status">Select a date with a saved report to evaluate alerts.</p>
  if (!enabled) return <p role="status">No alert rules are enabled. No agents have been evaluated or classified.</p>
  return <section aria-label="Agent alert results">
    <p className="dash-caption">Report date {data.date} · rules revision {config.revision}. Performance generated {data.snapshot.performance_generated_at?.replace('T', ' ')} · Pause generated {data.snapshot.pause_generated_at?.replace('T', ' ')}. Current rules applied to this saved report, not a historical verdict. Times are hh:mm:ss.</p>
    <p>{agents.filter(r => r.checks.some(c => c.state === 'triggered')).length} agents match at least one rule · {agents.filter(r => r.checks.some(c => c.state === 'unavailable')).length} agents have a non-evaluable check.</p>
    <p className="dash-caption">Groups use the performance identity, or pause identity if performance is absent. Each check names its own source group.</p>
    <div className="dash-alert-groups">{groups.map(name => {
      const rows = agents.filter(r => r.group === name)
      return <button key={name} onClick={() => { setGroup(name); setPage(0) }}><strong>{name}</strong><span>{rows.filter(r => r.checks.some(c => c.state === 'triggered')).length} / {rows.length} agents match a rule</span><small>VICIdial user group · no inferred team mapping</small></button>
    })}</div>
    <div className="dash-alert-filters"><label>User group<select aria-label="Alert user group" value={selected} onChange={e => { setGroup(e.target.value); setPage(0) }}><option value="">All user groups</option>{groups.map(g => <option key={g}>{g}</option>)}</select></label><label>Search agents<input aria-label="Search alert agents" type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /></label><label>Show<select aria-label="Alert result filter" value={view} onChange={e => { setView(e.target.value); setPage(0) }}><option value="attention">Rule matches & non-evaluable</option><option value="all">All evaluated agents</option></select></label></div>
    {!filtered.length && <p role="status">No agents match these filters. Missing data is never treated as a passing result.</p>}
    {filtered.slice(current * 25, (current + 1) * 25).map(agent => <details className="dash-alert-agent" key={agent.code}><summary><strong>{agent.name} · {agent.code}</strong><span>{agent.group} · {agent.checks.filter(c => c.state === 'triggered').length} rule matches · {agent.checks.filter(c => c.state === 'unavailable').length} non-evaluable</span></summary><ul>{agent.checks.map(check => <li key={check.id}><strong>{check.label}: {check.state === 'triggered' ? 'Rule matched' : check.state === 'unavailable' ? 'Not evaluable' : 'Within rule'}</strong><span>Observed {duration(check.value)} · rule {check.comparison} {duration(check.threshold)} · {check.source === 'performance' ? 'Agent Performance Detail' : 'Pause Code Breakdown'} · source group {check.group}</span>{check.reason && <span>{check.reason}</span>}</li>)}</ul></details>)}
    {filtered.length > 0 && <div className="dash-compare-controls"><button disabled={current === 0} onClick={() => setPage(current - 1)}>Previous agents</button><span>{current * 25 + 1}–{Math.min((current + 1) * 25, filtered.length)} of {filtered.length}</span><button disabled={current >= lastPage} onClick={() => setPage(current + 1)}>Next agents</button></div>}
  </section>
}
function AlertWorkspace({ client, scope, data, readError }) {
  const [config, setConfig] = useState(null), [draft, setDraft] = useState(null), [busy, setBusy] = useState(true)
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [history, setHistory] = useState(null), [historyBusy, setHistoryBusy] = useState(false)
  const request = useRef(0), historyRequest = useRef(0)
  async function reload() {
    const id = ++request.current; historyRequest.current++
    setBusy(true); setError(''); setMessage(''); setConfig(null); setDraft(null); setHistory(null); setHistoryBusy(false)
    const response = await loadAlertConfig(client, scope.id)
    if (id !== request.current) return
    setBusy(false); setError(response.error || ''); setConfig(response.data || null); setDraft(response.data?.rules || null)
  }
  useEffect(() => {
    const requests = request, histories = historyRequest, id = ++requests.current
    void loadAlertConfig(client, scope.id).then(response => {
      if (id !== requests.current) return
      setBusy(false); setError(response.error || ''); setConfig(response.data || null); setDraft(response.data?.rules || null)
    })
    return () => { requests.current++; histories.current++ }
  }, [client, scope.id])
  const dirty = config && JSON.stringify(draft) !== JSON.stringify(config.rules)
  function edit(id, patch) { setDraft(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r)); setMessage('') }
  async function save(event) {
    event.preventDefault()
    if (!config?.can_manage || !dirty || !validAlertRules(draft)) return
    const id = ++request.current; historyRequest.current++
    setBusy(true); setError(''); setMessage(''); setHistory(null); setHistoryBusy(false)
    const response = await saveAlertConfig(client, scope.id, config.revision, draft)
    if (id !== request.current) return
    setBusy(false)
    if (response.error) { setError(response.error); setConfig(null); return }
    setConfig(response.data); setDraft(response.data.rules); setMessage(`Shared rules saved as revision ${response.data.revision}.`)
  }
  async function historyPage(before = null) {
    const id = ++historyRequest.current
    setHistory(null); setHistoryBusy(true)
    const response = await loadAlertHistory(client, scope.id, before)
    if (id !== historyRequest.current) return
    setHistoryBusy(false); setHistory(response)
    if (response.code === 'access_denied') { request.current++; setConfig(null); setDraft(null); setError(response.error); setBusy(false) }
  }
  return <div className="dash-alert-body">
    <div className="dash-panel-heading"><div><h2>Rules</h2></div><button disabled={busy} onClick={reload}>Reload rules{dirty ? ' · discard draft' : ''}</button></div>
    {busy && <p role="status">{config ? 'Saving shared rules…' : 'Loading shared rules…'}</p>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {config && <>
      <details className="dash-alert-config"><summary>{config.can_manage ? 'Configure shared rules' : 'View shared rules (read only)'}</summary>
        {config.can_manage ? <form onSubmit={save}>
          <div className="dash-alert-edit-grid">{ALERT_METRICS.map(metric => {
            const rule = draft.find(r => r.id === metric.id)
            return <fieldset key={metric.id} disabled={busy}><legend>{metric.label}</legend><label className="dash-alert-enable"><input type="checkbox" aria-label={`Enable ${metric.label}`} checked={rule.enabled} onChange={e => edit(metric.id, { enabled: e.target.checked })} />Enabled</label><label>Alert {metric.comparison} (seconds)<input type="number" min="0" max="31536000" step="1" aria-label={`${metric.label} threshold seconds`} value={rule.threshold_seconds ?? ''} onChange={e => edit(metric.id, { threshold_seconds: e.target.value === '' ? null : Number(e.target.value) })} /></label><small>{rule.threshold_seconds === null ? 'No limit set' : duration(rule.threshold_seconds)} · {metric.source === 'performance' ? 'Source average' : 'Cumulative pause code'}</small></fieldset>
          })}</div>
          <p className="dash-caption">Saving affects everyone with access to this reporting scope. No other scope is changed. Unsaved edits are not used for evaluation.</p>
          {dirty && !validAlertRules(draft) && <p role="status">Each enabled rule needs a valid limit in whole seconds.</p>}
          <button type="submit" disabled={busy || !dirty || !validAlertRules(draft)}>Save shared rules</button>
        </form> : <RuleList rules={config.rules} />}
      </details>
      {!busy && <AlertResults key={data?.snapshot?.id || 'empty'} data={data} config={config} readError={readError} />}
      <div className="dash-compare-controls"><button disabled={busy || historyBusy} onClick={() => historyPage()}>View rule change history</button></div>
      {historyBusy && <p role="status">Loading rule history…</p>}
      {history?.error && <p role="alert">{history.error}</p>}
      {history?.rows && <section aria-label="Alert rule change history"><h3>Rule change history</h3>{!history.rows.length && <p>No saved changes on this page. All rules start disabled.</p>}{history.rows.map(v => <details key={v.revision}><summary>Revision {v.revision} · {v.changed_by_name} · {new Date(v.changed_at).toLocaleString()}</summary><RuleList rules={v.rules} /></details>)}{history.rows.length === 20 && <button onClick={() => historyPage(history.rows.at(-1).revision)}>Older rule changes</button>}</section>}
    </>}
  </div>
}
export function AlertPanel(props) {
  const [open, setOpen] = useState(false)
  return <details className="dash-panel dash-alerts" onToggle={e => setOpen(e.currentTarget.open)}><summary>Rules</summary>{open && <AlertWorkspace {...props} />}</details>
}
