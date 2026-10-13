import { fixture } from './parserFixtures.mjs'
import { ALL_TEAMS_GROUPS, ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'
export const allTeamsScope = { id: ALL_TEAMS_SCOPE_ID, label: 'All teams', user_groups: ALL_TEAMS_GROUPS, campaigns: ['SyntheticCampaign'], source_time_zone: null, can_import: true, can_manage_reports: false }
export function allTeamsCsv(type = 'performance') {
  return fixture(type, { transform({ headers, agents, summary }) {
    const seeds = structuredClone(agents)
    agents.splice(0)
    for (const [g, group] of ALL_TEAMS_GROUPS.entries()) for (const [i, seed] of seeds.entries()) {
      const row = [...seed]
      row[headers.indexOf('ID')] = String(1000 + g * 2 + i)
      row[headers.indexOf('USER NAME')] = `Synthetic ${g * 2 + i + 1}`
      row[headers.indexOf('CURRENT USER GROUP')] = group
      row[headers.indexOf('MOST RECENT USER GROUP')] = group
      agents.push(row)
    }
    for (let i = 0; i < summary.length; i++) {
      if (summary[i] === 'AGENTS:2') summary[i] = `AGENTS:${agents.length}`
      else if (headers[i].endsWith('AVG')) continue
      else if (/^0:00:\d+$/.test(summary[i])) {
        const seconds = Number(summary[i].slice(-2)) * ALL_TEAMS_GROUPS.length
        summary[i] = `0:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
      } else if (/^\d+$/.test(summary[i])) summary[i] = String(Number(summary[i]) * ALL_TEAMS_GROUPS.length)
    }
  } })
}
