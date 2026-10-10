import assert from 'node:assert/strict'
import test from 'node:test'
import { fixture, options } from './parserFixtures.mjs'
import { parseAgentPerformance, parsePauseBreakdown } from '../../supabase/functions/_shared/viciReportParsers.mjs'
import { collectViciScope, normalizedViciPair, viciSourceDate, viciRepository } from '../../supabase/functions/_shared/viciCollector.mjs'
import { createViciCollectorHandler } from '../../supabase/functions/pulse-vici-collector/handler.mjs'
const scopeId = '11111111-1111-4111-8111-111111111111'
const pair = () => ({ performance: parseAgentPerformance(fixture('performance'), options), pause: parsePauseBreakdown(fixture('pause'), options), warnings: [] })
const source = { key: 'fixture', baseUrl: 'https://reports.example.test', user: 'server-user-fixture', password: 'server-password-fixture' }
function runtime(overrides = {}) {
  const calls = [], data = pair()
  const repository = {
    scope: async () => ({ enabled: true, source_key: 'fixture', source_time_zone: 'America/Los_Angeles', ...overrides.scope }),
    begin: async (...args) => { calls.push(['begin', ...args]); return { acquired: true, run_id: 'run-fixture',
      source_key: 'fixture', source_time_zone: 'America/Los_Angeles', campaigns: ['FixtureCampaign'], user_groups: ['FixtureGroup'], ...overrides.lease } },
    complete: async (...args) => { calls.push(['complete', ...args]); if (overrides.persistError) throw new Error('private SQL trace'); return { status: 'success', snapshot_run_id: 'run-fixture' } },
    fail: async (...args) => { calls.push(['fail', ...args]); if (overrides.failError) throw new Error('private SQL trace') },
  }
  const makeClient = () => ({ readPair: async spec => {
    calls.push(['read', spec]); if (overrides.readError) throw overrides.readError; return data
  } })
  return { calls, data, repository, run: extra => collectViciScope({ scopeId, reportDate: '2026-10-09', repository, source, makeClient, ...extra }) }
}
test('source day honors explicit IANA timezone across midnight and DST', () => {
  assert.equal(viciSourceDate('America/Los_Angeles', new Date('2026-10-10T04:00:00Z')), '2026-10-09')
  assert.equal(viciSourceDate('America/Los_Angeles', new Date('2026-01-10T07:30:00Z')), '2026-01-09')
  assert.equal(viciSourceDate('Asia/Manila', new Date('2026-10-09T17:00:00Z')), '2026-10-10')
  assert.throws(() => viciSourceDate(null))
})
test('unknown timezone blocks automatic Today but not an explicit source date', async () => {
  const app = runtime({ scope: { source_time_zone: null } })
  assert.equal((await app.run({ reportDate: undefined })).category, 'confirmed_source_timezone_required')
  assert.equal(app.calls.length, 0)
  assert.equal((await app.run()).status, 'success')
})
test('invalid date and disabled or wrong source cannot acquire a lease', async () => {
  for (const date of ['2026-02-30', '', null, 123]) assert.equal((await runtime().run({ reportDate: date })).category, 'invalid_report_date')
  for (const scope of [{ enabled: false }, { source_key: 'different' }]) {
    const app = runtime({ scope }); assert.equal((await app.run()).category, 'configuration_error'); assert.equal(app.calls.length, 0)
  }
})
test('lease/cooldown/halts skip before making any source request', async () => {
  const app = runtime({ lease: { acquired: false, halted: true } })
  assert.deepEqual(await app.run(), { status: 'skipped', halted: true })
  assert.deepEqual(app.calls.map(c => c[0]), ['begin'])
})
test('successful pair uses database-owned scope then one atomic completion', async () => {
  const app = runtime(); const result = await app.run()
  assert.equal(result.status, 'success')
  assert.deepEqual(app.calls.map(c => c[0]), ['begin', 'read', 'complete'])
  assert.deepEqual(app.calls[1][1].scope, { campaigns: ['FixtureCampaign'], userGroups: ['FixtureGroup'], users: ['--ALL--'] })
  assert.equal(app.calls[2][2].performance.rows[0].agent_code, '0001')
})
test('normalizer keeps only canonical fields and category names, never arbitrary metadata', () => {
  const value = pair()
  value.performance.authorization = 'private'
  value.performance.rows[0].password = 'private'
  value.performance.warnings.push({ category: 'totals_mismatch', private: 'private' }, { category: 'raw-secret-error' })
  const output = normalizedViciPair(value)
  assert.equal(JSON.stringify(output).includes('private'), false)
  assert.deepEqual(output.warning_categories, ['totals_mismatch', 'unnamed_columns'])
  assert.equal(output.performance.rows[0].dispositions.SPANIS, 4)
  assert.equal(output.performance.rows[0].xfer_count, 1)
})
for (const category of ['authentication_failed', 'access_denied', 'requires_ip_validation', 'rate_limited', 'request_timeout', 'source_network_error']) {
  test(category + ' records sanitized failure without committing partial data', async () => {
    const app = runtime({ readError: { category, message: 'private-password-url', retry_after_seconds: 120 } })
    const result = await app.run()
    assert.equal(result.category, category)
    assert.equal(JSON.stringify(result).includes('private-password'), false)
    assert.deepEqual(app.calls.map(c => c[0]), ['begin', 'read', 'fail'])
    assert.equal(app.calls[2][3], 120)
  })
}
test('unexpected source errors cannot enter health as raw messages', async () => {
  const app = runtime({ readError: new Error('secret full response') })
  assert.equal((await app.run()).category, 'invalid_report')
  assert.equal(app.calls.at(-1)[2], 'invalid_report')
})
test('failed persistence is recorded and never reported as success', async () => {
  const app = runtime({ persistError: true })
  assert.equal((await app.run()).category, 'persistence_failed')
  assert.deepEqual(app.calls.map(c => c[0]), ['begin', 'read', 'complete', 'fail'])
})
test('failure to record health remains a failure; lease expires in database', async () => {
  const app = runtime({ persistError: true, failError: true })
  assert.equal((await app.run()).status, 'failed')
})
test('repository translates only canonical RPC arguments and redacts database errors', async () => {
  const calls = []
  const repo = viciRepository({ rpc: async (name, args) => { calls.push([name, args]); return { data: {}, error: name === 'fail_vici_sync' ? { message: 'private' } : null } } })
  await repo.begin(scopeId, '2026-10-09')
  await repo.complete('run', {})
  await assert.rejects(repo.fail('run', 'request_timeout', 60), { message: 'persistence_failed' })
  assert.equal(calls[0][0], 'begin_vici_sync'); assert.equal(calls[1][0], 'complete_vici_sync')
})
function edge() {
  const calls = []
  const env = { SUPABASE_SERVICE_ROLE_KEY: 'service-secret-fixture', VICI_COLLECTOR_TOKEN: 'collector-fixture-token-at-least-32-characters', SUPABASE_URL: 'https://backend.example.test', VICI_SOURCE_KEY: 'fixture',
    VICI_BASE_URL: source.baseUrl, VICI_REPORT_USER: source.user, VICI_REPORT_PASSWORD: source.password }
  const handler = createViciCollectorHandler({ env: key => env[key], createClient: () => { calls.push('client'); return {} },
    collect: async args => { calls.push(args); return { status: 'success', snapshotRunId: 'fixture' } } })
  return { calls, invoke: (body = { scopeId, reportDate: '2026-10-09' }, headers = {}, method = 'POST') => handler(new Request('https://edge.example.test', {
    method, headers: { authorization: 'Bearer service-secret-fixture', 'x-pulse-vici-token': env.VICI_COLLECTOR_TOKEN, ...headers }, body: method === 'POST' ? typeof body === 'string' ? body : JSON.stringify(body) : undefined,
  })) }
}
test('collector rejects anonymous, Staff JWT, Agent tokens and browser calls before backend use', async () => {
  const app = edge()
  for (const authorization of ['', 'Bearer staff-user-jwt', 'Bearer agent-session']) assert.equal((await app.invoke(undefined, { authorization, 'x-pulse-vici-token': '' })).status, 401)
  assert.equal((await app.invoke(undefined, { 'x-pulse-vici-token': 'wrong-collector-key' })).status, 401)
  assert.equal((await app.invoke(undefined, { origin: 'https://preview.example.test' })).status, 403)
  assert.equal(app.calls.length, 0)
})
test('collector rejects unexpected fields, malformed JSON, huge bodies and invalid method', async () => {
  const app = edge()
  for (const body of ['{', 'null', '[]', { scopeId, baseUrl: 'https://evil.test' }, { scopeId: 'bad' }]) assert.equal((await app.invoke(body)).status, 400)
  assert.equal((await app.invoke(' '.repeat(1025))).status, 413)
  assert.equal((await app.invoke(undefined, {}, 'GET')).status, 405)
  assert.equal(app.calls.length, 0)
})
test('only server secret enables collection; no CORS or secrets in response', async () => {
  const app = edge(); const response = await app.invoke()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  const text = await response.text()
  assert.equal(text.includes(source.password), false)
  assert.equal(text.includes('service-secret'), false)
  assert.equal(app.calls[1].source.key, 'fixture')
})
