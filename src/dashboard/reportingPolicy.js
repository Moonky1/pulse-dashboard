import { ALL_TEAMS_SCOPE_ID, ALL_TEAMS_GROUPS, DATASET_ALL_TEAMS_SCOPE_ID, LEGACY_ALL_TEAMS_SCOPE_ID, isAllTeamsScope } from './allTeamsScope.js'
import { integer } from './dashboardModel.js'

// Analytics-only interpretation confirmed by the operator on 2026-10-11.
// Scoped explicitly: a similarly named group in another source is NOT confirmation.
// This registry does not create team membership, identity links or access grants.
const CONFIRMED_POLICIES = Object.freeze({
  [ALL_TEAMS_SCOPE_ID]: Object.freeze({
    xferLanguage: 'English',
    groups: Object.freeze({ OpenersAsia: 'Asia Team A', OpenersAsia1: 'Asia Team B', OpenersPH: 'Philippines', OpenersMXBJ: 'Mexico Baja', OpenersMXBJ1: 'Mexico Baja B', OpenersCO: 'Colombia', OpenersVZ: 'Venezuela', OpenersCA: 'Central', OpenersNIC: 'Nicaragua' }),
  }),
  '426ab519-b87b-4410-bd42-e255b240bea1': Object.freeze({
    xferLanguage: 'English',
    groups: Object.freeze({ OpenersAsia: 'Asia Team A' }),
  }),
  '2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285': Object.freeze({
    xferLanguage: 'English',
    groups: Object.freeze({ OpenersAsia1: 'Asia Team B' }),
  }),
})
const policyFor = scope => {
  const sourceId = typeof scope === 'string' ? scope : scope?.parent_scope_id || scope?.id
  const id = [LEGACY_ALL_TEAMS_SCOPE_ID, DATASET_ALL_TEAMS_SCOPE_ID].includes(sourceId) ? ALL_TEAMS_SCOPE_ID : sourceId
  return Object.hasOwn(CONFIRMED_POLICIES, id) ? CONFIRMED_POLICIES[id] : null
}
export const isEnglishXfer = scope => policyFor(scope)?.xferLanguage === 'English'
export const transferLabel = scope => isEnglishXfer(scope) ? 'English XFER' : 'XFER'
export const COUNTED_TRANSFER_NOTE = 'English only for Asia, Philippines and Mexico Baja; English + SPXFER for other teams. Goals always use English only.'

function resolvedTeam(scope, row) {
  const policy = policyFor(scope)
  if (!row) return ''
  const confirmedTeam = policy && Object.hasOwn(policy.groups, row.current_user_group || '') ? policy.groups[row.current_user_group] : null
  const mappedTeam = typeof row.team_name === 'string' ? row.team_name.trim() : ''
  // Conflicting evidence needs review, not a silent override of canonical mapping.
  if (confirmedTeam && mappedTeam && confirmedTeam !== mappedTeam) return ''
  return confirmedTeam || mappedTeam || ''
}

export function teamLabel(scope, row) {
  const team = resolvedTeam(scope, row)
  return team === 'Asia Team A' ? 'Asia A' : team === 'Asia Team B' ? 'Asia B' : team || row?.current_user_group || 'Unassigned user group'
}

export function confirmedTargetReference(scope, row) {
  if (scope?.dataset_kind === 'run_test') return ''
  if (!isEnglishXfer(scope)) return ''
  if (isAllTeamsScope(scope)) {
    const group = row?.current_user_group
    // A CSV source group (including ADMIN) is not a confirmed sales team.
    if (!Object.hasOwn(policyFor(scope).groups, group || '')) return ''
    return ['OpenersAsia', 'OpenersAsia1'].includes(group) ? 'asia' : group === 'OpenersPH' ? 'philippines' : 'other'
  }
  const team = resolvedTeam(scope, row)
  return !team ? '' : ['Asia', 'Asia Team A', 'Asia Team B'].includes(team) ? 'asia' : team === 'Philippines' ? 'philippines' : 'other'
}

export function spanishTransfers(row) {
  const value = row?.dispositions?.SPXFER
  return integer(value) ? value : null
}
// Commission progress always uses xfer_count; SPXFER is never folded into it.
export function countedTransfers(scope, row) {
  if (!isEnglishXfer(scope) || !integer(row?.xfer_count)) return null
  const group = row.current_user_group
  if (['OpenersAsia', 'OpenersAsia1', 'OpenersPH', 'OpenersMXBJ', 'OpenersMXBJ1'].includes(group)) return row.xfer_count
  if (!isAllTeamsScope(scope) || !(ALL_TEAMS_GROUPS.includes(group) || group === 'Monitors')) return null
  const spanish = spanishTransfers(row)
  return spanish === null ? null : row.xfer_count + spanish
}
export function sumTransfers(rows, value) {
  const values = rows.map(value)
  return values.length && values.every(integer) ? values.reduce((a, b) => a + b, 0) : null
}

// Count one report side at a time; Call Stats and Pause are not two agents.
// Callers choose the visible report type, falling back to Pause for pause-only uploads.
export function teamCounts(scope, rows) {
  const groups = new Map()
  for (const row of rows) {
    const group = row.current_user_group || ''
    if (!groups.has(group)) groups.set(group, { group, labels: new Set(), ids: new Set() })
    groups.get(group).labels.add(teamLabel(scope, row))
    groups.get(group).ids.add(row.agent_code)
  }
  return [...groups.values()].map(({ group, labels, ids }) => ({ group, label: labels.size === 1 ? [...labels][0] : group || 'Unassigned user group', agents: ids.size }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
