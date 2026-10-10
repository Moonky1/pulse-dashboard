import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DashboardView } from '../../src/dashboard/DashboardView.jsx'
import '../../src/design/globals.css'
import { testReport, testScope } from './ui-fixtures.mjs'

if (!['127.0.0.1', 'localhost'].includes(location.hostname)) throw Error('Local synthetic review only')
let mode = new URLSearchParams(location.search).get('mode') || 'populated'
let calls = 0
const client = { async rpc(name, args) {
  if (name === 'list_vici_dashboard_scopes') return mode === 'no-scopes' ? { data: [] } : { data: [testScope, { ...testScope, id: '10000000-0000-4000-8000-000000000002', label: 'Other synthetic scope' }] }
  if (name !== 'get_vici_dashboard') throw Error('Unexpected RPC')
  calls++
  if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 500))
  if (mode === 'denied') return { error: { code: '42501' } }
  if (mode === 'failure') return { error: { code: 'NETWORK' } }
  const data = testReport(args.report_date)
  data.scope = { ...testScope, id: args.requested_scope }
  if (args.requested_scope.endsWith('2')) data.performance.forEach(r => { r.vici_user_name = 'Other scope ' + r.agent_code })
  if (mode === 'empty' || args.report_date === '2026-10-01') {
    data.snapshot = null; data.performance = []; data.pause = []
    data.health = { connected: false, last_successful_sync: null, last_failed_sync: '2026-10-09T18:01:00Z', last_error_category: 'source_network_error', halted: false }
  }
  return { data }
} }
createRoot(document.getElementById('root')).render(<BrowserRouter><div className="pulse-product-surface"><div style={{ padding: '12px 20px', font: '12px system-ui', color: '#eed4a5', background: '#332626' }}>LOCAL UI REVIEW · SYNTHETIC DATA · NOT LIVE <label>Test state <select aria-label="Test state" defaultValue={mode} onChange={e => { mode = e.target.value }}><option>populated</option><option>failure</option><option>denied</option><option>empty</option><option>slow</option></select></label><button onClick={() => { document.querySelector('[data-request-count]').textContent = String(calls) }}>Check requests</button><output data-request-count="">0</output></div><DashboardView client={client} /></div></BrowserRouter>)
