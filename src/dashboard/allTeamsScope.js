// Exact source groups observed in the operator's All User Groups export.
// This is presentation/import configuration, never an authorization grant.
export const ALL_TEAMS_SCOPE_ID = '98991d5e-5cc2-4257-966a-f5865a288f6f'
export const ALL_TEAMS_GROUPS = Object.freeze([
  'OpenersAsia', 'OpenersAsia1', 'OpenersCA', 'OpenersCO', 'OpenersMXBJ',
  'OpenersMXBJ1', 'OpenersNIC', 'OpenersPH', 'OpenersTraining', 'OpenersVZ',
])
export const isAllTeamsScope = scope => (typeof scope === 'string' ? scope : scope?.id) === ALL_TEAMS_SCOPE_ID
