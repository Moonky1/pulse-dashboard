import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

// Generates an explicit reviewed transaction. Never connects to a database.
const file = '20261010000100_vici_manual_reports.sql'
const source = await readFile(new URL('../../supabase/migrations/' + file, import.meta.url), 'utf8')
const body = source.replace(/^begin;\s*/m, '').replace(/commit;\s*$/, '')
const output = 'review-evidence.local/dashboard-manual/migration-bundle.sql'
await mkdir('review-evidence.local/dashboard-manual', { recursive: true })
await writeFile(output, "begin;\nset local lock_timeout='5s';\nset local statement_timeout='120s';\n" + body +
  "\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('20261010000100','vici_manual_reports',array[$manual_source$" + body + "$manual_source$]);\nnotify pgrst,'reload schema';\ncommit;\nselect version,name from supabase_migrations.schema_migrations where version='20261010000100';\n")
console.log(JSON.stringify({ generated: output, file, sha256: createHash('sha256').update(source).digest('hex'), databaseOperations: 0 }))
