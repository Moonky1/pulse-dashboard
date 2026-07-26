import {
  TEAM_ORDER,
  TEAMS,
} from '../config/dashboardConfig'

import {
  normalizeSearchText,
} from './dashboardViewHelpers'

export function agentMatchesSearch(agent, query) {
  if (!query) return true

  const name = normalizeSearchText(agent?.name)
  const ext = normalizeSearchText(agent?.ext)

  return name.includes(query) || ext.includes(query)
}

export function teamMatchesSearch(team, query) {
  if (!query) return true

  const label = normalizeSearchText(team?.label)
  const short = normalizeSearchText(team?.short)
  const id = normalizeSearchText(team?.id)

  return (
    label.includes(query)
    || short.includes(query)
    || id.includes(query)
  )
}

export function filterParsedBySearch(parsed, query) {
  if (!parsed || !query) return parsed

  return {
    ...parsed,
    agents: (parsed.agents || []).filter(agent => {
      return agentMatchesSearch(agent, query)
    }),
  }
}

export function buildSearchSuggestions(teamData, query) {
  const q = normalizeSearchText(query)
  if (!q) return []

  const suggestions = []

  TEAM_ORDER.forEach(teamId => {
    const team = TEAMS[teamId]
    const parsed = teamData?.[teamId]

    const teamLabel = normalizeSearchText(team?.label)
    const teamShort = normalizeSearchText(team?.short)
    const teamKey = normalizeSearchText(teamId)

    if (
      teamLabel.includes(q)
      || teamShort.includes(q)
      || teamKey.includes(q)
    ) {
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