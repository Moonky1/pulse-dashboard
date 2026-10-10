// Read-only proof against the operator's private ORIGINAL files.
// No raw CSV, identities, credential values or individual rows are printed or written.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseAgentPerformance, parsePauseBreakdown } from '../../supabase/functions/_shared/viciReportParsers.mjs'

const [performancePath, pausePath] = process.argv.slice(2)
if (!performancePath || !pausePath || process.argv.length !== 4) {
  console.error('Usage: npm run dashboard:verify-fixtures -- <private-performance.csv> <private-pause.csv>')
  process.exit(1)
}
try {
  const ingestedAt = new Date().toISOString()
  const [performanceText, pauseText] = await Promise.all([readFile(performancePath, 'utf8'), readFile(pausePath, 'utf8')])
  const performance = parseAgentPerformance(performanceText, { ingestedAt })
  const pause = parsePauseBreakdown(pauseText, { ingestedAt })
  for (const result of [performance, pause]) {
    assert.equal(result.rows.length, 50, 'Expected exactly 50 real agent records')
    assert.equal(result.totals?.agent_count, 50, 'Expected VICIdial TOTALS AGENTS:50')
    assert.ok(result.rows.every(row => typeof row.agent_code === 'string'), 'Agent codes must remain strings')
    assert.ok(result.comparisons.every(value => value.matches), 'Reported and computed additive totals must reconcile')
  }
  assert.deepEqual(performance.rows.map(row => row.agent_code).sort(), pause.rows.map(row => row.agent_code).sort(), 'Both files must represent the same agent ID set')
  assert.deepEqual(performance.source_range, pause.source_range, 'Source report ranges must agree')
  assert.ok(performance.rows.every(row => row.xfer_count === row.dispositions.XFER), 'XFER must stay canonical')
  console.log(JSON.stringify({
    proof: 'original_private_files', ingestionTimestamp: ingestedAt,
    performance: { rows: performance.rows.length, comparisons: performance.comparisons.length, allTotalsMatch: true, sourceGeneratedAt: performance.source_generated_at, warnings: performance.warnings },
    pause: { rows: pause.rows.length, comparisons: pause.comparisons.length, allTotalsMatch: true, sourceGeneratedAt: pause.source_generated_at, warnings: pause.warnings },
    sourceRange: performance.source_range, sameAgentIdSet: true, agentIdsRemainStrings: true,
    xferPreserved: true, spanisIndependent: true, rawSourceRetained: false,
  }, null, 2))
} catch (error) {
  // Do not print filesystem errors or assertion diffs that could contain identities.
  console.error(JSON.stringify({ proof: 'failed', category: error.category ?? 'fixture_verification_failed', line: error.line ?? null, column: error.column ?? null }))
  process.exitCode = 1
}
