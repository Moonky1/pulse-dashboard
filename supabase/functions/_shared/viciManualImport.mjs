import { parseAgentPerformance, parsePauseBreakdown, ViciReportError } from './viciReportParsers.mjs'
import { normalizedViciPair } from './viciCollector.mjs'

const fail = category => { throw new ViciReportError(category) }
export function inspectManualReports({ performanceText, pauseText, reportDate, userGroups, ingestedAt = new Date().toISOString() }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate || '') || !Array.isArray(userGroups) || !userGroups.length) fail('invalid_import_scope')
  const performance = parseAgentPerformance(performanceText, { ingestedAt })
  const pause = parsePauseBreakdown(pauseText, { ingestedAt })
  for (const report of [performance, pause]) {
    if (report.source_range.from !== reportDate + ' 00:00:00' || report.source_range.to !== reportDate + ' 23:59:59') fail('report_date_mismatch')
    if (!report.totals) fail('missing_totals')
    if (!report.comparisons.every(item => item.matches)) fail('totals_mismatch')
    if (report.rows.some(row => !userGroups.includes(row.current_user_group))) fail('report_group_mismatch')
  }
  const ids = report => report.rows.map(row => row.agent_code).sort().join(',')
  if (ids(performance) !== ids(pause)) fail('report_agent_sets_differ')
  const summary = report => ({
    agents: report.rows.length, totals: report.totals,
    reconciled_fields: report.comparisons.length,
    warnings: report.warnings.map(w => w.category),
  })
  return {
    pair: normalizedViciPair({ performance, pause, warnings: [] }),
    verification: { performance: summary(performance), pause: summary(pause), scope_attested: true },
  }
}
