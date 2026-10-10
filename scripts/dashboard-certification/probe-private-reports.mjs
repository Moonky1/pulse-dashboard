// Read-only direct HTTPS proof. Credentials are read privately, never printed.
// No CSV bodies, agent identities, auth headers or raw errors are persisted.
import { readFile } from 'node:fs/promises'
import { parseEnv } from 'node:util'
import { createViciReportClient } from '../../supabase/functions/_shared/viciReportClient.mjs'

const [configPath, reportDate] = process.argv.slice(2)
if (!configPath || !reportDate || process.argv.length !== 4 || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
  console.error('Usage: npm run dashboard:probe -- <private-env-file> <YYYY-MM-DD>')
  process.exit(1)
}

try {
  const env = parseEnv(await readFile(configPath, 'utf8'))
  const required = ['VICI_BASE_URL', 'VICI_REPORT_USER', 'VICI_REPORT_PASSWORD', 'VICI_REPORT_CAMPAIGNS', 'VICI_REPORT_USER_GROUPS']
  const missing = required.filter(key => !env[key])
  if (missing.length) {
    console.error(JSON.stringify({ proof: 'not_run', category: 'missing_private_configuration', fields: missing }))
    process.exitCode = 1
  } else {
    const client = createViciReportClient({
      baseUrl: env.VICI_BASE_URL, user: env.VICI_REPORT_USER, password: env.VICI_REPORT_PASSWORD,
      sourceTimeZone: env.VICI_SOURCE_TIME_ZONE || null,
    })
    const range = { from: `${reportDate} 00:00:00`, to: `${reportDate} 23:59:59` }
    const result = await client.readPair({ range, scope: {
      campaigns: env.VICI_REPORT_CAMPAIGNS.split(',').map(value => value.trim()),
      userGroups: env.VICI_REPORT_USER_GROUPS.split(',').map(value => value.trim()),
    } })
    const summary = report => ({
      rows: report.rows.length, declaredAgents: report.totals?.agent_count ?? null,
      additiveComparisons: report.comparisons.length,
      allAdditiveTotalsMatch: report.comparisons.every(value => value.matches),
      sourceGeneratedAt: report.source_generated_at, sourceTimeZone: report.source_time_zone,
      requestedRange: report.requested_range, sourceRange: report.source_range,
      ingestedAt: report.ingested_at, warningCategories: [...new Set(report.warnings.map(value => value.category))],
    })
    console.log(JSON.stringify({ proof: 'direct_server_http', performance: summary(result.performance), pause: summary(result.pause), pairWarnings: result.warnings, rawSourcePersisted: false, browserSessionUsed: false }, null, 2))
  }
} catch (error) {
  console.error(JSON.stringify({ proof: 'failed', category: error.category ?? 'private_probe_failed', requiresIpValidation: error.requires_ip_validation === true, retryAfterSeconds: error.retry_after_seconds ?? null }))
  process.exitCode = 1
}
