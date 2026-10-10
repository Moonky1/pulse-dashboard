import { integer, PERFORMANCE_FIELDS, PAUSE_FIELDS, validDate } from './dashboardModel.js'

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
const invalid = { code: 'invalid_response', message: 'The report could not be verified. No figures have been replaced.' }
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v)
function counts(value) { return record(value) && Object.values(value).every(integer) }
function unique(rows) { return new Set(rows.map(r => r.agent_code)).size === rows.length }
function identity(row) { return record(row) && typeof row.agent_code === 'string' && /^\d{1,32}$/.test(row.agent_code) && typeof row.vici_user_name === 'string' }
export function dashboardError(error) {
  if (['42501', '28000', 'PGRST301', 'PGRST302', 'PGRST303'].includes(error?.code) || [401, 403].includes(error?.status)) return { code: 'access_denied', message: 'Your account does not have access to this report. Contact your Pulse administrator.' }
  return { code: 'unavailable', message: 'Pulse could not refresh this report. Any previously loaded snapshot is kept below.' }
}
export function normalizeScopes(value) {
  if (!Array.isArray(value) || !value.every(s => record(s) && UUID.test(s.id) && typeof s.label === 'string' && Array.isArray(s.user_groups) && s.user_groups.every(g => typeof g === 'string'))) throw invalid
  return value.map(s => ({ id: s.id, label: s.label, user_groups: s.user_groups, source_time_zone: typeof s.source_time_zone === 'string' ? s.source_time_zone : null }))
}
export function normalizeReport(value, scope, date) {
  if (!record(value) || value.scope?.id !== scope || value.date !== date || !record(value.health) || !Array.isArray(value.performance) || !Array.isArray(value.pause)) throw invalid
  if (!value.performance.every(r => identity(r) && ['calls', 'xfer_count', ...PERFORMANCE_FIELDS].every(k => integer(r[k])) && counts(r.dispositions) && r.dispositions.XFER === r.xfer_count) || !unique(value.performance)) throw invalid
  if (!value.pause.every(r => identity(r) && ['total_seconds', 'nonpause_seconds', 'pause_seconds', ...PAUSE_FIELDS.map(([key]) => key)].every(k => integer(r[k])) && counts(r.other_pause_seconds)) || !unique(value.pause)) throw invalid
  if (value.snapshot === null && (value.performance.length || value.pause.length)) throw invalid
  if (value.snapshot !== null && (!record(value.snapshot) || !UUID.test(value.snapshot.id) || !Number.isFinite(Date.parse(value.snapshot.captured_at)))) throw invalid
  return value
}
export async function loadDashboardScopes(client) {
  try {
    const { data, error } = await client.rpc('list_vici_dashboard_scopes')
    if (error) return { data: null, error: dashboardError(error) }
    return { data: normalizeScopes(data), error: null }
  } catch (error) { return { data: null, error: error === invalid ? invalid : dashboardError(error) } }
}
export async function loadDashboardReport(client, scope, date) {
  if (!UUID.test(scope || '') || !validDate(date)) return { data: null, error: { code: 'invalid_request', message: 'Choose a valid scope and report date.' } }
  try {
    const { data, error } = await client.rpc('get_vici_dashboard', { requested_scope: scope, report_date: date })
    if (error) return { data: null, error: dashboardError(error) }
    return { data: normalizeReport(data, scope, date), error: null }
  } catch (error) { return { data: null, error: error === invalid ? invalid : dashboardError(error) } }
}
