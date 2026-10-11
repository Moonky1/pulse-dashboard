import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmedTargetReference, isEnglishXfer, teamCounts, teamLabel, transferLabel } from '../../src/dashboard/reportingPolicy.js'
import { goalProgress } from '../../src/dashboard/performanceInsights.js'
const scope = { id: '426ab519-b87b-4410-bd42-e255b240bea1' }
const scopeB = { id: '2aa2efd9-9d7c-4aa6-9cda-7f3b008bf285' }

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
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'OpenersAsia', team_name: 'Asia Team A' }), 'asia')
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'OpenersAsia', team_name: 'Asia Team B' }), '')
})

test('exact confirmed A and B groups stay distinct and both have 15 English goals', () => {
  for (const [s, group, team, label] of [[scope, 'OpenersAsia', 'Asia Team A', 'Asia A'], [scopeB, 'OpenersAsia1', 'Asia Team B', 'Asia B']]) {
    assert.equal(isEnglishXfer(s), true)
    for (const team_name of [null, team]) {
      const row = { current_user_group: group, team_name }
      assert.equal(teamLabel(s, row), label)
      assert.equal(goalProgress(12, confirmedTargetReference(s, row)).target, 15)
    }
  }
  assert.equal(confirmedTargetReference(scope, { current_user_group: 'OpenersAsia1' }), '')
  assert.equal(confirmedTargetReference(scopeB, { current_user_group: 'OpenersAsia' }), '')
  assert.equal(teamLabel('unknown', { current_user_group: 'OpenersAsia1' }), 'OpenersAsia1')
  assert.equal(teamLabel(scopeB, { current_user_group: 'OpenersAsia1', team_name: 'Asia Team A' }), 'OpenersAsia1')
})

test('campaign names never become team assignments or guessed goals', () => {
  for (const group of ['Openers', 'Openers2', 'Openers3', 'Openers4', 'Openers5', 'Openers6', 'OpenersH', 'Openers ASIA 1', '__proto__']) {
    assert.equal(teamLabel(scopeB, { current_user_group: group, vici_user_name: 'ASIA B - TEST' }), group)
    assert.equal(confirmedTargetReference(scopeB, { current_user_group: group }), '')
  }
})

test('team counts use distinct Agent IDs and current group without inventing missing teams', () => {
  const rows = [{ agent_code: '0001', current_user_group: 'OpenersAsia' }, { agent_code: '0002', current_user_group: 'OpenersAsia' }]
  assert.deepEqual(teamCounts(scope, [...rows, ...rows]), [{ group: 'OpenersAsia', label: 'Asia A', agents: 2 }])
  assert.deepEqual(teamCounts(scopeB, rows.map(row => ({ ...row, current_user_group: 'OpenersAsia1', most_recent_user_group: 'OpenersAsia' }))), [{ group: 'OpenersAsia1', label: 'Asia B', agents: 2 }])
  assert.deepEqual(teamCounts(scopeB, []), [])
  assert.equal(teamCounts(scope, [{ ...rows[0], team_name: 'Asia Team B' }, rows[1]])[0].label, 'OpenersAsia')
})
