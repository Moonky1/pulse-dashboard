import { normalizeReport, dashboardError } from './dashboardApi.js'
import { integer, PAUSE_FIELDS } from './dashboardModel.js'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const DELTA_FIELDS = [['calls', 'Calls'], ['xfer_count', 'XFER'], ['time_seconds', 'Time'], ['talk_seconds', 'Talk'], ['wait_seconds', 'Wait'], ['dispo_seconds', 'Dispo'], ['dead_seconds', 'Dead'], ['pause_seconds', 'Performance pause'], ['customer_seconds', 'Customer']]
export async function loadHistory(client, scope, date, offset = 0) {
  try {
    const { data, error } = await client.rpc('list_vici_report_history', { requested_scope: scope, report_date: date, page_offset: offset })
    if (error) throw error
    if (!Array.isArray(data) || data.length > 51 || data.some(r => !UUID.test(r.id) || !integer(r.agents) || !integer(r.calls) || !Number.isFinite(Date.parse(r.captured_at)))) throw Error('invalid_history')
    return { rows: data.slice(0, 50), more: data.length > 50 }
  } catch (error) { return { error: dashboardError(error).message } }
}
export async function loadSnapshot(client, scope, date, id) {
  try {
    if (!UUID.test(id || '')) throw Error('invalid_snapshot')
    const { data, error } = await client.rpc('get_vici_dashboard_snapshot', { requested_scope: scope, requested_snapshot: id })
    if (error) throw error
    if (data?.snapshot?.id !== id) throw Error('wrong_snapshot')
    return { data: normalizeReport(data, scope, date) }
  } catch (error) { return { error: dashboardError(error).message } }
}
const difference = (a, b) => integer(a) && integer(b) ? b - a : null
function mapDifference(a = {}, b = {}) {
  return Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].sort().map(key => [key, difference(a[key], b[key])]))
}
export function compareSnapshots(before, after) {
  if (before.scope.id !== after.scope.id || before.date !== after.date || before.snapshot.id === after.snapshot.id) throw Error('Choose two different versions of the same scope and date.')
  for (const key of ['performance_generated_at', 'pause_generated_at']) {
    const a = before.snapshot[key]?.replace('T', ' '), b = after.snapshot[key]?.replace('T', ' ')
    if (!a || !b || b < a) throw Error('The comparison version must not be older than the baseline in either report.')
  }
  const oldRows = new Map(before.performance.map(r => [r.agent_code, r]))
  const newRows = new Map(after.performance.map(r => [r.agent_code, r]))
  const oldPause = new Map(before.pause.map(r => [r.agent_code, r]))
  const newPause = new Map(after.pause.map(r => [r.agent_code, r]))
  return [...new Set([...oldRows.keys(), ...newRows.keys()])].sort().map(code => {
    const a = oldRows.get(code), b = newRows.get(code), pa = oldPause.get(code), pb = newPause.get(code)
    const metrics = Object.fromEntries(DELTA_FIELDS.map(([key]) => [key, difference(a?.[key], b?.[key])]))
    const pauses = Object.fromEntries([['total_seconds'], ['nonpause_seconds'], ['pause_seconds'], ...PAUSE_FIELDS].map(([key]) => [key, difference(pa?.[key], pb?.[key])]))
    const dispositions = mapDifference(a?.dispositions, b?.dispositions)
    const otherPauses = mapDifference(pa?.other_pause_seconds, pb?.other_pause_seconds)
    const unnamedPauses = mapDifference(pa?.unmapped_columns, pb?.unmapped_columns)
    return { code, name: (b || a).vici_user_name, status: !a ? 'Added' : !b ? 'Not in later report' : 'Matched',
      decreased: [...Object.values(metrics), ...Object.values(pauses), ...Object.values(dispositions), ...Object.values(otherPauses), ...Object.values(unnamedPauses)].some(v => v !== null && v < 0),
      metrics, pauses, dispositions, otherPauses, unnamedPauses }
  })
}
