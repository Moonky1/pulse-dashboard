import test from 'node:test'
import assert from 'node:assert/strict'
import { agentDay, compareAgentDays, contribution, goalProgress, historyDates, loadAgentJourney, medal, percent, previousDate, rankAgents, ratio, summarizeJourney } from '../../src/dashboard/performanceInsights.js'
import { testReport, testScope } from './ui-fixtures.mjs'

const agent = (code, calls, xfer, group = 'A') => ({ agent_code: code, vici_user_name: code, calls, xfer_count: xfer, current_user_group: group, dispositions: { XFER: xfer, SPANIS: 1000 } })
test('rank by XFER, calls and conversion; zero calls has no conversion', () => {
  const rows = [agent('001', 200, 12), agent('002', 100, 10), agent('003', 0, 0)]
  assert.deepEqual(rankAgents(rows).map(r => r.agent_code), ['001', '002', '003'])
  assert.deepEqual(rankAgents(rows, 'calls', true).map(r => r.agent_code), ['003', '002', '001'])
  assert.deepEqual(rankAgents(rows, 'conversion').map(r => r.agent_code), ['002', '001'])
  assert.equal(ratio(0, 0), null)
  assert.equal(ratio(0, 100), 0)
  assert.equal(percent(null), '—')
  assert.throws(() => rankAgents(rows, 'SPANIS'))
})
test('competition ranks handle ties and preserve exact IDs without mutating rows', () => {
  const rows = [agent('12', 100, 3), agent('012', 100, 3), agent('2', 100, 1)]
  assert.deepEqual(rankAgents(rows).map(r => [r.agent_code, r.rank]), [['012', 1], ['12', 1], ['2', 3]])
  assert.equal(rows[0].rank, undefined)
  assert.equal(medal(1), '🥇'); assert.equal(medal(2), '🥈'); assert.equal(medal(3), '🥉'); assert.equal(medal(4), '#4')
})
test('target references are 15 / 10 English, no inferred default and uncapped numeric progress', () => {
  assert.equal(goalProgress(8, ''), null)
  assert.deepEqual(goalProgress(14, 'asia'), { target: 15, remaining: 1, percent: 14 / 15 * 100, reached: false })
  assert.equal(goalProgress(15, 'asia').reached, true)
  assert.equal(goalProgress(10, 'other').remaining, 0)
  assert.equal(goalProgress(30, 'asia').percent, 200)
  assert.equal(goalProgress(null, 'asia'), null)
})
test('share is within source group; sums not average percentages; SPANIS is irrelevant', () => {
  const rows = [agent('1', 100, 10), agent('2', 900, 90), agent('3', 100, 100, 'B')]
  assert.deepEqual(contribution(rows[0], rows), { group: 'A', agents: 2, groupXfer: 100, groupCalls: 1000, xferShare: 10, callShare: 10, groupConversion: 10, rank: 2 })
  assert.equal(contribution(agent('4', 0, 0, 'C'), [agent('4', 0, 0, 'C')]).xferShare, null)
})
test('calendar windows cross month, leap day and DST without timezone assumptions', () => {
  assert.equal(previousDate('2024-03-01'), '2024-02-29')
  assert.equal(previousDate('2026-01-01'), '2025-12-31')
  assert.equal(historyDates('2026-11-03', 7)[6], '2026-10-28')
  assert.throws(() => historyDates('2026-02-30', 7)); assert.throws(() => historyDates('2026-10-09', 90))
})
test('missing report, missing ID, zero and pause-only are distinct', () => {
  const report = testReport()
  assert.equal(agentDay(report, '1000').status, 'absent')
  assert.equal(agentDay(report, '01000').status, 'observed')
  report.performance = []
  assert.equal(agentDay(report, '01000').status, 'absent')
  report.snapshot = null; report.pause = []
  assert.equal(agentDay(report, '01000').status, 'no_report')
})
test('daily summary counts one observation per day and retains tied extremes including active zero', () => {
  const make = (date, calls, xfer, groupTotal) => ({ status: 'observed', date, row: agent('001', calls, xfer), groupXfer: groupTotal, rank: 1, group: 'A', conversion: ratio(xfer, calls) })
  const days = [make('2026-10-09', 100, 10, 100), make('2026-10-08', 300, 10, 50), make('2026-10-07', 50, 0, 50), make('2026-10-06', 0, 0, 0), { status: 'absent' }, { status: 'no_report' }]
  const summary = summarizeJourney(days)
  assert.equal(summary.xfer, 20); assert.equal(summary.calls, 450); assert.equal(summary.conversion, 20 / 450 * 100)
  assert.equal(summary.share, 10); assert.equal(summary.active, 3); assert.equal(summary.observed, 4)
  assert.equal(summary.best.length, 2); assert.equal(summary.lowest[0].date, '2026-10-07')
  assert.equal(summary.zeroDays, 1); assert.equal(summary.noReport, 1); assert.equal(summary.absent, 1)
  assert.deepEqual(summarizeJourney([{ status: 'no_report' }]).best, [])
})
test('comparison uses percentage points, accepts declines and flags a group change', () => {
  const before = { status: 'observed', row: agent('1', 200, 20), conversion: 10, group: 'A' }
  const after = { status: 'observed', row: agent('1', 100, 0), conversion: 0, group: 'B' }
  assert.deepEqual(compareAgentDays(after, before), { calls: -100, xfer: -20, conversionPoints: -10, sameGroup: false })
  assert.equal(compareAgentDays(after, { status: 'absent' }), null)
})
test('history uses existing latest-per-date protected RPC only, once per day, concurrency <= 3', async () => {
  let inFlight = 0, max = 0; const requests = []
  const client = { async rpc(name, args) {
    assert.equal(name, 'get_vici_dashboard'); assert.equal(args.requested_scope, testScope.id)
    requests.push(args.report_date); max = Math.max(max, ++inFlight)
    await new Promise(resolve => setTimeout(resolve, 1)); inFlight--
    return { data: testReport(args.report_date) }
  } }
  const result = await loadAgentJourney(client, testScope.id, '2026-10-09', 7, '01000')
  assert.equal(result.days.length, 7); assert.equal(new Set(requests).size, 7); assert.equal(max, 3)
  assert.equal(summarizeJourney(result.days).xfer, 21)
  assert.equal(result.days[0].row.agent_code, '01000'); assert.equal(result.days[0].performance, undefined)
})
test('access denial discards ALL partial history and stops queued reads', async () => {
  let requests = 0
  const result = await loadAgentJourney({ async rpc(name, args) { requests++; return args.report_date === '2026-10-08' ? { error: { code: '42501' } } : { data: testReport(args.report_date) } } }, testScope.id, '2026-10-09', 30, '01000')
  assert.equal(result.error.code, 'access_denied'); assert.equal(result.days, undefined); assert.ok(requests < 30)
})
test('network and malformed cross-scope responses are not labelled missing days', async () => {
  for (const response of [{ error: { code: 'NETWORK' } }, { data: { ...testReport(), scope: { id: 'wrong' } } }]) {
    const result = await loadAgentJourney({ async rpc() { return response } }, testScope.id, '2026-10-09', 7, '01000')
    assert.ok(result.error); assert.equal(result.days, undefined)
  }
})
test('a later network failure cannot mask concurrent permission denial', async () => {
  let calls = 0
  const result = await loadAgentJourney({ async rpc() {
    const request = ++calls
    await new Promise(resolve => setTimeout(resolve, request))
    return { error: { code: request === 1 ? '42501' : 'NETWORK' } }
  } }, testScope.id, '2026-10-09', 7, '01000')
  assert.equal(result.error.code, 'access_denied'); assert.equal(result.days, undefined)
})
test('cancelled/unmounted journey does not publish or start queued days', async () => {
  let current = true, calls = 0, progress = 0
  const result = await loadAgentJourney({ async rpc(name, args) { calls++; current = false; return { data: testReport(args.report_date) } } }, testScope.id, '2026-10-09', 30, '01000', { current: () => current, progress: () => progress++ })
  assert.equal(result.cancelled, true); assert.equal(calls, 1); assert.equal(progress, 0)
})
