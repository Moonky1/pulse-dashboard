import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
import { createViciImportHandler } from '../../supabase/functions/pulse-vici-import/handler.mjs'
import { fixture } from './parserFixtures.mjs'
import { compareSnapshots, loadSnapshot } from '../../src/dashboard/reportHistory.js'
import { integrationState } from '../../src/dashboard/dashboardModel.js'
import { uploadReports } from '../../src/dashboard/manualReportApi.js'
import { testReport, testScope } from './ui-fixtures.mjs'

const scope = testScope.id, origin = 'https://preview.example.test'
const input = () => ({ performanceText: fixture('performance'), pauseText: fixture('pause'), reportDate: '2026-10-09', userGroups: ['FixtureGroup'] })
test('manual parser retains full data, original totals, source averages and reconciliation', () => {
  const value = inspectManualReports(input())
  assert.equal(value.pair.performance.rows.length, 2)
  assert.equal(value.verification.performance.totals.calls, 28)
  assert.equal(value.verification.performance.totals.talk_avg_seconds, 1)
  assert.equal(value.pair.pause.rows[0].unmapped_columns.column_9, 3)
  assert.equal(value.verification.scope_attested, true)
})
for (const [label, change, category] of [
  ['wrong date', i => { i.reportDate = '2026-10-08' }, 'report_date_mismatch'],
  ['different scope', i => { i.userGroups = ['NotThisGroup'] }, 'report_group_mismatch'],
  ['missing totals', i => { i.pauseText = fixture('pause', { totals: false }) }, 'missing_totals'],
  ['inconsistent totals', i => { i.performanceText = fixture('performance', { transform: ({ headers, summary }) => { summary[headers.indexOf('CALLS')] = '999' } }) }, 'totals_mismatch'],
  ['different agent set', i => { i.pauseText = i.pauseText.replace('"0099"', '"0100"') }, 'report_agent_sets_differ'],
  ['wrong file type in slot', i => { i.pauseText = i.performanceText }, 'missing_required_column'],
]) test('manual pair rejects ' + label, () => {
  const i = input(); change(i)
  assert.throws(() => inspectManualReports(i), e => e.category === category)
})
function harness({ allowed = true, auth = true, dbError, inspect } = {}) {
  const writes = []; let lookups = 0
  const client = {
    auth: { getUser: async () => ({ data: auth ? { user: { id: 'verified-auth-id' } } : null }) },
    rpc: async (name, args) => {
      if (name === 'list_vici_dashboard_scopes') { lookups++; return { data: [{ id: scope, user_groups: ['FixtureGroup'], can_import: allowed }] } }
      assert.equal(name, 'import_vici_reports'); writes.push(args)
      return dbError ? { error: { code: dbError, message: 'private must not leak' } } : { data: { status: 'success', snapshot_run_id: scope, report_date: args.report_date } }
    },
  }
  const env = name => ({ PULSE_VICI_IMPORT_ALLOWED_ORIGINS: origin, SUPABASE_URL: 'https://backend.example.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' })[name]
  return { handler: createViciImportHandler({ env, createClient: () => client, inspect }), writes, lookups: () => lookups }
}
function request({ confirmed = 'yes', extra, token = true, requestOrigin = origin, performance = fixture('performance'), pause = fixture('pause') } = {}) {
  const body = new FormData()
  body.set('scopeId', scope); body.set('reportDate', '2026-10-09'); body.set('confirmedScope', confirmed)
  body.set('performance', new File([performance], 'performance.csv')); body.set('pause', new File([pause], 'pause.csv'))
  if (extra) body.set(extra, 'attacker-controlled')
  return new Request('https://backend.example.test/import', { method: 'POST', headers: { Origin: requestOrigin, ...(token ? { Authorization: 'Bearer session' } : {}) }, body })
}
test('verified Staff identity is server-owned, complete pair written once', async () => {
  const h = harness(), response = await h.handler(request())
  assert.equal(response.status, 200); assert.equal(h.writes.length, 1)
  assert.equal(h.writes[0].actor_auth_id, 'verified-auth-id')
  assert.equal(h.writes[0].pair.performance.rows.length, 2)
  assert.equal((await response.json()).agents, 2)
})
for (const [label, options, req, status] of [
  ['anonymous', {}, { token: false }, 401],
  ['invalid session', { auth: false }, {}, 401],
  ['viewer', { allowed: false }, {}, 403],
  ['hostile origin', {}, { requestOrigin: 'https://evil.example' }, 403],
  ['actor forgery', {}, { extra: 'actor_auth_id' }, 400],
  ['missing scope confirmation', {}, { confirmed: 'no' }, 400],
  ['invalid second report', {}, { pause: '<html>private error</html>' }, 422],
  ['permission revoked at commit', { dbError: '42501' }, {}, 403],
  ['conflict', { dbError: '22023' }, {}, 409],
  ['cooldown', { dbError: 'P0001' }, {}, 429],
]) test('upload protects ' + label, async () => {
  const h = harness(options), response = await h.handler(request(req))
  assert.equal(response.status, status)
  assert.doesNotMatch(await response.text(), /private|attacker|session|service/)
  if (!options.dbError) assert.equal(h.writes.length, 0)
})
test('real streamed body limit rejects oversized request without trusting Content-Length', async () => {
  const h = harness()
  const response = await h.handler(new Request('https://backend.example.test/import', { method: 'POST',
    headers: { Origin: origin, Authorization: 'Bearer session', 'Content-Type': 'multipart/form-data; boundary=x' },
    body: new Uint8Array(10 * 1024 * 1024 + 65537) }))
  assert.equal(response.status, 413); assert.equal(h.writes.length, 0)
})
test('CORS preflight is bounded to configured origin', async () => {
  const h = harness(), response = await h.handler(new Request('https://backend.example.test/import', { method: 'OPTIONS', headers: { Origin: origin } }))
  assert.equal(response.status, 200); assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal(h.lookups(), 0)
})
function versions() {
  const before = testReport(), after = structuredClone(before)
  after.snapshot.id = '20000000-0000-4000-8000-000000000002'
  after.snapshot.performance_generated_at = '2026-10-09T11:30:00'
  after.snapshot.pause_generated_at = '2026-10-09T11:30:05'
  return { before, after }
}
test('comparison subtracts counters instead of adding cumulative reports', () => {
  const { before, after } = versions(); after.performance[0].calls += 15; after.performance[0].xfer_count += 2
  const [row] = compareSnapshots(before, after)
  assert.equal(row.metrics.calls, 15); assert.equal(row.metrics.xfer_count, 2)
  assert.equal(Object.hasOwn(row.metrics, 'talk_avg_seconds'), false)
})
test('comparison preserves added, missing, absent codes, and decreasing counters', () => {
  const { before, after } = versions(); after.performance[0].calls -= 5; after.performance[0].dispositions.NEWCODE = 2
  after.performance.pop(); before.performance.splice(2, 1)
  const result = compareSnapshots(before, after)
  assert.equal(result[0].metrics.calls, -5); assert.equal(result[0].decreased, true)
  assert.equal(result[0].dispositions.NEWCODE, null)
  assert.equal(result.find(r => r.status === 'Added').metrics.calls, null)
  assert.equal(result.find(r => r.status === 'Not in later report').metrics.calls, null)
})
test('comparison refuses different scope/date and reversed independent clocks', () => {
  for (const change of [r => { r.date = '2026-10-08' }, r => { r.scope = { id: 'other' } }, r => { r.snapshot.pause_generated_at = '2026-10-09T09:00:00' }]) {
    const { before, after } = versions(); change(after); assert.throws(() => compareSnapshots(before, after))
  }
})
test('manual provenance never masks real connection as Live', () => {
  const data = testReport(); data.snapshot.ingestion_method = 'manual'; data.health.connected = true
  assert.equal(integrationState(data, null).label, 'Manual upload')
  assert.equal(integrationState(data, { code: 'access_denied' }).tone, 'issue')
})
test('history snapshot must match requested ID', async () => {
  const result = await loadSnapshot({ rpc: async () => ({ data: testReport() }) }, scope, '2026-10-09', '20000000-0000-4000-8000-000000000002')
  assert.ok(result.error)
})
test('browser upload sends only original files and selected scope, never roles or credentials', async () => {
  let seen
  const result = await uploadReports({ functions: { invoke: async (name, { body }) => {
    seen = [name, ...body.keys()]
    return { data: { status: 'success', report_date: '2026-10-09', agents: 2 } }
  } } }, { scopeId: scope, reportDate: '2026-10-09', performance: new File(['a'], 'a.csv'), pause: new File(['b'], 'b.csv') })
  assert.equal(result.status, 'success')
  assert.deepEqual(seen, ['pulse-vici-import', 'scopeId', 'reportDate', 'performance', 'pause', 'confirmedScope'])
})
