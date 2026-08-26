import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL('../../supabase/migrations/20260825000200_audited_user_lifecycle_operations.sql', import.meta.url)
const cliUrl = new URL('./cli.js', import.meta.url)

test('migration exposes only narrow lifecycle, role, and read RPCs', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  for (const name of ['list_managed_users','get_managed_user','block_user','reactivate_user','inactivate_user','assign_user_role','remove_user_role']) assert.match(sql, new RegExp(`create function public\\.${name}\\(`))
  assert.doesNotMatch(sql, /execute\s+format|\btruncate\b/i)
})

test('last Super Admin protection is database-backed and serialized', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /users_protect_last_super_admin/)
  assert.match(sql, /user_roles_protect_last_super_admin/)
  assert.match(sql, /roles_protect_super_admin_catalog/)
})

test('every mutation emits required audit action', async () => {
  const sql = await readFile(migrationUrl, 'utf8')
  for (const action of ['account.blocked','account.reactivated','account.inactivated','role.assigned','role.removed']) assert.match(sql, new RegExp(action.replace('.', '\\.')))
})

test('CLI uses only publishable configuration and never contains elevated-key shortcuts', async () => {
  const source = await readFile(cliUrl, 'utf8')
  assert.match(source, /PULSE_SUPABASE_PUBLISHABLE_KEY/)
  const forbidden = ['SERVICE', 'ROLE'].join('_') + '|DB' + '_URL|DATABASE' + '_URL|access[_-]?' + 'token'
  assert.doesNotMatch(source, new RegExp(forbidden, 'i'))
  assert.match(source, /persistSession:\s*false/)
})
