// Display only: keep the source name, ID, matching and saved observations intact.
export function agentDisplayName(row) {
  const name = String(row?.vici_user_name || '').trim()
  return name.replace(/^(?:ASIA\s*[AB]?|COL|CO|PH|CA|NIC|VZ|VEN|BAJA\s*TJ(?:\s*B)?|MEX(?:ICO)?(?:\s*BAJA)?(?:\s*[AB])?)\s*[-–:]\s*/i, '').trim() || name
}

export function englishPerHour(rows) {
  if (!rows.length || rows.some(row => !Number.isFinite(row.time_seconds) || row.time_seconds < 0 || !Number.isFinite(row.xfer_count) || row.xfer_count < 0 || (!row.time_seconds && row.xfer_count > 0))) return null
  const seconds = rows.reduce((sum, row) => sum + row.time_seconds, 0)
  return seconds > 0 ? rows.reduce((sum, row) => sum + row.xfer_count, 0) * 3600 / seconds : null
}
export const hourlyLabel = value => value === null ? '—' : value.toFixed(2)
