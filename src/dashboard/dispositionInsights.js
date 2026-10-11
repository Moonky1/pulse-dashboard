import { integer } from './dashboardModel.js'

const rate = (value, total) => integer(value) && integer(total) && total > 0 ? value / total * 100 : null
const total = values => values.length && values.every(integer) ? values.reduce((a, b) => a + b, 0) : null
const count = (row, code) => row?.dispositions?.[code]

// Same saved cut, exact source group. Missing cells are never zero or a smaller denominator.
export function dispositionSummary(rows, code, agent = null) {
  const group = agent?.current_user_group
  const cohort = agent ? group ? rows.filter(row => row.current_user_group === group) : [] : rows
  const sum = total(cohort.map(row => count(row, code)))
  const calls = total(cohort.map(row => row.calls))
  const peers = agent ? cohort.filter(row => row.agent_code !== agent.agent_code) : cohort
  const peerTotal = total(peers.map(row => count(row, code)))
  const peerCalls = total(peers.map(row => row.calls))
  const ownCount = count(agent, code), ownRate = rate(ownCount, agent?.calls)
  const peerRate = rate(peerTotal, peerCalls)
  const peerAverage = peerTotal === null ? null : peerTotal / peers.length
  const top = cohort.filter(row => integer(count(row, code)) && count(row, code) > 0)
    .sort((a, b) => count(b, code) - count(a, code) || a.agent_code.localeCompare(b.agent_code))
    .slice(0, 10).map(row => ({ row, count: count(row, code), rate: rate(count(row, code), row.calls), share: rate(count(row, code), sum) }))
  return {
    agents: cohort.length, available: cohort.filter(row => integer(count(row, code))).length,
    total: sum, average: sum === null ? null : sum / cohort.length, rate: rate(sum, calls),
    ownCount: integer(ownCount) ? ownCount : null, ownRate, share: rate(ownCount, sum),
    peerAverage, peerRate, points: ownRate === null || peerRate === null ? null : ownRate - peerRate,
    aboveAverage: integer(ownCount) && peerAverage > 0 ? (ownCount / peerAverage - 1) * 100 : null,
    top,
  }
}

// Operator-confirmed daily review policy, 2026-10-11. These are UI observations,
// not permission checks, payroll deductions, or automatic disciplinary actions.
export const DAILY_PAUSE_LIMITS = Object.freeze({ break_seconds: 25 * 60, lunch_seconds: 60 * 60, rr_seconds: 20 * 60 })
export function pauseOverage(field, value) {
  const limit = DAILY_PAUSE_LIMITS[field]
  return integer(limit) && integer(value) && value > limit ? value - limit : null
}
// Batch comparisons stay linear in report size; no per-agent scan/sort of the team.
export function dispositionComparisons(rows, code) {
  const groups = new Map()
  for (const row of rows) {
    if (!row.current_user_group) continue
    const stats = groups.get(row.current_user_group) || { agents: 0, count: 0, calls: 0, valid: true }
    stats.agents++
    stats.valid &&= integer(count(row, code)) && integer(row.calls)
    stats.count += count(row, code) || 0; stats.calls += row.calls || 0
    groups.set(row.current_user_group, stats)
  }
  return rows.flatMap(row => {
    const stats = groups.get(row.current_user_group)
    if (!stats?.valid || stats.agents < 2) return []
    const ownCount = count(row, code), ownRate = rate(ownCount, row.calls)
    const peerRate = rate(stats.count - ownCount, stats.calls - row.calls)
    if (ownRate === null || peerRate === null) return []
    return [{ row, ownCount, ownRate, peerRate, points: ownRate - peerRate }]
  })
}
export function timeComparisons(report, metric) {
  if (!['callback', 'talk', 'dead'].includes(metric)) return []
  const pause = metric === 'callback', field = pause ? 'cb_seconds' : metric === 'talk' ? 'talk_avg_seconds' : 'dead_avg_seconds'
  const source = pause ? report.pause : report.performance
  const groups = new Map(), performances = new Map(report.performance.map(row => [row.agent_code, row]))
  for (const row of source) {
    if (!row.current_user_group || (!pause && !(row.calls > 0))) continue
    const stats = groups.get(row.current_user_group) || { agents: 0, weighted: 0, denominator: 0, valid: true }
    stats.agents++
    const denominator = pause ? row.total_seconds : row.calls
    stats.valid &&= integer(row[field]) && integer(denominator)
    stats.weighted += (row[field] || 0) * (pause ? 1 : denominator || 0)
    stats.denominator += denominator || 0
    groups.set(row.current_user_group, stats)
  }
  return source.flatMap(row => {
    if (!row.current_user_group || !integer(row[field]) || (!pause && !(row.calls > 0))) return []
    const stats = groups.get(row.current_user_group)
    if (!stats?.valid || stats.agents < 2) return []
    const denominator = stats.denominator - (pause ? row.total_seconds : row.calls)
    if (!denominator || (pause && !(row.total_seconds > 0))) return []
    const weighted = stats.weighted - row[field] * (pause ? 1 : row.calls)
    const average = weighted / (pause ? stats.agents - 1 : denominator)
    const ownRate = pause ? row[field] / row.total_seconds * 100 : null
    const peerRate = pause ? weighted / denominator * 100 : null
    const difference = pause ? ownRate - peerRate : row[field] - average
    const performance = performances.get(row.agent_code)
    return [{ row, value: row[field], average, difference, ownRate, peerRate, calls: performance?.calls, xfer: performance?.xfer_count }]
  }).filter(item => metric === 'talk' ? item.difference < 0 : item.difference > 0)
    .sort((a, b) => (metric === 'talk' ? a.difference - b.difference : b.difference - a.difference) || a.row.agent_code.localeCompare(b.row.agent_code)).slice(0, 10)
}
export function coachingAgents(report) {
  if (!report?.snapshot) return []
  const agents = new Map()
  const add = (row, reason) => {
    if (!agents.has(row.agent_code)) agents.set(row.agent_code, { row, reasons: [] })
    agents.get(row.agent_code).reasons.push(reason)
  }
  for (const row of report.pause) {
    for (const [field, label] of [['break_seconds', 'Break'], ['lunch_seconds', 'Lunch'], ['rr_seconds', 'RR']]) {
      const over = pauseOverage(field, row[field])
      if (over !== null) add(row, { kind: 'pause', code: label, value: row[field], limit: DAILY_PAUSE_LIMITS[field], over })
    }
  }
  for (const code of ['NI', 'DAIR']) {
    for (const { row, ...summary } of dispositionComparisons(report.performance, code)) {
      if (summary.points > 10 + 1e-9) add(row, { kind: 'disposition', code, ...summary })
    }
  }
  return [...agents.values()].sort((a, b) => b.reasons.length - a.reasons.length || a.row.agent_code.localeCompare(b.row.agent_code))
}
