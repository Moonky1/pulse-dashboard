import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  parseAgentPerformance, parsePauseBreakdown, parseViciDuration, tokenizeViciCsv,
  ViciReportError, classifyReportResponse,
} from '../../supabase/functions/_shared/viciReportParsers.mjs'
import { fixture, options, performanceHeaders, pauseHeaders } from './parserFixtures.mjs'

const rejects = (fn, category) => assert.throws(fn, error => error instanceof ViciReportError && error.category === category)

test('performance uses named fields, preserves string IDs and normalizes names', () => {
  const result = parseAgentPerformance(fixture('performance'), options)
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rows.map(row => row.agent_code), ['0001', '0099'])
  assert.equal(result.rows[0].vici_user_name, 'Fixture One')
  assert.equal(result.rows[1].vici_user_name, 'Fixture, "Two"')
  assert.equal(result.rows[0].time_seconds, 1)
  assert.equal(result.rows[0].talk_avg_seconds, 1)
  assert.equal(result.totals.calls, 28)
  assert.equal(result.warnings.length, 0)
  assert.ok(result.comparisons.every(value => value.matches))
})

test('XFER never becomes SPANIS or a fabricated Spanish/English metric', () => {
  const result = parseAgentPerformance(fixture('performance'), options)
  assert.equal(result.rows[0].xfer_count, 1)
  assert.equal(result.rows[0].dispositions.SPANIS, 4)
  assert.equal(result.totals.xfer_count, 2)
  assert.equal(result.totals.dispositions.SPANIS, 8)
  assert.equal(result.rows[0].spanish_xfer_count, undefined)
  assert.equal(result.rows[0].english_xfer_count, undefined)
})

test('TOTALS is separate from observations and averages are not summed', () => {
  const result = parseAgentPerformance(fixture('performance'), options)
  assert.equal(result.totals.agent_count, 2)
  assert.ok(result.rows.every(row => row.agent_count === undefined))
  assert.ok(result.comparisons.every(value => !value.column.endsWith('_avg_seconds')))
})

test('report wall clocks, source range and UTC ingestion remain distinct', () => {
  const result = parseAgentPerformance(fixture('performance'), options)
  assert.equal(result.source_generated_at, '2026-10-09 19:45:14')
  assert.deepEqual(result.source_range, { from: '2026-10-09 00:00:00', to: '2026-10-09 23:59:59' })
  assert.equal(result.source_time_zone, null)
  assert.equal(result.ingested_at, options.ingestedAt)
})

test('BOM and blank preamble/detail lines are harmless', () => {
  const lines = fixture('performance').split('\r\n')
  lines.splice(6, 0, '')
  const csv = '\uFEFF\n\n' + lines.join('\r\n')
  assert.equal(parseAgentPerformance(csv, options).rows.length, 2)
})

test('header reordering preserves every performance field', () => {
  const original = parseAgentPerformance(fixture('performance'), options)
  const reversed = parseAgentPerformance(fixture('performance', { headers: [...performanceHeaders].reverse() }), options)
  assert.deepEqual(reversed.rows, original.rows)
  assert.deepEqual(reversed.totals, original.totals)
})

test('pause tolerates CSV spacer variants without moving named codes', () => {
  const csv = fixture('pause').replace('"PAUSE","","",', '"PAUSE",,"",')
  const result = parsePauseBreakdown(csv, options)
  assert.equal(result.rows.length, 2)
  assert.equal(result.rows[0].break_seconds, 1)
  assert.equal(result.rows[0].cb_seconds, 1)
  assert.equal(result.rows[0].login_seconds, 1)
  assert.deepEqual(result.rows[0].unmapped_columns, { column_9: 3 })
  assert.deepEqual(result.totals.unmapped_columns, { column_9: 6 })
  assert.deepEqual(result.warnings, [{ category: 'unnamed_columns', columns: [8, 9] }])
  assert.ok(result.comparisons.every(value => value.matches))
})

test('pause named columns are safely reorderable', () => {
  const header = [...pauseHeaders.filter(Boolean)].reverse()
  const result = parsePauseBreakdown(fixture('pause', { headers: header }), options)
  const expected = parsePauseBreakdown(fixture('pause', { headers: pauseHeaders.filter(Boolean) }), options)
  assert.deepEqual(result.rows, expected.rows)
  assert.deepEqual(result.totals, expected.totals)
})

test('extra disposition is validated and retained, not silently dropped', () => {
  const result = parseAgentPerformance(fixture('performance', { headers: [...performanceHeaders, 'NEW_CODE'] }), options)
  assert.equal(result.rows[0].dispositions.NEW_CODE, 1)
  assert.equal(result.totals.dispositions.NEW_CODE, 2)
  assert.deepEqual(result.warnings[0], { category: 'extra_disposition_columns', columns: ['NEW_CODE'] })
})

test('extra named pause is retained as an unknown code, not renamed', () => {
  const result = parsePauseBreakdown(fixture('pause', { headers: [...pauseHeaders, 'Custom'] }), options)
  assert.deepEqual(result.rows[0].other_pause_seconds, { CUSTOM: 2 })
  assert.equal(result.totals.other_pause_seconds.CUSTOM, 4)
})

test('missing required fields fail explicitly in both formats', () => {
  rejects(() => parseAgentPerformance(fixture('performance', { headers: performanceHeaders.filter(name => name !== 'XFER') }), options), 'missing_required_column')
  rejects(() => parsePauseBreakdown(fixture('pause', { headers: pauseHeaders.filter(name => name !== 'Tech') }), options), 'missing_required_column')
})

test('duplicate semantic header is not silently overwritten', () => {
  rejects(() => parseAgentPerformance(fixture('performance', { headers: [...performanceHeaders, ' xfer '] }), options), 'duplicate_header')
})

test('missing header or metadata is not an empty successful sync', () => {
  rejects(() => parseAgentPerformance('"CALLS","XFER"\n"1","1"', options), 'missing_header')
  rejects(() => parseAgentPerformance(fixture('performance').split('\r\n').slice(4).join('\r\n'), options), 'missing_report_metadata')
})

test('duration validation preserves real zeros and accepts long totals', () => {
  assert.equal(parseViciDuration('0:00:00'), 0)
  assert.equal(parseViciDuration('433:23:25'), 1560205)
  for (const invalid of ['', '1:60:00', '0:00:60', '-1:00:00', '0:1:02', 'n/a', '7']) {
    rejects(() => parseViciDuration(invalid), 'invalid_duration')
  }
})

test('corrupt duration cannot be coerced to zero in either parser', () => {
  for (const [type, parser, target] of [['performance', parseAgentPerformance, 'TALK'], ['pause', parsePauseBreakdown, 'Tech']]) {
    const csv = fixture(type, { transform: ({ headers, agents }) => { agents[0][headers.indexOf(target)] = 'CORRUPT' } })
    rejects(() => parser(csv, options), 'invalid_duration')
  }
})

test('corrupt, negative, fractional and unsafe counts fail without echoing values', () => {
  for (const invalid of ['', 'password-test-do-not-log', '-1', '1.5', '9007199254740992']) {
    const csv = fixture('performance', { transform: ({ headers, agents }) => { agents[0][headers.indexOf('DNC')] = invalid } })
    assert.throws(() => parseAgentPerformance(csv, options), error => {
      assert.equal(error.category, 'invalid_count')
      assert.equal(error.line, 6)
      assert.equal(error.column, performanceHeaders.indexOf('DNC') + 1)
      assert.ok(!JSON.stringify(error).includes(invalid || 'password-test'))
      assert.ok(!error.message.includes('password-test'))
      return true
    })
  }
})

test('malformed row width, CSV quotes, duplicates and invalid IDs are rejected', () => {
  const width = fixture('performance', { transform: ({ agents }) => { agents[0].pop() } })
  rejects(() => parseAgentPerformance(width, options), 'row_width_mismatch')
  rejects(() => tokenizeViciCsv('"unfinished'), 'malformed_csv')
  rejects(() => tokenizeViciCsv('"closed"junk'), 'malformed_csv')
  rejects(() => tokenizeViciCsv('not"quoted'), 'malformed_csv')
  for (const [value, category] of [['0001', 'duplicate_agent_code'], ['1e3', 'invalid_agent_code'], ['', 'invalid_agent_code']]) {
    rejects(() => parseAgentPerformance(fixture('performance', { transform: ({ headers, agents }) => { agents[1][headers.indexOf('ID')] = value } }), options), category)
  }
})

test('mismatching totals warn and retain valid observations', () => {
  const result = parseAgentPerformance(fixture('performance', { transform: ({ headers, summary }) => { summary[headers.indexOf('CALLS')] = '100' } }), options)
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.warnings, [{ category: 'totals_mismatch', column: 'CALLS', reported: 100, computed: 28 }])
})

test('absent TOTALS warns, invalid or duplicate TOTALS fails', () => {
  const result = parseAgentPerformance(fixture('performance', { totals: false }), options)
  assert.deepEqual(result.warnings, [{ category: 'missing_totals' }])
  const csv = fixture('performance')
  const summary = csv.trim().split('\r\n').at(-1)
  rejects(() => parseAgentPerformance(csv + summary, options), 'duplicate_totals')
  rejects(() => parseAgentPerformance(csv.replace('AGENTS:2', 'AGENTS:unknown'), options), 'invalid_totals_agent_count')
})

test('unnamed pause values remain unknown; missing values are not made zero', () => {
  const result = parsePauseBreakdown(fixture('pause', { transform: ({ agents }) => { agents[0][8] = '' } }), options)
  assert.equal(result.rows[0].unmapped_columns.column_9, undefined)
  assert.ok(result.warnings.some(warning => warning.category === 'unmapped_totals_not_comparable'))
  rejects(() => parsePauseBreakdown(fixture('pause', { transform: ({ agents }) => { agents[0][8] = 'UNKNOWN' } }), options), 'invalid_duration')
})

test('HTML login/validation cannot masquerade as successful CSV', () => {
  const ip = '<!doctype html><title>User Validation</title><form action="abc_validation.php"></form>'
  assert.equal(classifyReportResponse(ip), 'requires_ip_validation')
  assert.throws(() => parseAgentPerformance(ip, options), error => error.category === 'requires_ip_validation' && error.requires_ip_validation)
  rejects(() => parsePauseBreakdown('<html><form>Password</form></html>', options), 'unexpected_html_response')
  rejects(() => parseAgentPerformance('', options), 'empty_report')
  rejects(() => parseAgentPerformance(null, options), 'invalid_response')
})

test('invalid report clocks, inverted ranges and ingestion timestamps fail', () => {
  rejects(() => parseAgentPerformance(fixture('performance').replace('19:45:14', '25:45:14'), options), 'invalid_source_timestamp')
  rejects(() => parseAgentPerformance(fixture('performance').replace('2026-10-09 00:00:00 to 2026-10-09', '2026-10-10 00:00:00 to 2026-10-09'), options), 'invalid_source_range')
  rejects(() => parseAgentPerformance(fixture('performance'), { ingestedAt: 'yesterday' }), 'invalid_ingestion_timestamp')
})

test('a report with zero observations is not an apparently valid empty Dashboard', () => {
  const csv = fixture('performance').split('\r\n')
  csv.splice(5, 2)
  rejects(() => parseAgentPerformance(csv.join('\r\n'), options), 'empty_agent_report')
})

test('declared agent mismatch is visible without discarding rows', () => {
  const result = parseAgentPerformance(fixture('performance').replace('AGENTS:2', 'AGENTS:50'), options)
  assert.equal(result.rows.length, 2)
  assert.ok(result.warnings.some(warning => warning.category === 'totals_mismatch' && warning.column === 'AGENTS'))
})

test('oversized inputs are rejected before parsing', () => {
  rejects(() => tokenizeViciCsv('x'.repeat(5 * 1024 * 1024 + 1)), 'report_too_large')
  rejects(() => tokenizeViciCsv('\n'.repeat(20_001)), 'empty_report')
  rejects(() => tokenizeViciCsv('value\n'.repeat(20_001)), 'too_many_rows')
})

test('a CSV value containing an embedded line break does not shift columns', () => {
  const csv = fixture('performance', { transform: ({ headers, agents }) => { agents[0][headers.indexOf('USER NAME')] = 'Fixture\nOne' } })
  const result = parseAgentPerformance(csv, options)
  assert.equal(result.rows[0].vici_user_name, 'Fixture One')
  assert.equal(result.rows[0].calls, 11)
})

test('parser is server-only and does not expose source data to the mounted app', () => {
  const app = readFileSync(new URL('../../src/auth/AuthApp.jsx', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../../src/auth/screens/ProductDashboardPage.jsx', import.meta.url), 'utf8')
  assert.ok(!/viciReportParsers|VICI_REPORT_PASSWORD|VICI_REPORT_USER|VICI_BASE_URL/.test(app + page))
  assert.match(page, /IN DEVELOPMENT/)
})
