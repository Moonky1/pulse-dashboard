import assert from 'node:assert/strict'
import test from 'node:test'

import { listStaffInvitations, loadStaffInvitationOptions, normalizeStaffInvitationOptions, resendStaffInvitation, revokeStaffInvitation, sendStaffInvitation } from './adminApi.js'

const ID = '11111111-1111-4111-8111-111111111111'
const DEPARTMENT = '22222222-2222-4222-8222-222222222222'
const ROLE = '33333333-3333-4333-8333-333333333333'

test('invitation options normalize only authoritative UUID catalogs and exact scopes', () => {
  const result = normalizeStaffInvitationOptions({
    departments: [{ id: DEPARTMENT, code: 'people', name: 'People' }, { id: 'bad', name: 'Bad' }],
    teams: [{ id: ID, department_id: DEPARTMENT, code: 'team', name: 'Team' }],
    positions: [],
    role_options: [{ role_id: ROLE, role_key: 'employee', role_name: 'Employee', scope_type: 'global' }, { role_id: ROLE, scope_type: 'made_up' }],
  })
  assert.equal(result.departments.length, 1)
  assert.equal(result.teams[0].departmentId, DEPARTMENT)
  assert.deepEqual(result.roleOptions.map((item) => item.scopeType), ['global'])
})

test('invitation reads use protected RPCs only', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push([name, args])
    if (name === 'get_staff_invitation_options') return { data: { departments: [], teams: [], positions: [], role_options: [] }, error: null }
    return { data: [{ invitation_id: ID, email: 'person@example.test', invitee_full_name: 'Person', invitation_status: 'sent', department_id: DEPARTMENT, department_name: 'People', role_id: ROLE, role_name: 'Employee', scope_type: 'global', delivery_attempt_count: 1, can_resend: true, can_revoke: true }], error: null }
  } }
  assert.deepEqual((await loadStaffInvitationOptions(client)).data.roleOptions, [])
  assert.equal((await listStaffInvitations(client)).data[0].email, 'person@example.test')
  assert.deepEqual(calls.map(([name]) => name), ['get_staff_invitation_options', 'list_staff_invitations'])
})

test('send, resend, and revoke invoke only the trusted Edge boundary with server timestamps', async () => {
  const calls = []
  const client = { functions: { invoke: async (name, options) => { calls.push([name, options.body]); return { data: { ok: true }, error: null } } } }
  await sendStaffInvitation(client, { email: 'person@example.test', departmentId: DEPARTMENT, roleId: ROLE, scopeType: 'global' })
  await resendStaffInvitation(client, { id: ID, updatedAt: '2026-09-10T00:00:00Z' })
  await revokeStaffInvitation(client, { id: ID, updatedAt: '2026-09-10T00:00:00Z' })
  assert.deepEqual(calls.map(([name, body]) => [name, body.action]), [
    ['pulse-staff-invitations', 'send'], ['pulse-staff-invitations', 'resend'], ['pulse-staff-invitations', 'revoke'],
  ])
  assert.match(calls[0][1].requestKey, /^[0-9a-f-]{36}$/i)
  assert.equal(calls[1][1].expectedUpdatedAt, '2026-09-10T00:00:00Z')
  assert.equal(calls[2][1].expectedUpdatedAt, '2026-09-10T00:00:00Z')
})
