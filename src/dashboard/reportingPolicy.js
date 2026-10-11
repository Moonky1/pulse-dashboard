// Analytics-only interpretation confirmed by the operator on 2026-10-11.
// Scoped explicitly: a similarly named group in another source is NOT confirmation.
// This registry does not create team membership, identity links or access grants.
const CONFIRMED_POLICIES = Object.freeze({
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
  const id = typeof scope === 'string' ? scope : scope?.id
  return Object.hasOwn(CONFIRMED_POLICIES, id) ? CONFIRMED_POLICIES[id] : null
}
export const isEnglishXfer = scope => policyFor(scope)?.xferLanguage === 'English'
export const transferLabel = scope => isEnglishXfer(scope) ? 'English XFER' : 'XFER'

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
  if (!policyFor(scope)) return ''
  const team = resolvedTeam(scope, row)
  return !team ? '' : ['Asia', 'Asia Team A', 'Asia Team B'].includes(team) ? 'asia' : 'other'
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
