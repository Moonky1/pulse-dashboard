import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Only schema and RBAC catalog from an existing disposable LOCAL review database.
// No remote URL, no real identities, no database deletion/reset, no linked db push.
const container = 'supabase_db_auth-google-selector'
const baseline = 'pulse_sim1_review_20261006_12'
const database = process.argv[2]
if (!/^pulse_dashboard1_review_20261009_[0-9]{1,3}$/.test(database || '')) throw new Error('A fresh Dashboard-owned local database name is required')
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', windowsHide: true, maxBuffer: 40 * 1024 * 1024 })
  if (result.status !== 0) throw new Error((result.stderr || result.stdout).slice(-3500))
  return result.stdout
}
function sql(input, role = 'postgres', target = database) {
  return docker(['exec', '-i', container, 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-U', role, '-d', target], input)
}
if (!process.argv.includes('--tests-only')) {
  if (sql("select count(*) from pg_database where datname='"+database+"'", 'supabase_admin', 'postgres').trim() !== '0') throw new Error('Existing database preserved. Choose a fresh task-owned name.')
  sql('create database '+database+' owner supabase_admin', 'supabase_admin', 'postgres')
  const support = docker(['exec', container, 'pg_dump', '-U', 'supabase_admin', '-d', 'postgres', '--schema-only', '--no-owner', '--no-acl', '-n', 'auth', '-n', 'extensions', '-n', 'storage', '-n', 'realtime'])
  const policies = (support.match(/^CREATE POLICY[\s\S]*?;\s*$/gm) || []).join('\n')
  sql(support.replace(/^CREATE POLICY[\s\S]*?;\s*$/gm, ''), 'supabase_admin')
  sql('grant usage on schema auth,storage,realtime,extensions to postgres; grant all on all tables in schema auth,storage,realtime to postgres; grant execute on all functions in schema realtime to postgres; alter database '+database+' owner to postgres;', 'supabase_admin')
  const schema = docker(['exec', container, 'pg_dump', '-U', 'postgres', '-d', baseline, '--schema-only', '--no-owner', '-n', 'public', '-n', 'pulse_private'])
  sql(schema.replace(/^CREATE SCHEMA public;$/m, ''))
  sql(policies, 'supabase_admin')
  sql(docker(['exec', container, 'pg_dump', '-U', 'postgres', '-d', baseline, '--data-only', '--column-inserts', '--no-owner', '--no-acl',
    '-t', 'public.roles', '-t', 'public.permissions', '-t', 'public.role_permissions', '-t', 'public.role_scopes', '-t', 'public.role_grant_rules']))
  sql('create extension if not exists pgcrypto with schema extensions; create extension if not exists pgtap with schema extensions;')
  sql(readFileSync('supabase/migrations/20261009000100_vici_dashboard_storage.sql', 'utf8'))
}
sql('grant usage on schema extensions to authenticated,service_role;', 'supabase_admin')
const output = sql(readFileSync('supabase/tests/20261009000100_vici_dashboard_storage_test.sql', 'utf8'))
if (/not ok|Looks like you failed/i.test(output)) throw new Error(output)
const assertions = (output.match(/\bok \d+ -/g) || []).length
if (!assertions) throw new Error('Dashboard SQL assertions required')
console.log(JSON.stringify({ database, assertions, result: 'passed', leftovers: sql('select json_build_object(\'staff\',(select count(*) from public.users),\'agents\',(select count(*) from public.agents),\'runs\',(select count(*) from public.vici_sync_runs),\'scopes\',(select count(*) from public.vici_report_scopes));').trim() }))
