// Scheduled server endpoint: no CORS, no browser auth, no arbitrary target URLs.
import { collectViciScope, viciRepository } from '../_shared/viciCollector.mjs'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function sameSecret(left, right) {
  const digest = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const [a, b] = await Promise.all([digest(left), digest(right)])
  const aa = new Uint8Array(a), bb = new Uint8Array(b)
  let difference = 0
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i]
  return difference === 0
}
export function createViciCollectorHandler({ env, createClient, collect = collectViciScope }) {
  return async request => {
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    } })
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' })
    const service = env('SUPABASE_SERVICE_ROLE_KEY')
    const expected = env('VICI_COLLECTOR_TOKEN')
    const token = request.headers.get('x-pulse-vici-token') || ''
    // The platform JWT check remains enabled. A separate collector-only secret
    // avoids comparing a platform-managed internal service token byte for byte.
    if (!service || !expected || expected.length < 32 || token.length > 512 ||
      !request.headers.get('authorization')?.startsWith('Bearer ') || !await sameSecret(token, expected)) {
      return reply(401, { error: 'request_denied' })
    }
    // Reject browser-origin requests even if someone mistakenly configures its transport.
    if (request.headers.has('origin')) return reply(403, { error: 'request_denied' })
    if (Number(request.headers.get('content-length')) > 1024) return reply(413, { error: 'invalid_request' })
    let body
    try {
      const reader = request.body?.getReader()
      if (!reader) return reply(400, { error: 'invalid_request' })
      let bytes = 0, text = ''
      const decoder = new TextDecoder()
      try {
        while (true) {
          const chunk = await reader.read()
          if (chunk.done) break
          bytes += chunk.value.byteLength
          if (bytes > 1024) return reply(413, { error: 'invalid_request' })
          text += decoder.decode(chunk.value, { stream: true })
        }
        body = JSON.parse(text + decoder.decode())
      } finally { await reader.cancel(); reader.releaseLock() }
      if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some(key => !['scopeId', 'reportDate'].includes(key)) || !uuid.test(body.scopeId || '') ||
        body.reportDate !== undefined && (typeof body.reportDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.reportDate))) {
        return reply(400, { error: 'invalid_request' })
      }
    } catch { return reply(400, { error: 'invalid_request' }) }
    try {
      const url = env('SUPABASE_URL')
      if (!url) return reply(503, { error: 'service_unavailable' })
      const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
      const result = await collect({
        scopeId: body.scopeId, reportDate: body.reportDate, repository: viciRepository(admin),
        source: { key: env('VICI_SOURCE_KEY'), baseUrl: env('VICI_BASE_URL'), user: env('VICI_REPORT_USER'), password: env('VICI_REPORT_PASSWORD') },
      })
      return reply(result.status === 'unavailable' || result.status === 'failed' ? 503 : 200, result)
    } catch { return reply(503, { error: 'service_unavailable' }) }
  }
}
