// Presentation rules only. Staff authorization and scope filtering belong to the RPCs.
export const PERFORMANCE_FIELDS = ['time_seconds', 'talk_seconds', 'talk_avg_seconds', 'wait_seconds', 'wait_avg_seconds', 'dead_seconds', 'dead_avg_seconds', 'dispo_seconds', 'pause_seconds', 'customer_seconds']
export const PAUSE_FIELDS = [['break_seconds', 'Break'], ['cb_seconds', 'Callback'], ['lunch_seconds', 'Lunch'], ['manage_seconds', 'Manage'], ['rr_seconds', 'RR'], ['tech_seconds', 'Tech'], ['login_seconds', 'Login'], ['lagged_seconds', 'Lagged'], ['dcmx_seconds', 'DCMX'], ['dismx_seconds', 'DISMX']]
export const integer = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || value.startsWith('0000')) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
export function duration(value) {
  if (!integer(value)) return '—'
  return `${Math.floor(value / 3600)}:${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export function number(value) { return integer(value) ? value.toLocaleString('en-US') : '—' }
export function calendarDate(timeZone, now = new Date()) {
  if (!timeZone) return null
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(p => [p.type, p.value]))
    return `${parts.year}-${parts.month}-${parts.day}`
  } catch { return null }
}
export function browserDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function ageLabel(value, now = Date.now()) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return 'Not synced yet'
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (seconds < 60) return `Updated ${seconds}s ago`
  if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `Updated ${Math.floor(seconds / 3600)}h ago`
  return `Updated ${Math.floor(seconds / 86400)}d ago`
}
export function integrationState(data, readError, now = Date.now()) {
  if (readError) return { tone: 'issue', label: 'Connection issue' }
  const h = data?.health
  if (!h) return { tone: 'waiting', label: 'Awaiting data' }
  const failed = h.last_failed_sync && (!h.last_successful_sync || Date.parse(h.last_failed_sync) >= Date.parse(h.last_successful_sync))
  if (failed || h.halted || h.requires_ip_validation) return { tone: 'issue', label: 'Connection issue' }
  if (!h.last_successful_sync) return { tone: 'waiting', label: 'Awaiting data' }
  // Same freshness window as the protected server contract; not an agent-performance threshold.
  if (h.connected && now - Date.parse(h.last_successful_sync) <= 150000) return { tone: 'live', label: 'Live' }
  return { tone: 'delayed', label: 'Delayed' }
}
export function groupName(row) { return row.current_user_group || 'Unassigned user group' }
export function aggregate(rows) {
  const sum = key => rows.reduce((total, row) => total + row[key], 0)
  return { agents: rows.length, calls: sum('calls'), xfer: sum('xfer_count'), talk: sum('talk_seconds'), wait: sum('wait_seconds'), pause: sum('pause_seconds'), customer: sum('customer_seconds') }
}
export function groupSummaries(rows) {
  const groups = new Map()
  for (const row of rows) { const key = groupName(row); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row) }
  return [...groups].map(([name, agents]) => ({ name, team: agents[0].team_name || null, ...aggregate(agents) })).sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name))
}
export function filterAgents(rows, { group = '', search = '', sort = 'calls', descending = true } = {}) {
  const query = search.trim().toLocaleLowerCase()
  return rows.filter(row => (!group || groupName(row) === group) && (!query || [row.vici_user_name, row.agent_code, groupName(row), row.team_name].some(v => String(v || '').toLocaleLowerCase().includes(query))))
    .sort((a, b) => {
      const left = a[sort], right = b[sort]
      const compared = typeof left === 'number' && typeof right === 'number' ? left - right : String(left || '').localeCompare(String(right || ''), 'en', { numeric: true })
      return (descending ? -compared : compared) || a.agent_code.localeCompare(b.agent_code)
    })
}
export function profilePath(row) {
  return row?.linked === true && row.profile_agent_code === row.agent_code && /^\d{4,12}$/.test(row.agent_code) ? `/profile/${encodeURIComponent(row.agent_code)}` : null
}
