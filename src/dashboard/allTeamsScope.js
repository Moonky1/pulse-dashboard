// Exact source groups observed in the operator's All User Groups export.
// This is presentation/import configuration, never an authorization grant.
export const LEGACY_ALL_TEAMS_SCOPE_ID = '98991d5e-5cc2-4257-966a-f5865a288f6f'
export const ALL_TEAMS_SCOPE_ID = '542b1474-29c7-4000-a1be-b0496fd9809d'
export const DATASET_ALL_TEAMS_SCOPE_ID = '829f3d68-fbcb-43ec-b6f7-f12e8bcca76f'
export const ALL_TEAMS_GROUPS = Object.freeze([
  'OpenersAsia', 'OpenersAsia1', 'OpenersCA', 'OpenersCO', 'OpenersMXBJ',
  'OpenersMXBJ1', 'OpenersNIC', 'OpenersPH', 'OpenersTraining', 'OpenersVZ', 'ADMIN',
])
export const isAllTeamsScope = scope => [DATASET_ALL_TEAMS_SCOPE_ID, ALL_TEAMS_SCOPE_ID, LEGACY_ALL_TEAMS_SCOPE_ID].includes(typeof scope === 'string' ? scope : scope?.parent_scope_id || scope?.id)
export const preferredDashboardScope = catalog => {
  const root = catalog.find(s => s.id === DATASET_ALL_TEAMS_SCOPE_ID) || catalog.find(s => s.id === ALL_TEAMS_SCOPE_ID) || catalog.find(s=>!s.parent_scope_id && isAllTeamsScope(s)) || catalog.find(s=>!s.parent_scope_id) || null
  return catalog.find(s=>s.dataset_kind === 'general' && s.parent_scope_id === root?.id && s.user_groups.length === root.user_groups.length && s.campaigns.length === root.campaigns.length) || root || catalog[0] || null
}
export function selectedDashboardScope(catalog, selected) {
  // Older bookmarked general-report links keep their date, while new uploads
  // use the current source definition whenever the caller can access it.
  if (selected === LEGACY_ALL_TEAMS_SCOPE_ID && catalog.some(s => s.id === ALL_TEAMS_SCOPE_ID)) return preferredDashboardScope(catalog)
  return catalog.find(s => s.id === selected) || preferredDashboardScope(catalog)
}
