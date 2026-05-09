import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './dashboard.css'

const CLEAN_START_DATE = '2026-04-23'
const OFFICIAL_DATA_START = '2026-04-28'
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

async function fetchHistoryRows() {
  const [agentResult, teamResult] = await Promise.all([
    supabase
      .from('pulse_agent_daily_clean')
      .select('*')
      .gte('date', OFFICIAL_DATA_START)
      .order('date', { ascending: false })
      .range(0, 49999),

    supabase
      .from('pulse_team_daily_clean')
      .select('*')
      .gte('date', OFFICIAL_DATA_START)
      .order('date', { ascending: false })
      .range(0, 9999),
  ])

  if (agentResult.error) throw agentResult.error
  if (teamResult.error) throw teamResult.error

  return buildHistoryInsights(agentResult.data || [], teamResult.data || [])
}

function buildAllTimeAgentRankings(agentRows = []) {
  const byAgent = new Map()

  agentRows
    .map(normalizeSupabaseAgent)
    .filter(agent => agent.date && agent.ext && (agent.english > 0 || agent.spanish > 0 || agent.total > 0))
    .forEach(agent => {
      const current = byAgent.get(agent.ext) || {
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
      if (Number(agent.english || 0) >= getTeamGoal(agent.teamId)) current.goalDays += 1

      if (Number(agent.english || 0) > current.bestEnglish) current.bestEnglish = Number(agent.english || 0)
      if (Number(agent.spanish || 0) > current.bestSpanish) current.bestSpanish = Number(agent.spanish || 0)
      if (Number(agent.total || 0) > current.bestTotal) {
        current.bestTotal = Number(agent.total || 0)
        current.bestDate = agent.date
      }

      byAgent.set(agent.ext, current)
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

  agentRows
    .map(normalizeSupabaseAgent)
    .filter(agent => agent.date && agent.ext && agent.english > 0)
    .forEach(agent => {
      if (!byDate.has(agent.date)) byDate.set(agent.date, [])
      byDate.get(agent.date).push(agent)
    })

  const byAgent = new Map()

  byDate.forEach((agents, date) => {
    const sorted = sortAgentsByMetric(agents, 'english')

    sorted.slice(0, 3).forEach((agent, index) => {
      const current = byAgent.get(agent.ext) || {
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

      byAgent.set(agent.ext, current)
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
  const agents = (agentRows || []).map(normalizeSupabaseAgent).filter(agent => agent.date && agent.ext && agent.teamId)
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
      const current = byAgent.get(agent.ext) || {
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
      }

      current.name = agent.name || current.name
      current.english += Number(agent.english || 0)
      current.spanish += Number(agent.spanish || 0)
      current.total += Number(agent.total || 0)
      current.activeDays += 1
      if (Number(agent.english || 0) >= goal) current.goalDays += 1

      if (Number(agent.english || 0) > current.bestEnglish) {
        current.bestEnglish = Number(agent.english || 0)
        current.bestDate = agent.date
      }

      byAgent.set(agent.ext, current)
    })

    const weekAgents = [...byAgent.values()].map(agent => ({
      ...agent,
      goalRate: agent.activeDays ? agent.goalDays / agent.activeDays : 0,
      avgEnglish: agent.activeDays ? agent.english / agent.activeDays : 0,
    }))

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
      goalLeaders: [...weekAgents].sort((a, b) => {
        const goalDiff = Number(b.goalDays || 0) - Number(a.goalDays || 0)
        if (goalDiff !== 0) return goalDiff
        return Number(b.english || 0) - Number(a.english || 0)
      }).slice(0, 10),
      lowestActive: [...weekAgents]
        .filter(agent => Number(agent.total || 0) > 0)
        .sort((a, b) => Number(a.total || 0) - Number(b.total || 0))
        .slice(0, 10),
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
      const rateDiff = Number(b.goalRate || 0) - Number(a.goalRate || 0)
      if (rateDiff !== 0) return rateDiff
      return Number(b.english || 0) - Number(a.english || 0)
    }).slice(0, 15),
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
  return (
    <section className="lov-date-row" style={{ alignItems: 'center', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 6 }}>
      <select
        value={selectedDate}
        onChange={event => onChange(event.target.value)}
        className="lov-date-btn active"
        style={{ minWidth: 180, cursor: 'pointer' }}
      >
        {dates.map(date => (
          <option key={date} value={date}>{formatDateLabel(date)}</option>
        ))}
      </select>

      {dates.map(date => {
        const active = date === selectedDate
        return (
          <button
            key={date}
            type="button"
            className={`lov-date-btn ${active ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}
            onClick={() => onChange(date)}
          >
            {formatDateLabel(date)}
          </button>
        )
      })}
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
  const reachedTarget = (parsed.agents || []).filter(agent => Number(agent.english || 0) >= getTeamGoal(team.id)).length
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
            {parsed.totals.activeAgents} active agents • Goal: {getTeamGoal(team.id)} English
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard title="English" value={parsed.totals.english} color="#60a5fa" titleColor="#60a5fa" />
        <SummaryCard title="Spanish" value={parsed.totals.spanish} color="#34d399" titleColor="#34d399" />
        <SummaryCard title="Invalid xfers" value={invalidTransfers} color="#f87171" titleColor="#f87171" />
        <SummaryCard title="Total" value={parsed.totals.total} color="#f59e0b" titleColor="#f59e0b" subtitle={`Raw: ${parsed.totals.rawTotal || parsed.totals.total}`} />
        <SummaryCard title="Reached target" value={reachedTarget} color="#22c55e" titleColor="#22c55e" subtitle={`Goal: ${getTeamGoal(team.id)} English`} />
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
          <span className="pulse-top-block-name linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value" style={{ color }}>{Number(agent?.[metric] || 0).toLocaleString()}</span>
        </div>
      ))}

      {!rows.length ? <div className="pulse-summary-subtitle">No ranking data available yet.</div> : null}
    </div>
  )
}

function AgentRankingTable({ title, subtitle, rows = [], metric = 'total', navigate }) {
  const showEnglish = metric === 'english' || metric === 'total'
  const showSpanish = metric === 'spanish' || metric === 'total'

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
              {showEnglish ? <th className="th-english">English</th> : null}
              {showSpanish ? <th className="th-spanish">Spanish</th> : null}
              <th className="th-invalid">Invalid</th>
              <th className="th-total">Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((agent, index) => (
              <tr key={`${title}-${agent.ext}-${index}`}>
                <td><RankMarker index={index} /></td>
                <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                <td>#{agent.ext}</td>
                {showEnglish ? <td className="blue" style={{ fontWeight: metric === 'english' ? 950 : 800 }}>{Number(agent.english || 0).toLocaleString()}</td> : null}
                {showSpanish ? <td className="green" style={{ fontWeight: metric === 'spanish' ? 950 : 800 }}>{Number(agent.spanish || 0).toLocaleString()}</td> : null}
                <td className="red">{Number(agent.invalidTransfers || 0).toLocaleString()}</td>
                <td className="orange" style={{ fontWeight: 950 }}>{Number(agent.total || 0).toLocaleString()}</td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan={showEnglish && showSpanish ? 8 : 7}>No ranking data available yet.</td>
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
        Goal days use each team target: Asia 20 English, every other team 10 English.
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
                <th>Goal</th>
                <th>Goal Days</th>
                <th>Goal Rate</th>
                <th>Avg ENG</th>
                <th>Best ENG</th>
                <th>Best Day</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((agent, index) => (
                <tr key={`goal-${agent.ext}-${index}`}>
                  <td><RankMarker index={index} /></td>
                  <td className="linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</td>
                  <td><TeamInlineLabel teamId={agent.teamId} teamFlag={agent.teamFlag} teamLabel={agent.teamLabel} /></td>
                  <td>#{agent.ext}</td>
                  <td className="blue">{Number(agent.goal || 0)}</td>
                  <td className="orange">{Number(agent.goalDays || 0).toLocaleString()}</td>
                  <td className="green">{Math.round(Number(agent.goalRate || 0) * 100)}%</td>
                  <td>{Number(agent.avgEnglish || 0).toFixed(1)}</td>
                  <td className="blue">{Number(agent.bestEnglish || 0).toLocaleString()}</td>
                  <td>{agent.bestDate ? formatDateLabel(agent.bestDate) : 'N/A'}</td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan="10">No goal data available yet.</td>
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

function RankingsPage({ teamData, selectedDate, rangeMode, history, historyLoading, historyError, navigate }) {
  const isAllTime = rangeMode === 'all_time'
  const currentAgents = useMemo(() => flattenAgentsForRankings(teamData), [teamData])
  const rankingAgents = isAllTime ? (history?.allTimeAgents || []) : currentAgents

  const topTotal = useMemo(() => sortAgentsByMetric(rankingAgents, 'total').slice(0, 10), [rankingAgents])
  const topEnglish = useMemo(() => sortAgentsByMetric(rankingAgents, 'english').slice(0, 10), [rankingAgents])
  const topSpanish = useMemo(() => sortAgentsByMetric(rankingAgents, 'spanish').slice(0, 10), [rankingAgents])
  const goalAgents = history?.topGoalAchievementAgents || []
  const mostFirst = history?.mostEnglishFirstPlaceAgents || []
  const mostTop3 = history?.mostEnglishTop3Agents || []
  const allTimeTeams = history?.allTimeTeams || []

  const currentTeamEnglish = buildCurrentTeamRankings(teamData, 'english')[0]
  const currentTeamSpanish = buildCurrentTeamRankings(teamData, 'spanish')[0]
  const currentTeamTotal = buildCurrentTeamRankings(teamData, 'total')[0]

  const teamEnglish = isAllTime ? [...allTimeTeams].sort((a, b) => Number(b.english || 0) - Number(a.english || 0))[0] : currentTeamEnglish
  const teamSpanish = isAllTime ? [...allTimeTeams].sort((a, b) => Number(b.spanish || 0) - Number(a.spanish || 0))[0] : currentTeamSpanish
  const teamTotal = isAllTime ? [...allTimeTeams].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0] : currentTeamTotal

  const topFirstAgent = mostFirst[0]
  const topTop3Agent = mostTop3[0]
  const topGoalAgent = goalAgents[0]
  const periodLabel = isAllTime ? 'All Time' : formatDateLabel(selectedDate)

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">{periodLabel}</div>
          <div className="pulse-hero-title-row">
            <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
            <div className="pulse-hero-title">Rankings</div>
          </div>
          <div className="pulse-hero-sub">
            Global rankings from Supabase. #1 and Top 3 streaks are always based on English xfers.
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid">
        <SummaryCard title="Best Team English" value={teamEnglish?.english || 0} color="#38bdf8" titleColor="#38bdf8" subtitle={teamEnglish ? `${teamEnglish.teamLabel} • ${teamEnglish.activeAgents || 0} agents` : historyLoading ? 'Loading history...' : 'N/A'} />
        <SummaryCard title="Best Team Spanish" value={teamSpanish?.spanish || 0} color="#34d399" titleColor="#34d399" subtitle={teamSpanish ? `${teamSpanish.teamLabel} • ${teamSpanish.activeAgents || 0} agents` : historyLoading ? 'Loading history...' : 'N/A'} />
        <SummaryCard title="Best Team Total" value={teamTotal?.total || 0} color="#ff8a2a" titleColor="#ff8a2a" subtitle={teamTotal ? `${teamTotal.teamLabel} • ${teamTotal.activeAgents || 0} agents` : historyLoading ? 'Loading history...' : 'N/A'} />
        <SummaryCard title="Most #1 Days" value={topFirstAgent?.firstPlaces || 0} color="#fbbf24" titleColor="#fbbf24" subtitle={topFirstAgent ? `${topFirstAgent.name} • #${topFirstAgent.ext}` : historyLoading ? 'Loading history...' : 'N/A'} />
        <SummaryCard title="Most Top 3 Days" value={topTop3Agent?.top3Days || 0} color="#22c55e" titleColor="#22c55e" subtitle={topTop3Agent ? `${topTop3Agent.name} • #${topTop3Agent.ext}` : historyLoading ? 'Loading history...' : 'N/A'} />
        <SummaryCard title="Most Goal Days" value={topGoalAgent?.goalDays || 0} color="#fbbf24" titleColor="#fbbf24" subtitle={topGoalAgent ? `${topGoalAgent.name} • #${topGoalAgent.ext}` : historyLoading ? 'Loading history...' : 'N/A'} />
      </div>

      <div className="pulse-top-blocks-grid">
        <RankingTopBlock title="Top Total" metric="total" rows={topTotal} navigate={navigate} />
        <RankingTopBlock title="Top English" metric="english" rows={topEnglish} navigate={navigate} />
        <RankingTopBlock title="Top Spanish" metric="spanish" rows={topSpanish} navigate={navigate} />
      </div>

      <AgentRankingTable title="🏆 Top 10 Total Xfers" subtitle={isAllTime ? 'All-time totals from Supabase.' : 'Sorted by total xfers for the selected date.'} rows={topTotal} metric="total" navigate={navigate} />
      <AgentRankingTable title="🔵 Top 10 English Xfers" subtitle={isAllTime ? 'All-time English xfers.' : 'Best English performance for the selected date.'} rows={topEnglish} metric="english" navigate={navigate} />
      <AgentRankingTable title="🟢 Top 10 Spanish Xfers" subtitle={isAllTime ? 'All-time Spanish xfers.' : 'Best Spanish performance for the selected date.'} rows={topSpanish} metric="spanish" navigate={navigate} />

      <GoalAchievementTable title="🎯 Most Goal Days" rows={goalAgents} loading={historyLoading} error={historyError} navigate={navigate} />

      <div className="pulse-top-blocks-grid">
        <EnglishPlacementTable title="🏆 Most #1 Days by English" subtitle="Agents who finished #1 the most times." rows={mostFirst} loading={historyLoading} error={historyError} navigate={navigate} mode="first" />
        <EnglishPlacementTable title="🥇 Most Top 3 Days by English" subtitle="Agents who appeared in the daily Top 3 the most times." rows={mostTop3} loading={historyLoading} error={historyError} navigate={navigate} mode="top3" />
      </div>

      <div className="pulse-top-blocks-grid">
        <TeamWinnerTable title="🏆 Team #1 Days by English" metric="english" rows={history?.englishTeamWinners || []} />
        <TeamWinnerTable title="🏆 Team #1 Days by Spanish" metric="spanish" rows={history?.spanishTeamWinners || []} />
      </div>
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
          <span className="pulse-top-block-name linkish" onClick={() => navigate(`/profile/${agent.ext}`)}>{agent.name}</span>
          <span className="pulse-top-block-ext">#{agent.ext}</span>
          <span className="pulse-top-block-value" style={{ color }}>
            {metric === 'goalDays'
              ? `${Number(agent.goalDays || 0)}x`
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
    <div className="pulse-table-wrap" style={{ marginBottom: 22 }}>
      <div className="pulse-team-card-top" style={{ marginBottom: 14 }}>
        <div className="pulse-team-title-wrap">
          <FlagImg src={teamInsight.teamFlag} size={24} alt="" />
          <div>
            <div className="pulse-team-name">{teamInsight.teamLabel}</div>
            <div className="pulse-team-sub">
              {formatDateLabel(week.weekStart)} - {formatDateLabel(week.weekEnd)} • Goal {teamInsight.goal} ENG/day
            </div>
          </div>
        </div>
      </div>

      <div className="pulse-summary-grid" style={{ marginBottom: 16 }}>
        <SummaryCard title="Week English" value={week.totals.english} color="#38bdf8" titleColor="#38bdf8" subtitle={`${englishDiff >= 0 ? '+' : ''}${englishDiff.toLocaleString()} vs last week`} />
        <SummaryCard title="Week Spanish" value={week.totals.spanish} color="#34d399" titleColor="#34d399" subtitle={`${week.totals.daysTracked || 0} days tracked`} />
        <SummaryCard title="Week Total" value={week.totals.total} color="#ff8a2a" titleColor="#ff8a2a" subtitle={`${totalDiff >= 0 ? '+' : ''}${totalDiff.toLocaleString()} vs last week`} />
        <SummaryCard title="Active Agents" value={week.totals.activeAgents} color="#c084fc" titleColor="#c084fc" subtitle="Max active count this week" />
      </div>

      <div className="pulse-top-blocks-grid">
        <MiniAgentList title="Top English — This Week" rows={week.topEnglish} metric="english" navigate={navigate} />
        <MiniAgentList title="Top Total — This Week" rows={week.topTotal} metric="total" navigate={navigate} />
        <MiniAgentList title="Goal Days — This Week" rows={week.goalLeaders} metric="goalDays" navigate={navigate} />
        <MiniAgentList title="Lowest Active — This Week" rows={week.lowestActive} metric="total" navigate={navigate} />
      </div>
    </div>
  )
}

function TeamsInsightsPage({ history, historyLoading, historyError, navigate }) {
  const teams = history?.weeklyTeams || []

  return (
    <>
      <div className="pulse-hero-card">
        <div>
          <div className="pulse-hero-date">Teams</div>
          <div className="pulse-hero-title-row">
            <span style={{ fontSize: 30, lineHeight: 1 }}>👥</span>
            <div className="pulse-hero-title">Weekly Team Breakdown</div>
          </div>
          <div className="pulse-hero-sub">
            One card per team: this week totals, last week comparison, top agents, goal days and lowest active performers.
          </div>
        </div>
      </div>

      {historyLoading ? <div className="pulse-loading">Loading team history...</div> : null}
      {historyError ? <div className="pulse-error">{historyError}</div> : null}

      {!historyLoading && !historyError ? (
        teams.map(teamInsight => (
          <TeamWeeklyCard key={teamInsight.teamId} teamInsight={teamInsight} navigate={navigate} />
        ))
      ) : null}
    </>
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
    if ((activeView === 'rankings' || activeView === 'teams' || activeView === 'analytics') && rangeMode === 'all_time') {
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
            <section className="lov-hero" style={{ padding: '22px 28px' }}>
              <div className="lov-hero-left">
                <div className="lov-hero-badge">
                  {activeView === 'rankings'
                    ? '🏆 Global rankings'
                    : activeView === 'teams'
                      ? '👥 Team weekly breakdown'
                      : selectedDate === todayKey()
                        ? '● Today — live from Supabase'
                        : `Saved snapshot · ${formatDateLabel(selectedDate)}`}
                </div>

                <h1 className="lov-hero-title" style={{ fontSize: 34 }}>
                  {activeView === 'rankings'
                    ? 'Rankings'
                    : activeView === 'teams'
                      ? 'Teams'
                      : 'Overview'}
                </h1>
              </div>

              {activeView === 'rankings' ? (
                <div className="lov-hero-right">
                  <div className="lov-range-tabs">
                    <button
                      type="button"
                      className={rangeMode === 'all_time' ? 'active' : ''}
                      onClick={() => setRangeMode('all_time')}
                    >
                      All Time
                    </button>
                    <button
                      type="button"
                      className={rangeMode === 'day' ? 'active' : ''}
                      onClick={() => setRangeMode('day')}
                    >
                      Selected Day
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="lov-kpi-grid lov-kpi-grid-main">
              <LovableKpi title="English" value={dashboardTotals.english} tone="blue" />
              <LovableKpi title="Spanish" value={dashboardTotals.spanish} tone="green" />
              <LovableKpi title="Invalid" value={dashboardTotals.invalid} tone="red" />
              <LovableKpi title="Total Xfers" value={dashboardTotals.total} tone="orange" />
            </section>

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
