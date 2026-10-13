import { validDate } from './dashboardModel.js'

// Remember only the filters in the URL. Reports are always read from Pulse,
// and a scope in the URL never grants access outside the protected catalog.
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
export function reportSelection(params) {
  const date = params.get('date'), scope = params.get('scope')
  return { date: validDate(date) ? date : '', scope: UUID.test(scope || '') ? scope : '' }
}
export function selectReport(params, selection) {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(selection)) {
    if ((key === 'date' && validDate(value)) || (key === 'scope' && UUID.test(value || ''))) next.set(key, value)
  }
  return next
}
