import test from 'node:test'
import assert from 'node:assert/strict'
import { loadSelectedReport } from '../../src/dashboard/dashboardApi.js'
import { ALL_TEAMS_SCOPE_ID, LEGACY_ALL_TEAMS_SCOPE_ID, selectedDashboardScope, isAllTeamsScope } from '../../src/dashboard/allTeamsScope.js'
import { testReport } from './ui-fixtures.mjs'
import { confirmedTargetReference } from '../../src/dashboard/reportingPolicy.js'
const catalog = [LEGACY_ALL_TEAMS_SCOPE_ID, ALL_TEAMS_SCOPE_ID].map(id => ({ id }))
const report = (id, empty = false) => ({ ...testReport(), scope: { id }, ...(empty ? { snapshot: null, performance: [], pause: [] } : {}) })

test('current general definition is preferred without changing scoped catalog authorization', () => {
  assert.equal(selectedDashboardScope(catalog, '').id, ALL_TEAMS_SCOPE_ID)
  assert.equal(selectedDashboardScope(catalog, LEGACY_ALL_TEAMS_SCOPE_ID).id, ALL_TEAMS_SCOPE_ID)
  assert.equal(selectedDashboardScope([catalog[0]], '').id, LEGACY_ALL_TEAMS_SCOPE_ID)
  assert.equal(selectedDashboardScope([], ALL_TEAMS_SCOPE_ID), null)
  for (const scope of catalog) { assert.ok(isAllTeamsScope(scope)); assert.equal(confirmedTargetReference(scope, { current_user_group: 'OpenersAsia' }), 'asia'); assert.equal(confirmedTargetReference(scope, { current_user_group: 'ADMIN' }), '') }
})
test('absent current date reads authorized earlier definition and preserves its provenance', async () => {
  const calls = [], client = { rpc: async (name, args) => { calls.push([name, args.requested_scope]); return { data: report(args.requested_scope, args.requested_scope === ALL_TEAMS_SCOPE_ID) } } }
  const result = await loadSelectedReport(client, ALL_TEAMS_SCOPE_ID, '2026-10-09', catalog)
  assert.equal(result.data.scope.id, LEGACY_ALL_TEAMS_SCOPE_ID)
  assert.equal(result.data.performance.length, 40)
  assert.deepEqual(calls.map(v => v[1]), [ALL_TEAMS_SCOPE_ID, LEGACY_ALL_TEAMS_SCOPE_ID])
})
test('an existing current report is never summed with an earlier definition', async () => {
  let reads = 0
  const result = await loadSelectedReport({ rpc: async (_name, args) => { reads++; return { data: report(args.requested_scope) } } }, ALL_TEAMS_SCOPE_ID, '2026-10-09', catalog)
  assert.equal(reads, 1); assert.equal(result.data.performance.length, 40)
})
test('access errors, invalid responses and unavailable legacy catalog never trigger a fallback', async () => {
  for (const response of [{ error: { code: '42501' } }, { data: {} }, { data: report(ALL_TEAMS_SCOPE_ID, true) }]) {
    let reads = 0
    await loadSelectedReport({ rpc: async () => { reads++; return response } }, ALL_TEAMS_SCOPE_ID, '2026-10-09', response.data?.snapshot === null ? [] : catalog)
    assert.equal(reads, 1)
  }
})
