import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildViciReportUrl, createViciReportClient, ViciClientError } from '../../supabase/functions/_shared/viciReportClient.mjs'
import { fixture, options } from './parserFixtures.mjs'

const config = { baseUrl: 'https://reports.example', user: 'fixture-user', password: 'fixture-password' }
const request = { range: { from: '2026-10-09 00:00:00', to: '2026-10-09 23:59:59' }, scope: { campaigns: ['CampaignB', 'CampaignA'], userGroups: ['FixtureGroup'] } }
const rejectCategory = (promise, category) => assert.rejects(promise, error => error instanceof ViciClientError && error.category === category)
const throwCategory = (fn, category) => assert.throws(fn, error => error instanceof ViciClientError && error.category === category)
const csvResponse = (type = 'performance') => new Response(fixture(type), { headers: { 'content-type': 'application/octet-stream' } })

test('DOWNLOAD contract uses observed GET parameters and distinct CSV exports', () => {
  for (const [type, stage] of [['performance', '1'], ['pause', '2']]) {
    const url = buildViciReportUrl(config.baseUrl, type, request)
    assert.equal(url.origin, config.baseUrl)
    assert.equal(url.pathname, '/vicidial/AST_agent_performance_detail.php')
    assert.equal(url.searchParams.get('file_download'), stage)
    assert.equal(url.searchParams.get('query_date'), '2026-10-09')
    assert.equal(url.searchParams.get('query_time'), '00:00:00')
    assert.equal(url.searchParams.get('end_time'), '23:59:59')
    assert.equal(url.searchParams.get('report_display_type'), 'TEXT')
    assert.equal(url.searchParams.get('shift'), '--')
    assert.equal(url.searchParams.get('DB'), '0')
    assert.deepEqual(url.searchParams.getAll('group[]'), ['CampaignA', 'CampaignB'])
    assert.deepEqual(url.searchParams.getAll('user_group[]'), ['FixtureGroup'])
    assert.deepEqual(url.searchParams.getAll('users[]'), ['--ALL--'])
    for (const option of ['show_percentages', 'live_agents', 'time_in_sec', 'search_archived_data', 'show_defunct_users', 'breakdown_by_date', 'stage']) assert.equal(url.searchParams.get(option), '')
    assert.ok(!url.toString().includes(config.password))
  }
})

test('multiple groups are repeated parameters, deduplicated without a permanent Asia scope', () => {
  const url = buildViciReportUrl(config.baseUrl, 'pause', { ...request, scope: { ...request.scope, userGroups: ['Other Team', 'FixtureGroup', 'Other Team'] } })
  assert.deepEqual(url.searchParams.getAll('user_group[]'), ['FixtureGroup', 'Other Team'])
  assert.ok(!url.toString().includes('OpenersAsia'))
})

test('invalid origins, embedded credentials, paths, query strings and validation ports are rejected', () => {
  for (const baseUrl of ['http://reports.example', 'https://user:pass@reports.example', 'https://reports.example/vicidial/', 'https://reports.example/?secret=x', 'https://reports.example/#x', 'https://reports.example:444', 'not-a-url']) {
    throwCategory(() => createViciReportClient({ ...config, baseUrl }), 'invalid_base_url')
  }
})

test('invalid calendar dates, reversed ranges and multiple-day V1 queries are rejected', () => {
  for (const range of [
    { from: '2026-02-30 00:00:00', to: '2026-02-30 23:59:59' },
    { from: '2026-10-09 24:00:00', to: '2026-10-09 24:00:01' },
    { from: '2026-10-09 23:59:59', to: '2026-10-09 00:00:00' },
    { from: '2026-10-08 00:00:00', to: '2026-10-09 23:59:59' },
  ]) throwCategory(() => buildViciReportUrl(config.baseUrl, 'performance', { ...request, range }), 'invalid_requested_range')
})

test('empty scopes, control characters and mixed ALL selections cannot widen the request', () => {
  for (const userGroups of [[], ['--ALL--', 'FixtureGroup'], ['x\nY'], [' '], [123], undefined]) {
    throwCategory(() => buildViciReportUrl(config.baseUrl, 'performance', { ...request, scope: { ...request.scope, userGroups } }), 'invalid_report_scope')
  }
  throwCategory(() => buildViciReportUrl(config.baseUrl, 'other', request), 'invalid_report_type')
})

test('missing credentials fail before any network request', () => {
  for (const override of [{ user: '' }, { password: '' }, { user: 'name:other' }, { password: 'x\r\ny' }]) {
    throwCategory(() => createViciReportClient({ ...config, ...override }), 'missing_or_invalid_credentials')
  }
})

test('authenticated request is HTTPS GET, uses Basic header only and never follows redirects', async () => {
  let calls = 0
  const client = createViciReportClient(config, { now: () => options.ingestedAt, fetchImpl: async (url, init) => {
    calls += 1
    assert.equal(url.protocol, 'https:')
    assert.equal(init.method, 'GET')
    assert.equal(init.redirect, 'manual')
    assert.equal(init.cache, 'no-store')
    assert.equal(init.headers.Authorization, `Basic ${Buffer.from(`${config.user}:${config.password}`).toString('base64')}`)
    assert.equal(init.body, undefined)
    return csvResponse()
  } })
  const result = await client.read('performance', request)
  assert.equal(calls, 1)
  assert.equal(result.rows.length, 2)
  assert.equal(result.ingested_at, options.ingestedAt)
  assert.equal(result.source_time_zone, null)
  assert.deepEqual(result.requested_range, request.range)
  assert.ok(!JSON.stringify(result).includes(config.password))
  assert.equal(result.raw_source, undefined)
})

test('valid source timezone is retained while source timestamps remain wall clocks', async () => {
  const client = createViciReportClient({ ...config, sourceTimeZone: 'America/Bogota' }, { fetchImpl: async () => csvResponse() })
  const result = await client.read('performance', request)
  assert.equal(result.source_time_zone, 'America/Bogota')
  assert.equal(result.source_generated_at, '2026-10-09 19:45:14')
  throwCategory(() => createViciReportClient({ ...config, sourceTimeZone: 'unknown' }), 'invalid_source_time_zone')
})

test('IP-validation redirect is detected without submitting or following it', async () => {
  let calls = 0
  const client = createViciReportClient(config, { fetchImpl: async () => {
    calls += 1
    return new Response(null, { status: 302, headers: { location: 'https://reports.example:444/abc_validation.php' } })
  } })
  await assert.rejects(client.readPair(request), error => error.category === 'requires_ip_validation' && error.requires_ip_validation && error.retry_after_seconds === null)
  assert.equal(calls, 1)
})

test('cross-origin redirects are refused and authentication cannot leak to another origin', async () => {
  let calls = 0
  const client = createViciReportClient(config, { fetchImpl: async () => {
    calls += 1
    return new Response(null, { status: 302, headers: { location: 'https://elsewhere.example/abc_validation.php' } })
  } })
  await rejectCategory(client.read('performance', request), 'unexpected_redirect')
  assert.equal(calls, 1)
})

test('validation HTML is a structured error even when delivered as 403', async () => {
  for (const status of [200, 403]) {
    const client = createViciReportClient(config, { fetchImpl: async () => new Response('<!doctype html><title>User Validation</title><form action="abc_validation.php"></form>', { status }) })
    await rejectCategory(client.read('performance', request), 'requires_ip_validation')
  }
})

test('login HTML, authentication failure and forbidden access never become zero agents', async () => {
  for (const [status, body, category] of [[200, '<html><title>Sign in</title></html>', 'unexpected_html_response'], [401, 'Private authentication response', 'authentication_failed'], [403, 'Forbidden', 'access_denied']]) {
    const client = createViciReportClient(config, { fetchImpl: async () => new Response(body, { status }) })
    await rejectCategory(client.read('performance', request), category)
  }
})

test('HTML content type is refused even if body resembles a CSV', async () => {
  const client = createViciReportClient(config, { fetchImpl: async () => new Response(fixture('performance'), { headers: { 'content-type': 'text/html' } }) })
  await rejectCategory(client.read('performance', request), 'unexpected_html_response')
})

test('429 honors a bounded retry delay and never retries in the client', async () => {
  let calls = 0
  const client = createViciReportClient(config, { fetchImpl: async () => {
    calls += 1
    return new Response('busy', { status: 429, headers: { 'retry-after': '120' } })
  } })
  await assert.rejects(client.readPair(request), error => error.category === 'rate_limited' && error.retry_after_seconds === 120)
  assert.equal(calls, 1)
})

test('server unavailability preserves a structured backoff error', async () => {
  const client = createViciReportClient(config, { fetchImpl: async () => new Response('private server exception', { status: 503 }) })
  await assert.rejects(client.read('performance', request), error => error.category === 'source_unavailable' && error.retry_after_seconds === 60 && !JSON.stringify(error).includes('private server'))
})

test('fetch failures cannot expose raw URLs, credentials, stacks or response bodies', async () => {
  const client = createViciReportClient(config, { fetchImpl: async () => { throw new Error(`https://${config.user}:${config.password}@reports.example PRIVATE-BODY`) } })
  await assert.rejects(client.read('performance', request), error => {
    assert.equal(error.category, 'source_network_error')
    for (const marker of [config.password, config.user, 'PRIVATE-BODY']) assert.ok(!JSON.stringify(error).includes(marker) && !error.message.includes(marker))
    assert.equal(error.cause, undefined)
    return true
  })
})

test('timeout aborts the request and does not launch another report query', async () => {
  let calls = 0
  const client = createViciReportClient({ ...config, timeoutMs: 5 }, { fetchImpl: async (url, init) => {
    calls += 1
    return new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
  } })
  await rejectCategory(client.readPair(request), 'request_timeout')
  assert.equal(calls, 1)
})

test('oversized responses are rejected both by header and by actual streamed bytes', async () => {
  for (const response of [new Response('small', { headers: { 'content-length': String(6 * 1024 * 1024) } }), new Response('x'.repeat(5 * 1024 * 1024 + 1))]) {
    const client = createViciReportClient(config, { fetchImpl: async () => response })
    await rejectCategory(client.read('performance', request), 'report_too_large')
  }
})

test('unexpected report range and malformed CSV are rejected before consumption', async () => {
  for (const [body, category] of [[fixture('performance').replace('Time range: 2026-10-09', 'Time range: 2026-10-08'), 'source_range_mismatch'], ['"not a report"', 'missing_header']]) {
    const client = createViciReportClient(config, { fetchImpl: async () => new Response(body) })
    await rejectCategory(client.read('performance', request), category)
  }
})

test('report pair keeps independent timestamps and validates each report separately', async () => {
  const requested = []
  const client = createViciReportClient(config, { fetchImpl: async url => {
    const type = url.searchParams.get('file_download') === '1' ? 'performance' : 'pause'
    requested.push(type)
    return new Response(fixture(type).replace('19:45:14', type === 'pause' ? '19:45:56' : '19:45:14'))
  } })
  const result = await client.readPair(request)
  assert.deepEqual(requested, ['performance', 'pause'])
  assert.equal(result.performance.rows.length, 2)
  assert.equal(result.pause.rows.length, 2)
  assert.notEqual(result.performance.source_generated_at, result.pause.source_generated_at)
  assert.deepEqual(result.warnings, [])
})

test('failure in the second report does not return a partially successful pair', async () => {
  const client = createViciReportClient(config, { fetchImpl: async url => url.searchParams.get('file_download') === '1' ? csvResponse() : new Response(null, { status: 401 }) })
  await rejectCategory(client.readPair(request), 'authentication_failed')
})

test('agent-set changes between separate report generations are explicitly warned', async () => {
  const client = createViciReportClient(config, { fetchImpl: async url => url.searchParams.get('file_download') === '1' ? csvResponse() : new Response(fixture('pause').replace('0099', '0098')) })
  assert.deepEqual((await client.readPair(request)).warnings, [{ category: 'report_agent_sets_differ' }])
})

test('private probe does not print credentials, response bodies or individual records', () => {
  const source = readFileSync(new URL('./probe-private-reports.mjs', import.meta.url), 'utf8')
  assert.ok(!/console\.(?:log|error)\((?:env|error\b|result\b)/.test(source))
  assert.ok(!/writeFile|appendFile|Authorization/.test(source))
})
