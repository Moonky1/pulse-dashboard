import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationUrl = new URL('../../supabase/migrations/20260825000200_audited_user_lifecycle_operations.sql', import.meta.url)
const organizationMigrationUrl = new URL('../../supabase/migrations/20260827000100_organization_administration.sql', import.meta.url)
const auditMigrationUrl = new URL('../../supabase/migrations/20260830000100_admin_audit_history.sql', import.meta.url)
const operationalAssignmentMigrationUrl = new URL('../../supabase/migrations/20260831000100_positions_operational_assignments_foundation.sql', import.meta.url)
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

test('organization migration exposes only narrow audited RPCs without hard deletion or dynamic SQL', async () => {
  const sql = await readFile(organizationMigrationUrl, 'utf8')
  for (const name of ['list_managed_departments','list_managed_teams','create_department','update_department','set_department_active','create_team','update_team','set_team_active']) {
    assert.match(sql, new RegExp(`create function public\\.${name}\\(`))
  }
  for (const action of ['department.created','department.updated','department.deactivated','department.reactivated','team.created','team.updated','team.deactivated','team.reactivated']) {
    assert.match(sql, new RegExp(action.replace('.', '\\.')))
  }
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.doesNotMatch(sql, /execute\s+format|\bdelete\s+from\s+public\.(departments|teams)|\btruncate\b/i)
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all).*authenticated/i)
})

test('audit migration removes direct browser reads and exposes only bounded read RPCs', async () => {
  const sql = await readFile(auditMigrationUrl, 'utf8')
  assert.match(sql, /revoke select on table public\.audit_events from authenticated/i)
  assert.match(sql, /create function public\.list_audit_events\(/)
  assert.match(sql, /create function public\.get_user_audit_history\(/)
  assert.match(sql, /requested_limit.*between 1 and 100/is)
  assert.match(sql, /security definer[\s\S]*set search_path = pg_catalog/i)
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all).*audit_events.*authenticated/i)
  assert.doesNotMatch(sql, /\binsert\s+into\s+public\.audit_events|\bupdate\s+public\.audit_events|\bdelete\s+from\s+public\.audit_events/i)
})

test('operational assignment foundation is read-only, protected, and RBAC-independent', async () => {
  const sql = await readFile(operationalAssignmentMigrationUrl, 'utf8')
  assert.match(sql, /create table public\.positions/)
  assert.match(sql, /create table public\.user_operational_assignments/)
  assert.match(sql, /create function public\.list_managed_positions\(\)/)
  assert.match(sql, /create function public\.get_user_operational_assignments\(target_user_id uuid\)/)
  assert.match(sql, /perform pulse_private\.require_global_permission\('positions\.view'\)/)
  assert.match(sql, /perform pulse_private\.require_global_permission\('assignments\.view'\)/)
  assert.match(sql, /security definer[\s\S]*set search_path = pg_catalog/i)
  assert.doesNotMatch(sql, /create function public\.(create|update|end|delete)_?(position|operational_assignment)/i)
  assert.doesNotMatch(sql, /insert into public\.user_roles|update public\.user_roles|delete from public\.user_roles/i)
  assert.doesNotMatch(sql, /insert into public\.audit_events/i)
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all).*authenticated/i)
  assert.doesNotMatch(sql, /execute\s+format|\btruncate\b/i)
})
