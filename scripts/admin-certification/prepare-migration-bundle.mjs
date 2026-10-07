import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

// Generates a reviewed transaction; it never connects to or changes a database.
const permanentRemoval = process.argv.includes('--permanent-removal')
const invitationRecovery = process.argv.includes('--invitation-recovery')
const files = invitationRecovery
  ? ['20261006000300_invited_account_removal.sql', '20261006000400_verified_invitation_setup.sql']
  : permanentRemoval
  ? ['20261006000100_admin2_permanent_account_cleanup.sql', '20261006000200_remove_unapproved_to_unit.sql']
  : ['20261005000100_admin2_people_removal.sql', '20261005000200_admin2_directory_and_invitations.sql']
const output = `review-evidence.local/admin2/${invitationRecovery ? 'invitation-recovery-bundle' : permanentRemoval ? 'permanent-removal-bundle' : 'migration-bundle'}.sql`
const statements = []
const hashes = []
for (const file of files) {
  const source = await readFile(new URL('../../supabase/migrations/' + file, import.meta.url), 'utf8')
  const body = source.replace(/^begin;\s*/m, '').replace(/commit;\s*$/, '')
  const [version, ...name] = file.replace(/\.sql$/, '').split('_')
  statements.push(body, `insert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name.join('_')}',array[$admin2_source$${body}$admin2_source$]);`)
  hashes.push({ file, sha256: createHash('sha256').update(source).digest('hex') })
}
await mkdir('review-evidence.local/admin2', { recursive: true })
await writeFile(output,
  "begin;\nset local lock_timeout='5s';\nset local statement_timeout='120s';\n" + statements.join('\n') +
  `\nnotify pgrst,'reload schema';\ncommit;\nselect version,name from supabase_migrations.schema_migrations where version in (${files.map(file => `'${file.split('_')[0]}'`).join(',')}) order by version;\n`)
console.log(JSON.stringify({ generated: output, migrations: hashes, databaseOperations: 0 }))
