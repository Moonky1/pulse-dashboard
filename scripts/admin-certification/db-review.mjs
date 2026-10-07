import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'

// Schema-only copy. Never point this runner at a linked/remote or existing app DB.
const container = process.env.PULSE_ADMIN2_LOCAL_CONTAINER || 'supabase_db_auth-google-selector'
const database = process.argv.find(value => value.startsWith('--database='))?.slice(11) || 'pulse_admin2_review_20261005'
if (!/^pulse_admin2_(review|checks|browser)_review_20261005(_[0-9]{1,2})?$/.test(database) && !/^pulse_admin2_purge_review_20261006(_[0-9]{1,2})?$/.test(database) && database !== 'pulse_admin2_review_20261005') throw new Error('Only task-owned local review database names are accepted')
const snapshot = process.env.PULSE_ADMIN2_SCHEMA_SNAPSHOT || 'review-evidence.local/production-schema.sql'
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 40 * 1024 * 1024, windowsHide: true })
  if (result.status !== 0) throw new Error((result.stderr || result.stdout).slice(-5000))
  return result.stdout
}
function sql(input, role = 'postgres', db = database) {
  return docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', role, '-d', db], input)
}
if (!process.argv.includes('--tests-only')) {
const exists = docker(['exec', container, 'psql', '-X', '-At', '-U', 'supabase_admin', '-d', 'postgres', '-c', `select count(*) from pg_database where datname='${database}'`]).trim()
if (exists !== '0') {
  throw new Error('Review database already exists. It will not be deleted; choose a fresh task-owned review name.')
}
sql(`create database ${database} owner supabase_admin;`, 'supabase_admin', 'postgres')
const support = docker(['exec', container, 'pg_dump', '-U', 'supabase_admin', '-d', 'postgres', '--schema-only', '--no-owner', '--no-acl', '-n', 'auth', '-n', 'extensions', '-n', 'storage', '-n', 'realtime'])
const policies = (support.match(/^CREATE POLICY[\s\S]*?;\s*$/gm) || []).join('\n')
sql(support.replace(/^CREATE POLICY[\s\S]*?;\s*$/gm, ''), 'supabase_admin')
sql(`grant usage on schema auth,storage,realtime,extensions to postgres; grant all on all tables in schema auth,storage,realtime to postgres; grant execute on all functions in schema realtime to postgres; alter database ${database} owner to postgres;`, 'supabase_admin')
sql('set role postgres;\n' + readFileSync(snapshot, 'utf8'), 'supabase_admin')
sql(policies, 'supabase_admin')
sql(docker(['exec', container, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '--data-only', '--column-inserts', '--no-owner', '--no-acl', '-t', 'public.roles', '-t', 'public.permissions', '-t', 'public.role_permissions', '-t', 'public.role_scopes']))
sql('create extension if not exists pgtap with schema extensions;')
const baseline = readdirSync('supabase/migrations').filter(name => /^20261003000[56]00_|^2026100400\d{4}_/.test(name)).sort()
if (baseline.length !== 12) throw new Error('Expected the exact 12 migration baseline for this schema-only snapshot')
const admin2 = readdirSync('supabase/migrations').filter(name => /^20261005000[12]00_/.test(name)).sort()
for (const name of [...baseline, ...admin2]) {
  sql(readFileSync(`supabase/migrations/${name}`, 'utf8'))
  console.log(`Applied ${name}`)
}
}
sql('grant usage on schema extensions to authenticated,service_role;', 'supabase_admin')
// Canonical private bucket settings are catalog data, not stored user media.
sql("insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('staff-avatars','staff-avatars',false,1048576,array['image/webp']) on conflict(id) do nothing;", 'supabase_admin')
// Static RBAC catalog only. No Staff, invitations or business assignments copied.
if (sql('select count(*) from public.role_grant_rules;').match(/\n\s*0\s*\n/)) {
  sql(docker(['exec', container, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '--data-only', '--column-inserts', '--no-owner', '--no-acl', '-t', 'public.role_grant_rules']))
}
let assertions = 0
const relevantBaseline = /^(20260825000[12]00|20260826000[12]00|20260830000100|20260910000200|20260923000100|20260924000[124]00|20261002000200|2026100400\d{4})_/
const tests = readdirSync('supabase/tests').filter(name => /^2026100500/.test(name) || process.argv.includes('--invitation-recovery') && /^20261006000[13]00_/.test(name) || process.argv.includes('--regressions') && relevantBaseline.test(name)).sort()
for (const name of tests) {
  const output = sql(readFileSync(`supabase/tests/${name}`, 'utf8'))
  if (/not ok|Looks like you failed/i.test(output)) throw new Error(`${name}\n${output}`)
  const count = (output.match(/\bok \d+ -/g) || []).length
  if (!count) throw new Error('No assertions executed')
  assertions += count
  console.log(`${name}: ${count} assertions passed`)
}
console.log(JSON.stringify({ database, assertions, leftovers: sql('select (select count(*) from auth.users) as auth,(select count(*) from public.users) as staff,(select count(*) from public.agents) as agents,(select count(*) from public.training_results) as results,(select count(*) from public.staff_invitations) as invitations;').trim() }))
