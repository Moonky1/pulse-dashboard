import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeRetention, loadRetention } from '../../src/dashboard/retentionApi.js'
import { retentionFixture } from './retention-fixtures.mjs'
import { testScope } from './ui-fixtures.mjs'
test('retention accepts only the fixed read-only contract', () => {
  assert.equal(normalizeRetention(retentionFixture(), testScope.id, '2026-10-10', 0).rows.length, 100)
})
for (const [label, change] of [
  ['write mode', d => { d.deletion_enabled = true }], ['not dry-run', d => { d.dry_run = false }],
  ['wrong scope', d => { d.scope_id = 'other' }], ['wrong date', d => { d.as_of_date = '2026-10-11' }],
  ['wrong page', d => { d.offset = 100 }], ['changed policy', d => { d.policy.detail_days = 1 }],
  ['invalid window', d => { d.policy.daily_from = 'not-date' }],
  ['negative counts', d => { d.totals.retain = -1 }], ['inconsistent counts', d => { d.totals.versions = 300 }],
  ['unknown reason', d => { d.rows[0].reason = 'private-error' }], ['wrong classification', d => { d.rows[0].decision = 'retain' }],
  ['duplicate ids', d => { d.rows[1].id = d.rows[0].id }], ['invalid date', d => { d.rows[0].report_date = '2026-02-30' }],
  ['oversized page', d => { d.rows.push(d.rows[0]) }],
]) test('retention rejects ' + label, () => {
  const data = retentionFixture(); change(data)
  assert.throws(() => normalizeRetention(data, testScope.id, '2026-10-10', 0))
})
test('retention client sends only scope, explicit date and page to the read RPC', async () => {
  let observed
  const r = await loadRetention({ rpc: async (name, args) => { observed = [name, args]; return { data: retentionFixture() } } }, testScope.id, '2026-10-10')
  assert.ok(r.data)
  assert.deepEqual(observed, ['preview_vici_retention', { requested_scope: testScope.id, as_of_date: '2026-10-10', page_offset: 0 }])
})
test('invalid date/scope/offset never invokes server', async () => {
  const client = { rpc: () => assert.fail('RPC must not run') }
  for (const args of [['bad','2026-10-10',0],[testScope.id,'2026-02-30',0],[testScope.id,'2026-10-10',-1],[testScope.id,'1800-01-01',0]]) assert.ok((await loadRetention(client, ...args)).error)
})
test('retention permissions and raw server errors never leak a result or private details', async () => {
  for (const code of ['42501','XX000']) {
    const r = await loadRetention({ rpc: async () => ({ error: { code, message: 'private SQL' } }) }, testScope.id, '2026-10-10')
    assert.ok(r.error); assert.equal(r.data, undefined); assert.doesNotMatch(r.error, /private SQL/)
  }
})
test('simulation migration has no data mutation, schedule or public private-helper grant', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261010000200_vici_retention_preview.sql', import.meta.url), 'utf8').replace(/--[^\n]*/g, '')
  assert.doesNotMatch(sql, /\b(delete|insert|update|truncate|cron|pg_net)\b/i)
  assert.match(sql, /language sql stable security definer/)
  assert.match(sql, /revoke all on function pulse_private\.vici_retention_plan/)
})
