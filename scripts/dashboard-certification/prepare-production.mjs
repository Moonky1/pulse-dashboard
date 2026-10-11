import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Prepare only. Does not connect, deploy, or copy Preview report/user data.
const files = ['20261009000100_vici_dashboard_storage.sql', '20261010000100_vici_manual_reports.sql',
  '20261010000200_vici_retention_preview.sql', '20261010000300_vici_alert_rules.sql', '20261011000100_vici_independent_reports.sql']
let sql = `begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
do $guard$ begin
  if (select max(version) from supabase_migrations.schema_migrations) is distinct from '20261008000100'
    or to_regclass('public.vici_report_scopes') is not null then
    raise exception 'Dashboard Production baseline changed; release aborted';
  end if;
end $guard$;
`
const manifest = []
for (const file of files) {
  const source = await readFile(new URL('../../supabase/migrations/' + file, import.meta.url), 'utf8')
  const body = source.replace(/^begin;\s*/m, '').replace(/commit;\s*$/, '')
  const [version, ...name] = file.replace(/\.sql$/, '').split('_')
  if (body.includes('$dashboard_release$')) throw Error('Unexpected SQL delimiter')
  sql += body + `\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name.join('_')}',array[$dashboard_release$${body}$dashboard_release$]);\n`
  manifest.push({ file, sha256: createHash('sha256').update(source).digest('hex') })
}
sql += `notify pgrst,'reload schema';
commit;
select version,name from supabase_migrations.schema_migrations where version>='20261009000100' order by version;
`
const output = 'review-evidence.local/dashboard-production/schema.sql'
await mkdir('review-evidence.local/dashboard-production', { recursive: true })
await writeFile(output, sql)
console.log(JSON.stringify({ output, manifest, databaseOperations: 0 }))
