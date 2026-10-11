import test from 'node:test'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { coachingAgents, DAILY_PAUSE_LIMITS, dispositionComparisons, dispositionSummary, pauseOverage, timeComparisons } from '../../src/dashboard/dispositionInsights.js'

const row = (id, calls, ni, extra = {}) => ({ agent_code: id, vici_user_name: 'Agent ' + id, current_user_group: 'A', calls, xfer_count: 5, dispositions: { NI: ni, DAIR: 0, CALLBK: 0 }, ...extra })
const report = (rows, pause = []) => ({ snapshot: { id: 'saved' }, performance: rows, pause })
test('disposition share, count average, weighted rate and leave-one-out peers have different denominators', () => {
  const rows = [row('1', 300, 258), row('2', 100, 100), row('3', 200, 0), row('4', 1, 999, { current_user_group: 'B' })]
  const s = dispositionSummary(rows, 'NI', rows[0])
  assert.equal(s.agents, 3); assert.equal(s.total, 358); assert.equal(s.average, 358 / 3)
  assert.equal(s.peerAverage, 50); assert.equal(s.peerRate, 100 / 300 * 100)
  assert.equal(s.ownRate, 86); assert.equal(s.share, 258 / 358 * 100)
  assert.equal(s.aboveAverage, 416); assert.equal(s.top.length, 2)
  assert.deepEqual(dispositionComparisons(rows, 'NI')[0], { row: rows[0], ownCount: 258, ownRate: 86, peerRate: 100 / 300 * 100, points: 86 - 100 / 300 * 100 })
})
test('zero, missing, unknown group and singleton are not invented comparisons', () => {
  const rows = [row('1', 0, 0), row('2', 0, 0)]
  assert.equal(dispositionSummary(rows, 'NI', rows[0]).share, null)
  assert.equal(dispositionSummary(rows, 'NI', rows[0]).peerRate, null)
  assert.equal(dispositionSummary(rows, 'SPXFER').total, null)
  assert.equal(dispositionSummary([row('1', 10, 2)], 'NI', row('1', 10, 2)).peerRate, null)
  assert.equal(dispositionSummary(rows, 'NI', { ...rows[0], current_user_group: null }).agents, 0)
  assert.deepEqual(dispositionComparisons(rows, 'NI'), [])
  delete rows[1].dispositions.NI
  assert.equal(dispositionSummary(rows, 'NI').total, null)
  assert.deepEqual(dispositionComparisons(rows, 'NI'), [])
})
test('top ten stable count ranking never mutates input or leaks other groups', () => {
  const rows = Array.from({ length: 20 }, (_, i) => row(String(i).padStart(2, '0'), 100, 20 - i))
  const before = JSON.stringify(rows)
  assert.equal(dispositionSummary(rows, 'NI').top.length, 10)
  assert.deepEqual(dispositionSummary(rows, 'NI').top.map(item => item.count), [20,19,18,17,16,15,14,13,12,11])
  assert.equal(JSON.stringify(rows), before)
})
test('approved daily limits flag only strictly over, not equality or missing', () => {
  for (const [field, limit] of Object.entries(DAILY_PAUSE_LIMITS)) {
    assert.equal(pauseOverage(field, limit), null)
    assert.equal(pauseOverage(field, limit + 1), 1)
    assert.equal(pauseOverage(field, null), null)
  }
  assert.equal(pauseOverage('cb_seconds', 10000), null)
  assert.deepEqual(DAILY_PAUSE_LIMITS, { break_seconds: 1500, lunch_seconds: 3600, rr_seconds: 1200 })
})
test('coaching merges reasons without forcing two reports and uses strict ten-point threshold', () => {
  const rows = [row('1', 100, 20), row('2', 100, 10)]
  assert.equal(coachingAgents(report(rows)).length, 0)
  rows[0].dispositions.NI = 21
  const agents = coachingAgents(report(rows, [{ ...rows[0], break_seconds: 1501, lunch_seconds: 3600, rr_seconds: 1201 }]))
  assert.equal(agents.length, 1); assert.equal(agents[0].reasons.length, 3)
  assert.equal(coachingAgents(report([], [{ ...rows[0], break_seconds: 1501 }])).length, 1)
  assert.deepEqual(coachingAgents({ ...report(rows), snapshot: null }), [])
})
test('300 calls and 4-second talk compares with weighted same-team 25-second peers', () => {
  const rows = [row('1', 300, 100, { talk_avg_seconds: 4 }), row('2', 100, 20, { talk_avg_seconds: 10 }), row('3', 300, 60, { talk_avg_seconds: 30 }), row('4', 5000, 100, { current_user_group: 'B', talk_avg_seconds: 200 })]
  const result = timeComparisons(report(rows), 'talk')
  assert.equal(result[0].row.agent_code, '1'); assert.equal(result[0].average, 25)
  assert.equal(result[0].difference, -21); assert.equal(result[0].calls, 300)
  rows[1].talk_avg_seconds = null
  assert.deepEqual(timeComparisons(report(rows), 'talk'), [])
})
test('callback duration ranks percentage of logged time, not disposition count', () => {
  const pause = [row('1', 20, 0, { cb_seconds: 600, total_seconds: 1000 }), row('2', 20, 0, { cb_seconds: 900, total_seconds: 9000 })]
  const result = timeComparisons(report([], pause), 'callback')
  assert.equal(result.length, 1); assert.equal(result[0].row.agent_code, '1')
  assert.equal(result[0].ownRate, 60); assert.equal(result[0].peerRate, 10)
  assert.equal(result[0].difference, 50); assert.equal(result[0].calls, undefined)
})
test('coaching analysis remains responsive at the 20,000-row import limit', () => {
  const rows = Array.from({ length: 20000 }, (_, i) => row(String(i), 300, i % 4 ? 30 : 258, { talk_avg_seconds: i % 4 ? 25 : 4 }))
  const start = performance.now()
  assert.equal(coachingAgents(report(rows)).length, 5000)
  assert.equal(timeComparisons(report(rows), 'talk').length, 10)
  assert.ok(performance.now() - start < 1500, '20,000-row analytics must not block rendering for 1.5s')
})
