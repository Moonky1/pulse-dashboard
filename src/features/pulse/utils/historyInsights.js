import {
  OFFICIAL_DATA_START,
  TEAM_ORDER,
} from '../config/dashboardConfig'

import {
  fetchSupabaseHistorySourceRows,
  normalizeSupabaseAgent,
  normalizeSupabaseTeam,
} from '../services/dashboardData'

import {
  getTeamFlag,
  getTeamGoal,
  getTeamLabel,
  sortAgentsByLowestXfers,
  sortAgentsByMetric,
} from './dashboardHelpers'

import {
  agentReachedGoal,
  dateAddKey,
  getWeekEndKey,
  getWeekStartKey,
  todayKey,
} from './dashboardViewHelpers'
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


function dedupeDailyTeams(normalizedTeams = []) {
  const byKey = new Map()

  ;(normalizedTeams || []).forEach(team => {
    if (!team?.date || !team?.teamId) return

    const key = `${team.date}|${team.teamId}`
    const previous = byKey.get(key)

    if (!previous) {
      byKey.set(key, team)
      return
    }

    const previousIsFinal = Boolean(previous.isFinal)
    const currentIsFinal = Boolean(team.isFinal)
    const previousScore = Number(previous.rawTotal || previous.total || 0)
    const currentScore = Number(team.rawTotal || team.total || 0)

    if (currentIsFinal && !previousIsFinal) {
      byKey.set(key, team)
      return
    }

    if (!currentIsFinal && previousIsFinal) return

    if (currentScore >= previousScore) byKey.set(key, team)
  })

  return [...byKey.values()]
}

export async function fetchHistoryRows() {
  const { agentRows, teamRows } = await fetchSupabaseHistorySourceRows()
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
    teamLabel: getTeamLabel(teamId),
    teamFlag: getTeamFlag(teamId),
    goal: getTeamGoal(teamId),
    thisWeek: buildWeekForTeam(teamId, thisWeekStart),
    lastWeek: buildWeekForTeam(teamId, lastWeekStart),
  }))
}

function buildHistoryInsights(agentRows = [], teamRows = []) {
  const cleanAgentRows = dedupeDailyAgents(
    (agentRows || [])
      .map(normalizeSupabaseAgent)
      .filter(row => row.date && row.date >= OFFICIAL_DATA_START && row.ext && row.teamId),
  )

  const cleanTeamRows = dedupeDailyTeams(
    (teamRows || [])
      .map(normalizeSupabaseTeam)
      .filter(row => row.date && row.date >= OFFICIAL_DATA_START && row.teamId),
  )

  const dates = [...new Set(cleanTeamRows.map(row => row.date).filter(Boolean))].sort()
  const allTimeAgents = buildAllTimeAgentRankings(cleanAgentRows)
  const allTimeTeams = buildAllTimeTeamRankings(cleanTeamRows)
  const placement = buildEnglishPlacementAgents(cleanAgentRows)

  return {
    dates,
    datesTracked: dates.length,
    dailyAgents: cleanAgentRows,
    dailyTeams: cleanTeamRows,
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
