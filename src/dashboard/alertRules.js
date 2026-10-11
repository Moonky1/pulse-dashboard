import { integer, groupName } from './dashboardModel.js'
import { dashboardError } from './dashboardApi.js'

export const ALERT_METRICS = [
  { id: 'talk_avg', label: 'Talk Avg', source: 'performance', field: 'talk_avg_seconds', comparison: 'below' },
  { id: 'dead_avg', label: 'Dead Avg', source: 'performance', field: 'dead_avg_seconds', comparison: 'above' },
  { id: 'dispo_avg', label: 'Dispo Avg', source: 'performance', field: 'dispo_avg_seconds', comparison: 'above' },
  { id: 'break', label: 'Break', source: 'pause', field: 'break_seconds', comparison: 'above' },
  { id: 'callback', label: 'Callback', source: 'pause', field: 'cb_seconds', comparison: 'above' },
  { id: 'lunch', label: 'Lunch', source: 'pause', field: 'lunch_seconds', comparison: 'above' },
  { id: 'rr', label: 'RR', source: 'pause', field: 'rr_seconds', comparison: 'above' },
  { id: 'tech', label: 'Tech', source: 'pause', field: 'tech_seconds', comparison: 'above' },
]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const defaultAlertRules = () => ALERT_METRICS.map(({ id }) => ({ id, enabled: false, threshold_seconds: null }))
export function validAlertRules(rules) {
  return Array.isArray(rules) && rules.length === ALERT_METRICS.length && new Set(rules.map(r => r?.id)).size === rules.length && rules.every(r => r &&
    Object.keys(r).length === 3 && ALERT_METRICS.some(m => m.id === r.id) && typeof r.enabled === 'boolean' &&
    (r.threshold_seconds === null ? !r.enabled : integer(r.threshold_seconds) && r.threshold_seconds <= 31536000))
}
export function normalizeAlertConfig(data, scope) {
  if (!data || data.scope_id !== scope || data.schema_version !== 1 || !integer(data.revision) || data.revision > 2147483646 ||
    typeof data.can_manage !== 'boolean' || !validAlertRules(data.rules) ||
    (data.revision === 0 ? data.changed_at !== null || data.changed_by_name !== null || data.rules.some(r => r.enabled || r.threshold_seconds !== null) :
      !Number.isFinite(Date.parse(data.changed_at)) || typeof data.changed_by_name !== 'string')) throw Error('Invalid alert configuration')
  return data
}
function alertError(error, saving) {
  if (error?.code === '40001') return { error: 'Another administrator changed these rules. Reload the configuration before saving again.', code: 'conflict' }
  if (dashboardError(error).code === 'access_denied') return { error: 'Your account cannot access or change these alert rules.', code: 'access_denied' }
  return { error: saving ? 'Save could not be confirmed. Reload the configuration before trying again.' : 'Alert rules could not be verified. No alert results are shown.', code: 'unavailable' }
}
export async function loadAlertConfig(client, scope) {
  if (!UUID.test(scope || '')) return alertError(null, false)
  try {
    const { data, error } = await client.rpc('get_vici_alert_rules', { requested_scope: scope })
    if (error) throw error
    return { data: normalizeAlertConfig(data, scope) }
  } catch (error) { return alertError(error, false) }
}
export async function saveAlertConfig(client, scope, revision, rules) {
  if (!UUID.test(scope || '') || !integer(revision) || revision > 2147483646 || !validAlertRules(rules)) return { error: 'Enter whole seconds from 0 to 31,536,000 for every enabled rule.', code: 'invalid' }
  try {
    const { data, error } = await client.rpc('save_vici_alert_rules', { requested_scope: scope, expected_revision: revision, requested_rules: rules })
    if (error) throw error
    return { data: normalizeAlertConfig(data, scope) }
  } catch (error) { return alertError(error, true) }
}
export async function loadAlertHistory(client, scope, before = null) {
  if (!UUID.test(scope || '') || (before !== null && (!integer(before) || before < 1))) return alertError(null, false)
  try {
    const { data, error } = await client.rpc('list_vici_alert_rule_history', { requested_scope: scope, before_revision: before })
    if (error) throw error
    if (!Array.isArray(data) || data.length > 20 || data.some((v, i) => !integer(v.revision) || v.revision < 1 ||
      (before !== null && v.revision >= before) || (i > 0 && v.revision >= data[i - 1].revision) || !validAlertRules(v.rules) ||
      !Number.isFinite(Date.parse(v.changed_at)) || typeof v.changed_by_name !== 'string')) throw Error('Invalid history')
    return { rows: data }
  } catch (error) { return alertError(error, false) }
}
// Presentation only: evaluate the authorized snapshot, never fetch or widen report access.
export function evaluateAlerts(report, config) {
  if (!report?.snapshot || !config || report.scope.id !== config.scope_id || !validAlertRules(config.rules)) return []
  const performance = new Map(report.performance.map(r => [r.agent_code, r])), pauses = new Map(report.pause.map(r => [r.agent_code, r]))
  const codes = [...new Set([...performance.keys(), ...pauses.keys()])].sort()
  return codes.map(code => {
    const identity = performance.get(code) || pauses.get(code)
    const checks = config.rules.filter(r => r.enabled).map(rule => {
      const metric = ALERT_METRICS.find(m => m.id === rule.id)
      const row = (metric.source === 'performance' ? performance : pauses).get(code)
      const value = row?.[metric.field]
      const reason = !row ? 'This agent is absent from the required source report.' : !integer(value) ? 'The source metric is missing or invalid.' :
        metric.source === 'performance' && (!integer(row.calls) || row.calls === 0) ? 'No reported calls: a per-call average cannot be evaluated.' : null
      const triggered = !reason && (metric.comparison === 'below' ? value < rule.threshold_seconds : value > rule.threshold_seconds)
      return { ...metric, threshold: rule.threshold_seconds, value: reason ? null : value, state: reason ? 'unavailable' : triggered ? 'triggered' : 'within', reason,
        group: row ? groupName(row) : groupName(identity) }
    })
    return { code, name: identity.vici_user_name, group: groupName(identity), checks }
  })
}
