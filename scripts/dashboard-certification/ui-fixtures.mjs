// Synthetic UI test data only. Never imported by the application or sent to a database.
export const testScope = { id: '10000000-0000-4000-8000-000000000001', label: 'UI review · Synthetic Openers', user_groups: ['ReviewGroupA', 'ReviewGroupB'], source_time_zone: null }
export function testReport(date = '2026-10-09') {
  const performance = Array.from({ length: 40 }, (_, i) => ({
    agent_code: String(i + 1000).padStart(5, '0'), vici_user_name: `Sample Agent ${String(i + 1).padStart(2, '0')}`,
    current_user_group: i % 2 ? 'ReviewGroupB' : 'ReviewGroupA', most_recent_user_group: i % 2 ? 'ReviewGroupB' : 'ReviewGroupA',
    team_name: null, linked: i === 0, profile_agent_code: i === 0 ? '01000' : null,
    calls: 100 + i, xfer_count: 3 + i, time_seconds: 28800, talk_seconds: 12600, talk_avg_seconds: 126,
    wait_seconds: 1800, wait_avg_seconds: 18, dead_seconds: 600, dead_avg_seconds: 6,
    dispo_seconds: 1200, dispo_avg_seconds: 12, pause_seconds: 7200, pause_avg_seconds: 72, customer_seconds: 12000, customer_avg_seconds: 120,
    dispositions: { A: 10, CALLBK: 2, DAIR: 4, DNC: 5, LANG: 1, NI: 8, SPANIS: 7, WRGNUM: 1, WRGVEH: 2, XFER: 3 + i },
  }))
  return { scope: testScope, date, health: { connected: false, last_successful_sync: '2026-10-09T18:00:00Z', last_failed_sync: null, last_error_category: null, requires_ip_validation: false, halted: false },
    snapshot: { id: '20000000-0000-4000-8000-000000000001', captured_at: '2026-10-09T18:00:00Z', performance_generated_at: `${date}T10:59:40`, pause_generated_at: `${date}T10:59:45`, performance_ingested_at: '2026-10-09T18:00:00Z', pause_ingested_at: '2026-10-09T18:00:00Z', warnings: [] },
    performance, pause: performance.map(row => ({ agent_code: row.agent_code, vici_user_name: row.vici_user_name, current_user_group: row.current_user_group, most_recent_user_group: row.most_recent_user_group,
      total_seconds: 28800, nonpause_seconds: 21600, pause_seconds: 7200, break_seconds: 1800, cb_seconds: 300, lunch_seconds: 3600, manage_seconds: 600, rr_seconds: 480, tech_seconds: 180, login_seconds: 120, lagged_seconds: 60, dcmx_seconds: 0, dismx_seconds: 0, other_pause_seconds: { unlabelled: 60 },
    })) }
}
