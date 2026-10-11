import { dashboardError } from './dashboardApi.js'
import { integer, validDate } from './dashboardModel.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const RETENTION_REASONS = {
  recent_detail: ['retain', 'All cuts within the most recent 7 dates'],
  daily_close: ['retain', 'Last valid pair for this date, within 90 dates'],
  intermediate_cut: ['candidate', 'Older intermediate cut; daily closing pair retained'],
  expired_day: ['candidate', 'Outside the 90-date window'],
  active_run: ['protected', 'Running or referenced by the active collector lease'],
  future_date: ['protected', 'Report date is after the simulation date'],
  incomplete_pair: ['protected', 'Partial range or incomplete pair needs review'],
  latest_success: ['protected', 'Latest successful pair for this scope is always protected'],
  duplicate_reference: ['protected', 'Duplicate audit records still reference this version'],
  audit_metadata: ['metadata', 'Failed/duplicate metadata is outside this cleanup preview'],
}
export function normalizeRetention(data, scope, date, offset) {
  if (!data || data.scope_id !== scope || data.as_of_date !== date || data.offset !== offset ||
    data.dry_run !== true || data.deletion_enabled !== false || data.policy?.detail_days !== 7 || data.policy?.daily_days !== 90 ||
    !validDate(data.policy.recent_from) || !validDate(data.policy.daily_from) ||
    typeof data.more !== 'boolean' || !data.totals || !['versions', 'retain', 'candidates', 'protected', 'metadata'].every(k => integer(data.totals[k])) ||
    data.totals.versions !== data.totals.retain + data.totals.candidates + data.totals.protected + data.totals.metadata ||
    !Array.isArray(data.rows) || data.rows.length > 100 || new Set(data.rows.map(r => r.id)).size !== data.rows.length ||
    data.rows.some(r => !UUID.test(r.id) || !validDate(r.report_date) || !RETENTION_REASONS[r.reason] || RETENTION_REASONS[r.reason][0] !== r.decision ||
      !['running', 'success', 'failed', 'duplicate'].includes(r.status) ||
      !['performance_rows', 'pause_rows'].every(k => r[k] === null || integer(r[k])))) throw Error('Invalid retention preview')
  return data
}
export async function loadRetention(client, scope, date, offset = 0) {
  if (!UUID.test(scope || '') || !validDate(date) || date < '1900-01-01' || date > '2200-12-31' || !integer(offset) || offset > 1000000) return { error: 'Choose a valid simulation date (1900–2200).' }
  try {
    const { data, error } = await client.rpc('preview_vici_retention', { requested_scope: scope, as_of_date: date, page_offset: offset })
    if (error) throw error
    return { data: normalizeRetention(data, scope, date, offset) }
  } catch (error) {
    return { error: dashboardError(error).code === 'access_denied' ? 'Your account cannot preview retention for this scope.' : 'The retention preview could not be verified. No data was changed.' }
  }
}
