import test from 'node:test'
import assert from 'node:assert/strict'
import { reportSelection, selectReport } from '../../src/dashboard/reportSelection.js'
import { testScope } from './ui-fixtures.mjs'

test('report date survives a reload/share without storing report data in the browser', () => {
  const params = selectReport(new URLSearchParams('mode=manual'), { date: '2026-10-09', scope: testScope.id })
  assert.deepEqual(reportSelection(new URLSearchParams(params.toString())), { date: '2026-10-09', scope: testScope.id })
  assert.equal(params.get('mode'), 'manual')
  assert.deepEqual([...params.keys()], ['mode', 'date', 'scope'])
})
test('invalid calendar dates and scope identifiers cannot become report filters', () => {
  for (const date of ['2026-02-30', '0000-01-01', '<script>', '']) {
    const params = new URLSearchParams({ date, scope: 'not-an-authorized-scope' })
    assert.deepEqual(reportSelection(params), { date: '', scope: '' })
    assert.equal(selectReport(new URLSearchParams('date=2026-10-09'), { date }).get('date'), '2026-10-09')
  }
})
test('Today/date changes retain the selected scope and unrelated parameters', () => {
  const params = selectReport(new URLSearchParams({ date: '2026-10-09', scope: testScope.id, view: 'agents' }), { date: '2026-10-13' })
  assert.deepEqual(reportSelection(params), { date: '2026-10-13', scope: testScope.id })
  assert.equal(params.get('view'), 'agents')
})
