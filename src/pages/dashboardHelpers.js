// src/pages/dashboardHelpers.js

import {
  CLEAN_START_DATE,
  TEAM_COLORS,
  TEAM_ORDER,
  TEAM_TARGETS,
  TEAMS,
} from './dashboardConfig'

export function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function clampNumber(value, min = 0, max = Infinity) {
  const n = toNumber(value)
  return Math.max(min, Math.min(max, n))
}

export function normalizeText(value) {
  return String(value || '').trim()
}

export function normalizeExt(value) {
  return String(value || '').trim()
}

export function normalizeAgentName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeTeamId(value) {
  const clean = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')

  if (clean === 'asia') return 'asia'
  if (clean === 'philippines' || clean === 'ph') return 'philippines'
  if (clean === 'colombia') return 'colombia'
  if (clean === 'central' || clean === 'central-america') return 'central'
  if (clean === 'mexico' || clean === 'mexico-baja' || clean === 'mexico-bj') return 'mexico'
  if (clean === 'venezuela') return 'venezuela'

  return clean || 'unknown'
}

export function getTeamConfig(teamId) {
  const id = normalizeTeamId(teamId)
  return TEAMS[id] || {
    id,
    label: id,
    short: id,
    flag: null,
  }
}

export function getTeamLabel(teamId) {
  return getTeamConfig(teamId).label
}

export function getTeamShort(teamId) {
  return getTeamConfig(teamId).short
}

export function getTeamFlag(teamId) {
  return getTeamConfig(teamId).flag
}

export function getTeamGoal(teamId) {
  return TEAM_TARGETS[normalizeTeamId(teamId)] || 10
}

export function getTeamColor(teamId) {
  return TEAM_COLORS[normalizeTeamId(teamId)] || '#b9d6ff'
}

export function getTeamOrderIndex(teamId) {
  const index = TEAM_ORDER.indexOf(normalizeTeamId(teamId))
  return index === -1 ? 999 : index
}

export function parseDateKey(dateKey) {
  if (!dateKey) return null

  const clean = String(dateKey).trim()

  // Expected Supabase format: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  // Display format: DD/MM/YYYY
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, d, m, y] = slashMatch
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  const fallback = new Date(clean)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function normalizeDateKey(value) {
  const parsed = parseDateKey(value)
  return parsed ? toDateKey(parsed) : ''
}

export function formatDateLabel(dateKey) {
  const parsed = parseDateKey(dateKey)
  if (!parsed) return String(dateKey || '')

  const d = String(parsed.getDate()).padStart(2, '0')
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const y = parsed.getFullYear()

  return `${d}/${m}/${y}`
}

export function isToday(dateKey) {
  return normalizeDateKey(dateKey) === todayKey()
}

export function isSunday(dateKey) {
  const parsed = parseDateKey(dateKey)
  if (!parsed) return false
  return parsed.getDay() === 0
}

export function isCleanDate(dateKey) {
  const key = normalizeDateKey(dateKey)
  if (!key) return false
  if (isSunday(key)) return false
  return key >= CLEAN_START_DATE
}

export function addDays(dateKey, amount) {
  const parsed = parseDateKey(dateKey)
  if (!parsed) return ''

  parsed.setDate(parsed.getDate() + amount)
  return toDateKey(parsed)
}

export function sortDateKeysDesc(dateKeys = []) {
  return [...new Set(dateKeys.map(normalizeDateKey).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a))
}

export function sortDateKeysAsc(dateKeys = []) {
  return [...new Set(dateKeys.map(normalizeDateKey).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
}

export function getWeekStartKey(dateKey) {
  const parsed = parseDateKey(dateKey)
  if (!parsed) return ''

  const day = parsed.getDay()
  const diff = day === 0 ? -6 : 1 - day

  parsed.setDate(parsed.getDate() + diff)
  return toDateKey(parsed)
}

export function getWeekEndKey(dateKey) {
  const start = getWeekStartKey(dateKey)
  if (!start) return ''
  return addDays(start, 5)
}

export function getWeekLabel(dateKey) {
  const start = getWeekStartKey(dateKey)
  const end = getWeekEndKey(dateKey)

  if (!start || !end) return ''

  return `${formatDateLabel(start)} - ${formatDateLabel(end)}`
}

export function formatCompactNumber(value) {
  const n = toNumber(value)

  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`

  return String(n)
}

export function getAgentTotal(agent) {
  if (!agent) return 0

  if (agent.total !== undefined) return toNumber(agent.total)
  if (agent.net_total !== undefined) return toNumber(agent.net_total)
  if (agent.raw_total !== undefined) return toNumber(agent.raw_total)

  return toNumber(agent.english) + toNumber(agent.spanish)
}

export function getTeamTotal(team) {
  if (!team) return 0

  if (team.total !== undefined) return toNumber(team.total)
  if (team.net_total !== undefined) return toNumber(team.net_total)
  if (team.raw_total !== undefined) return toNumber(team.raw_total)

  return toNumber(team.english) + toNumber(team.spanish)
}

export function agentReachedGoal(agent) {
  if (!agent) return false

  const teamId = normalizeTeamId(agent.team)
  const goal = getTeamGoal(teamId)
  return getAgentTotal(agent) >= goal
}

export function getMetricValue(row, metric = 'english') {
  if (!row) return 0

  if (metric === 'english') return toNumber(row.english)
  if (metric === 'spanish') return toNumber(row.spanish)
  if (metric === 'invalid') return toNumber(row.invalid_transfers || row.invalid)
  if (metric === 'total') return getAgentTotal(row)

  return toNumber(row[metric])
}

export function sortAgentsByMetric(agents = [], metric = 'english') {
  return [...agents].sort((a, b) => {
    const diff = getMetricValue(b, metric) - getMetricValue(a, metric)
    if (diff !== 0) return diff

    return normalizeAgentName(a.name || a.agent_name).localeCompare(
      normalizeAgentName(b.name || b.agent_name)
    )
  })
}
export function sortAgentsByLowestXfers(agents = []) {
  return [...(agents || [])]
    .filter(agent => Number(agent.lowestXfers ?? agent.weekXfers ?? agent.total ?? 0) > 0)
    .sort((a, b) => {
      const aXfers = Number(a.lowestXfers ?? a.weekXfers ?? a.total ?? 0)
      const bXfers = Number(b.lowestXfers ?? b.weekXfers ?? b.total ?? 0)
      const xferDiff = aXfers - bXfers
      if (xferDiff !== 0) return xferDiff

      const englishDiff = Number(a.english || 0) - Number(b.english || 0)
      if (englishDiff !== 0) return englishDiff

      const spanishDiff = Number(a.spanish || 0) - Number(b.spanish || 0)
      if (spanishDiff !== 0) return spanishDiff

      const activeDiff = Number(b.activeDays || 0) - Number(a.activeDays || 0)
      if (activeDiff !== 0) return activeDiff

      return String(a?.name || '').localeCompare(String(b?.name || ''))
    })
}
export function normalizeAgentRow(row = {}) {
  const team = normalizeTeamId(row.team)
  const english = toNumber(row.english)
  const spanish = toNumber(row.spanish)
  const invalid = toNumber(row.invalid_transfers || row.invalid)
  const rawTotal = row.raw_total !== undefined
    ? toNumber(row.raw_total)
    : english + spanish

  const netTotal = row.net_total !== undefined
    ? toNumber(row.net_total)
    : Math.max(0, rawTotal - invalid)

  return {
    ...row,
    date: normalizeDateKey(row.date),
    team,
    ext: normalizeExt(row.ext || row.agent_ext || row.user),
    name: normalizeAgentName(row.name || row.agent_name || row.agent || ''),
    english,
    spanish,
    invalid_transfers: invalid,
    raw_total: rawTotal,
    net_total: netTotal,
    total: netTotal,
  }
}

export function normalizeTeamRow(row = {}) {
  const team = normalizeTeamId(row.team)
  const english = toNumber(row.english)
  const spanish = toNumber(row.spanish)
  const invalid = toNumber(row.invalid_transfers || row.invalid)
  const rawTotal = row.raw_total !== undefined
    ? toNumber(row.raw_total)
    : english + spanish

  const netTotal = row.net_total !== undefined
    ? toNumber(row.net_total)
    : Math.max(0, rawTotal - invalid)

  return {
    ...row,
    date: normalizeDateKey(row.date),
    team,
    english,
    spanish,
    invalid_transfers: invalid,
    raw_total: rawTotal,
    net_total: netTotal,
    total: netTotal,
  }
}

export function dedupeAgentRows(rows = []) {
  const map = new Map()

  rows.forEach((row) => {
    const clean = normalizeAgentRow(row)
    const key = `${clean.date}:${clean.team}:${clean.ext || clean.name}`

    map.set(key, {
      ...map.get(key),
      ...clean,
    })
  })

  return [...map.values()]
}

export function dedupeTeamRows(rows = []) {
  const map = new Map()

  rows.forEach((row) => {
    const clean = normalizeTeamRow(row)
    const key = `${clean.date}:${clean.team}`

    map.set(key, {
      ...map.get(key),
      ...clean,
    })
  })

  return [...map.values()]
}

export function calcTotalsFromAgents(agents = []) {
  return agents.reduce(
    (acc, agent) => {
      acc.english += toNumber(agent.english)
      acc.spanish += toNumber(agent.spanish)
      acc.invalid += toNumber(agent.invalid_transfers || agent.invalid)
      acc.total += getAgentTotal(agent)
      return acc
    },
    {
      english: 0,
      spanish: 0,
      invalid: 0,
      total: 0,
    }
  )
}

export function groupByTeam(rows = []) {
  return rows.reduce((acc, row) => {
    const team = normalizeTeamId(row.team)

    if (!acc[team]) acc[team] = []
    acc[team].push(row)

    return acc
  }, {})
}

export function getAvailableDateOptions(dateKeys = []) {
  return sortDateKeysDesc(dateKeys)
    .filter(isCleanDate)
    .map((dateKey) => ({
      value: dateKey,
      label: isToday(dateKey) ? 'Today — LIVE' : formatDateLabel(dateKey),
    }))
}

export function buildTeamTotalsFromAgents(agents = []) {
  const grouped = groupByTeam(agents)

  return TEAM_ORDER.map((teamId) => {
    const teamAgents = grouped[teamId] || []
    const totals = calcTotalsFromAgents(teamAgents)

    return {
      team: teamId,
      active_agents: teamAgents.length,
      english: totals.english,
      spanish: totals.spanish,
      invalid_transfers: totals.invalid,
      raw_total: totals.english + totals.spanish,
      net_total: totals.total,
      total: totals.total,
    }
  })
}