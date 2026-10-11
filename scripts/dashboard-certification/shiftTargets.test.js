import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardTimeZone, displayClock, COLOMBIA_TIME_ZONE, SHIFT_TIME_ZONE, pacificClock, shiftSchedule, teamPace } from '../../src/dashboard/shiftTargets.js'
import { ALL_TEAMS_SCOPE_ID } from '../../src/dashboard/allTeamsScope.js'
import { dailyCommission, dailyGoal } from '../../src/dashboard/performanceInsights.js'
import { pauseOverage, coachingAgents } from '../../src/dashboard/dispositionInsights.js'

test('Saturday is five consecutive Pacific hours, 15 production English, no break or lunch', () => {
  const saturday = hour => teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-10', `2026-10-10T${hour + 7}:00:00Z`)
  assert.equal(saturday(8).phase, 'Not started')
  assert.equal(saturday(9).phase, 'First hour')
  assert.equal(saturday(12).phase, 'Fourth hour')
  assert.equal(saturday(13).phase, 'Fifth hour')
  assert.equal(saturday(14).phase, 'Shift complete')
  assert.equal(saturday(16).phase, 'Shift complete')
  assert.equal(saturday(14).daily, 32 * 15)
  assert.equal(saturday(12).expected, 32 * 9)
  assert.deepEqual(saturday(14).hours.map(h => h.cumulative), [96,192,288,384,480])
  assert.equal(pauseOverage('break_seconds', 1, '2026-10-10'), 1)
  assert.equal(pauseOverage('lunch_seconds', 60, '2026-10-10'), 60)
  assert.equal(pauseOverage('break_seconds', 0, '2026-10-10'), null)
  assert.equal(pauseOverage('break_seconds', null, '2026-10-10'), null)
  assert.equal(pauseOverage('rr_seconds', 1200, '2026-10-10'), null)
  assert.equal(pauseOverage('rr_seconds', 1201, '2026-10-10'), 1)
  assert.equal(pauseOverage('break_seconds', 60, '2026-10-09'), null)
  const flags = coachingAgents({snapshot:{}, date:'2026-10-10', performance:[], pause:[{agent_code:'1', break_seconds:60, lunch_seconds:0, rr_seconds:0}]})
  assert.equal(flags[0].reasons[0].limit, 0)
})

test('Saturday commission varies by source group, histories use report date, English only', () => {
  for (const [group, weekday, saturday] of [['OpenersAsia',15,10],['OpenersAsia1',15,10],['OpenersPH',20,10],['OpenersMXBJ',10,10],['OpenersMXBJ1',10,10],['OpenersCO',10,5],['OpenersVZ',10,5],['OpenersCA',10,5],['OpenersNIC',10,5]]) {
    const day = {status:'observed', date:'2026-10-10', row:{current_user_group:group,xfer_count:5,dispositions:{SPXFER:100}}}
    assert.equal(dailyCommission(day, ALL_TEAMS_SCOPE_ID).target, saturday)
    assert.equal(dailyCommission(day, ALL_TEAMS_SCOPE_ID).reached, saturday === 5)
    assert.equal(dailyGoal(day, ALL_TEAMS_SCOPE_ID).target, 15)
    assert.equal(dailyGoal(day, ALL_TEAMS_SCOPE_ID).reached, false)
    day.date = '2026-10-09'
    assert.equal(dailyCommission(day, ALL_TEAMS_SCOPE_ID).target, weekday)
    assert.equal(dailyGoal(day, ALL_TEAMS_SCOPE_ID).target, 24)
  }
  assert.equal(dailyCommission({status:'observed',date:'2026-10-10',row:{current_user_group:'OpenersTraining',xfer_count:100}}, ALL_TEAMS_SCOPE_ID), null)
})

test('both live clocks reflect DST and Colombia stays UTC minus 5', () => {
  assert.match(displayClock('2026-10-09T15:00:00Z', SHIFT_TIME_ZONE), /8:00 AM PDT/)
  assert.match(displayClock('2026-01-09T16:00:00Z', SHIFT_TIME_ZONE), /8:00 AM PST/)
  assert.match(displayClock('2026-10-09T15:00:00Z', COLOMBIA_TIME_ZONE), /10:00 AM/)
  assert.match(displayClock('2026-01-09T16:00:00Z', COLOMBIA_TIME_ZONE), /11:00 AM/)
})

const rows = Array.from({ length: 32 }, (_, i) => ({ agent_code: String(i), current_user_group: 'OpenersAsia', xfer_count: 15, dispositions: { SPXFER: 100 } }))
const at = hour => teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-09', `2026-10-09T${String(hour + 7).padStart(2, '0')}:00:00Z`)

test('32 agents match the operator table: 96,192,288,384,480,576,672,768', () => {
  assert.deepEqual(at(8).hours.map(hour => hour.cumulative), [96,192,288,384,480,576,672,768])
  assert.equal(at(8).hourly, 96)
  assert.equal(at(8).daily, 768)
  assert.equal(at(8).english, 480, 'SPXFER never satisfies English pacing')
  for (const [hour, expected] of [[8,96],[9,192],[10,288],[11,384],[12,480],[13,480],[14,576],[15,672],[16,768]]) assert.equal(at(hour).expected, expected)
})

test('shift clock pauses at lunch, caps at 8 hours, distinguishes extra time and prorates minutes', () => {
  assert.equal(at(6).phase, 'Not started')
  assert.equal(at(7).phase, 'First hour')
  assert.equal(at(8).phase, 'Second hour')
  assert.equal(at(12).phase, 'Lunch')
  assert.equal(at(13).phase, 'Sixth hour')
  assert.equal(at(16).phase, 'Extra hour')
  assert.equal(teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-10T00:00:00Z').phase, 'Shift complete')
  assert.equal(teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-09T14:30:00Z').expected, 48)
  assert.equal(teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-09T19:45:00Z').expected, 480)
  assert.equal(at(16).expected, 768)
})

test('Los Angeles clock handles summer, winter and date boundaries without browser-local offsets', () => {
  assert.equal(dashboardTimeZone({ id: ALL_TEAMS_SCOPE_ID }), 'America/Los_Angeles')
  assert.equal(dashboardTimeZone({ id: 'unknown' }), null)
  assert.equal(dashboardTimeZone({ id: ALL_TEAMS_SCOPE_ID, source_time_zone: 'UTC' }), 'UTC')
  assert.equal(pacificClock('2026-10-09T15:00:00Z').time, '08:00')
  assert.equal(pacificClock('2026-01-09T16:00:00Z').time, '08:00')
  assert.equal(pacificClock('2026-10-10T06:59:00Z').date, '2026-10-09')
  assert.equal(pacificClock('invalid'), null)
  assert.equal(teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-01-09', '2026-01-09T16:00:00Z').expected, 96)
  assert.equal(teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-11T16:00:00Z').expected, 768)
  assert.equal(teamPace(rows, ALL_TEAMS_SCOPE_ID, '2026-10-12', '2026-10-11T16:00:00Z').expected, 0)
})

test('only confirmed report headcount is counted and unavailable data is not zero', () => {
  assert.equal(teamPace([], ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-09T15:00:00Z'), null)
  assert.equal(teamPace(rows, 'unknown', '2026-10-09', '2026-10-09T15:00:00Z'), null)
  assert.equal(teamPace([{ ...rows[0], xfer_count: null }], ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-09T15:00:00Z'), null)
  assert.equal(teamPace([...rows, { ...rows[0], current_user_group: 'OpenersTraining' }], ALL_TEAMS_SCOPE_ID, '2026-10-09', '2026-10-09T15:00:00Z').agents, 32)
  assert.equal(shiftSchedule('invalid'), null)
  assert.equal(shiftSchedule('2026-10-10').length, 5)
})
