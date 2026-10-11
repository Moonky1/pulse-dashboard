import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALL_TEAMS_GROUPS, ALL_TEAMS_SCOPE_ID, isAllTeamsScope } from '../../src/dashboard/allTeamsScope.js'
import { teamCounts, teamLabel, confirmedTargetReference, countedTransfers, spanishTransfers, sumTransfers } from '../../src/dashboard/reportingPolicy.js'
import { rankAgents, goalProgress, productionProgress, dailyGoal, dailyCommission } from '../../src/dashboard/performanceInsights.js'
import { filterAgents } from '../../src/dashboard/dashboardModel.js'
import { inspectManualReports } from '../../supabase/functions/_shared/viciManualImport.mjs'
import { allTeamsCsv } from './all-teams-fixtures.mjs'

test('general call and pause CSVs are independent and retain all exact groups', () => {
  for (const sides of [['performance'], ['pause'], ['performance', 'pause']]) {
    const input = Object.fromEntries(sides.map(type => [type + 'Text', allTeamsCsv(type)]))
    const { pair } = inspectManualReports({ ...input, reportDate: '2026-10-09', userGroups: ALL_TEAMS_GROUPS })
    for (const side of sides) {
      assert.equal(pair[side].rows.length, 20)
      assert.deepEqual([...new Set(pair[side].rows.map(r => r.current_user_group))].sort(), [...ALL_TEAMS_GROUPS].sort())
      assert.equal(teamCounts(ALL_TEAMS_SCOPE_ID, pair[side].rows).reduce((sum, g) => sum + g.agents, 0), 20)
    }
    for (const missing of ['performance', 'pause'].filter(v => !sides.includes(v))) assert.equal(pair[missing], null)
  }
})
test('global upload does not loosen the Asia scope or silently accept unknown groups', () => {
  const input = { performanceText: allTeamsCsv(), reportDate: '2026-10-09' }
  assert.throws(() => inspectManualReports({ ...input, userGroups: ['OpenersAsia'] }), e => e.category === 'report_group_mismatch')
  assert.throws(() => inspectManualReports({ ...input, performanceText: input.performanceText.replaceAll('OpenersPH', 'UnknownGroup'), userGroups: ALL_TEAMS_GROUPS }), e => e.category === 'report_group_mismatch')
})
test('global ranking and team ranking share data, not a sum across saved scopes', () => {
  const rows = [
    { agent_code: '01', current_user_group: 'OpenersAsia', calls: 100, xfer_count: 15 },
    { agent_code: '02', current_user_group: 'OpenersPH', calls: 200, xfer_count: 25 },
    { agent_code: '03', current_user_group: 'OpenersAsia', calls: 50, xfer_count: 0 },
  ]
  assert.equal(rankAgents(rows)[0].agent_code, '02')
  assert.equal(rankAgents(rows, 'conversion')[0].agent_code, '01')
  assert.equal(rankAgents(rows, 'xfer', true)[0].agent_code, '03')
  assert.equal(rankAgents(filterAgents(rows, { group: 'OpenersAsia' }))[0].agent_code, '01')
  assert.equal(rows.length, 3)
})
test('All teams is exact and labels do not invent canonical team membership', () => {
  assert.equal(isAllTeamsScope({ id: ALL_TEAMS_SCOPE_ID }), true)
  assert.equal(isAllTeamsScope('All teams'), false)
  assert.equal(teamLabel(ALL_TEAMS_SCOPE_ID, { current_user_group: 'OpenersAsia' }), 'Asia A')
  assert.equal(teamLabel(ALL_TEAMS_SCOPE_ID, { current_user_group: 'OpenersAsia1' }), 'Asia B')
  assert.equal(teamLabel(ALL_TEAMS_SCOPE_ID, { current_user_group: 'OpenersCA' }), 'Central')
  assert.equal(teamLabel(ALL_TEAMS_SCOPE_ID, { current_user_group: 'OpenersNIC' }), 'Nicaragua')
  const sql = readFileSync('scripts/dashboard-certification/configure-all-teams.sql', 'utf8')
  assert.ok(sql.includes(ALL_TEAMS_SCOPE_ID))
  assert.ok(sql.includes('array[' + ALL_TEAMS_GROUPS.map(v => `'${v}'`).join(',') + ']'))
})

test('commission goals use English only: Philippines 20, Asia 15, others 10', () => {
  for (const group of ALL_TEAMS_GROUPS.filter(g => g !== 'OpenersTraining')) {
    const target = group === 'OpenersPH' ? 20 : ['OpenersAsia', 'OpenersAsia1'].includes(group) ? 15 : 10
    const row = { current_user_group: group, xfer_count: target - 1, dispositions: { SPXFER: 100, SPANIS: 999 } }
    const reference = confirmedTargetReference(ALL_TEAMS_SCOPE_ID, row)
    assert.equal(goalProgress(row.xfer_count, reference).target, target)
    assert.equal(goalProgress(row.xfer_count, reference).reached, false)
    assert.equal(goalProgress(target, reference).reached, true)
  }
  for (const group of ['OpenersTraining', 'UnknownGroup']) assert.equal(confirmedTargetReference(ALL_TEAMS_SCOPE_ID, { current_user_group: group }), '')
})

test('24 English production goal is distinct from commission and ignores Spanish for every team', () => {
  for (const group of ALL_TEAMS_GROUPS.filter(g => g !== 'OpenersTraining')) {
    const day = { status: 'observed', row: { current_user_group: group, xfer_count: 23, dispositions: { SPXFER: 100, SPANIS: 999 } } }
    assert.equal(dailyGoal(day, ALL_TEAMS_SCOPE_ID).target, 24)
    assert.equal(dailyGoal(day, ALL_TEAMS_SCOPE_ID).reached, false)
    assert.equal(dailyCommission(day, ALL_TEAMS_SCOPE_ID).reached, true)
    day.row.xfer_count = 24
    assert.equal(dailyGoal(day, ALL_TEAMS_SCOPE_ID).reached, true)
  }
  assert.equal(productionProgress(24, ''), null)
  assert.equal(productionProgress(null, 'asia'), null)
  assert.equal(productionProgress(48, 'philippines').percent, 200)
  assert.equal(dailyCommission({ status: 'absent' }, ALL_TEAMS_SCOPE_ID), null)
})

test('Spanish stays visible but only eligible teams include SPXFER in operational totals', () => {
  for (const group of ALL_TEAMS_GROUPS) {
    const row = { agent_code: '1', current_user_group: group, xfer_count: 9, dispositions: { SPXFER: 7, SPANIS: 500 } }
    const englishOnly = ['OpenersAsia', 'OpenersAsia1', 'OpenersPH', 'OpenersMXBJ', 'OpenersMXBJ1'].includes(group)
    assert.equal(spanishTransfers(row), 7)
    assert.equal(countedTransfers(ALL_TEAMS_SCOPE_ID, row), englishOnly ? 9 : 16)
    assert.equal(rankAgents([row], 'total', false, ALL_TEAMS_SCOPE_ID)[0].value, englishOnly ? 9 : 16)
    assert.equal(rankAgents([row], 'spanish')[0].value, 7)
  }
  const missing = { current_user_group: 'OpenersCO', xfer_count: 9, dispositions: { SPANIS: 500 } }
  assert.equal(spanishTransfers(missing), null)
  assert.equal(countedTransfers(ALL_TEAMS_SCOPE_ID, missing), null)
  assert.equal(countedTransfers('unconfirmed', missing), null)
  assert.equal(sumTransfers([missing], spanishTransfers), null)
  assert.equal(sumTransfers([], spanishTransfers), null)
  assert.equal(sumTransfers([{ dispositions: { SPXFER: 0 } }], spanishTransfers), 0)
})
