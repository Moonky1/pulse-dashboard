// Exact source groups observed in the operator's All User Groups export.
// This is presentation/import configuration, never an authorization grant.
export const LEGACY_ALL_TEAMS_SCOPE_ID = '98991d5e-5cc2-4257-966a-f5865a288f6f'
export const ALL_TEAMS_SCOPE_ID = '542b1474-29c7-4000-a1be-b0496fd9809d'
export const ALL_TEAMS_GROUPS = Object.freeze([
  'OpenersAsia', 'OpenersAsia1', 'OpenersCA', 'OpenersCO', 'OpenersMXBJ',
  'OpenersMXBJ1', 'OpenersNIC', 'OpenersPH', 'OpenersTraining', 'OpenersVZ', 'ADMIN',
])
export const isAllTeamsScope = scope => [ALL_TEAMS_SCOPE_ID, LEGACY_ALL_TEAMS_SCOPE_ID].includes(typeof scope === 'string' ? scope : scope?.id)
export const preferredDashboardScope = catalog => catalog.find(s => s.id === ALL_TEAMS_SCOPE_ID) || catalog.find(isAllTeamsScope) || catalog[0] || null
export function selectedDashboardScope(catalog, selected) {
  // Older bookmarked general-report links keep their date, while new uploads
  // use the current source definition whenever the caller can access it.
  if (selected === LEGACY_ALL_TEAMS_SCOPE_ID && catalog.some(s => s.id === ALL_TEAMS_SCOPE_ID)) return preferredDashboardScope(catalog)
  return catalog.find(s => s.id === selected) || preferredDashboardScope(catalog)
}
