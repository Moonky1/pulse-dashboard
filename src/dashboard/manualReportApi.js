import { normalizeReport } from './dashboardApi.js'

const messages = {
  report_date_mismatch: 'Use reports for the same full day: 00:00:00–23:59:59.',
  report_group_mismatch: 'A file contains a user group outside the selected reporting scope.',
  report_agent_sets_differ: 'The two files contain different Agent IDs. Export both reports again using the same filters.',
  missing_totals: 'A report is missing its TOTALS row. Upload the complete original CSV export.',
  totals_mismatch: 'A report’s totals do not match its agent rows. Nothing was saved.',
  report_too_large: 'Each CSV must be 5 MiB or smaller.',
  import_denied: 'Your active Staff account needs Dashboard access to this team.',
  sign_in_required: 'Your session must be renewed before uploading.',
  invalid_upload: 'Choose at least one CSV and confirm the report filters.',
  invalid_report: 'The report format could not be verified. Use the original VICIdial CSV exports without editing them.',
  import_cooldown: 'Please wait a few seconds before another upload.',
  import_conflict: 'This upload conflicts with a stored version or the scope changed. No data was replaced.',
  import_unavailable: 'The upload could not be confirmed. Refresh History before retrying; exact retries will not duplicate figures.',
}
export async function csvReportDate(file) {
  const header = await file.slice(0, 4096).text()
  const range = header.match(/Time range:\s*(\d{4}-\d{2}-\d{2}) 00:00:00 to (\d{4}-\d{2}-\d{2}) 23:59:59/)
  return range && range[1] === range[2] ? range[1] : null
}
export async function uploadReports(client, { scopeId, reportDate, performance, pause }) {
  const files = [performance, pause].filter(Boolean)
  if (!files.length || !files.every(file => /\.csv$/i.test(file.name) && file.size > 0)) return { error: messages.invalid_upload }
  if (files.some(file => file.size > 5 * 1024 * 1024)) return { error: messages.report_too_large }
  const body = new FormData()
  Object.entries({ scopeId, reportDate, performance, pause, confirmedScope: 'yes' }).forEach(([key, value]) => { if (value != null) body.append(key, value) })
  try {
    const { data, error } = await client.functions.invoke('pulse-vici-import', { body })
    if (error) {
      let code
      try { code = (await error.context?.json())?.error } catch { /* Never show raw response text. */ }
      return { error: messages[code] || messages.import_unavailable }
    }
    if (!['success', 'duplicate'].includes(data?.status) || data.report_date !== reportDate || !Number.isSafeInteger(data.agents)) return { error: messages.import_unavailable }
    // A confirmed save stays successful even if its follow-up read fails.
    let report = null
    try { if (data.report) report = normalizeReport(data.report, scopeId, reportDate) } catch { /* Retry protected read in the Dashboard. */ }
    return { ...data, report }
  } catch { return { error: messages.import_unavailable } }
}
