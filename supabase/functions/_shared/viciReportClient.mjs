// Server-only HTTPS client. Never import into React, expose config, or log fetch errors.
import { classifyReportResponse, parseAgentPerformance, parsePauseBreakdown, ViciReportError } from './viciReportParsers.mjs'

const REPORT_PATH = '/vicidial/AST_agent_performance_detail.php'
const MAX_BYTES = 5 * 1024 * 1024
const EXPORTS = Object.freeze({ performance: '1', pause: '2' })
const OPTIONS = ['show_percentages', 'live_agents', 'time_in_sec', 'search_archived_data', 'show_defunct_users', 'breakdown_by_date']

export class ViciClientError extends Error {
  constructor(category, { retryAfterSeconds = null, networkReason = null, networkPhase = null } = {}) {
    super(category)
    this.name = 'ViciClientError'
    this.category = category
    this.requires_ip_validation = category === 'requires_ip_validation'
    this.retry_after_seconds = retryAfterSeconds
    this.network_reason = networkReason
    this.network_phase = networkPhase
  }
}

const fail = (category, options) => { throw new ViciClientError(category, options) }

function networkReason(error) {
  // Inspect privately and return only a fixed enum, never the message/URL/cause.
  const diagnostic = String(error?.cause?.code ?? error?.code ?? '') + ' ' + String(error?.message ?? '')
  if (/certificate|UnknownIssuer|CertExpired|CERT_|TLS handshake/i.test(diagnostic)) return 'tls_certificate'
  if (/ENOTFOUND|EAI_AGAIN|failed to lookup address|name or service not known|dns error/i.test(diagnostic)) return 'dns'
  if (/ECONNREFUSED|connection refused/i.test(diagnostic)) return 'connection_refused'
  if (/ECONNRESET|connection reset|connection closed|unexpected end|unexpected eof/i.test(diagnostic)) return 'connection_closed'
  if (/ENETUNREACH|network is unreachable/i.test(diagnostic)) return 'network_unreachable'
  if (/ETIMEDOUT|timed out/i.test(diagnostic)) return 'connection_timeout'
  return 'unspecified'
}

function origin(value) {
  let parsed
  try { parsed = new URL(value) } catch { fail('invalid_base_url') }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || (parsed.port && parsed.port !== '443')) fail('invalid_base_url')
  return parsed.origin
}

function dateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} [0-2]\d:[0-5]\d:[0-5]\d$/.test(value)) fail('invalid_requested_range')
  const parsed = new Date(value.replace(' ', 'T') + 'Z')
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 19).replace('T', ' ') !== value) fail('invalid_requested_range')
  return value
}

function selection(values) {
  if (!Array.isArray(values) || !values.length || values.length > 100) fail('invalid_report_scope')
  const hasControlCharacter = value => Array.from(value).some(character => character.codePointAt(0) < 32 || character.codePointAt(0) === 127)
  if (values.some(value => typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > 100 || hasControlCharacter(value))) fail('invalid_report_scope')
  const result = [...new Set(values)].sort()
  if (result.includes('--ALL--') && result.length > 1) fail('invalid_report_scope')
  return result
}

function requestSpec({ range, scope } = {}) {
  const from = dateTime(range?.from), to = dateTime(range?.to)
  if (from > to || from.slice(0, 10) !== to.slice(0, 10)) fail('invalid_requested_range')
  return {
    range: { from, to },
    scope: { campaigns: selection(scope?.campaigns), userGroups: selection(scope?.userGroups), users: selection(scope?.users ?? ['--ALL--']) },
  }
}

// Reproduces DOWNLOAD links observed in the authenticated UI on 2026-10-09.
// All-campaign expansion is supplied by trusted server config, never hardcoded here.
export function buildViciReportUrl(baseUrl, reportType, request) {
  if (!Object.hasOwn(EXPORTS, reportType)) fail('invalid_report_type')
  const { range, scope } = requestSpec(request)
  const url = new URL(REPORT_PATH, origin(baseUrl))
  const params = url.searchParams
  params.set('query_date', range.from.slice(0, 10))
  params.set('end_date', range.to.slice(0, 10))
  params.set('query_time', range.from.slice(11))
  params.set('end_time', range.to.slice(11))
  for (const campaign of scope.campaigns) params.append('group[]', campaign)
  for (const group of scope.userGroups) params.append('user_group[]', group)
  for (const user of scope.users) params.append('users[]', user)
  params.set('shift', '--')
  params.set('DB', '0')
  for (const option of OPTIONS) params.set(option, '')
  params.set('report_display_type', 'TEXT')
  params.set('stage', '')
  params.set('file_download', EXPORTS[reportType])
  return url
}

function authorization(user, password) {
  if (typeof user !== 'string' || !user.trim() || /[:\r\n]/.test(user) || user.length > 256 || typeof password !== 'string' || !password.length || /[\r\n]/.test(password) || password.length > 4096) fail('missing_or_invalid_credentials')
  const bytes = new TextEncoder().encode(`${user}:${password}`)
  return 'Basic ' + btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
}

function validationRedirect(location, baseUrl) {
  if (!location) return false
  try {
    const target = new URL(location, baseUrl)
    return target.protocol === 'https:' && target.hostname === new URL(baseUrl).hostname && target.pathname === '/abc_validation.php'
  } catch { return false }
}

async function readBoundedBody(response, signal) {
  const declared = Number(response.headers.get('content-length'))
  if (declared > MAX_BYTES) { await response.body?.cancel(); fail('report_too_large') }
  if (!response.body) fail('empty_report')
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let size = 0, body = ''
  try {
    while (true) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) fail('report_too_large')
      body += decoder.decode(value, { stream: true })
    }
    return body + decoder.decode()
  } finally {
    try { await reader.cancel() } catch { /* Never expose network error messages. */ }
    reader.releaseLock()
  }
}

function retryAfter(response) {
  const value = response.headers.get('retry-after')
  if (value && /^\d+$/.test(value)) return Math.max(60, Math.min(86400, Number(value)))
  if (value && Number.isFinite(Date.parse(value))) return Math.max(60, Math.min(86400, Math.ceil((Date.parse(value) - Date.now()) / 1000)))
  return 60
}

export function createViciReportClient({ baseUrl, user, password, sourceTimeZone = null, timeoutMs = 30000 } = {}, { fetchImpl = globalThis.fetch, now = () => new Date().toISOString() } = {}) {
  const base = origin(baseUrl)
  const auth = authorization(user, password)
  if (typeof fetchImpl !== 'function' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) fail('invalid_client_configuration')
  if (sourceTimeZone !== null) {
    try { new Intl.DateTimeFormat('en', { timeZone: sourceTimeZone }).format() } catch { fail('invalid_source_time_zone') }
    if (typeof sourceTimeZone !== 'string' || !sourceTimeZone) fail('invalid_source_time_zone')
  }

  async function read(reportType, request) {
    const spec = requestSpec(request)
    const url = buildViciReportUrl(base, reportType, spec)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let networkPhase = 'connect'
    try {
      const response = await fetchImpl(url, {
        method: 'GET', redirect: 'manual', cache: 'no-store', signal: controller.signal,
        headers: { Accept: 'text/csv, text/plain, application/octet-stream', Authorization: auth },
      })
      networkPhase = 'read_response'
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel()
        fail(validationRedirect(response.headers.get('location'), base) ? 'requires_ip_validation' : 'unexpected_redirect')
      }
      if (response.status === 401) { await response.body?.cancel(); fail('authentication_failed') }
      if (response.status === 429) { await response.body?.cancel(); fail('rate_limited', { retryAfterSeconds: retryAfter(response) }) }
      if (response.status >= 500) { await response.body?.cancel(); fail('source_unavailable', { retryAfterSeconds: 60 }) }
      const body = await readBoundedBody(response, controller.signal)
      const classification = classifyReportResponse(body)
      if (classification === 'requires_ip_validation') fail(classification)
      if (response.status === 403) fail('access_denied')
      if (!response.ok) fail('source_http_error', { retryAfterSeconds: 60 })
      if (classification) fail(classification)
      if (/html/i.test(response.headers.get('content-type') ?? '')) fail('unexpected_html_response')
      networkPhase = 'parse_response'
      const parsed = (reportType === 'performance' ? parseAgentPerformance : parsePauseBreakdown)(body, { ingestedAt: now() })
      if (parsed.source_range.from !== spec.range.from || parsed.source_range.to !== spec.range.to) fail('source_range_mismatch')
      return { ...parsed, requested_range: spec.range, requested_scope: spec.scope, source_time_zone: sourceTimeZone }
    } catch (error) {
      if (controller.signal.aborted) fail('request_timeout', { retryAfterSeconds: 60 })
      if (error instanceof ViciClientError) throw error
      if (error instanceof ViciReportError) fail(error.category)
      // Fetch errors may contain full URLs or sensitive proxy details. Never retain causes.
      fail('source_network_error', { retryAfterSeconds: 60, networkReason: networkReason(error), networkPhase })
    } finally { clearTimeout(timer) }
  }

  return Object.freeze({
    read,
    async readPair(request) {
      // No automatic retry: failures stop this cycle. A scheduler must honor backoff
      // and pause until operator action for authentication/IP-validation failures.
      const performance = await read('performance', request)
      const pause = await read('pause', request)
      const sameIds = JSON.stringify(performance.rows.map(row => row.agent_code).sort()) === JSON.stringify(pause.rows.map(row => row.agent_code).sort())
      return { performance, pause, warnings: sameIds ? [] : [{ category: 'report_agent_sets_differ' }] }
    },
  })
}
