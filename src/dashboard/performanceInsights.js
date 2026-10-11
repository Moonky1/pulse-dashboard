import { loadDashboardReport } from './dashboardApi.js'
import { groupName, integer, validDate } from './dashboardModel.js'
import { confirmedTargetReference } from './reportingPolicy.js'

// Read-only analysis. A reference target is not a team mapping or an access grant.
export const TARGET_REFERENCES = { asia: { label: 'Asia', daily: 15 }, other: { label: 'Other teams', daily: 10 } }
export const RANK_METRICS = { xfer: 'XFER', calls: 'Calls', conversion: 'Conversion %' }
export const percent = value => value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(2)}%`
export const ratio = (numerator, denominator) => integer(numerator) && integer(denominator) && denominator > 0 ? numerator / denominator * 100 : null
export const medal = rank => ({ 1: '🥇', 2: '🥈', 3: '🥉' })[rank] || `#${rank}`
export function goalProgress(xfer, reference) {
  const target = TARGET_REFERENCES[reference]?.daily
  if (!target || !integer(xfer)) return null
  return { target, remaining: Math.max(0, target - xfer), percent: xfer / target * 100, reached: xfer >= target }
}
export function dailyGoal(day, scope) {
  return day?.status === 'observed' ? goalProgress(day.row.xfer_count, confirmedTargetReference(scope, day.row)) : null
}
export function historyDayLabel(date) {
  if (!validDate(date)) return '—'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z')) + ' ' + date.slice(5)
}
export function previousDate(date, days = 1) {
  if (!validDate(date) || !Number.isInteger(days) || days < 0 || days > 365) throw Error('Invalid calendar date')
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() - days)
  return value.toISOString().slice(0, 10)
}
export function historyDates(end, count) {
  if (![7, 30].includes(count)) throw Error('Choose 7 or 30 calendar days')
  return Array.from({ length: count }, (_, i) => previousDate(end, i))
}
export function rankAgents(rows, metric = 'xfer', ascending = false) {
  if (!(metric in RANK_METRICS)) throw Error('Unsupported ranking metric')
  const value = row => metric === 'conversion' ? ratio(row.xfer_count, row.calls) : row[metric === 'calls' ? 'calls' : 'xfer_count']
  const sorted = rows.map(row => ({ ...row, value: value(row) }))
    .filter(row => Number.isFinite(row.value) && row.value >= 0)
    .sort((a, b) => (ascending ? a.value - b.value : b.value - a.value) || a.agent_code.localeCompare(b.agent_code))
  let rank = 0
  return sorted.map((row, index) => {
    if (index === 0 || row.value !== sorted[index - 1].value) rank = index + 1
    return { ...row, rank }
  })
}
export function contribution(row, rows) {
  const peers = rows.filter(peer => groupName(peer) === groupName(row))
  const total = key => peers.reduce((sum, peer) => sum + peer[key], 0)
  return { group: groupName(row), agents: peers.length, groupXfer: total('xfer_count'), groupCalls: total('calls'),
    xferShare: ratio(row.xfer_count, total('xfer_count')), callShare: ratio(row.calls, total('calls')),
    groupConversion: ratio(total('xfer_count'), total('calls')),
    rank: rankAgents(peers).find(peer => peer.agent_code === row.agent_code)?.rank ?? null }
}
export function agentDay(report, code) {
  const row = report.performance.find(value => value.agent_code === code)
  if (!report.snapshot || !report.performance.length) return { date: report.date, status: 'no_report' }
  const source = { snapshot: report.snapshot, date: report.date }
  if (!row) return { ...source, status: 'absent' }
  return { ...source, status: 'observed', row, pause: report.pause.find(value => value.agent_code === code) || null,
    conversion: ratio(row.xfer_count, row.calls), ...contribution(row, report.performance) }
}
export function summarizeJourney(days) {
  const observed = days.filter(day => day.status === 'observed')
  const active = observed.filter(day => day.row.calls > 0)
  const total = key => observed.reduce((sum, day) => sum + day.row[key], 0)
  const extremes = ascending => {
    if (!active.length) return []
    const value = (ascending ? Math.min : Math.max)(...active.map(day => day.row.xfer_count))
    return active.filter(day => day.row.xfer_count === value)
  }
  return { observed: observed.length, active: active.length, noReport: days.filter(day => day.status === 'no_report').length,
    absent: days.filter(day => day.status === 'absent').length, calls: total('calls'), xfer: total('xfer_count'),
    conversion: ratio(total('xfer_count'), total('calls')),
    share: ratio(total('xfer_count'), observed.reduce((sum, day) => sum + day.groupXfer, 0)),
    best: extremes(false), lowest: extremes(true), zeroDays: active.filter(day => day.row.xfer_count === 0).length,
    topThree: active.filter(day => day.rank <= 3).length, first: active.filter(day => day.rank === 1).length }
}
export function compareAgentDays(later, earlier) {
  if (later?.status !== 'observed' || earlier?.status !== 'observed') return null
  return { calls: later.row.calls - earlier.row.calls, xfer: later.row.xfer_count - earlier.row.xfer_count,
    conversionPoints: later.conversion !== null && earlier.conversion !== null ? later.conversion - earlier.conversion : null,
    sameGroup: later.group === earlier.group }
}
export async function loadAgentJourney(client, scope, end, count, code, { current = () => true, progress = () => {} } = {}) {
  const dates = historyDates(end, count), days = new Array(count)
  let next = 0, complete = 0, error = null
  async function worker() {
    while (current() && !error && next < dates.length) {
      const index = next++
      let timer
      const result = await Promise.race([loadDashboardReport(client, scope, dates[index]), new Promise(resolve => {
        timer = setTimeout(() => resolve({ error: { code: 'timeout' } }), 20000)
      })])
      clearTimeout(timer)
      if (!current()) return
      if (result.error) { if (!error || result.error.code === 'access_denied') error = result.error; return }
      days[index] = agentDay(result.data, code)
      progress(++complete, count)
    }
  }
  // On-demand only; no scheduled polling, raw table queries or persistent cache.
  await Promise.all(Array.from({ length: 3 }, worker))
  if (!current()) return { cancelled: true }
  if (error) return { error: { code: error.code, message: error.code === 'access_denied'
    ? 'Access to this history is unavailable. No historical figures are shown.'
    : 'History could not be verified completely. Reload to try again; no partial totals are shown.' } }
  return { days }
}
