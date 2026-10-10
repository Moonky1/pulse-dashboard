import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ageLabel, aggregate, browserDate, calendarDate, duration, filterAgents, groupSummaries, integrationState, number, profilePath, validDate } from '../../src/dashboard/dashboardModel.js'
import { dashboardError, loadDashboardReport, loadDashboardScopes, normalizeReport, normalizeScopes } from '../../src/dashboard/dashboardApi.js'
import { testReport, testScope } from './ui-fixtures.mjs'

test('durations preserve hours beyond 24 and do not coerce corrupt data to zero', () => {
  assert.equal(duration(360001), '100:00:01')
  assert.equal(duration(0), '0:00:00')
  for (const v of [null, undefined, -1, '60', NaN, 1.5, Infinity]) assert.equal(duration(v), '—')
})
test('numbers distinguish no data from a real zero', () => { assert.equal(number(null), '—'); assert.equal(number(0), '0'); assert.equal(number(12000), '12,000') })
test('report date validation rejects impossible and malformed dates without throwing', () => {
  for (const v of ['', '2026-02-30', '2026-19-09', '0000-01-01', '2026-10-00', 'bad', null]) assert.equal(validDate(v), false)
  assert.equal(validDate('2024-02-29'), true)
})
test('source Today is unavailable until timezone is confirmed', () => { assert.equal(calendarDate(null), null); assert.equal(calendarDate('Invalid/Zone'), null) })
test('source date handles the day boundary and daylight time through Intl', () => { assert.equal(calendarDate('America/Los_Angeles', new Date('2026-10-10T01:00:00Z')), '2026-10-09'); assert.match(browserDate(), /^\d{4}-\d{2}-\d{2}$/) })
test('freshness does not invent a last sync', () => { assert.equal(ageLabel(null), 'Not synced yet'); assert.equal(ageLabel('2026-10-09T00:00:00Z', Date.parse('2026-10-09T00:04:00Z')), 'Updated 4m ago') })
test('connection distinguishes waiting, delayed, live and failed states', () => {
  const data = testReport(), now = Date.parse('2026-10-09T18:00:20Z')
  assert.equal(integrationState(null).label, 'Awaiting data')
  assert.equal(integrationState(data).label, 'Delayed')
  data.health.connected = true
  assert.equal(integrationState(data, null, now).label, 'Live')
  assert.equal(integrationState(data, null, now + 151000).label, 'Delayed')
  assert.equal(integrationState(data, { code: 'unavailable' }, now).label, 'Connection issue')
  data.health.last_failed_sync = '2026-10-09T18:00:10Z'
  assert.equal(integrationState(data, null, now).label, 'Connection issue')
})
test('IP validation is never a zero-agent successful state', () => { const r = testReport(); r.health.requires_ip_validation = true; assert.equal(integrationState(r).label, 'Connection issue') })
test('summary sums actual durations and XFER only, never adds SPANIS', () => { const rows = testReport().performance.slice(0, 2); const total = aggregate(rows); assert.equal(total.xfer, 7); assert.equal(total.calls, 201); assert.equal(total.talk, 25200); assert.equal(total.agents, 2); assert.equal(Object.hasOwn(total, 'talk_avg'), false) })
test('groups remain actual Vici groups without inferred Pulse team names', () => { const groups = groupSummaries(testReport().performance); assert.equal(groups.length, 2); assert.equal(groups[0].team, null); assert.equal(groups[0].name, 'ReviewGroupB') })
test('search finds leading-zero Agent IDs without name-based linking', () => { const rows = testReport().performance; assert.equal(filterAgents(rows, { search: '01000' })[0].agent_code, '01000'); assert.equal(filterAgents(rows, { group: 'ReviewGroupA' }).length, 20) })
test('sort is numeric and never mutates the source observations', () => { const rows = testReport().performance; assert.equal(filterAgents(rows)[0].calls, 139); assert.equal(rows[0].calls, 100); assert.equal(filterAgents(rows, { sort: 'calls', descending: false })[0].calls, 100) })
test('profile navigation requires exact verified identity and supported Agent ID', () => { const row = testReport().performance[0]; assert.equal(profilePath(row), '/profile/01000'); assert.equal(profilePath({ ...row, linked: false }), null); assert.equal(profilePath({ ...row, profile_agent_code: '9999' }), null); assert.equal(profilePath({ ...row, agent_code: '../bad' }), null) })
test('scope normalization rejects malformed catalog and keeps unknown timezone', () => { assert.equal(normalizeScopes([testScope])[0].source_time_zone, null); assert.throws(() => normalizeScopes([{ ...testScope, id: 'bad' }])) })
test('valid report keeps both report clocks and the original disposition map', () => { const r = testReport(); const got = normalizeReport(r, testScope.id, r.date); assert.equal(got.performance[0].agent_code, '01000'); assert.notEqual(got.snapshot.performance_generated_at, got.snapshot.pause_generated_at); assert.equal(got.performance[0].dispositions.SPANIS, 7) })
test('cross-scope or cross-date responses are rejected', () => { const r = testReport(); assert.throws(() => normalizeReport(r, 'other', r.date)); assert.throws(() => normalizeReport(r, testScope.id, '2026-10-08')) })
test('invalid counts, duplicate IDs and mismatched transfer counts are rejected', () => {
  for (const change of [r => { r.performance[0].calls = null }, r => { r.performance.push(r.performance[0]) }, r => { r.performance[0].dispositions.XFER = 99 }, r => { r.pause[0].break_seconds = '10' }, r => { r.performance[0].agent_code = 1000 }, r => { r.pause[0].agent_code = 1000 }]) {
    const r = testReport(); change(r); assert.throws(() => normalizeReport(r, testScope.id, r.date))
  }
})
test('no snapshot cannot carry fabricated observations', () => { const r = testReport(); r.snapshot = null; assert.throws(() => normalizeReport(r, testScope.id, r.date)); r.performance = []; r.pause = []; assert.equal(normalizeReport(r, testScope.id, r.date).snapshot, null) })
test('data adapter uses only approved protected RPCs', async () => {
  const calls = [], r = testReport(); const client = { async rpc(name, args) { calls.push([name, args]); return { data: name === 'list_vici_dashboard_scopes' ? [testScope] : r, error: null } } }
  assert.equal((await loadDashboardScopes(client)).error, null)
  assert.equal((await loadDashboardReport(client, testScope.id, r.date)).error, null)
  assert.deepEqual(calls, [['list_vici_dashboard_scopes', undefined], ['get_vici_dashboard', { requested_scope: testScope.id, report_date: r.date }]])
})
test('invalid filters never reach the backend', async () => { let calls = 0; const client = { rpc() { calls++ } }; assert.equal((await loadDashboardReport(client, 'bad', '2026-10-09')).error.code, 'invalid_request'); assert.equal((await loadDashboardReport(client, testScope.id, '2026-99-99')).error.code, 'invalid_request'); assert.equal(calls, 0) })
test('permission and token errors fail closed without raw error exposure', async () => {
  for (const code of ['42501', '28000', 'PGRST301', 'PGRST302', 'PGRST303']) assert.equal(dashboardError({ code, message: 'private' }).code, 'access_denied')
  const response = await loadDashboardReport({ async rpc() { return { error: { code: '42501', message: 'private' } } } }, testScope.id, '2026-10-09')
  assert.equal(response.data, null); assert.equal(response.error.message.includes('private'), false)
})
test('network and malformed responses are safe results, not unhandled rejections', async () => {
  assert.equal((await loadDashboardScopes({ rpc() { throw Error('private') } })).error.code, 'unavailable')
  assert.equal((await loadDashboardReport({ async rpc() { return { data: {} } } }, testScope.id, '2026-10-09')).error.code, 'invalid_response')
})
test('the operational route stays active-Staff only and has no fixture imports', () => {
  const app = readFileSync('src/auth/AuthApp.jsx', 'utf8'), page = readFileSync('src/auth/screens/ProductDashboardPage.jsx', 'utf8')
  assert.match(app, /path="\/dashboard" element={<RouteGate allow={\[AUTH_STATES.ACTIVE\]}/)
  assert.doesNotMatch(page, /fixture|testReport|IN DEVELOPMENT/)
  for (const file of ['DashboardView.jsx', 'dashboardApi.js', 'useDashboard.js']) assert.doesNotMatch(readFileSync('src/dashboard/' + file, 'utf8'), /service_role|VICI_REPORT_PASSWORD|alwaysbeclosing\.ai|functions\.invoke|\.from\(/)
})
