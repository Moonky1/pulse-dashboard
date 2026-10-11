import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmedTargetReference, isEnglishXfer, transferLabel } from '../../src/dashboard/reportingPolicy.js'
import { goalProgress } from '../../src/dashboard/performanceInsights.js'
const scope = { id: '426ab519-b87b-4410-bd42-e255b240bea1' }

test('English interpretation is confined to the exact operator-confirmed scope', () => {
  assert.equal(isEnglishXfer(scope), true)
  assert.equal(transferLabel(scope.id), 'English XFER')
  for (const unknown of [undefined, {}, { id: 'another-scope', user_groups: ['OpenersAsia'] }, 'OpenersAsia', '__proto__', 'constructor']) {
    assert.equal(isEnglishXfer(unknown), false)
    assert.equal(transferLabel(unknown), 'XFER')
    assert.equal(confirmedTargetReference(unknown, { current_user_group: 'OpenersAsia', team_name: 'Asia' }), '')
  }
})
test('OpenersAsia automatically has the approved 15 English daily goal, without requiring identity linkage', () => {
  const row = { current_user_group: 'OpenersAsia', team_name: null, xfer_count: 7, linked: false, dispositions: { XFER: 7, SPANIS: 900 } }
  const before = structuredClone(row)
  assert.equal(confirmedTargetReference(scope, row), 'asia')
  assert.deepEqual(goalProgress(row.xfer_count, confirmedTargetReference(scope, row)), { target: 15, remaining: 8, percent: 7 / 15 * 100, reached: false })
  assert.deepEqual(row, before)
})
test('other team targets require a canonical team mapping within the confirmed-English scope', () => {
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'MappedGroup', team_name: 'Colombia' }), 'other')
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'AnotherAsiaGroup', team_name: 'Asia' }), 'asia')
  assert.equal(goalProgress(9, confirmedTargetReference(scope, { team_name: 'Mexico' })).remaining, 1)
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'Unknown', team_name: null }), '')
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'Unknown', team_name: '  ' }), '')
})
test('no prefix, casing, agent-name, recent-group or prototype-name inference is allowed', () => {
  for (const name of ['OpenersAsia1', 'openersasia', 'OpenersAsia ', 'Unknown', '__proto__', 'constructor']) {
    assert.equal(confirmedTargetReference(scope, { current_user_group: name, most_recent_user_group: 'OpenersAsia', vici_user_name: 'ASIA-SAMPLE', agent_code: '3100' }), '')
  }
  assert.equal(confirmedTargetReference(scope, null), '')
})
test('a contradictory canonical mapping withholds the goal instead of overriding team evidence', () => {
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'OpenersAsia', team_name: 'Colombia' }), '')
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'OpenersAsia', team_name: 'Asia' }), 'asia')
})
