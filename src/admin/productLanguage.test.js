import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const files = (names) => Promise.all(names.map((name) => readFile(new URL(name, import.meta.url), 'utf8')))

test('Administration navigation and primary pages use staff-friendly product language', async () => {
  const [shell, people, approvals, activity] = await files([
    './components/AdminShell.jsx',
    './pages/AdminUsersPage.jsx',
    './pages/AdminPendingUsersPage.jsx',
    './pages/AdminAuditPage.jsx',
  ])
  assert.match(shell, />People</)
  assert.match(shell, />Approvals</)
  assert.match(shell, />Invitations</)
  assert.match(shell, />Activity</)
  assert.match(people, /Find teammates and see where they work across Pulse/)
  assert.match(people, /All statuses/)
  assert.match(approvals, /Awaiting approval/)
  assert.match(approvals, /Email verified/)
  assert.match(activity, /important account, access and organization changes/)
  assert.doesNotMatch(`${shell}\n${people}\n${approvals}\n${activity}`, /User governance|Identity & access|Protected read|Read-only workspace|server-authorized|Protected history/)
})

test('staff profile and approval flow separate work details from Pulse access', async () => {
  const [detail, assignments, pendingActions, pendingDialog, roleAdmin, roleDialog] = await files([
    './pages/AdminUserDetailPage.jsx',
    './components/OperationalAssignments.jsx',
    './components/PendingApprovalActions.jsx',
    './components/PendingApprovalDialog.jsx',
    './components/RoleAdministration.jsx',
    './components/RoleActionDialog.jsx',
  ])
  assert.match(detail, /Staff profile/)
  assert.match(assignments, /Campaign assignments/)
  assert.match(detail, /Account status/)
  assert.match(detail, /User approved/)
  assert.match(detail, /justApproved/)
  assert.match(pendingActions, /onApproved/)
  assert.match(pendingDialog, /Work details/)
  assert.match(pendingDialog, /Role and access area/)
  assert.match(roleAdmin, /Manage access/)
  assert.match(roleDialog, /Add Pulse access/)
  assert.doesNotMatch(`${detail}\n${assignments}\n${pendingActions}\n${pendingDialog}\n${roleAdmin}\n${roleDialog}`, /Employment placement|Employment team|Roles and scope|authorized and audited by the database|server-provided combination/)
})

test('invitation and organization surfaces keep business language and never expose raw access IDs', async () => {
  const [page, dialog, organization] = await files([
    './pages/AdminInvitationsPage.jsx',
    './components/StaffInvitationDialog.jsx',
    './pages/AdminOrganizationPage.jsx',
  ])
  assert.match(dialog, /Personal details/)
  assert.match(dialog, /Work details/)
  assert.match(dialog, /Pulse access/)
  assert.match(page, /Invite staff with their work details/)
  assert.match(organization, /Where people belong in the company/)
  assert.match(organization, /Groups working together/)
  assert.doesNotMatch(`${page}\n${dialog}\n${organization}`, /protected invitation ledger|protected .* catalog|active scoped roles|Scope UUID/)
})
