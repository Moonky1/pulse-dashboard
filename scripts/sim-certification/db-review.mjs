import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'

const container = 'supabase_db_auth-google-selector'
const baseline = 'pulse_admin2_purge_review_20261006_19'
const database = process.argv.find(v => v.startsWith('--database='))?.slice(11) || 'pulse_sim1_review_20261006'
if (!/^pulse_sim1_review_20261006(_[0-9]{1,2})?$/.test(database)) throw new Error('Only a SIM-owned local database is permitted')
function docker(args, input) {
  const r = spawnSync('docker', args, { input, encoding: 'utf8', windowsHide: true, maxBuffer: 40 * 1024 * 1024 })
  if (r.status !== 0) throw new Error((r.stdout + '\n' + r.stderr).slice(-6000))
  return r.stdout
}
function sql(input, db = database, role = 'postgres') {
  return docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', role, '-d', db], input)
}
if (!process.argv.includes('--tests-only')) {
  const exists = docker(['exec', container, 'psql', '-XAt', '-U', 'supabase_admin', '-d', 'postgres', '-c', `select count(*) from pg_database where datname='${database}'`]).trim()
  if (exists !== '0') throw new Error('Existing database will not be deleted. Choose a fresh SIM-owned name.')
  sql(`create database ${database} owner supabase_admin;`, 'postgres', 'supabase_admin')
  const support = docker(['exec', container, 'pg_dump', '-U', 'supabase_admin', '-d', 'postgres', '--schema-only', '--no-owner', '--no-acl', '-n', 'auth', '-n', 'extensions', '-n', 'storage', '-n', 'realtime'])
  const policies = (support.match(/^CREATE POLICY[\s\S]*?;\s*$/gm) || []).join('\n')
  sql(support.replace(/^CREATE POLICY[\s\S]*?;\s*$/gm, ''), database, 'supabase_admin')
  sql(`grant usage on schema auth,storage,realtime,extensions to postgres; grant all on all tables in schema auth,storage,realtime to postgres; grant execute on all functions in schema realtime to postgres; alter database ${database} owner to postgres;`, database, 'supabase_admin')
  // Schema only, including ACLs. Never copy people, credentials or business data.
  const schema = docker(['exec', container, 'pg_dump', '-U', 'postgres', '-d', baseline, '--schema-only', '--no-owner', '-n', 'public', '-n', 'pulse_private'])
  sql(schema.replace(/^CREATE SCHEMA public;$/m, ''))
  sql(policies, database, 'supabase_admin')
  sql(docker(['exec', container, 'pg_dump', '-U', 'postgres', '-d', baseline, '--data-only', '--column-inserts', '--no-owner', '--no-acl', '-t', 'public.roles', '-t', 'public.permissions', '-t', 'public.role_permissions', '-t', 'public.role_scopes', '-t', 'public.role_grant_rules']))
  sql('create extension if not exists pgtap with schema extensions;')
  sql(readFileSync('supabase/migrations/20261006000500_simulation_foundation.sql', 'utf8'))
}
// pg_dump -n omits extension-owned functions. Recreate the existing required
// extension only inside the validated SIM-owned local database.
sql('create extension if not exists pgcrypto with schema extensions;')
let assertions = 0
// Historical TRAIN-1 fixture files predate private-media lifecycle constraints.
// Use the current GO-4/Agent regression fixtures against the current baseline.
const tests = readdirSync('supabase/tests').filter(name => !process.argv.includes('--tests-only') && name === '20261006000500_simulation_foundation_test.sql' || process.argv.includes('--regressions') && /^(20261003000100|2026100400\d{4})_/.test(name)).sort()
if (!process.argv.includes('--tests-only') && !tests.includes('20261006000500_simulation_foundation_test.sql')) throw new Error('SIM contract test is required')
for (const name of tests) {
  const output = sql(readFileSync('supabase/tests/' + name, 'utf8'))
  if (/not ok|Looks like you failed/i.test(output)) throw new Error(name + '\n' + output)
  const count = (output.match(/\bok \d+ -/g) || []).length
  if (!count) throw new Error('No assertions executed')
  assertions += count
  console.log(name + ': ' + count + ' assertions passed')
}
if (!process.argv.includes('--tests-only')) {
sql(readFileSync('supabase/migrations/20261007000100_vici_opener_challenges.sql', 'utf8'))
const viciOutput = sql(readFileSync('supabase/tests/20261007000100_vici_opener_challenges_test.sql', 'utf8'))
if (/not ok|Looks like you failed/i.test(viciOutput)) throw new Error(viciOutput)
const viciCount = (viciOutput.match(/\bok \d+ -/g) || []).length
if (!viciCount) throw new Error('Manual VICI contract assertions are required')
assertions += viciCount
console.log('Manual VICI: ' + viciCount + ' assertions passed')
sql(readFileSync('supabase/migrations/20261007000200_vici_call_lifecycle.sql', 'utf8'))
}
const lifecycleOutput=process.argv.includes('--tests-only') ? '' : sql(readFileSync('supabase/tests/20261007000200_vici_call_lifecycle_test.sql','utf8'))
if (/not ok|Looks like you failed/i.test(lifecycleOutput)) throw new Error(lifecycleOutput)
const lifecycleCount=(lifecycleOutput.match(/\bok \d+ -/g)||[]).length
if (!lifecycleCount && !process.argv.includes('--tests-only')) throw new Error('Lifecycle assertions required')
assertions+=lifecycleCount
console.log('VICI call lifecycle: '+lifecycleCount+' assertions passed')
if (!process.argv.includes('--tests-only')) sql(readFileSync('supabase/migrations/20261007000300_vici_pause_codes_spanis.sql','utf8'))
const pauseOutput=sql(readFileSync('supabase/tests/20261007000300_vici_pause_codes_spanis_test.sql','utf8'))
if (/not ok|Looks like you failed/i.test(pauseOutput)) throw new Error(pauseOutput)
const pauseCount=(pauseOutput.match(/\bok \d+ -/g)||[]).length
if (!pauseCount) throw new Error('Pause codes and SPANIS assertions required')
assertions+=pauseCount
console.log('VICI pause codes and SPANIS: '+pauseCount+' assertions passed')
if (!process.argv.includes('--tests-only')) sql(readFileSync('supabase/migrations/20261007000400_vici_call_practice.sql','utf8'))
const practiceOutput=sql(readFileSync('supabase/tests/20261007000400_vici_call_practice_test.sql','utf8'))
if (/not ok|Looks like you failed/i.test(practiceOutput)) throw new Error(practiceOutput)
const practiceCount=(practiceOutput.match(/\bok \d+ -/g)||[]).length
if (!practiceCount) throw new Error('Practice contract assertions required')
assertions+=practiceCount
console.log('VICI practice: '+practiceCount+' assertions passed')
if (!process.argv.includes('--tests-only') || process.argv.includes('--add-audio')) sql(readFileSync('supabase/migrations/20261007000500_vici_private_audio.sql','utf8'))
const audioOutput=sql(readFileSync('supabase/tests/20261007000500_vici_private_audio_test.sql','utf8'))
if (/not ok|Looks like you failed/i.test(audioOutput)) throw new Error(audioOutput)
const audioCount=(audioOutput.match(/\bok \d+ -/g)||[]).length
if (!audioCount) throw new Error('Private audio assertions required')
assertions+=audioCount
console.log('VICI private audio: '+audioCount+' assertions passed')
console.log(JSON.stringify({ database, assertions, leftovers: sql('select (select count(*) from public.users) staff,(select count(*) from public.agents) agents,(select count(*) from public.training_content) content,(select count(*) from public.training_attempts) attempts;').trim() }))
