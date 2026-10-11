// Synthetic, local-only contract fixture. Never imported by the application.
import { testScope } from './ui-fixtures.mjs'
export function retentionFixture(date = '2026-10-10', offset = 0) {
  const from = days => new Date(Date.parse(date + 'T00:00:00Z') - days * 86400000).toISOString().slice(0, 10)
  return { scope_id: testScope.id, as_of_date: date, offset, dry_run: true, deletion_enabled: false, source_time_zone: null,
    policy: { detail_days: 7, daily_days: 90, recent_from: from(6), daily_from: from(89) },
    totals: { versions: 103, retain: 97, candidates: 3, protected: 2, metadata: 1 }, more: offset === 0,
    rows: Array.from({ length: offset ? 3 : 100 }, (_, index) => {
      const i = offset + index, reportDate = from(i < 3 || i === 6 ? 7 : i < 6 ? 100 : i % 7)
      return { id: '30000000-0000-4000-8000-' + String(i).padStart(12, '0'), report_date: reportDate,
        performance_generated_at: reportDate + (i === 6 ? 'T20:00:00' : 'T10:00:00'), pause_generated_at: reportDate + (i === 6 ? 'T20:00:05' : 'T10:00:05'),
        status: i === 3 ? 'running' : i === 5 ? 'failed' : 'success', performance_rows: i === 3 || i === 5 ? null : 50, pause_rows: i === 3 || i === 5 ? null : 50,
        decision: i < 3 ? 'candidate' : i < 5 ? 'protected' : i === 5 ? 'metadata' : 'retain',
        reason: i < 3 ? 'intermediate_cut' : i === 3 ? 'active_run' : i === 4 ? 'incomplete_pair' : i === 5 ? 'audit_metadata' : i === 6 ? 'daily_close' : 'recent_detail' }
    }) }
}
