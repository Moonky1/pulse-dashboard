import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALERT_METRICS, defaultAlertRules, validAlertRules, normalizeAlertConfig, evaluateAlerts, loadAlertConfig, saveAlertConfig, loadAlertHistory } from '../../src/dashboard/alertRules.js'
import { testReport, testScope } from './ui-fixtures.mjs'
import { alertFixture } from './alert-fixtures.mjs'

function enabled(id, threshold) { const c = alertFixture(); Object.assign(c.rules.find(r => r.id === id), { enabled: true, threshold_seconds: threshold }); return c }
test('alert catalog starts disabled with no invented business thresholds', () => {
  assert.equal(ALERT_METRICS.length, 8)
  assert.ok(validAlertRules(defaultAlertRules()))
  assert.ok(defaultAlertRules().every(r => r.enabled === false && r.threshold_seconds === null))
  assert.equal(evaluateAlerts(testReport(), alertFixture()).flatMap(r => r.checks).length, 0)
})
for (const [label, change] of [
  ['extra rule', r => r.push(r[0])], ['missing rule', r => r.pop()], ['duplicate rule', r => { r[0] = r[1] }],
  ['unknown metric', r => { r[0].id = 'sales' }], ['extra property', r => { r[0].actor = 'spoof' }],
  ['null enabled', r => { r[0].enabled = null }], ['enabled without threshold', r => { r[0].enabled = true }],
  ['string limit', r => { r[0].threshold_seconds = '20' }], ['negative limit', r => { r[0].threshold_seconds = -1 }],
  ['fractional limit', r => { r[0].threshold_seconds = 0.5 }], ['huge limit', r => { r[0].threshold_seconds = 31536001 }],
]) test('alert configuration rejects ' + label, () => { const r = defaultAlertRules(); change(r); assert.equal(validAlertRules(r), false) })
test('strict comparisons preserve equality and genuine zeroes', () => {
  const report = testReport()
  assert.equal(evaluateAlerts(report, enabled('talk_avg',126))[0].checks[0].state, 'within')
  assert.equal(evaluateAlerts(report, enabled('talk_avg',127))[0].checks[0].state, 'triggered')
  assert.equal(evaluateAlerts(report, enabled('dead_avg',6))[0].checks[0].state, 'within')
  assert.equal(evaluateAlerts(report, enabled('dead_avg',5))[0].checks[0].state, 'triggered')
  report.pause[0].rr_seconds = 0
  assert.equal(evaluateAlerts(report, enabled('rr',0))[0].checks[0].state, 'within')
})
test('pause thresholds refer to source code totals, never performance pause totals', () => {
  const report = testReport(); report.performance[0].pause_seconds = 999999
  const result = evaluateAlerts(report, enabled('rr',500))[0].checks[0]
  assert.equal(result.value,480); assert.equal(result.state,'within'); assert.equal(result.source,'pause')
})
for (const missing of [undefined, null, NaN, -1, '0']) test('missing or corrupt metric is not zero: ' + String(missing), () => {
  const report = testReport(); report.performance[0].talk_avg_seconds = missing
  assert.equal(evaluateAlerts(report, enabled('talk_avg',20))[0].checks[0].state,'unavailable')
})
test('zero calls are not usable source averages', () => {
  const report = testReport(); report.performance[0].calls = 0
  assert.equal(evaluateAlerts(report, enabled('dead_avg',0))[0].checks[0].state, 'unavailable')
})
test('union of string identities retains leading zeroes and missing report side', () => {
  const report = testReport(); report.pause.shift()
  assert.equal(evaluateAlerts(report, enabled('rr',0))[0].code, '01000')
  assert.equal(evaluateAlerts(report, enabled('rr',0))[0].checks[0].state, 'unavailable')
  report.performance.shift()
  report.pause.push({ agent_code:'0001',vici_user_name:'Pause only',current_user_group:'Other',rr_seconds:800 })
  assert.equal(evaluateAlerts(report, enabled('talk_avg',20))[0].checks[0].state, 'unavailable')
})
test('group membership is not inferred from names or another report side', () => {
  const report=testReport(); report.pause[0].current_user_group='MovedGroup'
  assert.equal(evaluateAlerts(report,enabled('rr',0))[0].checks[0].group,'MovedGroup')
})
test('evaluation has no cross-scope or empty-report fallback and never mutates inputs', () => {
  const report=testReport(), config=enabled('rr',0), before=JSON.stringify([report,config])
  evaluateAlerts(report,config); assert.equal(JSON.stringify([report,config]),before)
  assert.deepEqual(evaluateAlerts({...report, snapshot:null},config),[])
  assert.deepEqual(evaluateAlerts(report,{...config,scope_id:'other'}),[])
})
test('configuration identity, version and audit metadata must be verified', () => {
  assert.equal(normalizeAlertConfig(alertFixture(),testScope.id).revision,0)
  for (const patch of [{scope_id:'other'},{schema_version:2},{revision:-1},{can_manage:'true'},{revision:1},{changed_by_name:'unverified'}]) assert.throws(() => normalizeAlertConfig({...alertFixture(),...patch},testScope.id))
  assert.throws(() => normalizeAlertConfig(enabled('rr',1200),testScope.id))
})
test('read and save use only protected RPCs with optimistic revision, no actor spoofing', async () => {
  const calls=[], client={rpc:async(name,args)=>{calls.push([name,args]);return {data:alertFixture()} }}
  assert.ok((await loadAlertConfig(client,testScope.id)).data)
  assert.ok((await saveAlertConfig(client,testScope.id,0,defaultAlertRules())).data)
  assert.deepEqual(calls.map(c=>c[0]),['get_vici_alert_rules','save_vici_alert_rules'])
  assert.deepEqual(Object.keys(calls[1][1]),['requested_scope','expected_revision','requested_rules'])
})
test('invalid configuration cannot reach save RPC', async () => {
  const client={rpc:()=>assert.fail('must not call')}
  assert.equal((await saveAlertConfig(client,testScope.id,0,[])).code,'invalid')
  assert.equal((await saveAlertConfig(client,testScope.id,-1,defaultAlertRules())).code,'invalid')
})
test('conflict, revoked access and unknown save outcome are safe explicit failures', async () => {
  for (const [code,want] of [['40001','conflict'],['42501','access_denied'],['XX000','unavailable']]) {
    const r=await saveAlertConfig({rpc:async()=>({error:{code,message:'private-secret'}})},testScope.id,0,defaultAlertRules())
    assert.equal(r.code,want); assert.equal(r.data,undefined); assert.doesNotMatch(r.error,/private-secret/)
  }
})
test('history requires valid ordered revisions and bounded pages', async () => {
  const v={revision:1,rules:defaultAlertRules(),changed_at:'2026-10-10T18:00:00Z',changed_by_name:'Synthetic Admin'}
  const client=rows=>({rpc:async()=>({data:rows})})
  assert.equal((await loadAlertHistory(client([v]),testScope.id)).rows.length,1)
  for(const rows of [[v,v],Array(21).fill(v),[{...v,rules:[]}],[{...v,changed_at:null}]]) assert.ok((await loadAlertHistory(client(rows),testScope.id)).error)
})
test('migration exposes no raw table or service-role mutation and adds no automatic activation', () => {
  const sql=readFileSync(new URL('../../supabase/migrations/20261010000300_vici_alert_rules.sql',import.meta.url),'utf8')
  assert.match(sql,/enable row level security/); assert.match(sql,/revoke all on public.vici_alert_rule_versions from public,anon,authenticated,service_role/)
  assert.match(sql,/for update/); assert.match(sql,/errcode='40001'/)
  assert.doesNotMatch(sql,/grant (select|insert|update|delete)|\bcron\b|update public\.vici_|insert into public\.vici_alert_rule_versions[\s\S]*values\(/i)
})
