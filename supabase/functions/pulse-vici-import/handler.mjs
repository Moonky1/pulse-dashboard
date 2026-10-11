import { inspectManualReports } from '../_shared/viciManualImport.mjs'

export const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_BODY = MAX_FILE_BYTES * 2 + 65536
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const safeErrors = new Set(['report_date_mismatch', 'missing_totals', 'totals_mismatch', 'report_group_mismatch', 'report_agent_sets_differ', 'report_too_large'])
export function createViciImportHandler({ env, createClient, inspect = inspectManualReports }) {
  const origins = new Set((env('PULSE_VICI_IMPORT_ALLOWED_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean))
  return async request => {
    const origin = request.headers.get('origin') || ''
    const reply = (status, value) => Response.json(value, { status, headers: {
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin',
      ...(origins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Headers': 'authorization,apikey,x-client-info,content-type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    } })
    if (!origins.has(origin)) return reply(403, { error: 'origin_not_allowed' })
    if (request.method === 'OPTIONS') return reply(200, { ok: true })
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' })
    const authorization = request.headers.get('authorization') || ''
    if (!authorization.startsWith('Bearer ')) return reply(401, { error: 'sign_in_required' })
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return reply(400, { error: 'invalid_upload' })
    if (Number(request.headers.get('content-length')) > MAX_BODY) return reply(413, { error: 'report_too_large' })
    try {
      const url = env('SUPABASE_URL'), anon = env('SUPABASE_ANON_KEY'), service = env('SUPABASE_SERVICE_ROLE_KEY')
      if (!url || !anon || !service) return reply(503, { error: 'import_unavailable' })
      const options = { auth: { persistSession: false, autoRefreshToken: false } }
      const user = createClient(url, anon, { ...options, global: { headers: { Authorization: authorization } } })
      const { data: verified, error: authError } = await user.auth.getUser()
      if (authError || !verified?.user?.id) return reply(401, { error: 'sign_in_required' })
      // Authorize before reading potentially large files. Scopes come from the
      // existing protected RPC, not role claims or browser-supplied permissions.
      const { data: scopes, error: scopeError } = await user.rpc('list_vici_dashboard_scopes')
      if (scopeError || !Array.isArray(scopes) || !scopes.some(s => s.can_import === true)) return reply(403, { error: 'import_denied' })
      const reader = request.body?.getReader()
      if (!reader) return reply(400, { error: 'invalid_upload' })
      const chunks = []; let bytes = 0
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          bytes += value.byteLength
          if (bytes > MAX_BODY) return reply(413, { error: 'report_too_large' })
          chunks.push(value)
        }
      } finally { await reader.cancel(); reader.releaseLock() }
      let form
      try { form = await new Response(new Blob(chunks), { headers: { 'Content-Type': request.headers.get('content-type') } }).formData() }
      catch { return reply(400, { error: 'invalid_upload' }) }
      const fields = ['scopeId', 'reportDate', 'confirmedScope', 'performance', 'pause']
      if ([...form.keys()].some(key => !fields.includes(key)) || fields.some(key => form.getAll(key).length !== 1) ||
        form.get('confirmedScope') !== 'yes') return reply(400, { error: 'invalid_upload' })
      const scopeId = form.get('scopeId'), reportDate = form.get('reportDate')
      const scope = scopes.find(s => s.id === scopeId && s.can_import === true)
      if (typeof scopeId !== 'string' || !UUID.test(scopeId) || !scope) return reply(403, { error: 'import_denied' })
      if (typeof reportDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return reply(400, { error: 'invalid_upload' })
      const files = [form.get('performance'), form.get('pause')]
      if (files.some(f => !(f instanceof File) || !/\.csv$/i.test(f.name) || !f.size)) return reply(400, { error: 'invalid_upload' })
      if (files.some(f => f.size > MAX_FILE_BYTES)) return reply(413, { error: 'report_too_large' })
      let prepared
      try {
        const texts = await Promise.all(files.map(async f => new TextDecoder('utf-8', { fatal: true }).decode(await f.arrayBuffer())))
        prepared = inspect({ performanceText: texts[0], pauseText: texts[1], reportDate, userGroups: scope.user_groups })
      } catch (error) { return reply(422, { error: safeErrors.has(error?.category) ? error.category : 'invalid_report' }) }
      const admin = createClient(url, service, options)
      const { data, error } = await admin.rpc('import_vici_reports', {
        requested_scope: scopeId, report_date: reportDate, actor_auth_id: verified.user.id,
        pair: prepared.pair, verification: prepared.verification,
      })
      if (error) return reply(error.code === '42501' ? 403 : error.code === 'P0001' ? 429 : 409,
        { error: error.code === '42501' ? 'import_denied' : error.code === 'P0001' ? 'import_cooldown' : 'import_conflict' })
      return reply(200, { ...data, agents: prepared.verification.performance.agents })
    } catch { return reply(503, { error: 'import_unavailable' }) }
  }
}
