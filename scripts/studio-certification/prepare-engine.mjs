// Opt-in workaround for the bundled PostgreSQL 17.6 / Supautils error-hint crash.
// Run AFTER local reset. Never part of a migration, browser build or deployment.
import { spawnSync } from 'node:child_process'
import { container, sql } from './local-runtime.mjs'

if (process.env.PULSE_LOCAL_ENGINE_WORKAROUND !== 'supautils-hints') throw new Error('Explicit local engine workaround selection required.')
if (sql("select count(*) from auth.users where email !~ '^studio[1-8]@example[.]test$'") !== '0') throw new Error('Refusing an environment with unrelated users.')
function docker(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8', windowsHide: true })
  if (result.status !== 0) throw new Error('Local engine preparation failed: ' + result.stderr)
}
docker(['exec', container, 'sh', '-c', 'export PGPASSWORD="$POSTGRES_PASSWORD"; exec psql -w -U supabase_admin -d postgres -X -v ON_ERROR_STOP=1 -c "ALTER SYSTEM SET supautils.hint_roles = none"'])
docker(['restart', container])
for (let i = 0; i < 50; i++) {
  const ready = spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'postgres'], { encoding: 'utf8', windowsHide: true })
  if (ready.status === 0) break
  await new Promise(resolve => setTimeout(resolve, 200))
}
if (sql('show supautils.hint_roles') !== 'none') throw new Error('Local error hints are still enabled.')
console.log('Local Supautils error hints disabled; roles, ACLs, RLS and migrations unchanged.')
