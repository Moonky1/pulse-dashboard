// Server-only orchestration. A lease and cooldown are acquired before any Vici HTTP.
import { PERFORMANCE_DURATIONS, PAUSE_DURATIONS } from './viciReportParsers.mjs'
import { createViciReportClient } from './viciReportClient.mjs'

const identities = ['agent_code', 'vici_user_name', 'current_user_group', 'most_recent_user_group']
const failures = new Set(['authentication_failed', 'access_denied', 'requires_ip_validation', 'unexpected_redirect',
  'rate_limited', 'source_unavailable', 'source_network_error', 'request_timeout', 'source_http_error'])
const warnings = new Set(['unnamed_columns', 'extra_disposition_columns', 'extra_pause_columns', 'missing_totals',
  'totals_mismatch', 'unmapped_totals_not_comparable', 'report_agent_sets_differ'])
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key]]))
export function normalizedViciPair(pair) {
  const performance = [...identities, 'calls', ...Object.values(PERFORMANCE_DURATIONS), 'xfer_count', 'dispositions', 'unmapped_columns']
  const pause = [...identities, ...Object.values(PAUSE_DURATIONS), 'other_pause_seconds', 'unmapped_columns']
  const report = (value, fields) => ({
    source_generated_at: value.source_generated_at, ingested_at: value.ingested_at,
    rows: value.rows.map(row => pick(row, fields)),
  })
  return {
    performance: report(pair.performance, performance), pause: report(pair.pause, pause),
    warning_categories: [...new Set([...pair.performance.warnings, ...pair.pause.warnings, ...pair.warnings]
      .map(value => value.category).filter(value => warnings.has(value)))].sort(),
  }
}

export function viciSourceDate(timeZone, now = new Date()) {
  if (typeof timeZone !== 'string' || !timeZone) throw new Error('confirmed_source_timezone_required')
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = name => parts.find(value => value.type === name).value
  return part('year') + '-' + part('month') + '-' + part('day')
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
}

export async function collectViciScope({ scopeId, reportDate, repository, source, now = () => new Date(), makeClient = createViciReportClient }) {
  let scope
  try { scope = await repository.scope(scopeId) } catch { return { status: 'unavailable', category: 'configuration_error' } }
  if (!scope || !scope.enabled || scope.source_key !== source?.key) return { status: 'unavailable', category: 'configuration_error' }
  let date = reportDate
  if (date === undefined) {
    try { date = viciSourceDate(scope.source_time_zone, now()) } catch { return { status: 'unavailable', category: 'confirmed_source_timezone_required' } }
  }
  if (!validDate(date)) return { status: 'unavailable', category: 'invalid_report_date' }
  let lease
  try { lease = await repository.begin(scopeId, date) } catch { return { status: 'unavailable', category: 'persistence_failed' } }
  if (!lease.acquired) return { status: 'skipped', halted: lease.halted === true }
  // Use the lease's immutable scope, never a request-body URL, campaign or credentials.
  let phase = 'configuration'
  try {
    if (lease.source_key !== source.key) throw new Error('source_mismatch')
    const client = makeClient({ baseUrl: source.baseUrl, user: source.user, password: source.password, sourceTimeZone: lease.source_time_zone })
    phase = 'read'
    const pair = await client.readPair({
      range: { from: date + ' 00:00:00', to: date + ' 23:59:59' },
      scope: { campaigns: lease.campaigns, userGroups: lease.user_groups, users: ['--ALL--'] },
    })
    phase = 'persist'
    const result = await repository.complete(lease.run_id, normalizedViciPair(pair))
    return { status: result.status, snapshotRunId: result.snapshot_run_id }
  } catch (error) {
    const category = phase === 'configuration' ? 'configuration_error' : phase === 'persist' ? 'persistence_failed'
      : failures.has(error?.category) ? error.category : 'invalid_report'
    const retry = Number.isInteger(error?.retry_after_seconds) ? Math.max(60, Math.min(86400, error.retry_after_seconds)) : 60
    try { await repository.fail(lease.run_id, category, retry) } catch { return { status: 'failed', category: 'persistence_failed' } }
    return { status: 'failed', category, requiresIpValidation: category === 'requires_ip_validation',
      ...(category === 'source_network_error' && ['tls_certificate', 'dns', 'connection_refused', 'connection_closed', 'network_unreachable', 'connection_timeout', 'unspecified'].includes(error?.network_reason)
        ? { networkReason: error.network_reason } : {}),
      ...(category === 'source_network_error' && ['connect', 'read_response', 'parse_response'].includes(error?.network_phase)
        ? { networkPhase: error.network_phase } : {}) }
  }
}

export function viciRepository(admin) {
  const rpc = async (name, args) => {
    const result = await admin.rpc(name, args)
    if (result.error) throw new Error('persistence_failed')
    return result.data
  }
  return {
    async scope(id) {
      const result = await admin.from('vici_report_scopes').select('id,source_key,source_time_zone,enabled').eq('id', id).maybeSingle()
      if (result.error) throw new Error('configuration_error')
      return result.data
    },
    begin: (scope, date) => rpc('begin_vici_sync', { requested_scope: scope, report_date: date }),
    complete: (run, pair) => rpc('complete_vici_sync', { requested_run: run, pair }),
    fail: (run, category, retry) => rpc('fail_vici_sync', { requested_run: run, category, retry_seconds: retry }),
  }
}
