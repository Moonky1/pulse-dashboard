import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PulsePet } from '../../src/pet/PulsePet.jsx'
import { DashboardView } from '../../src/dashboard/DashboardView.jsx'
import '../../src/design/globals.css'
import { testReport, testScope } from './ui-fixtures.mjs'
import { retentionFixture } from './retention-fixtures.mjs'
import { alertFixture } from './alert-fixtures.mjs'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
import { allTeamsScope } from './all-teams-fixtures.mjs'

if (!['127.0.0.1', 'localhost'].includes(location.hostname)) throw Error('Local synthetic review only')
let mode = new URLSearchParams(location.search).get('mode') || 'populated'
let calls = 0
let uploaded = false
const asiaScopes = [
  { ...testScope, id: '426ab519-b87b-4410-bd42-e255b240bea1', label: 'Asia A · OpenersAsia', user_groups: ['OpenersAsia'] },
  { ...testScope, id: '2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285', label: 'Asia B · OpenersAsia1', user_groups: ['OpenersAsia1'] },
]
const alertConfigs = new Map(), alertHistory = new Map()
const independentReports = new Map()
const client = { async rpc(name, args) {
  if (mode === 'cloud-reload') return (await fetch('/__cloud-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, args }) })).json()
  if (mode === 'all-teams' && name === 'list_vici_dashboard_scopes') return { data: [allTeamsScope, ...asiaScopes] }
  if (mode === 'asia-teams' && name === 'list_vici_dashboard_scopes') return { data: asiaScopes }
  if (['get_vici_alert_rules', 'save_vici_alert_rules', 'list_vici_alert_rule_history'].includes(name)) {
    if (mode === 'denied') return { error: { code: '42501' } }
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 500))
    if (mode === 'failure') return { error: { code: 'NETWORK' } }
    const prior = alertConfigs.get(args.requested_scope) || alertFixture(args.requested_scope, mode === 'manual')
    if (name === 'save_vici_alert_rules') {
      if (mode === 'conflict') return { error: { code: '40001' } }
      if (mode !== 'manual') return { error: { code: '42501' } }
      const saved = { ...prior, revision: prior.revision + 1, rules: args.requested_rules, changed_at: '2026-10-10T18:00:00Z', changed_by_name: 'Synthetic administrator' }
      alertConfigs.set(args.requested_scope, saved)
      alertHistory.set(args.requested_scope, [saved, ...(alertHistory.get(args.requested_scope) || [])])
      return { data: saved }
    }
    if (name === 'list_vici_alert_rule_history') return { data: (alertHistory.get(args.requested_scope) || []).filter(v => !args.before_revision || v.revision < args.before_revision).slice(0, 20) }
    return { data: prior }
  }
  if (name === 'preview_vici_retention') {
    if (mode === 'denied') return { error: { code: '42501' } }
    if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 500))
    if (mode === 'failure') return { error: { code: 'NETWORK' } }
    return { data: retentionFixture(args.as_of_date, args.page_offset) }
  }
  if (name === 'list_vici_dashboard_scopes') return mode === 'no-scopes' ? { data: [] } : { data: [{ ...testScope, ...(mode === 'confirmed-targets' ? { id: '426ab519-b87b-4410-bd42-e255b240bea1', user_groups: ['OpenersAsia', 'MappedGroup', 'UnknownGroup'] } : {}), can_import: mode === 'manual' || mode === 'staff-upload', can_manage_reports: mode === 'manual', campaigns: ['SyntheticCampaign'] }, { ...testScope, id: '10000000-0000-4000-8000-000000000002', label: 'Other synthetic scope' }] }
  if (name === 'list_vici_report_history') return { data: [2, 1].map(version => ({ id: '20000000-0000-4000-8000-00000000000' + version, performance_generated_at: args.report_date + (version === 1 ? 'T10:00:00' : 'T10:30:00'), pause_generated_at: args.report_date + (version === 1 ? 'T10:00:05' : 'T10:30:05'), captured_at: '2026-10-09T18:00:00Z', ingestion_method: 'manual', uploaded_by: 'Synthetic administrator', agents: 40, calls: version === 1 ? 4000 : 4200 })) }
  if (name === 'get_vici_dashboard_snapshot') {
    const data = testReport(), first = args.requested_snapshot.endsWith('1')
    data.snapshot.id = args.requested_snapshot
    data.snapshot.ingestion_method = 'manual'
    data.snapshot.performance_generated_at = '2026-10-09T10:' + (first ? '00' : '30') + ':00'
    data.snapshot.pause_generated_at = '2026-10-09T10:' + (first ? '00' : '30') + ':05'
    if (!first) data.performance.forEach(r => { r.calls += 5 })
    return { data }
  }
  if (name !== 'get_vici_dashboard') throw Error('Unexpected RPC')
  calls++
  if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 500))
  if (mode === 'denied') return { error: { code: '42501' } }
  if (mode === 'failure') return { error: { code: 'NETWORK' } }
  const data = testReport(args.report_date)
  if (mode === 'all-teams') {
    if (independentReports.has(args.report_date)) return { data: independentReports.get(args.report_date) }
    return { data: { ...data, scope: allTeamsScope, snapshot: null, performance: [], pause: [] } }
  }
  if (mode === 'coaching' || mode === 'coaching-many') {
    data.performance.forEach((row, i) => {
      row.current_user_group = mode === 'coaching-many' && i >= 20 ? 'ReviewGroupB' : 'ReviewGroupA'; row.calls = 300
      row.talk_avg_seconds = i === 0 ? 4 : 25; row.dead_avg_seconds = i === 1 ? 12 : 4
      row.dispositions.NI = i === 0 ? 258 : 30; row.dispositions.CALLBK = i === 2 ? 51 : 2
    })
    data.pause.forEach((row, i) => {
      row.current_user_group = mode === 'coaching-many' && i >= 20 ? 'ReviewGroupB' : 'ReviewGroupA'; row.break_seconds = mode === 'coaching-many' || i === 0 ? 1501 : 1500
      row.lunch_seconds = 3600; row.rr_seconds = i === 0 ? 1201 : 1200
      row.cb_seconds = i === 2 ? 3600 : 300
    })
  }
  if (mode === 'staff-upload') {
    if (independentReports.has(args.report_date)) return { data: independentReports.get(args.report_date) }
    data.snapshot = null; data.performance = []; data.pause = []
  }
  if (mode === 'insights') {
    const day = Number(args.report_date.slice(-2))
    data.performance.forEach((row, i) => { row.xfer_count = (i + day) % 20; row.dispositions.XFER = row.xfer_count; row.calls = i === 4 ? 0 : 100 + i * 10 })
    if (day === 7) { data.performance = data.performance.filter(row => row.agent_code !== '01000'); data.pause = data.pause.filter(row => row.agent_code !== '01000') }
    if (day === 6) { data.snapshot = null; data.performance = []; data.pause = [] }
  }
  if (mode === 'manual' && uploaded) { data.snapshot.ingestion_method = 'manual'; data.snapshot.uploaded_by = 'Synthetic administrator' }
  data.scope = { ...testScope, id: args.requested_scope }
  if (mode === 'asia-teams') {
    const s = asiaScopes.find(item => item.id === args.requested_scope)
    data.scope = s
    data.performance = data.performance.slice(0, s === asiaScopes[0] ? 30 : 17).map(row => ({ ...row, current_user_group: s.user_groups[0], most_recent_user_group: s.user_groups[0], team_name: s === asiaScopes[0] ? 'Asia Team A' : 'Asia Team B' }))
    data.pause = data.pause.slice(0, data.performance.length).map(row => ({ ...row, current_user_group: s.user_groups[0], most_recent_user_group: s.user_groups[0] }))
    if (args.report_date === '2026-10-08') data.performance = []
  }
  if (mode === 'confirmed-targets') {
    data.performance.forEach((row, i) => { row.current_user_group = ['OpenersAsia', 'MappedGroup', 'UnknownGroup'][i % 3]; row.team_name = i % 3 === 1 ? 'Colombia' : null; if (i < 3) { row.xfer_count = [args.report_date.endsWith('08') ? 15 : args.report_date.endsWith('05') ? 26 : 7, 9, 20][i]; row.dispositions.XFER = row.xfer_count } })
  }
  if (args.requested_scope.endsWith('2')) data.performance.forEach(r => { r.vici_user_name = 'Other scope ' + r.agent_code })
  if (mode === 'empty' || args.report_date === '2026-10-01') {
    data.snapshot = null; data.performance = []; data.pause = []
    data.health = { connected: false, last_successful_sync: null, last_failed_sync: '2026-10-09T18:01:00Z', last_error_category: 'source_network_error', halted: false }
  }
  return { data }
}, functions: { async invoke(name, { body }) {
  if (mode === 'cloud-reload') return (await fetch('/__cloud-review-upload', { method: 'POST', body })).json()
  if (name !== 'pulse-vici-import') throw Error('Unexpected function')
  if (mode === 'staff-upload' || mode === 'all-teams') {
    const date = body.get('reportDate'), prior = independentReports.get(date)
    const prepared = inspectManualReports({ performanceText: await body.get('performance')?.text(), pauseText: await body.get('pause')?.text(),
      reportDate: date, userGroups: mode === 'all-teams' ? allTeamsScope.user_groups : ['FixtureGroup'] })
    const report = prior ? structuredClone(prior) : testReport(date)
    if (mode === 'all-teams') report.scope = allTeamsScope
    report.performance = prepared.pair.performance?.rows || prior?.performance || []
    report.pause = prepared.pair.pause?.rows || prior?.pause || []
    report.snapshot.ingestion_method = 'manual'
    report.snapshot.performance_generated_at = prepared.pair.performance?.source_generated_at || prior?.snapshot.performance_generated_at || null
    report.snapshot.pause_generated_at = prepared.pair.pause?.source_generated_at || prior?.snapshot.pause_generated_at || null
    report.snapshot.validation_summary = { performance: prepared.verification.performance || prior?.snapshot.validation_summary.performance,
      pause: prepared.verification.pause || prior?.snapshot.validation_summary.pause }
    independentReports.set(date, report)
    return { data: { status: 'success', agents: (prepared.pair.performance || prepared.pair.pause).rows.length, report_date: date, report } }
  }
  if (body.get('pause') && (await body.get('pause').text()).includes('invalid')) return { error: { context: new Response('{"error":"invalid_report"}') } }
  uploaded = true
  const report = (await client.rpc('get_vici_dashboard', { requested_scope: body.get('scopeId'), report_date: body.get('reportDate') })).data
  report.snapshot.ingestion_method = 'manual'
  return { data: { status: 'success', agents: 40, report_date: body.get('reportDate'), report } }
} } }
createRoot(document.getElementById('root')).render(<BrowserRouter><div className="pulse-product-surface"><div style={{ padding: '12px 20px', font: '12px system-ui', color: '#eed4a5', background: '#332626' }}>LOCAL UI REVIEW · SYNTHETIC DATA · NOT LIVE <label>Test state <select aria-label="Test state" defaultValue={mode} onChange={e => { mode = e.target.value }}><option>populated</option><option>manual</option><option>failure</option><option>denied</option><option>empty</option><option>slow</option><option>conflict</option><option>insights</option></select></label><button onClick={() => { document.querySelector('[data-request-count]').textContent = String(calls) }}>Check requests</button><output data-request-count="">0</output></div><DashboardView client={client} />{new URLSearchParams(location.search).has('pet') && <PulsePet actions={[]} pathname="/dashboard"/>}</div></BrowserRouter>)
