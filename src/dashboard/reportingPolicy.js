// Analytics-only interpretation confirmed by the operator on 2026-10-10.
// Scoped explicitly: a similarly named group in another source is NOT confirmation.
// This registry does not create team membership, identity links or access grants.
const CONFIRMED_POLICIES = Object.freeze({
  '426ab519-b87b-4410-bd42-e255b240bea1': Object.freeze({
    xferLanguage: 'English',
    groups: Object.freeze({ OpenersAsia: 'Asia' }),
  }),
})
const policyFor = scope => {
  const id = typeof scope === 'string' ? scope : scope?.id
  return Object.hasOwn(CONFIRMED_POLICIES, id) ? CONFIRMED_POLICIES[id] : null
}
export const isEnglishXfer = scope => policyFor(scope)?.xferLanguage === 'English'
export const transferLabel = scope => isEnglishXfer(scope) ? 'English XFER' : 'XFER'

export function confirmedTargetReference(scope, row) {
  const policy = policyFor(scope)
  if (!policy || !row) return ''
  const confirmedTeam = Object.hasOwn(policy.groups, row.current_user_group || '') ? policy.groups[row.current_user_group] : null
  const mappedTeam = typeof row.team_name === 'string' ? row.team_name.trim() : ''
  // Conflicting evidence needs review, not a silent override of canonical mapping.
  if (confirmedTeam && mappedTeam && confirmedTeam !== mappedTeam) return ''
  const team = confirmedTeam || mappedTeam
  return !team ? '' : team === 'Asia' ? 'asia' : 'other'
}
