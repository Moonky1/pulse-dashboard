import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './dashboard.css'

const CLEAN_START_DATE = '2026-03-23'
const OFFICIAL_DATA_START = '2026-03-23'
const POLL_MS = 10000

const MEDALS = ['/emojis/medal1.webp', '/emojis/medal2.webp', '/emojis/medal3.webp']
const TEAM_RANK_EMOJIS = ['/emojis/goal1.webp', '/emojis/goal3.webp', '/emojis/goal4.webp']

const TEAM_TARGETS = {
  asia: 20,
  philippines: 10,
  colombia: 10,
  central: 10,
  mexico: 10,
  venezuela: 10,
}

const TEAMS = {
  asia: {
    id: 'asia',
    label: 'Asia',
    short: 'Asia',
    flag: '/flags/asia.png',
  },
  philippines: {
    id: 'philippines',
    label: 'Philippines',
    short: 'Philippines',
    flag: '/flags/philippines.png',
  },
  colombia: {
    id: 'colombia',
    label: 'Colombia',
    short: 'Colombia',
    flag: '/flags/colombia.png',
  },
  central: {
    id: 'central',
    label: 'Central America',
    short: 'Central',
    flag: null,
  },
  mexico: {
    id: 'mexico',
    label: 'Mexico Baja',
    short: 'Mexico',
    flag: '/flags/mexico.png',
  },
  venezuela: {
    id: 'venezuela',
    label: 'Venezuela',
    short: 'Venezuela',
    flag: '/flags/venezuela.png',
  },
}

const TEAM_ORDER = ['asia', 'philippines', 'colombia', 'central', 'mexico', 'venezuela']

const SORT_OPTIONS = [
  { id: 'english', label: 'English Xfers' },
  { id: 'spanish', label: 'Spanish Xfers' },
  { id: 'total', label: 'Total Xfers' },
]

const SIDEBAR_GROUPS = [
  {
    title: 'WORKSPACE',
    items: [
      { id: 'overview', label: 'Overview', icon: '▦' },
      { id: 'analytics', label: 'Analytics', icon: '▥' },
      { id: 'rankings', label: 'Rankings', icon: '🏆' },
      { id: 'teams', label: 'Teams', icon: '👥' },
      { id: 'commissions', label: 'Commissions', icon: '$' },
    ],
  },
  {
    title: 'APPS',
    items: [
      { id: 'pulse-go', label: 'Pulse GO', icon: '⚡' },
      { id: 'academy', label: 'Academy', icon: '📖' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'alerts', label: 'Alerts', icon: '🔔' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
      { id: 'support', label: 'Support', icon: '◎' },
    ],
  },
]

const normalizeSearchText = value => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const colombiaDate = () => new Date(Date.now() - 5 * 60 * 60 * 1000)

const todayKey = () => {
  const d = colombiaDate()

  // Business-day protection: 00:00 - 03:59 still belongs to previous work day.
  if (d.getUTCHours() < 4) d.setUTCDate(d.getUTCDate() - 1)

  return d.toISOString().slice(0, 10)
}

function normalizeDate(raw) {
  if (!raw) return null

  const s = String(raw).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  let match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const first = Number(match[1])
    const second = Number(match[2])
    const year = Number(match[3])
    const month = first > 12 ? second : first
    const day = first > 12 ? first : second
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  match = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (match) {
    const first = Number(match[1])
    const second = Number(match[2])
    const year = Number(match[3])
    const month = first > 12 ? second : first
    const day = first > 12 ? first : second
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateAddKey(dateKey, days) {
  const d = new Date(`${dateKey}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

function getWeekStartKey(dateKey) {
  const date = normalizeDate(dateKey)
  if (!date) return null

  const d = new Date(`${date}T12:00:00Z`)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

function getWeekEndKey(weekStartKey) {
  return weekStartKey ? dateAddKey(weekStartKey, 5) : null
}

function formatDateLabel(date) {
  if (!date) return 'N/A'
  if (date === todayKey()) return 'Today — LIVE'

  const [y, m, d] = String(date).split('-')
  if (!y || !m || !d) return date
  return `${d}/${m}/${y}`
}

function getMetricLabel(metric) {
  if (metric === 'english') return 'English'
  if (metric === 'spanish') return 'Spanish'
  if (metric === 'invalid') return 'Invalid'
  if (metric === 'goalDays') return 'Goal Days'
  if (metric === 'total') return 'Total'
  return metric
}

function getMetricColor(metric) {
  if (metric === 'english') return '#38bdf8'
  if (metric === 'spanish') return '#34d399'
  if (metric === 'invalid') return '#fb7185'
  if (metric === 'goalDays') return '#fbbf24'
  if (metric === 'lowestXfers') return '#fbbf24'
  return '#ff8a2a'
}

function getTeamName(teamId) {
  return TEAMS[teamId]?.label || teamId || 'Unknown team'
}

function getTeamFlag(teamId) {
  return TEAMS[teamId]?.flag || null
}

function getTeamGoal(teamId) {
  return Number(TEAM_TARGETS[teamId] || 10)
}

function isSaturdayDateKey(dateKey) {
  const date = normalizeDate(dateKey)
  if (!date) return false

  const d = new Date(`${date}T12:00:00Z`)
  return d.getUTCDay() === 6
}

function getGoalTargetForDate(teamId, dateKey) {
  return isSaturdayDateKey(dateKey) ? 10 : getTeamGoal(teamId)
}

function getGoalMetricForDate(dateKey) {
  return isSaturdayDateKey(dateKey) ? 'total' : 'english'
}

function agentReachedGoal(agent) {
  const goal = getGoalTargetForDate(agent?.teamId || agent?.team, agent?.date)
  const metric = getGoalMetricForDate(agent?.date)

  if (metric === 'total') {
    return Number(agent?.total || agent?.rawTotal || 0) >= goal
  }

  return Number(agent?.english || 0) >= goal
}

function getGoalRuleLabel(teamId, dateKey = null) {
  if (dateKey && isSaturdayDateKey(dateKey)) return 'Saturday goal: 10 Total'
  if (teamId === 'asia') return 'Mon-Fri goal: 20 English • Saturday: 10 Total'
  return 'Mon-Fri goal: 10 English • Saturday: 10 Total'
}

function FlagImg({ src, size = 18, alt = '' }) {
  if (!src) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>🌎</span>

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={Math.round(size * 0.72)}
      style={{ borderRadius: 3, objectFit: 'cover', display: 'inline-block' }}
    />
  )
}

function Medal({ index, size = 18 }) {
  return <img src={MEDALS[index]} alt="" width={size} height={size} style={{ objectFit: 'contain' }} />
}

function RankMarker({ index }) {
  if (index < 3) return <Medal index={index} size={20} />
  return <span className="pulse-team-rank-text">#{index + 1}</span>
}

function TeamInlineLabel({ teamId, teamFlag, teamLabel }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 900 }}>
      <FlagImg src={teamFlag || getTeamFlag(teamId)} size={18} alt="" />
      {teamLabel || getTeamName(teamId)}
    </span>
  )
}

function SummaryCard({ title, value, color, subtitle, titleColor }) {
  return (
    <div className="pulse-summary-card">
      <div className="pulse-summary-title" style={{ color: titleColor || undefined }}>{title}</div>
      <div className="pulse-summary-value" style={{ color }}>{Number(value || 0).toLocaleString()}</div>
      <div className="pulse-summary-subtitle">{subtitle || ''}</div>
    </div>
  )
}

function LovableKpi({ title, value, tone }) {
  return (
    <div className={`lov-kpi-card ${tone}`}>
      <div className="lov-kpi-title">{title}</div>
      <div className="lov-kpi-value">{Number(value || 0).toLocaleString()}</div>
    </div>
  )
}

function normalizeSupabaseAgent(row) {
  const english = Number(row?.english || 0)
  const spanish = Number(row?.spanish || 0)
  const invalidTransfers = Number(row?.invalid_transfers || 0)
  const rawTotal = Number(row?.raw_total ?? (english + spanish))
  const total = Number(row?.net_total ?? Math.max(0, rawTotal - invalidTransfers))
  const teamId = String(row?.team || '').trim()

  return {
    date: normalizeDate(row?.date),
    ext: String(row?.agent_ext || '').trim(),
    name: String(row?.agent_name || '').trim(),
    teamId,
    team: teamId,
    teamLabel: getTeamName(teamId),
    teamFlag: getTeamFlag(teamId),
    english,
    spanish,
    invalidTransfers,
    rawTotal,
    total,
    source: String(row?.source || ''),
    isFinal: Boolean(row?.is_final),
  }
}

function dedupeDailyAgents(normalizedAgents = []) {
  const byKey = new Map()

  ;(normalizedAgents || []).forEach(agent => {
    if (!agent?.date || !agent?.teamId || !agent?.ext) return

    const key = `${agent.date}|${agent.teamId}|${agent.ext}`
    const previous = byKey.get(key)

    if (!previous) {
      byKey.set(key, agent)
      return
    }

    const previousIsFinal = Boolean(previous.isFinal)
    const currentIsFinal = Boolean(agent.isFinal)
    const previousScore = Number(previous.rawTotal || previous.total || 0)
    const currentScore = Number(agent.rawTotal || agent.total || 0)

    // Official/final rows must ALWAYS win over live rows for the same date/team/agent.
    // This prevents old live/OT snapshots from creating fake Goal Days or inflated weekly totals.
    if (currentIsFinal && !previousIsFinal) {
      byKey.set(key, agent)
      return
    }

    if (!currentIsFinal && previousIsFinal) {
      return
    }

    // If both rows have the same status, keep the strongest row.
    if (currentScore > previousScore) {
      byKey.set(key, agent)
    }
  })

  return [...byKey.values()]
}

function normalizeSupabaseTeam(row) {
  const teamId = String(row?.team || '').trim()
  const english = Number(row?.english || 0)
  const spanish = Number(row?.spanish || 0)
  const invalidTransfers = Number(row?.invalid_transfers || 0)
  const rawTotal = Number(row?.raw_total ?? (english + spanish))
  const total = Number(row?.net_total ?? Math.max(0, rawTotal - invalidTransfers))

  return {
    date: normalizeDate(row?.date),
    teamId,
    team: teamId,
    teamLabel: getTeamName(teamId),
    teamFlag: getTeamFlag(teamId),
    english,
    spanish,
    invalidTransfers,
    rawTotal,
    total,
    activeAgents: Number(row?.active_agents || 0),
    source: String(row?.source || ''),
    isFinal: Boolean(row?.is_final),
  }
}

function sortAgentsByMetric(agents, metric = 'total') {
  return [...(agents || [])].sort((a, b) => {
    const metricDiff = Number(b?.[metric] || 0) - Number(a?.[metric] || 0)
    if (metricDiff !== 0) return metricDiff

    const totalDiff = Number(b?.total || 0) - Number(a?.total || 0)
    if (totalDiff !== 0) return totalDiff

    const englishDiff = Number(b?.english || 0) - Number(a?.english || 0)
    if (englishDiff !== 0) return englishDiff

    return String(a?.name || '').localeCompare(String(b?.name || ''))
  })
}

function sortAgentsByLowestXfers(agents = []) {
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

function buildParsedTeamsFromSupabase(teamRows = [], agentRows = []) {
  const teamMap = {}

  TEAM_ORDER.forEach(teamId => {
    const teamRow = (teamRows || []).find(row => String(row.team || '') === teamId)

    const agents = (agentRows || [])
      .filter(row => String(row.team || '') === teamId)
      .map(normalizeSupabaseAgent)
      .filter(agent => agent.ext)

    if (!teamRow && agents.length === 0) return

    const fallbackEnglish = agents.reduce((sum, agent) => sum + Number(agent.english || 0), 0)
    const fallbackSpanish = agents.reduce((sum, agent) => sum + Number(agent.spanish || 0), 0)
    const fallbackInvalid = agents.reduce((sum, agent) => sum + Number(agent.invalidTransfers || 0), 0)
    const fallbackRawTotal = agents.reduce((sum, agent) => sum + Number(agent.rawTotal || 0), 0)
    const fallbackTotal = agents.reduce((sum, agent) => sum + Number(agent.total || 0), 0)

    const english = Number(teamRow?.english ?? fallbackEnglish)
    const spanish = Number(teamRow?.spanish ?? fallbackSpanish)
    const invalidTransfers = Number(teamRow?.invalid_transfers ?? fallbackInvalid)
    const rawTotal = Number(teamRow?.raw_total ?? (fallbackRawTotal || english + spanish))
    const total = Number(teamRow?.net_total ?? (fallbackTotal || Math.max(0, rawTotal - invalidTransfers)))
    const activeAgents = Number(teamRow?.active_agents ?? agents.length)

    teamMap[teamId] = {
      agents: sortAgentsByMetric(agents, 'total'),
      totals: {
        english,
        spanish,
        rawTotal,
        total,
        activeAgents,
      },
      invalidTransfers,
      source: String(teamRow?.source || agents[0]?.source || ''),
      isFinal: Boolean(teamRow?.is_final),
    }
  })

  return teamMap
}

async function fetchSupabaseDashboardDate(date) {
  const [teamResult, agentResult] = await Promise.all([
    supabase
      .from('pulse_team_daily_clean')
      .select('*')
      .eq('date', date),

    supabase
      .from('pulse_agent_daily_clean')
      .select('*')
      .eq('date', date)
      .range(0, 9999),
  ])

  if (teamResult.error) throw teamResult.error
  if (agentResult.error) throw agentResult.error

  return buildParsedTeamsFromSupabase(teamResult.data || [], agentResult.data || [])
}

async function fetchSupabaseDates() {
  const { data, error } = await supabase
    .from('pulse_team_daily_clean')
    .select('date')
    .gte('date', CLEAN_START_DATE)
    .order('date', { ascending: false })
    .range(0, 9999)

  if (error) throw error

  return [...new Set(
    (data || [])
      .map(row => normalizeDate(row.date))
      .filter(Boolean)
  )].sort((a, b) => b.localeCompare(a))
}

async function fetchAllSupabaseRows(tableName, select = '*', pageSize = 1000, orderColumns = []) {
  const rows = []
  let from = 0

  // Supabase/PostgREST can silently return only the first page if we request a huge range.
  // This loop forces Dashboard rankings to read every historical row saved in the tables,
  // not only the current week or the first 1,000 rows.
  while (true) {
    const to = from + pageSize - 1
    let query = supabase
      .from(tableName)
      .select(select)
      .gte('date', OFFICIAL_DATA_START)

    orderColumns.forEach(column => {
      query = query.order(column.name, { ascending: column.ascending })
    })

    const { data, error } = await query.range(from, to)

    if (error) throw error

    const batch = data || []
    rows.push(...batch)

    if (batch.length < pageSize) break
    from += pageSize

    // Safety guard. 100k rows is far above what this dashboard needs right now.
    if (from >= 100000) break
  }

  return rows
}

async function fetchHistoryRows() {
  const [agentRows, teamRows] = await Promise.all([
    fetchAllSupabaseRows('pulse_agent_daily_clean', '*', 1000, [
      { name: 'date', ascending: false },
      { name: 'team', ascending: true },
      { name: 'agent_ext', ascending: true },
    ]),
    fetchAllSupabaseRows('pulse_team_daily_clean', '*', 1000, [
      { name: 'date', ascending: false },
      { name: 'team', ascending: true },
    ]),
  ])

  return buildHistoryInsights(agentRows || [], teamRows || [])
}

function buildAllTimeAgentRankings(agentRows = []) {
  const byAgent = new Map()

  dedupeDailyAgents((agentRows || []).map(normalizeSupabaseAgent))
    .filter(agent => agent.date && agent.ext && (agent.english > 0 || agent.spanish > 0 || agent.total > 0))
    .forEach(agent => {
      const agentKey = `${agent.teamId}|${agent.ext}`
      const current = byAgent.get(agentKey) || {
        ext: agent.ext,
        name: agent.name,
        teamId: agent.teamId,
        teamLabel: agent.teamLabel,
        teamFlag: agent.teamFlag,
        english: 0,
        spanish: 0,
        invalidTransfers: 0,
        rawTotal: 0,
        total: 0,
        activeDays: 0,
        goalDays: 0,
        bestEnglish: 0,
        bestSpanish: 0,
        bestTotal: 0,
        bestDate: agent.date,
        goal: getTeamGoal(agent.teamId),
      }

      current.name = agent.name || current.name
      current.teamId = agent.teamId || current.teamId
      current.teamLabel = agent.teamLabel || current.teamLabel
      current.teamFlag = agent.teamFlag || current.teamFlag
      current.goal = getTeamGoal(current.teamId)
      current.english += Number(agent.english || 0)
      current.spanish += Number(agent.spanish || 0)
      current.invalidTransfers += Number(agent.invalidTransfers || 0)
      current.rawTotal += Number(agent.rawTotal || 0)
      current.total += Number(agent.total || 0)
      current.activeDays += 1
      if (agentReachedGoal(agent)) current.goalDays += 1

      if (Number(agent.english || 0) > current.bestEnglish) current.bestEnglish = Number(agent.english || 0)
      if (Number(agent.spanish || 0) > current.bestSpanish) current.bestSpanish = Number(agent.spanish || 0)
      if (Number(agent.total || 0) > current.bestTotal) {
        current.bestTotal = Number(agent.total || 0)
        current.bestDate = agent.date
      }

      byAgent.set(agentKey, current)
    })

  return [...byAgent.values()].map(agent => ({
    ...agent,
    avgEnglish: agent.activeDays ? agent.english / agent.activeDays : 0,
    goalRate: agent.activeDays ? agent.goalDays / agent.activeDays : 0,
  }))
}

function buildAllTimeTeamRankings(teamRows = []) {
  const byTeam = new Map()

  teamRows
    .map(normalizeSupabaseTeam)
    .filter(team => team.date && team.teamId)
    .forEach(team => {
      const current = byTeam.get(team.teamId) || {
        teamId: team.teamId,
        teamLabel: team.teamLabel,
        teamFlag: team.teamFlag,
        english: 0,
        spanish: 0,
        invalidTransfers: 0,
        total: 0,
        activeAgents: 0,
        daysTracked: 0,
        bestEnglish: 0,
        bestSpanish: 0,
        bestTotal: 0,
        bestDate: team.date,
      }

      current.english += Number(team.english || 0)
      current.spanish += Number(team.spanish || 0)
      current.invalidTransfers += Number(team.invalidTransfers || 0)
      current.total += Number(team.total || 0)
      current.activeAgents = Math.max(current.activeAgents, Number(team.activeAgents || 0))
      current.daysTracked += 1

      if (Number(team.english || 0) > current.bestEnglish) current.bestEnglish = Number(team.english || 0)
      if (Number(team.spanish || 0) > current.bestSpanish) current.bestSpanish = Number(team.spanish || 0)
      if (Number(team.total || 0) > current.bestTotal) {
        current.bestTotal = Number(team.total || 0)
        current.bestDate = team.date
      }

      byTeam.set(team.teamId, current)
    })

  return [...byTeam.values()]
}

function buildEnglishPlacementAgents(agentRows = []) {
  const byDate = new Map()

  dedupeDailyAgents((agentRows || []).map(normalizeSupabaseAgent))
    .filter(agent => agent.date && agent.ext && agent.english > 0)
    .forEach(agent => {
      if (!byDate.has(agent.date)) byDate.set(agent.date, [])
      byDate.get(agent.date).push(agent)
    })

  const byAgent = new Map()

  byDate.forEach((agents, date) => {
    const sorted = sortAgentsByMetric(agents, 'english')

    sorted.slice(0, 3).forEach((agent, index) => {
      const agentKey = `${agent.teamId}|${agent.ext}`
      const current = byAgent.get(agentKey) || {
        ext: agent.ext,
        name: agent.name,
        teamId: agent.teamId,
        teamLabel: agent.teamLabel,
        teamFlag: agent.teamFlag,
        firstPlaces: 0,
        top3Days: 0,
        bestEnglish: 0,
        bestTotal: 0,
        bestDate: date,
      }

      if (index === 0) current.firstPlaces += 1
      current.top3Days += 1

      if (Number(agent.english || 0) > current.bestEnglish) {
        current.bestEnglish = Number(agent.english || 0)
        current.bestTotal = Number(agent.total || 0)
        current.bestDate = date
      }

      byAgent.set(agentKey, current)
    })
  })

  const rows = [...byAgent.values()]

  return {
    mostFirst: [...rows].sort((a, b) => {
      const firstDiff = Number(b.firstPlaces || 0) - Number(a.firstPlaces || 0)
      if (firstDiff !== 0) return firstDiff
      const top3Diff = Number(b.top3Days || 0) - Number(a.top3Days || 0)
      if (top3Diff !== 0) return top3Diff
      return Number(b.bestEnglish || 0) - Number(a.bestEnglish || 0)
    }),
    mostTop3: [...rows].sort((a, b) => {
      const top3Diff = Number(b.top3Days || 0) - Number(a.top3Days || 0)
      if (top3Diff !== 0) return top3Diff
      const firstDiff = Number(b.firstPlaces || 0) - Number(a.firstPlaces || 0)
      if (firstDiff !== 0) return firstDiff
      return Number(b.bestEnglish || 0) - Number(a.bestEnglish || 0)
    }),
  }
}

function buildTeamWinnerCounts(teamRows = [], metric = 'english') {
  const byDate = new Map()

  teamRows
    .map(normalizeSupabaseTeam)
    .filter(team => team.date && team.teamId && Number(team?.[metric] || 0) > 0)
    .forEach(team => {
      if (!byDate.has(team.date)) byDate.set(team.date, [])
      byDate.get(team.date).push(team)
    })

  const byTeam = new Map()

  byDate.forEach((teams, date) => {
    const topTeam = [...teams].sort((a, b) => {
      const metricDiff = Number(b?.[metric] || 0) - Number(a?.[metric] || 0)
      if (metricDiff !== 0) return metricDiff
      return Number(b?.total || 0) - Number(a?.total || 0)
    })[0]

    if (!topTeam) return

    const current = byTeam.get(topTeam.teamId) || {
      teamId: topTeam.teamId,
      teamLabel: topTeam.teamLabel,
      teamFlag: topTeam.teamFlag,
      wins: 0,
      bestValue: 0,
      bestDate: date,
      bestTotal: 0,
    }

    current.wins += 1

    if (Number(topTeam?.[metric] || 0) > current.bestValue) {
      current.bestValue = Number(topTeam?.[metric] || 0)
      current.bestDate = date
      current.bestTotal = Number(topTeam.total || 0)
    }

    byTeam.set(topTeam.teamId, current)
  })

  return [...byTeam.values()].sort((a, b) => {
    const winDiff = Number(b.wins || 0) - Number(a.wins || 0)
    if (winDiff !== 0) return winDiff
    return Number(b.bestValue || 0) - Number(a.bestValue || 0)
  })
}

function buildTeamWeeklyInsights(agentRows = [], teamRows = []) {
  const agents = dedupeDailyAgents((agentRows || []).map(normalizeSupabaseAgent).filter(agent => agent.date && agent.ext && agent.teamId))
  const teams = (teamRows || []).map(normalizeSupabaseTeam).filter(team => team.date && team.teamId)
  const dates = [...new Set(teams.map(team => team.date).filter(Boolean))].sort()
  const latestDate = dates[dates.length - 1] || todayKey()
  const thisWeekStart = getWeekStartKey(latestDate)
  const lastWeekStart = dateAddKey(thisWeekStart, -7)

  const buildWeekForTeam = (teamId, weekStart) => {
    const weekEnd = getWeekEndKey(weekStart)
    const goal = getTeamGoal(teamId)
    const weekTeamRows = teams.filter(row => row.teamId === teamId && row.date >= weekStart && row.date <= weekEnd)
    const weekAgentRows = agents.filter(row => row.teamId === teamId && row.date >= weekStart && row.date <= weekEnd)
    const byAgent = new Map()

    weekAgentRows.forEach(agent => {
      const agentKey = `${agent.teamId}|${agent.ext}`
      const current = byAgent.get(agentKey) || {
        ext: agent.ext,
        name: agent.name,
        teamId: agent.teamId,
        teamLabel: agent.teamLabel,
        teamFlag: agent.teamFlag,
        english: 0,
        spanish: 0,
        total: 0,
        activeDays: 0,
        goalDays: 0,
        bestEnglish: 0,
        bestDate: agent.date,
        activeDateKeys: new Set(),
        goalDateKeys: new Set(),
      }

      current.name = agent.name || current.name
      const dayEnglish = Number(agent.english || 0)
      const daySpanish = Number(agent.spanish || 0)
      const dayXfers = dayEnglish + daySpanish

      current.english += dayEnglish
      current.spanish += daySpanish
      current.total += dayXfers
      current.weekXfers = Number(current.weekXfers || 0) + dayXfers
      current.lowestXfers = Number(current.lowestXfers || 0) + dayXfers

      if (agent.date && dayXfers > 0) {
        current.activeDateKeys.add(agent.date)
        if (agentReachedGoal({ ...agent, english: dayEnglish, spanish: daySpanish, total: dayXfers, rawTotal: dayXfers })) {
          current.goalDateKeys.add(agent.date)
        }
      }

      if (Number(agent.english || 0) > current.bestEnglish) {
        current.bestEnglish = Number(agent.english || 0)
        current.bestDate = agent.date
      }

      byAgent.set(agentKey, current)
    })

    const weekAgents = [...byAgent.values()].map(agent => {
      const activeDays = agent.activeDateKeys?.size || 0
      const goalDays = agent.goalDateKeys?.size || 0

      return {
        ...agent,
        activeDays,
        goalDays,
        goalRate: activeDays ? goalDays / activeDays : 0,
        avgEnglish: activeDays ? agent.english / activeDays : 0,
      }
    })

    const totals = weekTeamRows.reduce((acc, row) => {
      acc.english += Number(row.english || 0)
      acc.spanish += Number(row.spanish || 0)
      acc.invalidTransfers += Number(row.invalidTransfers || 0)
      acc.total += Number(row.total || 0)
      acc.daysTracked += 1
      acc.activeAgents = Math.max(acc.activeAgents, Number(row.activeAgents || 0))
      return acc
    }, {
      english: 0,
      spanish: 0,
      invalidTransfers: 0,
      total: 0,
      daysTracked: 0,
      activeAgents: 0,
    })

    return {
      weekStart,
      weekEnd,
      goal,
      totals,
      topEnglish: sortAgentsByMetric(weekAgents, 'english').slice(0, 10),
      topTotal: sortAgentsByMetric(weekAgents, 'total').slice(0, 10),
      goalLeaders: [...weekAgents]
        .filter(agent => Number(agent.goalDays || 0) > 0)
        .sort((a, b) => {
          const goalDiff = Number(b.goalDays || 0) - Number(a.goalDays || 0)
          if (goalDiff !== 0) return goalDiff
          const englishDiff = Number(b.english || 0) - Number(a.english || 0)
          if (englishDiff !== 0) return englishDiff
          return Number(b.total || 0) - Number(a.total || 0)
        })
        .slice(0, 10),
      lowestActive: sortAgentsByLowestXfers(weekAgents).slice(0, 10),
    }
  }

  return TEAM_ORDER.map(teamId => ({
    teamId,
    teamLabel: getTeamName(teamId),
    teamFlag: getTeamFlag(teamId),
    goal: getTeamGoal(teamId),
    thisWeek: buildWeekForTeam(teamId, thisWeekStart),
    lastWeek: buildWeekForTeam(teamId, lastWeekStart),
  }))
}

function buildHistoryInsights(agentRows = [], teamRows = []) {
  const cleanAgentRows = (agentRows || []).filter(row => normalizeDate(row?.date) >= OFFICIAL_DATA_START)
  const cleanTeamRows = (teamRows || []).filter(row => normalizeDate(row?.date) >= OFFICIAL_DATA_START)
  const dates = [...new Set(cleanTeamRows.map(row => normalizeDate(row?.date)).filter(Boolean))].sort()
  const allTimeAgents = buildAllTimeAgentRankings(cleanAgentRows)
  const allTimeTeams = buildAllTimeTeamRankings(cleanTeamRows)
  const placement = buildEnglishPlacementAgents(cleanAgentRows)

  return {
    dates,
    datesTracked: dates.length,
    allTimeAgents,
    allTimeTeams,
    topAllTimeTotalAgents: sortAgentsByMetric(allTimeAgents, 'total').slice(0, 10),
    topAllTimeEnglishAgents: sortAgentsByMetric(allTimeAgents, 'english').slice(0, 10),
    topAllTimeSpanishAgents: sortAgentsByMetric(allTimeAgents, 'spanish').slice(0, 10),
    topGoalAchievementAgents: [...allTimeAgents].sort((a, b) => {
      const goalDiff = Number(b.goalDays || 0) - Number(a.goalDays || 0)
      if (goalDiff !== 0) return goalDiff
      const englishDiff = Number(b.english || 0) - Number(a.english || 0)
      if (englishDiff !== 0) return englishDiff
      const bestDiff = Number(b.bestEnglish || 0) - Number(a.bestEnglish || 0)
      if (bestDiff !== 0) return bestDiff
      return String(a.name || '').localeCompare(String(b.name || ''))
    }).slice(0, 10),
    mostEnglishFirstPlaceAgents: placement.mostFirst.slice(0, 10),
    mostEnglishTop3Agents: placement.mostTop3.slice(0, 10),
    englishTeamWinners: buildTeamWinnerCounts(cleanTeamRows, 'english').slice(0, 10),
    spanishTeamWinners: buildTeamWinnerCounts(cleanTeamRows, 'spanish').slice(0, 10),
    totalTeamWinners: buildTeamWinnerCounts(cleanTeamRows, 'total').slice(0, 10),
    weeklyTeams: buildTeamWeeklyInsights(cleanAgentRows, cleanTeamRows),
  }
}

function agentMatchesSearch(agent, query) {
  if (!query) return true
  const name = normalizeSearchText(agent?.name)
  const ext = normalizeSearchText(agent?.ext)
  return name.includes(query) || ext.includes(query)
}

function teamMatchesSearch(team, query) {
  if (!query) return true
  const label = normalizeSearchText(team?.label)
  const short = normalizeSearchText(team?.short)
  const id = normalizeSearchText(team?.id)
  return label.includes(query) || short.includes(query) || id.includes(query)
}

function filterParsedBySearch(parsed, query) {
  if (!parsed || !query) return parsed
  return {
    ...parsed,
    agents: (parsed.agents || []).filter(agent => agentMatchesSearch(agent, query)),
  }
}

function buildSearchSuggestions(teamData, query) {
  const q = normalizeSearchText(query)
  if (!q) return []

  const suggestions = []

  TEAM_ORDER.forEach(teamId => {
    const team = TEAMS[teamId]
    const parsed = teamData?.[teamId]
    const teamLabel = normalizeSearchText(team?.label)
    const teamShort = normalizeSearchText(team?.short)
    const teamKey = normalizeSearchText(teamId)

    if (teamLabel.includes(q) || teamShort.includes(q) || teamKey.includes(q)) {
      suggestions.push({
        type: 'team',
        id: teamId,
        label: team.label,
        sub: 'Team',
        icon: team.flag ? '🌐' : '🌎',
      })
    }

    ;(parsed?.agents || []).forEach(agent => {
      const name = normalizeSearchText(agent?.name)
      const ext = normalizeSearchText(agent?.ext)

      if (name.includes(q) || ext.includes(q)) {
        suggestions.push({
          type: 'agent',
          id: agent.ext,
          label: agent.name,
          sub: `${agent.ext} • ${team.label}`,
          icon: '👤',
        })
      }
    })
  })

  return suggestions.slice(0, 8)
}

function LovableSidebar({ collapsed, activeItem, onNavigate }) {
  return (
    <aside className={`lov-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="lov-brand">
        <div className="lov-brand-glow" />
        <span>Pulse</span>
      </div>

      <div className="lov-sidebar-scroll">
        {SIDEBAR_GROUPS.map(group => (
          <div className="lov-sidebar-group" key={group.title}>
            <div className="lov-sidebar-title">{group.title}</div>

            <div className="lov-sidebar-list">
              {group.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  className={`lov-sidebar-item ${activeItem === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item)}
                >
                  <span className="lov-sidebar-icon">{item.icon}</span>
                  <span className="lov-sidebar-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="lov-sidebar-status">
        <div className="lov-status-dot-row">
          <span className="lov-status-dot" />
          <strong>Pulse GO active</strong>
        </div>
        <span>All systems nominal</span>
      </div>
    </aside>
  )
}

function LovableHeader({
  sidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  suggestions = [],
  onSuggestionClick,
  userMenuOpen,
  onToggleUserMenu,
  onUserAction,
}) {
  return (
    <header className="lov-header">
      <button
        type="button"
        className={`lov-icon-btn lov-menu-toggle ${sidebarCollapsed ? 'active' : ''}`}
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        ☰
      </button>

      <div className="lov-search-wrap">
        <div className="lov-search">
          <span className="lov-search-icon">⌕</span>
          <input
            value={searchQuery}
            placeholder="Search agent name or extension..."
            onChange={event => onSearchChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') onSearchSubmit()
            }}
          />

          {searchQuery ? (
            <button
              type="button"
              className="lov-search-clear"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        {searchQuery && suggestions.length > 0 ? (
          <div className="lov-search-suggestions">
            {suggestions.map(item => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="lov-search-suggestion"
                onClick={() => onSuggestionClick(item)}
              >
                <span className="lov-suggestion-icon">{item.icon}</span>
                <span className="lov-suggestion-text">
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </span>
                <span className="lov-suggestion-action">
                  {item.type === 'agent' ? 'Open profile' : 'Open team'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="lov-live-pill">● Today — LIVE</div>

      <nav className="lov-nav-pill">
        <button type="button" className="active">Home</button>
        <button type="button">Pulse GO</button>
        <button type="button">Academy</button>
      </nav>

      <div className="lov-header-actions">
        <button type="button" className="lov-icon-btn">◔</button>
        <button type="button" className="lov-icon-btn">🔔</button>

        <div className="lov-user-wrap">
          <button type="button" className="lov-user" onClick={onToggleUserMenu}>
            <div>
              <strong>Simon</strong>
              <span>Asia · Team Leader</span>
            </div>
            <div className="lov-avatar">SM</div>
          </button>

          {userMenuOpen ? (
            <div className="lov-user-menu">
              <button type="button" onClick={() => onUserAction('profile')}>👤 Profile</button>
              <button type="button" onClick={() => onUserAction('settings')}>⚙️ Settings</button>
              <button type="button" onClick={() => onUserAction('logout')}>🚪 Log out</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function TeamTabs({ selectedTeam, onChange }) {
  return (
    <div className="pulse-tabs-grid">
      <button className={`pulse-tab ${selectedTeam === 'all' ? 'active' : ''}`} onClick={() => onChange('all')}>
        <span>All Teams</span>
      </button>

      {TEAM_ORDER.map(teamId => {
        const team = TEAMS[teamId]
        const active = selectedTeam === teamId

        return (
          <button key={teamId} className={`pulse-tab ${active ? 'active' : ''}`} onClick={() => onChange(teamId)}>
            <FlagImg src={team.flag} size={18} alt="" />
            <span>{team.short}</span>
          </button>
        )
      })}
    </div>
  )
}

function SortTabs({ sortMetric, onChange }) {
  return (
    <div className="pulse-sort-tabs">
      {SORT_OPTIONS.map(option => (
        <button
          key={option.id}
          className={`pulse-sort-tab ${sortMetric === option.id ? 'active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function DateSelectorRow({ dates = [], selectedDate, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = event => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const groupedDates = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const groups = []
    const groupMap = new Map()

    ;(dates || []).forEach(date => {
      const normalized = normalizeDate(date)
      if (!normalized) return

      const key = normalized.slice(0, 7)
      const label = normalized === todayKey()
        ? 'Today'
        : monthFormatter.format(new Date(`${normalized}T12:00:00Z`))

      if (!groupMap.has(key)) {
        const group = { key, label, dates: [] }
        groupMap.set(key, group)
        groups.push(group)
      }

      groupMap.get(key).dates.push(normalized)
    })

    return groups
  }, [dates])

  return (
    <section
      className="lov-date-row"
      ref={wrapRef}
      style={{
        alignItems: 'center',
        overflow: 'visible',
        flexWrap: 'nowrap',
        paddingBottom: 0,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <button
        type="button"
        className="lov-date-btn active"
        onClick={() => setOpen(prev => !prev)}
        style={{
          minWidth: 190,
          justifyContent: 'space-between',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>{formatDateLabel(selectedDate)}</span>
        <span style={{ fontSize: 14, opacity: 0.8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            width: 310,
            maxHeight: 420,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 12,
            borderRadius: 18,
            border: '1px solid rgba(255, 138, 42, 0.35)',
            background: 'linear-gradient(180deg, rgba(20, 12, 7, 0.98), rgba(8, 6, 5, 0.98))',
            boxShadow: '0 22px 60px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 4px 10px',
              color: '#f7eee7',
              fontWeight: 800,
            }}
          >
            <span>Select day</span>
            <span style={{ color: '#8f8178', fontSize: 12 }}>{dates.length} days</span>
          </div>

          {groupedDates.map(group => (
            <div key={group.key} style={{ marginBottom: 12 }}>
              <div
                style={{
                  color: '#8f8178',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  margin: '4px 4px 8px',
                }}
              >
                {group.label}
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {group.dates.map(date => {
                  const active = date === selectedDate

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        onChange(date)
                        setOpen(false)
                      }}
                      style={{
                        width: '100%',
                        border: active ? '1px solid rgba(255, 138, 42, 0.9)' : '1px solid rgba(255,255,255,0.08)',
                        background: active ? 'rgba(255, 138, 42, 0.18)' : 'rgba(255,255,255,0.035)',
                        color: active ? '#ff9b3d' : '#f7eee7',
                        borderRadius: 12,
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: active ? 800 : 600,
                      }}
                    >
                      {formatDateLabel(date)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function TeamOverviewCard({ team, parsed, sortMetric, onOpen, rankIndex = 0 }) {
  const topThree = sortAgentsByMetric(parsed.agents, sortMetric).slice(0, 3)
  const teamRankIcon = TEAM_RANK_EMOJIS[rankIndex] || null

  return (
    <div className="pulse-team-card" onClick={() => onOpen(team.id)}>
      <div className="pulse-team-card-top">
        <div className="pulse-team-rank-badge">
          {teamRankIcon ? (
            <img src={teamRankIcon} alt={`#${rankIndex + 1}`} width={28} height={28} style={{ objectFit: 'contain' }} />
          ) : (
            <span className="pulse-team-rank-text">#{rankIndex + 1}</span>
          )}
        </div>

        <div className="pulse-team-title-wrap">
          <FlagImg src={team.flag} size={24} alt="" />
          <div>
            <div className="pulse-team-name">{team.label}</div>
            <div className="pulse-team-sub">{parsed.totals.activeAgents} active agents • {parsed.isFinal ? 'Official' : 'Live'}</div>
          </div>
        </div>

        <div className="pulse-team-metric">
          <div className="pulse-team-metric-label">{SORT_OPTIONS.find(opt => opt.id === sortMetric)?.label}</div>
          <div className="pulse-team-metric-value">{Number(parsed.totals[sortMetric] || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="pulse-team-stats-grid">
        <div><span className="stat-k blue">English</span><span className="stat-v blue">{parsed.totals.english.toLocaleString()}</span></div>
        <div><span className="stat-k green">Spanish</span><span className="stat-v green">{parsed.totals.spanish.toLocaleString()}</span></div>
        <div><span className="stat-k red">Invalid</span><span className="stat-v red">{Number(parsed.invalidTransfers || 0).toLocaleString()}</span></div>
        <div><span className="stat-k orange">Total</span><span className="stat-v orange">{parsed.totals.total.toLocaleString()}</span></div>
      </div>

      <div className="pulse-top3-list">
        {topThree.map((agent, index) => (
          <div key={`${team.id}-${agent.ext}`} className="pulse-top3-item">
            <Medal index={index} size={17} />
            <span className="pulse-top3-name">{agent.name}</span>
            <span className="pulse-top3-val">{agent[sortMetric]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamComingSoonCard({ team }) {
  return (
    <div className="pulse-team-card pulse-coming-soon">
      <div className="pulse-team-title-wrap">
        <FlagImg src={team?.flag} size={24} alt="" />
        <div>
          <div className="pulse-team-name">{team?.label || 'Team'}</div>
          <div className="pulse-team-sub">No data loaded yet for this team.</div>
        </div>
      </div>
    </div>
  )
}

function AgentTable({ team, agents, navigate }) {
  const displayAgents = sortAgentsByMetric(agents, 'english')

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{team.label} agents</div>

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Ext</th>
              <th className="th-spanish">Spanish</th>
              <th className="th-english">English</th>
              <th className="th-invalid">Invalid xfers</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {displayAgents.map((agent, index) => (
              <tr key={agent.ext}>
                <td>{index + 1}</td>
                <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td>#{agent.ext}</td>
                <td className="green">{agent.spanish}</td>
                <td className="blue">{agent.english}</td>
                <td className="red">{agent.invalidTransfers || 0}</td>
                <td className="orange">{agent.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TopRow({ title, metric, agents }) {
  const top = sortAgentsByMetric(agents, metric).slice(0, 3)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">{title}</div>

      {top.map((agent, index) => (
        <div key={`${metric}-${agent.ext}`} className="pulse-top-block-item">
          <Medal index={index} size={19} />
          <span className="pulse-top-block-name">{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value">{agent[metric]}</span>
        </div>
      ))}
    </div>
  )
}

function TeamDetail({ team, parsed, selectedDate, navigate }) {
  const reachedTarget = (parsed.agents || []).filter(agent => agentReachedGoal({ ...agent, teamId: team.id, date: selectedDate })).length
  const invalidTransfers = Number(parsed.invalidTransfers || 0)

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">{formatDateLabel(selectedDate)} • {parsed.isFinal ? 'Official snapshot' : 'Live snapshot'}</div>

          <div className="pulse-hero-title-row">
            <FlagImg src={team.flag} size={28} alt="" />
            <div className="pulse-hero-title">{team.label}</div>
          </div>

          <div className="pulse-hero-sub">
            {parsed.totals.activeAgents} active agents • {getGoalRuleLabel(team.id, selectedDate)}
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard title="English" value={parsed.totals.english} color="#60a5fa" titleColor="#60a5fa" />
        <SummaryCard title="Spanish" value={parsed.totals.spanish} color="#34d399" titleColor="#34d399" />
        <SummaryCard title="Invalid xfers" value={invalidTransfers} color="#f87171" titleColor="#f87171" />
        <SummaryCard title="Total" value={parsed.totals.total} color="#f59e0b" titleColor="#f59e0b" subtitle={`Raw: ${parsed.totals.rawTotal || parsed.totals.total}`} />
        <SummaryCard title="Reached target" value={reachedTarget} color="#22c55e" titleColor="#22c55e" subtitle={getGoalRuleLabel(team.id, selectedDate)} />
        <SummaryCard title="Active agents" value={parsed.totals.activeAgents} color="#c084fc" titleColor="#c084fc" />
      </div>

      <div className="pulse-top-blocks-grid">
        <TopRow title="Top English" metric="english" agents={parsed.agents} />
        <TopRow title="Top Spanish" metric="spanish" agents={parsed.agents} />
        <TopRow title="Top Total" metric="total" agents={parsed.agents} />
      </div>

      <AgentTable team={team} agents={parsed.agents} navigate={navigate} />
    </>
  )
}

function RankingTopBlock({ title, metric, rows = [], navigate }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">{title}</div>

      {rows.slice(0, 5).map((agent, index) => (
        <div key={`${title}-${agent.ext}-${index}`} className="pulse-top-block-item">
          <RankMarker index={index} />
          <span className="pulse-top-block-name linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value" style={{ color }}>{Number(agent?.[metric] || 0).toLocaleString()}</span>
        </div>
      ))}

      {!rows.length ? <div className="pulse-summary-subtitle">No ranking data available yet.</div> : null}
    </div>
  )
}

function AgentRankingTable({ title, subtitle, rows = [], metric = 'english', navigate }) {
  const highlightColor = getMetricColor(metric)

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      {subtitle ? <div className="pulse-summary-subtitle" style={{ margin: '0 0 12px' }}>{subtitle}</div> : null}

      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent</th>
              <th>Team</th>
              <th>Ext</th>
              <th className="th-english">English</th>
              <th className="th-spanish">Spanish</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((agent, index) => (
              <tr key={`${title}-${agent.ext}-${index}`}>
                <td><RankMarker index={index} /></td>
                <td className="linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                <td>#{agent.ext}</td>
                <td className="blue" style={{ fontWeight: metric === 'english' ? 950 : 700, color: metric === 'english' ? highlightColor : undefined }}>{Number(agent.english || 0).toLocaleString()}</td>
                <td className="green" style={{ fontWeight: metric === 'spanish' ? 950 : 700, color: metric === 'spanish' ? highlightColor : undefined }}>{Number(agent.spanish || 0).toLocaleString()}</td>
                <td className="orange" style={{ fontWeight: metric === 'total' ? 950 : 700 }}>{Number(agent.total || 0).toLocaleString()}</td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan="7">No ranking data available yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EnglishPlacementTable({ title, subtitle, rows = [], loading, error, navigate, mode = 'first' }) {
  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      {subtitle ? <div className="pulse-summary-subtitle" style={{ margin: '0 0 12px' }}>{subtitle}</div> : null}

      {loading ? <div className="pulse-loading">Loading ranking history...</div> : null}
      {error ? <div className="pulse-error">{error}</div> : null}

      {!loading && !error ? (
        <div className="pulse-table-scroll">
          <table className="pulse-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Team</th>
                <th>Ext</th>
                <th>#1 Days</th>
                <th>Top 3 Days</th>
                <th>Best English</th>
                <th>Best Day</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((agent, index) => (
                <tr key={`${mode}-${agent.ext}-${index}`}>
                  <td><RankMarker index={index} /></td>
                  <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                  <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                  <td>#{agent.ext}</td>
                  <td className="orange">{Number(agent.firstPlaces || 0).toLocaleString()}</td>
                  <td className="green">{Number(agent.top3Days || 0).toLocaleString()}</td>
                  <td className="blue">{Number(agent.bestEnglish || 0).toLocaleString()}</td>
                  <td>{agent.bestDate ? formatDateLabel(agent.bestDate) : 'N/A'}</td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan="8">No English placement history available yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function GoalAchievementTable({ title, rows = [], loading, error, navigate }) {
  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      <div className="pulse-summary-subtitle" style={{ margin: '0 0 12px' }}>
        Goal days: Monday-Friday uses English target (Asia 20, all other teams 10). Saturday uses 10 Total transfers for everyone.
      </div>

      {loading ? <div className="pulse-loading">Loading goal history...</div> : null}
      {error ? <div className="pulse-error">{error}</div> : null}

      {!loading && !error ? (
        <div className="pulse-table-scroll">
          <table className="pulse-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Team</th>
                <th>Ext</th>
                <th>Goal Days</th>
                <th>Total ENG</th>
                <th>Best ENG</th>
                <th>Best Day</th>
              </tr>
            </thead>

            <tbody>
              {rows.slice(0, 10).map((agent, index) => (
                <tr key={`goal-${agent.ext}-${index}`}>
                  <td><RankMarker index={index} /></td>
                  <td className="linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                  <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                  <td>#{agent.ext}</td>
                  <td className="orange" style={{ fontWeight: 950 }}>{Number(agent.goalDays || 0).toLocaleString()}</td>
                  <td className="blue">{Number(agent.english || 0).toLocaleString()}</td>
                  <td className="blue">{Number(agent.bestEnglish || 0).toLocaleString()}</td>
                  <td>{agent.bestDate ? formatDateLabel(agent.bestDate) : 'N/A'}</td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan="8">No goal data available yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function TeamWinnerTable({ title, rows = [], metric }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-table-wrap">
      <div className="pulse-table-title">{title}</div>
      <div className="pulse-table-scroll">
        <table className="pulse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>#1 Days</th>
              <th>Best {getMetricLabel(metric)}</th>
              <th>Best Total</th>
              <th>Best Day</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((team, index) => (
              <tr key={`${title}-${team.teamId}-${index}`}>
                <td><RankMarker index={index} /></td>
                <td><TeamInlineLabel teamId={team.teamId} teamFlag={team.teamFlag} teamLabel={team.teamLabel} /></td>
                <td className="orange">{Number(team.wins || 0).toLocaleString()}</td>
                <td style={{ color, fontWeight: 950 }}>{Number(team.bestValue || 0).toLocaleString()}</td>
                <td className="orange">{Number(team.bestTotal || 0).toLocaleString()}</td>
                <td>{team.bestDate ? formatDateLabel(team.bestDate) : 'N/A'}</td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan="6">No team ranking history available yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RankingsPage({ history, historyLoading, historyError, navigate }) {
  const rankingAgents = history?.allTimeAgents || []

  const topEnglish = useMemo(() => sortAgentsByMetric(rankingAgents, 'english').slice(0, 10), [rankingAgents])
  const topSpanish = useMemo(() => sortAgentsByMetric(rankingAgents, 'spanish').slice(0, 10), [rankingAgents])
  const goalAgents = history?.topGoalAchievementAgents || []

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">All Time</div>
          <div className="pulse-hero-title-row">
            <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
            <div className="pulse-hero-title">Rankings</div>
          </div>
          <div className="pulse-hero-sub">
            Goal days are sorted by the highest number of days on target. Asia uses 20 ENG Monday-Friday; all other teams use 10 ENG Monday-Friday; Saturday uses 10 Total for everyone.
          </div>
        </div>
      </div>

      <div className="pulse-top-blocks-grid">
        <RankingTopBlock title="Top English" metric="english" rows={topEnglish} navigate={navigate} />
        <RankingTopBlock title="Top Spanish" metric="spanish" rows={topSpanish} navigate={navigate} />
        <RankingTopBlock title="Most Goal Days" metric="goalDays" rows={goalAgents} navigate={navigate} />
      </div>

      {historyLoading ? <div className="pulse-loading">Loading rankings...</div> : null}
      {historyError ? <div className="pulse-error">{historyError}</div> : null}

      {!historyLoading && !historyError ? (
        <>
          <AgentRankingTable
            title="🔵 Top 10 English Xfers"
            subtitle=""
            rows={topEnglish}
            metric="english"
            navigate={navigate}
          />

          <AgentRankingTable
            title="🟢 Top 10 Spanish Xfers"
            subtitle=""
            rows={topSpanish}
            metric="spanish"
            navigate={navigate}
          />

          <GoalAchievementTable
            title="🎯 Top 10 Most Goal Days"
            rows={goalAgents}
            loading={false}
            error=""
            navigate={navigate}
          />
        </>
      ) : null}
    </>
  )
}

function flattenAgentsForRankings(teamData) {
  const agents = []

  TEAM_ORDER.forEach(teamId => {
    const parsed = teamData?.[teamId]
    ;(parsed?.agents || []).forEach(agent => {
      if (!agent?.ext) return
      if (Number(agent.english || 0) <= 0 && Number(agent.spanish || 0) <= 0 && Number(agent.total || 0) <= 0) return

      agents.push({
        ...agent,
        teamId,
        teamLabel: getTeamName(teamId),
        teamFlag: getTeamFlag(teamId),
      })
    })
  })

  return agents
}

function buildCurrentTeamRankings(teamData, metric = 'total') {
  return TEAM_ORDER
    .map(teamId => {
      const parsed = teamData?.[teamId]
      if (!parsed) return null

      return {
        teamId,
        teamLabel: getTeamName(teamId),
        teamFlag: getTeamFlag(teamId),
        english: Number(parsed?.totals?.english || 0),
        spanish: Number(parsed?.totals?.spanish || 0),
        invalidTransfers: Number(parsed?.invalidTransfers || 0),
        total: Number(parsed?.totals?.total || 0),
        activeAgents: Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0),
        value: Number(metric === 'invalid' ? parsed?.invalidTransfers || 0 : parsed?.totals?.[metric] || 0),
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const metricDiff = Number(b?.value || 0) - Number(a?.value || 0)
      if (metricDiff !== 0) return metricDiff
      return Number(b?.total || 0) - Number(a?.total || 0)
    })
}

function MiniAgentList({ title, rows = [], metric = 'english', navigate }) {
  const color = getMetricColor(metric)

  return (
    <div className="pulse-top-block">
      <div className="pulse-top-block-title">{title}</div>

      {rows.slice(0, 5).map((agent, index) => (
        <div key={`${title}-${agent.ext}-${index}`} className="pulse-top-block-item">
          <RankMarker index={index} />
          <span className="pulse-top-block-name linkish" style={{ fontWeight: 400 }} onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value" style={{ color }}>
            {metric === 'goalDays'
              ? `${Number(agent.goalDays || 0)}x`
              : metric === 'lowestXfers'
                ? Number(agent.lowestXfers ?? agent.weekXfers ?? agent.total ?? 0).toLocaleString()
                : Number(agent?.[metric] || 0).toLocaleString()}
          </span>
        </div>
      ))}

      {!rows.length ? <div className="pulse-summary-subtitle">No data for this week yet.</div> : null}
    </div>
  )
}

function TeamWeeklyCard({ teamInsight, navigate }) {
  const week = teamInsight.thisWeek
  const previous = teamInsight.lastWeek
  const englishDiff = Number(week?.totals?.english || 0) - Number(previous?.totals?.english || 0)
  const totalDiff = Number(week?.totals?.total || 0) - Number(previous?.totals?.total || 0)

  return (
    <div className="pulse-table-wrap pulse-team-card">
      <div className="pulse-team-card-header">
        <FlagImg src={teamInsight.teamFlag} size={24} alt="" />
        <div className="pulse-team-name">{teamInsight.teamLabel}</div>
      </div>

      <div className="pulse-summary-grid pulse-team-summary-grid">
        <SummaryCard title="Week English" value={week.totals.english} color="#38bdf8" titleColor="#38bdf8" subtitle={`${englishDiff >= 0 ? '+' : ''}${englishDiff.toLocaleString()} vs last week`} />
        <SummaryCard title="Week Spanish" value={week.totals.spanish} color="#34d399" titleColor="#34d399" subtitle={`${week.totals.daysTracked || 0} days tracked`} />
        <SummaryCard title="Week Total" value={week.totals.total} color="#ff8a2a" titleColor="#ff8a2a" subtitle={`${totalDiff >= 0 ? '+' : ''}${totalDiff.toLocaleString()} vs last week`} />
        <SummaryCard title="Active Agents" value={week.totals.activeAgents} color="#c084fc" titleColor="#c084fc" subtitle="Max active count this week" />
      </div>

      <div className="pulse-team-week-grid">
        <MiniAgentList title="Top English" rows={week.topEnglish} metric="english" navigate={navigate} />
        <MiniAgentList title="Top Total" rows={week.topTotal} metric="total" navigate={navigate} />
        <MiniAgentList title="Goal Days" rows={week.goalLeaders} metric="goalDays" navigate={navigate} />
        <MiniAgentList title="Lowest Xfers" rows={week.lowestActive} metric="lowestXfers" navigate={navigate} />
      </div>
    </div>
  )
}

function TeamsInsightsPage({ history, historyLoading, historyError, navigate }) {
  const teams = history?.weeklyTeams || []

  return (
    <section className="pulse-teams-list">
      {historyLoading ? <div className="pulse-loading">Loading team history...</div> : null}
      {historyError ? <div className="pulse-error">{historyError}</div> : null}

      {!historyLoading && !historyError ? (
        teams.map(teamInsight => (
          <TeamWeeklyCard key={teamInsight.teamId} teamInsight={teamInsight} navigate={navigate} />
        ))
      ) : null}
    </section>
  )
}

function DashboardResponsivePolishStyle() {
  return (
    <style>{`
      .lov-content {
        width: 100%;
        max-width: 1540px;
        margin-left: auto;
        margin-right: auto;
        box-sizing: border-box;
      }

      .lov-kpi-grid-main {
        width: min(100%, 1280px);
        margin: 0 auto 18px !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(170px, 1fr)) !important;
        gap: 16px !important;
        align-items: stretch;
        justify-content: center;
      }

      .lov-kpi-grid-main .lov-kpi-card,
      .pulse-team-summary-grid .pulse-summary-card {
        min-width: 0;
        width: 100%;
        box-sizing: border-box;
      }

      .pulse-teams-list {
        width: min(100%, 1380px);
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .pulse-team-card {
        width: 100%;
        box-sizing: border-box;
        margin: 0 !important;
        padding: 18px 20px 20px !important;
        overflow: hidden;
      }

      .pulse-team-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 14px;
        padding-left: 8px;
      }

      .pulse-team-card-header img,
      .pulse-team-card-header span:first-child {
        flex: 0 0 auto;
      }

      .pulse-team-summary-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(170px, 1fr)) !important;
        gap: 14px !important;
        margin: 0 0 14px !important;
        width: 100%;
      }

      .pulse-team-week-grid {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(210px, 1fr)) !important;
        gap: 14px !important;
        width: 100%;
        align-items: stretch;
      }

      .pulse-team-week-grid .pulse-top-block {
        min-width: 0;
        height: 100%;
        box-sizing: border-box;
        margin: 0 !important;
      }

      .pulse-top-block-item {
        min-width: 0;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
      }

      .pulse-top-block-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 400 !important;
      }

      .pulse-top-block-title,
      .pulse-summary-title,
      .lov-kpi-title,
      .pulse-table-title {
        font-weight: 800 !important;
      }

      .pulse-table td,
      .pulse-table .linkish,
      .pulse-top-block-name,
      .pulse-top3-name {
        font-weight: 400 !important;
      }

      .pulse-table th {
        font-weight: 800 !important;
      }

      .pulse-hero-sub:empty,
      .pulse-summary-subtitle:empty {
        display: none;
      }

      @media (max-width: 1250px) {
        .lov-kpi-grid-main,
        .pulse-team-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        .pulse-team-week-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 720px) {
        .lov-content {
          padding-left: 14px !important;
          padding-right: 14px !important;
        }

        .lov-kpi-grid-main,
        .pulse-team-summary-grid,
        .pulse-team-week-grid {
          grid-template-columns: 1fr !important;
          width: 100%;
        }

        .pulse-team-card {
          padding: 16px 14px !important;
          border-radius: 22px;
        }

        .pulse-team-card-header {
          padding-left: 4px;
        }
      }
    `}</style>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(todayKey())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [sortMetric, setSortMetric] = useState('english')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamData, setTeamData] = useState({})
  const [remoteDates, setRemoteDates] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [rangeMode, setRangeMode] = useState('all_time')
  const [activeView, setActiveView] = useState('overview')
  const [historyState, setHistoryState] = useState({ insights: null, loading: false, error: '' })

  const isToday = selectedDate === todayKey()
  const selectedDateRef = useRef(selectedDate)
  const teamDataRef = useRef({})

  const setSelectedDateSafe = useCallback(date => {
    selectedDateRef.current = date
    setSelectedDate(date)
  }, [])

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

  useEffect(() => {
    teamDataRef.current = teamData
  }, [teamData])

  const loadRemoteDates = useCallback(async () => {
    const dates = await fetchSupabaseDates()
    setRemoteDates(dates)
  }, [])

  const loadDashboardDate = useCallback(async date => {
    setError('')
    const supabaseData = await fetchSupabaseDashboardDate(date)
    setTeamData(supabaseData)
    setLastUpdate(date === todayKey() ? new Date() : null)
  }, [])

  const loadToday = useCallback(async () => {
    await loadDashboardDate(todayKey())
    loadRemoteDates().catch(() => {})
  }, [loadDashboardDate, loadRemoteDates])

  const loadHistory = useCallback(async () => {
    setHistoryState(prev => ({ ...prev, loading: true, error: '' }))

    try {
      const insights = await fetchHistoryRows()
      setHistoryState({ insights, loading: false, error: '' })
    } catch (err) {
      console.error('Failed loading history:', err)
      setHistoryState({
        insights: null,
        loading: false,
        error: String(err?.message || err || 'Failed loading history'),
      })
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const requestedDate = selectedDate

    const run = async () => {
      selectedDateRef.current = requestedDate
      setLoading(true)
      setError('')
      teamDataRef.current = {}
      setTeamData({})

      try {
        await loadDashboardDate(requestedDate)
      } catch (err) {
        if (!cancelled) setError(String(err?.message || err || 'Failed to load dashboard data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [selectedDate, loadDashboardDate])

  useEffect(() => {
    loadRemoteDates().catch(() => {})
  }, [loadRemoteDates])

  useEffect(() => {
    if (activeView !== 'rankings' && activeView !== 'teams' && activeView !== 'analytics') return
    if (historyState.loading || historyState.insights) return
    loadHistory().catch(() => {})
  }, [activeView, historyState.insights, historyState.loading, loadHistory])

  useEffect(() => {
    if (!isToday) return

    let cancelled = false
    let timer = null

    const scheduleNext = () => {
      if (cancelled) return

      timer = window.setTimeout(async () => {
        try {
          await loadToday()
        } catch (err) {
          console.warn('Live refresh failed:', err)
        } finally {
          scheduleNext()
        }
      }, POLL_MS)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [isToday, loadToday])

  const dateTabs = useMemo(() => {
    const set = new Set([todayKey(), ...remoteDates])
    return [...set].filter(date => date >= CLEAN_START_DATE).sort((a, b) => b.localeCompare(a))
  }, [remoteDates])

  const allTeamCards = useMemo(() => {
    const liveCards = TEAM_ORDER
      .filter(teamId => teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: teamData[teamId] }))
      .sort((a, b) => {
        const diff = (b.parsed?.totals?.[sortMetric] || 0) - (a.parsed?.totals?.[sortMetric] || 0)
        if (diff !== 0) return diff
        return (b.parsed?.totals?.total || 0) - (a.parsed?.totals?.total || 0)
      })

    const missingCards = TEAM_ORDER
      .filter(teamId => !teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: null }))

    return [...liveCards, ...missingCards]
  }, [sortMetric, teamData])

  const selectedParsed = selectedTeam !== 'all' ? teamData[selectedTeam] : null
  const selectedTeamMeta = selectedTeam !== 'all' ? TEAMS[selectedTeam] : null

  const dashboardTotals = useMemo(() => {
    if (activeView === 'teams') {
      const weeklyTeams = historyState.insights?.weeklyTeams || []

      return weeklyTeams.reduce((acc, teamInsight) => {
        const totals = teamInsight?.thisWeek?.totals || {}
        acc.english += Number(totals.english || 0)
        acc.spanish += Number(totals.spanish || 0)
        acc.invalid += Number(totals.invalidTransfers || 0)
        acc.total += Number(totals.total || 0)
        acc.activeAgents += Number(totals.activeAgents || 0)
        return acc
      }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
    }

    if ((activeView === 'rankings' || activeView === 'analytics') && rangeMode === 'all_time') {
      const allTimeAgents = historyState.insights?.allTimeAgents || []

      return allTimeAgents.reduce((acc, agent) => {
        acc.english += Number(agent?.english || 0)
        acc.spanish += Number(agent?.spanish || 0)
        acc.invalid += Number(agent?.invalidTransfers || 0)
        acc.total += Number(agent?.total || 0)
        acc.activeAgents += 1
        return acc
      }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
    }

    const source = selectedTeam === 'all'
      ? TEAM_ORDER.map(teamId => teamData[teamId]).filter(Boolean)
      : selectedParsed
        ? [selectedParsed]
        : []

    return source.reduce((acc, parsed) => {
      acc.english += Number(parsed?.totals?.english || 0)
      acc.spanish += Number(parsed?.totals?.spanish || 0)
      acc.invalid += Number(parsed?.invalidTransfers || 0)
      acc.total += Number(parsed?.totals?.total || 0)
      acc.activeAgents += Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0)
      return acc
    }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
  }, [activeView, historyState.insights, rangeMode, selectedParsed, selectedTeam, teamData])

  const normalizedSearch = useMemo(() => normalizeSearchText(searchQuery), [searchQuery])

  const visibleAllTeamCards = useMemo(() => {
    if (!normalizedSearch) return allTeamCards

    return allTeamCards
      .map(({ team, parsed }) => {
        const teamMatch = teamMatchesSearch(team, normalizedSearch)

        if (!parsed) return teamMatch ? { team, parsed } : null

        const filteredParsed = filterParsedBySearch(parsed, normalizedSearch)
        const hasAgentMatches = (filteredParsed?.agents || []).length > 0
        if (!teamMatch && !hasAgentMatches) return null

        return { team, parsed: teamMatch ? parsed : filteredParsed }
      })
      .filter(Boolean)
  }, [allTeamCards, normalizedSearch])

  const selectedParsedForView = useMemo(() => {
    return filterParsedBySearch(selectedParsed, normalizedSearch)
  }, [selectedParsed, normalizedSearch])

  const searchSuggestions = useMemo(() => {
    return buildSearchSuggestions(teamData, searchQuery)
  }, [teamData, searchQuery])

  const activeSidebarItem = activeView === 'rankings'
    ? 'rankings'
    : activeView === 'teams'
      ? 'teams'
      : activeView === 'analytics'
        ? 'analytics'
        : selectedTeam === 'all'
          ? 'overview'
          : 'teams'

  const handleSidebarNavigate = useCallback(item => {
    if (item.id === 'overview') {
      setActiveView('overview')
      setSelectedTeam('all')
      setSelectedDateSafe(todayKey())
      setSortMetric('english')
      setRangeMode('day')
      setSearchQuery('')
      setUserMenuOpen(false)
      navigate('/dashboard')
      loadToday().catch(() => {})
      return
    }

    if (item.id === 'teams') {
      setActiveView('teams')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'rankings') {
      setActiveView('rankings')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'analytics') {
      setActiveView('teams')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'pulse-go') {
      navigate('/go')
      return
    }

    if (item.id === 'settings') {
      navigate('/settings')
      return
    }

    window.alert(`${item.label} is coming soon.`)
  }, [loadToday, navigate, setSelectedDateSafe])

  const handleTeamTabChange = useCallback(teamId => {
    setActiveView('overview')
    setRangeMode('day')
    setSelectedTeam(teamId)
  }, [])

  const handleSuggestionClick = useCallback(item => {
    if (!item) return

    if (item.type === 'agent') {
      setSearchQuery('')
      setUserMenuOpen(false)
      navigate(`/profile/${item.id}`)
      return
    }

    if (item.type === 'team') {
      setSearchQuery('')
      setUserMenuOpen(false)
      setActiveView('overview')
      setRangeMode('day')
      setSelectedTeam(item.id)
    }
  }, [navigate])

  const handleSearchSubmit = useCallback(() => {
    const first = searchSuggestions[0]
    if (first) handleSuggestionClick(first)
  }, [searchSuggestions, handleSuggestionClick])

  const handleUserAction = useCallback(action => {
    setUserMenuOpen(false)

    if (action === 'profile') {
      navigate('/profile/3134')
      return
    }

    if (action === 'settings') {
      navigate('/settings')
      return
    }

    if (action === 'logout') {
      localStorage.removeItem('pulse_user')
      navigate('/signin')
    }
  }, [navigate])

  return (
    <div className={`dash-root ${sidebarCollapsed ? 'lov-sidebar-collapsed' : ''}`}>
      <div className="lov-shell">
        <LovableSidebar
          collapsed={sidebarCollapsed}
          activeItem={activeSidebarItem}
          onNavigate={handleSidebarNavigate}
        />

        <div className="lov-main">
          <LovableHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            suggestions={searchSuggestions}
            onSuggestionClick={handleSuggestionClick}
            userMenuOpen={userMenuOpen}
            onToggleUserMenu={() => setUserMenuOpen(prev => !prev)}
            onUserAction={handleUserAction}
          />

          <main className="lov-content">
            <DashboardResponsivePolishStyle />
            {activeView !== 'rankings' ? (
              <section className="lov-hero" style={{ padding: '22px 28px' }}>
                <div className="lov-hero-left">
                  {activeView === 'teams' ? null : (
                    <div className="lov-hero-badge">
                      {selectedDate === todayKey()
                        ? '● Today — live data'
                        : `Saved snapshot · ${formatDateLabel(selectedDate)}`}
                    </div>
                  )}

                  <h1 className="lov-hero-title" style={{ fontSize: 34, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {activeView === 'teams' ? <span style={{ fontSize: 30, lineHeight: 1 }}>👥</span> : null}
                    {activeView === 'teams' ? 'Weekly Team Breakdown' : 'Overview'}
                  </h1>
                </div>
              </section>
            ) : null}

            {activeView !== 'rankings' ? (
              <section className="lov-kpi-grid lov-kpi-grid-main">
                <LovableKpi title="English" value={dashboardTotals.english} tone="blue" />
                <LovableKpi title="Spanish" value={dashboardTotals.spanish} tone="green" />
                <LovableKpi title="Invalid" value={dashboardTotals.invalid} tone="red" />
                <LovableKpi title="Total Xfers" value={dashboardTotals.total} tone="orange" />
              </section>
            ) : null}

            {activeView === 'overview' ? (
              <>
                <section className="lov-control-row">
                  <TeamTabs selectedTeam={selectedTeam} onChange={handleTeamTabChange} />
                  <SortTabs sortMetric={sortMetric} onChange={setSortMetric} />
                </section>

                <DateSelectorRow
                  dates={dateTabs}
                  selectedDate={selectedDate}
                  onChange={setSelectedDateSafe}
                />
              </>
            ) : null}

            {loading ? (
              <div className="pulse-loading">Loading team data...</div>
            ) : error ? (
              <div className="pulse-error">{error}</div>
            ) : activeView === 'teams' ? (
              <TeamsInsightsPage
                history={historyState.insights}
                historyLoading={historyState.loading}
                historyError={historyState.error}
                navigate={navigate}
              />
            ) : activeView === 'rankings' ? (
              <RankingsPage
                teamData={teamData}
                selectedDate={selectedDate}
                rangeMode={rangeMode}
                history={historyState.insights}
                historyLoading={historyState.loading}
                historyError={historyState.error}
                navigate={navigate}
              />
            ) : selectedTeam === 'all' ? (
              <div className="pulse-overview-grid">
                {visibleAllTeamCards.map(({ team, parsed }, index) => (
                  parsed
                    ? (
                      <TeamOverviewCard
                        key={team.id}
                        team={team}
                        parsed={parsed}
                        sortMetric={sortMetric}
                        onOpen={teamId => {
                          setActiveView('overview')
                          setRangeMode('day')
                          setSelectedTeam(teamId)
                        }}
                        rankIndex={index}
                      />
                    )
                    : <TeamComingSoonCard key={team.id} team={team} />
                ))}
              </div>
            ) : selectedParsed && selectedTeamMeta ? (
              <TeamDetail
                team={selectedTeamMeta}
                parsed={selectedParsedForView}
                selectedDate={selectedDate}
                navigate={navigate}
              />
            ) : (
              <TeamComingSoonCard team={TEAMS[selectedTeam]} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
