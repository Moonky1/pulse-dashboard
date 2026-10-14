import { preferredDashboardScope } from './allTeamsScope.js'
export const campaignLabel = value => value.replace(/^Openers(?=\d|$)/, 'OP')
export function datasetCatalog(catalog, kind) {
  return catalog.filter(s => kind === 'run_test' ? s.dataset_kind === 'run_test' : s.dataset_kind !== 'run_test')
}
export function importSource(catalog, scope) {
  return catalog.find(s => s.id === scope?.parent_scope_id) || (scope && !scope.parent_scope_id ? scope : preferredDashboardScope(catalog.filter(s => !s.parent_scope_id)))
}
export function decorateReport(data, catalog) {
  const source = catalog.find(s => s.id === data?.scope?.id)
  return data && source ? {...data, scope: {...data.scope, dataset_kind: source.dataset_kind, parent_scope_id: source.parent_scope_id, campaigns: source.campaigns}} : data
}
