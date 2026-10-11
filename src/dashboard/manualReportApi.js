const messages = {
  report_date_mismatch: 'Both files must cover the selected date, 00:00:00–23:59:59. Check the Report date and export filters.',
  report_group_mismatch: 'A file contains a user group outside the selected reporting scope.',
  report_agent_sets_differ: 'The two files contain different Agent IDs. Export both reports again using the same filters.',
  missing_totals: 'A report is missing its TOTALS row. Upload the complete original CSV export.',
  totals_mismatch: 'A report’s totals do not match its agent rows. Nothing was saved.',
  report_too_large: 'Each CSV must be 5 MiB or smaller.',
  import_denied: 'Only active global Admin or Super Admin accounts may import into this scope.',
  sign_in_required: 'Your session must be renewed before uploading.',
  invalid_upload: 'Choose both original .csv files and confirm the export scope.',
  invalid_report: 'The report format could not be verified. Use the original VICIdial CSV exports without editing them.',
  import_cooldown: 'Please wait a few seconds before another upload.',
  import_conflict: 'This upload conflicts with a stored version or the scope changed. No data was replaced.',
  import_unavailable: 'The upload could not be confirmed. Refresh History before retrying; exact retries will not duplicate figures.',
}
export async function uploadReports(client, { scopeId, reportDate, performance, pause }) {
  if (![performance, pause].every(file => file && /\.csv$/i.test(file.name) && file.size > 0)) return { error: messages.invalid_upload }
  if ([performance, pause].some(file => file.size > 5 * 1024 * 1024)) return { error: messages.report_too_large }
  const body = new FormData()
  Object.entries({ scopeId, reportDate, performance, pause, confirmedScope: 'yes' }).forEach(([key, value]) => body.append(key, value))
  try {
    const { data, error } = await client.functions.invoke('pulse-vici-import', { body })
    if (error) {
      let code
      try { code = (await error.context?.json())?.error } catch { /* Never show raw response text. */ }
      return { error: messages[code] || messages.import_unavailable }
    }
    if (!['success', 'duplicate'].includes(data?.status) || data.report_date !== reportDate || !Number.isSafeInteger(data.agents)) return { error: messages.import_unavailable }
    return data
  } catch { return { error: messages.import_unavailable } }
}
