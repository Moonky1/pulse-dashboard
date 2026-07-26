import {
  useMemo,
} from 'react'

import {
  TEAM_ORDER,
  TEAMS,
} from '../config/dashboardConfig'

import {
  normalizeSearchText,
} from '../utils/dashboardViewHelpers'

import {
  buildSearchSuggestions,
  filterParsedBySearch,
  teamMatchesSearch,
} from '../utils/dashboardSearchHelpers'

export function useDashboardViewModel({
  activeView,
  historyState,
  rangeMode,
  searchQuery,
  selectedTeam,
  sortMetric,
  teamData,
}) {
  const allTeamCards = useMemo(() => {
    const liveCards = TEAM_ORDER
      .filter(teamId => teamData[teamId])
      .map(teamId => ({
        team: TEAMS[teamId],
        parsed: teamData[teamId],
      }))
      .sort((first, second) => {
        const metricDifference =
          Number(
            second.parsed?.totals?.[sortMetric] || 0
          )
          - Number(
            first.parsed?.totals?.[sortMetric] || 0
          )

        if (metricDifference !== 0) {
          return metricDifference
        }

        return (
          Number(second.parsed?.totals?.total || 0)
          - Number(first.parsed?.totals?.total || 0)
        )
      })

    const missingCards = TEAM_ORDER
      .filter(teamId => !teamData[teamId])
      .map(teamId => ({
        team: TEAMS[teamId],
        parsed: null,
      }))

    return [
      ...liveCards,
      ...missingCards,
    ]
  }, [
    sortMetric,
    teamData,
  ])

  const selectedParsed =
    selectedTeam !== 'all'
      ? teamData[selectedTeam]
      : null

  const selectedTeamMeta =
    selectedTeam !== 'all'
      ? TEAMS[selectedTeam]
      : null

  const dashboardTotals = useMemo(() => {
    const emptyTotals = {
      english: 0,
      spanish: 0,
      invalid: 0,
      total: 0,
      activeAgents: 0,
    }

    if (activeView === 'teams') {
      const weeklyTeams =
        historyState?.insights?.weeklyTeams || []

      return weeklyTeams.reduce(
        (totals, teamInsight) => {
          const teamTotals =
            teamInsight?.thisWeek?.totals || {}

          totals.english += Number(
            teamTotals.english || 0
          )

          totals.spanish += Number(
            teamTotals.spanish || 0
          )

          totals.invalid += Number(
            teamTotals.invalidTransfers || 0
          )

          totals.total += Number(
            teamTotals.total || 0
          )

          totals.activeAgents += Number(
            teamTotals.activeAgents || 0
          )

          return totals
        },
        emptyTotals
      )
    }

    const usesAllTimeHistory =
      (
        activeView === 'rankings'
        || activeView === 'analytics'
      )
      && rangeMode === 'all_time'

    if (usesAllTimeHistory) {
      const allTimeAgents =
        historyState?.insights?.allTimeAgents || []

      return allTimeAgents.reduce(
        (totals, agent) => {
          totals.english += Number(
            agent?.english || 0
          )

          totals.spanish += Number(
            agent?.spanish || 0
          )

          totals.invalid += Number(
            agent?.invalidTransfers || 0
          )

          totals.total += Number(
            agent?.total || 0
          )

          totals.activeAgents += 1

          return totals
        },
        emptyTotals
      )
    }

    const source =
      selectedTeam === 'all'
        ? TEAM_ORDER
            .map(teamId => teamData[teamId])
            .filter(Boolean)
        : selectedParsed
          ? [selectedParsed]
          : []

    return source.reduce(
      (totals, parsed) => {
        totals.english += Number(
          parsed?.totals?.english || 0
        )

        totals.spanish += Number(
          parsed?.totals?.spanish || 0
        )

        totals.invalid += Number(
          parsed?.invalidTransfers || 0
        )

        totals.total += Number(
          parsed?.totals?.total || 0
        )

        totals.activeAgents += Number(
          parsed?.totals?.activeAgents
          || parsed?.agents?.length
          || 0
        )

        return totals
      },
      emptyTotals
    )
  }, [
    activeView,
    historyState,
    rangeMode,
    selectedParsed,
    selectedTeam,
    teamData,
  ])

  const normalizedSearch = useMemo(() => {
    return normalizeSearchText(searchQuery)
  }, [searchQuery])

  const visibleAllTeamCards = useMemo(() => {
    if (!normalizedSearch) {
      return allTeamCards
    }

    return allTeamCards
      .map(({ team, parsed }) => {
        const teamMatch =
          teamMatchesSearch(
            team,
            normalizedSearch
          )

        if (!parsed) {
          return teamMatch
            ? { team, parsed }
            : null
        }

        const filteredParsed =
          filterParsedBySearch(
            parsed,
            normalizedSearch
          )

        const hasAgentMatches =
          (
            filteredParsed?.agents || []
          ).length > 0

        if (!teamMatch && !hasAgentMatches) {
          return null
        }

        return {
          team,
          parsed: teamMatch
            ? parsed
            : filteredParsed,
        }
      })
      .filter(Boolean)
  }, [
    allTeamCards,
    normalizedSearch,
  ])

  const selectedParsedForView = useMemo(() => {
    return filterParsedBySearch(
      selectedParsed,
      normalizedSearch
    )
  }, [
    normalizedSearch,
    selectedParsed,
  ])

  const searchSuggestions = useMemo(() => {
    return buildSearchSuggestions(
      teamData,
      searchQuery
    )
  }, [
    searchQuery,
    teamData,
  ])

  const activeSidebarItem =
    activeView === 'rankings'
      ? 'rankings'
      : activeView === 'teams'
        ? 'teams'
        : activeView === 'analytics'
          ? 'analytics'
          : selectedTeam === 'all'
            ? 'overview'
            : 'teams'

  return {
    activeSidebarItem,
    dashboardTotals,
    searchSuggestions,
    selectedParsed,
    selectedParsedForView,
    selectedTeamMeta,
    visibleAllTeamCards,
  }
}