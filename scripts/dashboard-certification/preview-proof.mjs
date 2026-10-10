// Explicitly targeted Preview proof; never accepts a Production project argument.
import { spawnSync } from 'node:child_process'
import { parseEnv } from 'node:util'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'
const project = 'sgshbawggqapuyqzkyhs'
const reportDate = process.argv[2]
if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate || '')) throw new Error('An explicit source date is required')
const config = parseEnv(readFileSync('.env.vici-report.local', 'utf8'))
const lookup = spawnSync('cmd.exe', ['/d', '/c', 'npx', '--no-install', 'supabase', 'projects', 'api-keys', '--project-ref', project, '--output', 'json'],
  { encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024 })
if (lookup.status !== 0) throw new Error('Preview key lookup failed; no key output printed')
const keys = JSON.parse(lookup.stdout)
const service = keys.find(entry => entry.name === 'service_role')?.api_key
const anonymous = keys.find(entry => entry.name === 'anon')?.api_key
for (const [key, role] of [[service, 'service_role'], [anonymous, 'anon']]) {
  const claims = JSON.parse(Buffer.from(key?.split('.')[1] || '', 'base64url'))
  if (claims.ref !== project || claims.role !== role) throw new Error('Unexpected Preview key scope')
}
const url = 'https://' + project + '.supabase.co'
// Domain-separated server credential: reproducible privately for the future
// scheduler, not useful as a Supabase DB key. Never print it or send to React.
const collectorToken = createHmac('sha256', service).update('pulse-vici-collector:' + project).digest('hex')
if (process.argv.includes('--configure-collector-token')) {
  const configured = spawnSync('cmd.exe', ['/d', '/c', 'npx', '--no-install', 'supabase', 'secrets', 'set',
    'VICI_COLLECTOR_TOKEN=' + collectorToken, '--project-ref', project], { encoding: 'utf8', windowsHide: true })
  if (configured.status !== 0) throw new Error('Preview collector token configuration failed; values suppressed')
}
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
const desired = { code: 'garrett-openers-preview', label: 'OpenersAsia · VICIdial', source_key: 'alwaysbeclosing',
  campaigns: config.VICI_REPORT_CAMPAIGNS.split(',').map(v => v.trim()), user_groups: config.VICI_REPORT_USER_GROUPS.split(',').map(v => v.trim()),
  source_time_zone: null, enabled: true }
let scope = await admin.from('vici_report_scopes').select('id,source_key,campaigns,user_groups,source_time_zone').eq('code', desired.code).maybeSingle()
if (scope.error) throw new Error('Preview scope lookup failed')
if (!scope.data) {
  scope = await admin.from('vici_report_scopes').insert(desired).select('id,source_key,campaigns,user_groups,source_time_zone').single()
  if (scope.error) throw new Error('Preview scope creation failed')
}
for (const key of ['source_key', 'campaigns', 'user_groups', 'source_time_zone']) {
  if (JSON.stringify(scope.data[key]) !== JSON.stringify(desired[key])) throw new Error('Existing Preview scope differs; review required')
}
const endpoint = url + '/functions/v1/pulse-vici-collector'
const body = JSON.stringify({ scopeId: scope.data.id, reportDate })
const denied = await fetch(endpoint, { method: 'POST', headers: { Authorization: 'Bearer ' + anonymous, apikey: anonymous, 'Content-Type': 'application/json' }, body })
if (![401, 403].includes(denied.status)) throw new Error('Anonymous collector access was not denied')
await denied.body?.cancel()
console.log(JSON.stringify({ project, anonymousCollectorDenied: denied.status, sourceTimezoneConfirmed: false, scheduleCreated: false }))
const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: 'Bearer ' + service, apikey: service, 'x-pulse-vici-token': collectorToken, 'Content-Type': 'application/json' }, body,
  signal: AbortSignal.timeout(85000) })
let result
try { result = await response.json() } catch { throw new Error('Preview collector returned an unrecognized response') }
const allowed = new Set(['success', 'duplicate', 'skipped', 'failed', 'unavailable'])
if (!allowed.has(result.status)) {
  console.log(JSON.stringify({ status: response.status, proof: 'collector_gateway_or_runtime_failure',
    category: result.message === 'Invalid JWT' ? 'gateway_invalid_jwt' : result.error === 'request_denied' ? 'handler_request_denied' : 'unclassified_gateway_response',
    executionStarted: response.headers.has('x-deno-execution-id') }))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({ project, httpStatus: response.status, status: result.status,
    category: ['authentication_failed','access_denied','requires_ip_validation','unexpected_redirect','rate_limited','source_unavailable','source_network_error','request_timeout','source_http_error','invalid_report','persistence_failed','configuration_error'].includes(result.category) ? result.category : undefined,
    requiresIpValidation: result.requiresIpValidation === true, halted: result.halted === true, snapshotRunId: result.snapshotRunId,
    networkReason: ['tls_certificate','dns','connection_refused','connection_closed','network_unreachable','connection_timeout','unspecified'].includes(result.networkReason) ? result.networkReason : undefined,
    networkPhase: ['connect','read_response','parse_response'].includes(result.networkPhase) ? result.networkPhase : undefined }))
  if (!['success', 'duplicate'].includes(result.status)) process.exitCode = 1
}
