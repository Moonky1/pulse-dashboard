import {
  OFFICIAL_DATA_START,
  TEAM_ORDER,
} from '../config/dashboardConfig'

import {
  getTeamFlag,
  getTeamLabel,
  sortAgentsByLowestXfers,
  sortAgentsByMetric,
} from './dashboardHelpers'

import {
  agentReachedGoal,
  formatDateLabel,
  getBusinessHoursForDate,
  getWeekEndKey,
  getWeekStartKey,
  normalizeDate,
  todayKey,
} from './dashboardViewHelpers'
function getMonthStartKey(dateKey) {
  const date = normalizeDate(dateKey) || todayKey()
  return `${date.slice(0, 7)}-01`
}

function getMonthEndKey(dateKey) {
  const date = normalizeDate(dateKey) || todayKey()
  const [year, month] = date.split('-').map(Number)
  const d = new Date(Date.UTC(year, month, 0, 12, 0, 0))
  return d.toISOString().slice(0, 10)
}

function getRangeBounds(rangeMode, anchorDate, availableDates = []) {
  const date = normalizeDate(anchorDate) || todayKey()
  const sortedDates = [...new Set((availableDates || []).map(normalizeDate).filter(Boolean))].sort()

  if (rangeMode === 'day') return { start: date, end: date, label: formatDateLabel(date) }

  if (rangeMode === 'week') {
    const start = getWeekStartKey(date)
    const end = getWeekEndKey(start)
    return { start, end, label: `${formatDateLabel(start)} - ${formatDateLabel(end)}` }
  }

  if (rangeMode === 'month') {
    const start = getMonthStartKey(date)
    const end = getMonthEndKey(date)
    return { start, end, label: `${formatDateLabel(start)} - ${formatDateLabel(end)}` }
  }

  const start = sortedDates[0] || OFFICIAL_DATA_START
  const end = sortedDates[sortedDates.length - 1] || todayKey()
  return { start, end, label: 'All Time' }
}

function isDateInsideRange(date, start, end) {
  const normalized = normalizeDate(date)
  if (!normalized || !start || !end) return false
  return normalized >= start && normalized <= end
}

function isTeamSelected(teamId, selectedTeams = []) {
  return selectedTeams.includes('all') || selectedTeams.length === 0 || selectedTeams.includes(teamId)
}

export function buildAnalyticsInsights(history, selectedTeams = ['all'], rangeMode = 'week', anchorDate = todayKey()) {
  const dailyAgents = history?.dailyAgents || []
  const dailyTeams = history?.dailyTeams || []
  const range = getRangeBounds(rangeMode, anchorDate, history?.dates || [])
  const selectedTeamIds = selectedTeams.includes('all') || selectedTeams.length === 0 ? TEAM_ORDER : selectedTeams

  const teamRows = dailyTeams.filter(row => selectedTeamIds.includes(row.teamId) && isDateInsideRange(row.date, range.start, range.end))
  const agentRows = dailyAgents.filter(row => selectedTeamIds.includes(row.teamId) && isDateInsideRange(row.date, range.start, range.end))

  const summary = teamRows.reduce((acc, row) => {
    acc.english += Number(row.english || 0)
    acc.spanish += Number(row.spanish || 0)
    acc.invalid += Number(row.invalidTransfers || 0)
    acc.total += Number(row.total || 0)
    acc.activeAgents = Math.max(acc.activeAgents, Number(row.activeAgents || 0))
    return acc
  }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })

  const byDate = new Map()
  ;(history?.dates || []).forEach(date => {
    if (isDateInsideRange(date, range.start, range.end)) {
      byDate.set(date, { date, label: formatDateLabel(date), english: 0, spanish: 0, total: 0, invalid: 0 })
    }
  })

  teamRows.forEach(row => {
    const current = byDate.get(row.date) || { date: row.date, label: formatDateLabel(row.date), english: 0, spanish: 0, total: 0, invalid: 0 }
    current.english += Number(row.english || 0)
    current.spanish += Number(row.spanish || 0)
    current.total += Number(row.total || 0)
    current.invalid += Number(row.invalidTransfers || 0)
    byDate.set(row.date, current)
  })

  const trend = [...byDate.values()]
    .filter(row => row.english > 0 || row.spanish > 0 || row.total > 0 || rangeMode !== 'all_time')
    .sort((a, b) => a.date.localeCompare(b.date))

  const byTeam = new Map()
  selectedTeamIds.forEach(teamId => {
    byTeam.set(teamId, {
      teamId,
      teamLabel: getTeamLabel(teamId),
      teamFlag: getTeamFlag(teamId),
      english: 0,
      spanish: 0,
      total: 0,
      invalid: 0,
      activeAgents: 0,
      daysTracked: 0,
      goalDays: 0,
      bestTotal: 0,
      bestEnglish: 0,
      bestSpanish: 0,
    })
  })

  const allTeamsByDate = new Map()
  ;(history?.dates || []).forEach(date => {
    if (!isDateInsideRange(date, range.start, range.end)) return
    const row = { date, label: formatDateLabel(date) }
    TEAM_ORDER.forEach(teamId => { row[teamId] = 0 })
    allTeamsByDate.set(date, row)
  })

  teamRows.forEach(row => {
    const current = byTeam.get(row.teamId) || {
      teamId: row.teamId,
      teamLabel: getTeamLabel(row.teamId),
      teamFlag: getTeamFlag(row.teamId),
      english: 0,
      spanish: 0,
      total: 0,
      invalid: 0,
      activeAgents: 0,
      daysTracked: 0,
      goalDays: 0,
      bestTotal: 0,
      bestEnglish: 0,
      bestSpanish: 0,
    }

    current.english += Number(row.english || 0)
    current.spanish += Number(row.spanish || 0)
    current.total += Number(row.total || 0)
    current.invalid += Number(row.invalidTransfers || 0)
    current.activeAgents = Math.max(current.activeAgents, Number(row.activeAgents || 0))
    current.daysTracked += 1
    current.bestTotal = Math.max(current.bestTotal, Number(row.total || 0))
    current.bestEnglish = Math.max(current.bestEnglish, Number(row.english || 0))
    current.bestSpanish = Math.max(current.bestSpanish, Number(row.spanish || 0))
    byTeam.set(row.teamId, current)

    const dateRow = allTeamsByDate.get(row.date) || { date: row.date, label: formatDateLabel(row.date) }
    TEAM_ORDER.forEach(teamId => {
      if (dateRow[teamId] == null) dateRow[teamId] = 0
    })
    dateRow[row.teamId] = Number(row.total || 0)
    dateRow[`${row.teamId}_english`] = Number(row.english || 0)
    dateRow[`${row.teamId}_spanish`] = Number(row.spanish || 0)
    allTeamsByDate.set(row.date, dateRow)
  })

  const byAgent = new Map()
  agentRows.forEach(agent => {
    const key = `${agent.teamId}|${agent.ext}`
    const current = byAgent.get(key) || {
      ext: agent.ext,
      name: agent.name,
      teamId: agent.teamId,
      teamLabel: agent.teamLabel,
      teamFlag: agent.teamFlag,
      english: 0,
      spanish: 0,
      total: 0,
      rawTotal: 0,
      goalDays: 0,
      activeDays: 0,
      bestEnglish: 0,
      bestTotal: 0,
      bestDate: agent.date,
      activeDateKeys: new Set(),
      goalDateKeys: new Set(),
    }

    const dayEnglish = Number(agent.english || 0)
    const daySpanish = Number(agent.spanish || 0)
    const dayTotal = Number(agent.total || agent.rawTotal || dayEnglish + daySpanish)

    current.name = agent.name || current.name
    current.english += dayEnglish
    current.spanish += daySpanish
    current.total += dayTotal
    current.rawTotal += Number(agent.rawTotal || dayTotal)

    if (dayTotal > 0 && agent.date) current.activeDateKeys.add(agent.date)
    if (dayTotal > 0 && agentReachedGoal({ ...agent, total: dayTotal, rawTotal: dayTotal })) current.goalDateKeys.add(agent.date)

    if (dayEnglish > current.bestEnglish) {
      current.bestEnglish = dayEnglish
      current.bestDate = agent.date
    }

    if (dayTotal > current.bestTotal) current.bestTotal = dayTotal

    byAgent.set(key, current)
  })

  const agentAggregates = [...byAgent.values()].map(agent => ({
    ...agent,
    activeDays: agent.activeDateKeys.size,
    goalDays: agent.goalDateKeys.size,
  }))

  const teamComparison = [...byTeam.values()]
    .filter(team => team.english > 0 || team.spanish > 0 || team.total > 0)
    .map(team => ({
      ...team,
      avgEnglish: team.daysTracked ? team.english / team.daysTracked : 0,
      avgSpanish: team.daysTracked ? team.spanish / team.daysTracked : 0,
      avgTotal: team.daysTracked ? team.total / team.daysTracked : 0,
    }))
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))

  const dailyGoalAgents = agentRows.filter(agent => agentReachedGoal(agent))
  dailyGoalAgents.forEach(agent => {
    const current = byTeam.get(agent.teamId)
    if (current) current.goalDays += 1
  })

  const allTeamsTrend = [...allTeamsByDate.values()]
    .filter(row => TEAM_ORDER.some(teamId => Number(row[teamId] || 0) > 0))
    .sort((a, b) => a.date.localeCompare(b.date))

  const languageMix = teamComparison.map(team => ({
    ...team,
    englishPct: team.total ? (team.english / team.total) * 100 : 0,
    spanishPct: team.total ? (team.spanish / team.total) * 100 : 0,
    invalidPct: team.total ? (team.invalid / team.total) * 100 : 0,
  }))

  const selectedTeamForProfile = selectedTeamIds.length === 1 ? selectedTeamIds[0] : (teamComparison[0]?.teamId || 'all')
  const profileTeam = selectedTeamForProfile === 'all'
    ? null
    : teamComparison.find(team => team.teamId === selectedTeamForProfile) || null

  const radarTeams = selectedTeamIds.filter(teamId => byTeam.has(teamId))
  const radarAxes = radarTeams.length ? radarTeams : TEAM_ORDER.filter(teamId => byTeam.has(teamId))
  const radarMaxEnglish = Math.max(1, ...radarAxes.map(teamId => Number(byTeam.get(teamId)?.english || 0)))
  const radarMaxSpanish = Math.max(1, ...radarAxes.map(teamId => Number(byTeam.get(teamId)?.spanish || 0)))

  const radarData = [
    {
      key: 'english',
      label: 'English',
      color: '#38bdf8',
      values: Object.fromEntries(radarAxes.map(teamId => [teamId, Number(byTeam.get(teamId)?.english || 0) / radarMaxEnglish])),
      rawValues: Object.fromEntries(radarAxes.map(teamId => [teamId, Number(byTeam.get(teamId)?.english || 0)])),
    },
    {
      key: 'spanish',
      label: 'Spanish',
      color: '#34d399',
      values: Object.fromEntries(radarAxes.map(teamId => [teamId, Number(byTeam.get(teamId)?.spanish || 0) / radarMaxSpanish])),
      rawValues: Object.fromEntries(radarAxes.map(teamId => [teamId, Number(byTeam.get(teamId)?.spanish || 0)])),
    },
  ]

  const selectedDateRows = dailyTeams.filter(row => selectedTeamIds.includes(row.teamId) && row.date === anchorDate)
  const currentDayRows = selectedDateRows.length ? selectedDateRows : teamRows.filter(row => row.date === range.end)
  const hours = getBusinessHoursForDate(anchorDate)
  const hourlyCompared = hours.map((hour, index) => {
    const row = { hour }
    const progress = hours.length <= 1 ? 1 : (index + 1) / hours.length

    TEAM_ORDER.forEach(teamId => {
      const team = currentDayRows.find(item => item.teamId === teamId)
      const activeAgents = Math.max(1, Number(team?.activeAgents || 0))
      const total = Number(team?.total || 0)
      const dailyPace = total / activeAgents / Math.max(1, hours.length)
      row[teamId] = Number((dailyPace * (1.1 - progress * 0.16)).toFixed(2))
    })

    return row
  })

  return {
    range,
    summary,
    trend,
    teamComparison,
    allTeamsTrend,
    languageMix,
    radarAxes,
    radarData,
    profileTeam,
    hourlyCompared,
    selectedTeamIds,
    topEnglish: sortAgentsByMetric(agentAggregates, 'english').slice(0, 10),
    topSpanish: sortAgentsByMetric(agentAggregates, 'spanish').slice(0, 10),
    topTotal: sortAgentsByMetric(agentAggregates, 'total').slice(0, 10),
    goalLeaders: [...agentAggregates]
      .filter(agent => Number(agent.goalDays || 0) > 0)
      .sort((a, b) => {
        const goalDiff = Number(b.goalDays || 0) - Number(a.goalDays || 0)
        if (goalDiff !== 0) return goalDiff
        const englishDiff = Number(b.english || 0) - Number(a.english || 0)
        if (englishDiff !== 0) return englishDiff
        return Number(b.total || 0) - Number(a.total || 0)
      })
      .slice(0, 10),
    lowestXfers: sortAgentsByLowestXfers(agentAggregates.map(agent => ({
      ...agent,
      lowestXfers: agent.total,
      weekXfers: agent.total,
    }))).slice(0, 10),
  }
}