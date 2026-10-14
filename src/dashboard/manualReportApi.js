import { normalizeReport, normalizeScopes } from './dashboardApi.js'

const messages = {
  report_date_mismatch: 'Use reports for the same full day: 00:00:00–23:59:59.',
  report_group_mismatch: 'This file contains teams outside the selected upload source. Choose All teams under Upload to, then try again.',
  invalid_selection: 'Choose the campaigns you exported and confirm the selection before uploading.',
  report_agent_sets_differ: 'The two files contain different Agent IDs. Export both reports again using the same filters.',
  missing_totals: 'A report is missing its TOTALS row. Upload the complete original CSV export.',
  totals_mismatch: 'A report’s totals do not match its agent rows. Nothing was saved.',
  report_too_large: 'Each CSV must be 5 MiB or smaller.',
  import_denied: 'Your active Staff account needs Dashboard access to this team.',
  sign_in_required: 'Your session must be renewed before uploading.',
  invalid_upload: 'Choose at least one original VICIdial CSV report.',
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
export async function uploadReports(client, { scopeId, reportDate, performance, pause, selection }) {
  const files = [performance, pause].filter(Boolean)
  if (!files.length || !files.every(file => /\.csv$/i.test(file.name) && file.size > 0)) return { error: messages.invalid_upload }
  if (files.some(file => file.size > 5 * 1024 * 1024)) return { error: messages.report_too_large }
  const body = new FormData()
  Object.entries({ scopeId, reportDate, performance, pause, confirmedScope: 'yes' }).forEach(([key, value]) => { if (value != null) body.append(key, value) })
  if (selection) body.append('selection', JSON.stringify(selection))
  try {
    const { data, error } = await client.functions.invoke('pulse-vici-import', { body })
    if (error) {
      let code
      try { code = (await error.context?.json())?.error } catch { /* Never show raw response text. */ }
      return { error: messages[code] || messages.import_unavailable, code }
    }
    if (!['success', 'duplicate'].includes(data?.status) || data.report_date !== reportDate || !Number.isSafeInteger(data.agents)) return { error: messages.import_unavailable }
    const savedId = selection ? data.scope_id : scopeId
    if (selection && (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(savedId || '') || data.parent_scope_id !== scopeId || data.dataset_kind !== selection.kind)) return { error: messages.import_unavailable }
    let scope = null
    try { if (data.scope) scope = normalizeScopes([data.scope])[0] } catch { /* Reload protected catalog. */ }
    // A confirmed save stays successful even if its follow-up read fails.
    let report = null
    try { if (data.report) report = normalizeReport(data.report, savedId, reportDate) } catch { /* Retry protected read in the Dashboard. */ }
    return { ...data, report, scope }
  } catch { return { error: messages.import_unavailable } }
}
