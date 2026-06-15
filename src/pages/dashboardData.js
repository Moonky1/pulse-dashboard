// src/pages/dashboardData.js

import { supabase } from '../utils/supabase'

import {
  OFFICIAL_DATA_START,
  SUPABASE_PAGE_SIZE,
  TEAM_ORDER,
} from './dashboardConfig'

import {
  getTeamFlag,
  getTeamLabel,
  normalizeDateKey,
  normalizeTeamId,
  sortAgentsByMetric,
  toNumber,
} from './dashboardHelpers'

function normalizeSupabaseAgent(row = {}) {
  const teamId = normalizeTeamId(row.team || row.teamId)
  const english = toNumber(row.english)
  const spanish = toNumber(row.spanish)
  const invalidTransfers = toNumber(row.invalid_transfers ?? row.invalidTransfers)
  const rawTotal = toNumber(row.raw_total ?? row.rawTotal ?? english + spanish)
  const total = toNumber(row.net_total ?? row.total ?? Math.max(0, rawTotal - invalidTransfers))

  return {
    ...row,

    date: normalizeDateKey(row.date),

    ext: String(row.agent_ext ?? row.ext ?? '').trim(),
    name: String(row.agent_name ?? row.name ?? '').trim(),

    team: teamId,
    teamId,
    teamLabel: getTeamLabel(teamId),
    teamFlag: getTeamFlag(teamId),

    english,
    spanish,
    invalidTransfers,
    invalid_transfers: invalidTransfers,
    rawTotal,
    raw_total: rawTotal,
    total,
    net_total: total,

    source: String(row.source || ''),
    isFinal: Boolean(row.is_final ?? row.isFinal),
    is_final: Boolean(row.is_final ?? row.isFinal),
  }
}

function normalizeSupabaseTeam(row = {}) {
  const teamId = normalizeTeamId(row.team || row.teamId)
  const english = toNumber(row.english)
  const spanish = toNumber(row.spanish)
  const invalidTransfers = toNumber(row.invalid_transfers ?? row.invalidTransfers)
  const rawTotal = toNumber(row.raw_total ?? row.rawTotal ?? english + spanish)
  const total = toNumber(row.net_total ?? row.total ?? Math.max(0, rawTotal - invalidTransfers))

  return {
    ...row,

    date: normalizeDateKey(row.date),

    team: teamId,
    teamId,
    teamLabel: getTeamLabel(teamId),
    teamFlag: getTeamFlag(teamId),

    english,
    spanish,
    invalidTransfers,
    invalid_transfers: invalidTransfers,
    rawTotal,
    raw_total: rawTotal,
    total,
    net_total: total,
    activeAgents: toNumber(row.active_agents ?? row.activeAgents),
    active_agents: toNumber(row.active_agents ?? row.activeAgents),

    source: String(row.source || ''),
    isFinal: Boolean(row.is_final ?? row.isFinal),
    is_final: Boolean(row.is_final ?? row.isFinal),
  }
}

function buildParsedTeamsFromSupabase(teamRows = [], agentRows = []) {
  const normalizedTeams = teamRows.map(normalizeSupabaseTeam)
  const normalizedAgents = agentRows.map(normalizeSupabaseAgent)
  const teamMap = {}

  TEAM_ORDER.forEach((teamId) => {
    const teamRow = normalizedTeams.find((row) => row.teamId === teamId)

    const agents = normalizedAgents
      .filter((agent) => agent.teamId === teamId)
      .filter((agent) => agent.ext || agent.name)

    if (!teamRow && agents.length === 0) return

    const fallbackEnglish = agents.reduce((sum, agent) => sum + toNumber(agent.english), 0)
    const fallbackSpanish = agents.reduce((sum, agent) => sum + toNumber(agent.spanish), 0)
    const fallbackInvalid = agents.reduce((sum, agent) => sum + toNumber(agent.invalidTransfers), 0)
    const fallbackRawTotal = agents.reduce((sum, agent) => sum + toNumber(agent.rawTotal), 0)
    const fallbackTotal = agents.reduce((sum, agent) => sum + toNumber(agent.total), 0)

    const english = toNumber(teamRow?.english ?? fallbackEnglish)
    const spanish = toNumber(teamRow?.spanish ?? fallbackSpanish)
    const invalidTransfers = toNumber(teamRow?.invalidTransfers ?? fallbackInvalid)
    const rawTotal = toNumber(teamRow?.rawTotal ?? fallbackRawTotal ?? english + spanish)
    const total = toNumber(teamRow?.total ?? fallbackTotal ?? Math.max(0, rawTotal - invalidTransfers))
    const activeAgents = toNumber(teamRow?.activeAgents ?? agents.length)

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
      isFinal: Boolean(teamRow?.isFinal || agents[0]?.isFinal),
    }
  })

  return teamMap
}

export async function fetchSupabaseDashboardDate(date) {
  const cleanDate = normalizeDateKey(date)

  const [teamResult, agentResult] = await Promise.all([
    supabase
      .from('pulse_team_daily_clean')
      .select('*')
      .eq('date', cleanDate),

    supabase
      .from('pulse_agent_daily_clean')
      .select('*')
      .eq('date', cleanDate)
      .range(0, 9999),
  ])

  if (teamResult.error) throw teamResult.error
  if (agentResult.error) throw agentResult.error

  return buildParsedTeamsFromSupabase(teamResult.data || [], agentResult.data || [])
}

export async function fetchSupabaseDates(startDate) {
  let query = supabase
    .from('pulse_team_daily_clean')
    .select('date')
    .order('date', { ascending: false })
    .range(0, 9999)

  if (startDate) {
    query = query.gte('date', normalizeDateKey(startDate))
  }

  const { data, error } = await query

  if (error) throw error

  return [...new Set(
    (data || [])
      .map((row) => normalizeDateKey(row.date))
      .filter(Boolean)
  )].sort((a, b) => b.localeCompare(a))
}

export async function fetchAllSupabaseRows(
  tableName,
  select = '*',
  pageSize = SUPABASE_PAGE_SIZE,
  orderColumns = []
) {
  const rows = []
  let from = 0

  while (true) {
    const to = from + pageSize - 1

    let query = supabase
      .from(tableName)
      .select(select)
      .gte('date', OFFICIAL_DATA_START)

    orderColumns.forEach((column) => {
      query = query.order(column.name, { ascending: column.ascending })
    })

    const { data, error } = await query.range(from, to)

    if (error) throw error

    const batch = data || []
    rows.push(...batch)

    if (batch.length < pageSize) break

    from += pageSize

    if (from >= 100000) break
  }

  return rows
}

export async function fetchSupabaseHistorySourceRows() {
  const [agentRows, teamRows] = await Promise.all([
    fetchAllSupabaseRows('pulse_agent_daily_clean', '*', SUPABASE_PAGE_SIZE, [
      { name: 'date', ascending: false },
    ]),

    fetchAllSupabaseRows('pulse_team_daily_clean', '*', SUPABASE_PAGE_SIZE, [
      { name: 'date', ascending: false },
    ]),
  ])

  return {
    agentRows: agentRows || [],
    teamRows: teamRows || [],
  }
}