import assert from 'node:assert/strict'
import test from 'node:test'

import { approvePendingUser, assignManagedUserRole, blockManagedUser, blockPendingUser, createManagedDepartment, createManagedTeam, extractGlobalPermissionKeys, getManagedUser, getUserAuditHistory, getUserOperationalAssignments, inactivateManagedUser, listAuditEvents, listManagedCampaigns, listManagedDepartments, listManagedPositions, listManagedTeams, listManagedUsers, loadAssignableRoleOptions, loadOrganizationDirectory, loadOwnGlobalPermissionKeys, loadPendingApprovalOptions, normalizeAuditError, normalizeLifecycleMutationError, normalizeOrganizationMutationError, normalizePendingApprovalError, normalizePendingMutationError, normalizeRoleMutationError, reactivateManagedUser, removeManagedUserRole, setManagedDepartmentActive, setManagedTeamActive, updateManagedDepartment, updateManagedTeam } from './adminApi.js'

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ROLE_ID = '10000000-0000-0000-0000-000000000009'
const ASSIGNMENT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const row = {
  id: USER_ID,
  email: 'person@example.test',
  full_name: 'Example Person',
  display_name: 'Example',
  employee_id: 'KK-000999',
  status: 'active',
  auth_email_confirmed: true,
  roles: null,
}

test('permission read follows canonical role scopes and includes active global grants only', async () => {
  const assignments = [
    { scope_type: 'global', role_scopes: { roles: { is_active: true, role_permissions: [{ permissions: { key: 'admin.access', is_active: true } }, { permissions: { key: 'users.view', is_active: true } }] } } },
    { scope_type: 'team', role_scopes: { roles: { is_active: true, role_permissions: [{ permissions: { key: 'users.manage', is_active: true } }] } } },
    { scope_type: 'global', role_scopes: { roles: { is_active: false, role_permissions: [{ permissions: { key: 'audit.view', is_active: true } }] } } },
  ]
  assert.deepEqual(extractGlobalPermissionKeys(assignments).sort(), ['admin.access', 'users.view'])
  let select = ''
  const query = {
    select(value) { select = value; return this },
    eq() { return this },
    then(resolve) { return Promise.resolve(resolve({ data: assignments, error: null })) },
  }
  const result = await loadOwnGlobalPermissionKeys({ from: () => query }, USER_ID)
  assert.match(select, /role_scopes!user_roles_role_scope_fk!inner/)
  assert.match(select, /roles!role_scopes_role_fk!inner/)
  assert.match(select, /role_permissions!role_permissions_role_fk/)
  assert.deepEqual(result.data.sort(), ['admin.access', 'users.view'])
})

test('users list normalizes successful results and null roles', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: [row], error: null } } }
  const result = await listManagedUsers(client, { status: 'pending_approval' })
  assert.equal(result.error, null)
  assert.equal(result.data[0].displayName, 'Example')
  assert.deepEqual(result.data[0].roles, [])
  assert.deepEqual(calls, [{ name: 'list_managed_users', args: { requested_status: 'pending_approval' } }])
})

test('users list sanitizes backend errors', async () => {
  const client = { rpc: async () => ({ data: null, error: { code: 'XX000', message: 'sensitive SQL' } }) }
  const result = await listManagedUsers(client)
  assert.equal(result.error.code, 'unavailable')
  assert.doesNotMatch(result.error.message, /SQL/)
})

test('user detail normalizes a successful exact result', async () => {
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'get_managed_user')
    assert.equal(args.target_user_id, USER_ID)
    return { data: [row], error: null }
  } }
  const result = await getManagedUser(client, USER_ID)
  assert.equal(result.data.id, USER_ID)
})

test('user detail rejects invalid and missing targets safely', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [], error: null } } }
  assert.equal((await getManagedUser(client, 'bad-id')).error.code, 'invalid_request')
  assert.equal(calls, 0)
  assert.equal((await getManagedUser(client, USER_ID)).error.code, 'not_found')
})

test('lifecycle operations call only their canonical RPC and normalize the result', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    const states = { block_user: 'blocked', reactivate_user: 'active', inactivate_user: 'inactive' }
    return { data: [{ id: USER_ID, status: states[name], status_changed_at: '2026-08-26T00:00:00Z', changed: true }], error: null }
  } }
  assert.equal((await blockManagedUser(client, USER_ID, ' review ')).data.status, 'blocked')
  assert.equal((await reactivateManagedUser(client, USER_ID)).data.status, 'active')
  assert.equal((await inactivateManagedUser(client, USER_ID)).data.status, 'inactive')
  assert.deepEqual(calls, [
    { name: 'block_user', args: { target_user_id: USER_ID, reason: 'review' } },
    { name: 'reactivate_user', args: { target_user_id: USER_ID, reason: null } },
    { name: 'inactivate_user', args: { target_user_id: USER_ID, reason: null } },
  ])
})

test('lifecycle operations reject malformed requests and unexpected server results', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ id: USER_ID, status: 'active', changed: true }], error: null } } }
  assert.equal((await blockManagedUser(client, 'bad-id')).error.code, 'invalid_request')
  assert.equal((await blockManagedUser(client, USER_ID, 'x'.repeat(501))).error.code, 'invalid_reason')
  assert.equal(calls, 0)
  assert.equal((await blockManagedUser(client, USER_ID)).error.code, 'unexpected_result')
})

test('lifecycle errors are sanitized into actionable public messages', () => {
  const cases = [
    [{ code: '42501', message: 'self-blocking is not allowed' }, 'self_operation'],
    [{ code: '55000', message: 'the last active Super Admin is protected' }, 'protected_super_admin'],
    [{ code: '42501', message: 'active global users.manage permission required' }, 'access_denied'],
    [{ code: '55000', message: 'target must be active' }, 'invalid_transition'],
    [{ code: '23514', message: 'target Auth identity is invalid or email does not match' }, 'auth_identity_invalid'],
    [{ code: '23514', message: 'target has no valid active role assignment' }, 'role_required'],
    [{ code: '23503', message: 'target department is missing or inactive' }, 'organization_invalid'],
    [{ code: 'XX000', message: 'sensitive SQL stack' }, 'unavailable'],
  ]
  cases.forEach(([error, code]) => {
    const normalized = normalizeLifecycleMutationError(error)
    assert.equal(normalized.code, code)
    assert.doesNotMatch(normalized.message, /SQL|stack/i)
  })
})

test('pending block calls only the canonical onboarding RPC and validates its response', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ id: USER_ID, status: 'blocked', status_changed_at: '2026-08-26T00:00:00Z' }], error: null }
  } }
  const result = await blockPendingUser(client, USER_ID, ' duplicate registration ')
  assert.equal(result.data.status, 'blocked')
  assert.deepEqual(calls, [{ name: 'block_pending_user', args: { target_user_id: USER_ID, reason: 'duplicate registration' } }])
})

test('pending block rejects malformed, stale, and unauthorized requests safely', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ id: USER_ID, status: 'active' }], error: null } } }
  assert.equal((await blockPendingUser(client, 'bad-id')).error.code, 'invalid_request')
  assert.equal((await blockPendingUser(client, USER_ID, 'x'.repeat(501))).error.code, 'invalid_reason')
  assert.equal(calls, 0)
  assert.equal((await blockPendingUser(client, USER_ID)).error.code, 'unexpected_result')
  assert.equal(normalizePendingMutationError({ code: '55000', message: 'target must be pending approval' }).code, 'stale_pending_user')
  assert.equal(normalizePendingMutationError({ code: '42501', message: 'global users.approve is required' }).code, 'access_denied')
  const hidden = normalizePendingMutationError({ code: 'XX000', message: 'sensitive SQL stack' })
  assert.equal(hidden.code, 'unavailable')
  assert.doesNotMatch(hidden.message, /SQL|stack/i)
})

test('pending approval catalog accepts only exact resolved combinations from its protected RPC', async () => {
  const calls = []
  const rawOption = {
    department_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    department_code: 'support',
    department_name: 'Support',
    team_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    team_code: 'support_one',
    team_name: 'Support One',
    role_id: ROLE_ID,
    role_key: 'admin',
    role_name: 'Admin',
    scope_type: 'global',
  }
  const result = await loadPendingApprovalOptions({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [rawOption, { ...rawOption, department_id: 'arbitrary' }, { ...rawOption, scope_type: 'planet' }], error: null }
  } }, USER_ID)
  assert.deepEqual(calls, [{ name: 'get_pending_approval_options', args: { target_user_id: USER_ID } }])
  assert.equal(result.data.length, 1)
  assert.deepEqual(result.data[0], {
    departmentId: rawOption.department_id,
    departmentCode: 'support',
    departmentName: 'Support',
    teamId: rawOption.team_id,
    teamCode: 'support_one',
    teamName: 'Support One',
    campaignId: null,
    campaignCode: null,
    campaignName: null,
    roleId: ROLE_ID,
    roleKey: 'admin',
    roleName: 'Admin',
    scopeType: 'global',
  })
})

test('pending approval catalog preserves empty results and sanitizes load errors', async () => {
  assert.deepEqual(await loadPendingApprovalOptions({ rpc: async () => ({ data: [], error: null }) }, USER_ID), { data: [], error: null })
  assert.equal((await loadPendingApprovalOptions({ rpc: async () => { throw new Error('must not run') } }, 'bad-id')).error.code, 'invalid_request')
  const failure = await loadPendingApprovalOptions({ rpc: async () => ({ data: null, error: { code: 'XX000', message: 'sensitive SQL' } }) }, USER_ID)
  assert.equal(failure.error.code, 'unavailable')
  assert.doesNotMatch(failure.error.message, /SQL/i)
})

test('pending approval calls only approve_pending_user with the selected protected option', async () => {
  const calls = []
  const option = {
    departmentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    departmentCode: 'support',
    departmentName: 'Support',
    teamId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    teamCode: 'support_one',
    teamName: 'Support One',
    roleId: ROLE_ID,
    roleKey: 'agent',
    roleName: 'Agent',
    scopeType: 'team',
  }
  const result = await approvePendingUser({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ id: USER_ID, employee_id: 'KK-001234', status: 'active', department_id: option.departmentId, team_id: option.teamId, approved_at: '2026-08-27T00:00:00Z' }], error: null }
  } }, USER_ID, option)
  assert.equal(result.data.status, 'active')
  assert.deepEqual(calls, [{ name: 'approve_pending_user', args: {
    target_user_id: USER_ID,
    selected_department_id: option.departmentId,
    selected_team_id: option.teamId,
    requested_roles: [{ role_id: ROLE_ID, scope_type: 'team', campaign_id: null }],
  } }])
})

test('pending approval rejects arbitrary input and stale or unsafe server results', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ id: USER_ID, status: 'pending_approval' }], error: null } } }
  assert.equal((await approvePendingUser(client, 'bad-id', {})).error.code, 'invalid_request')
  assert.equal((await approvePendingUser(client, USER_ID, { departmentId: 'arbitrary', roleId: ROLE_ID, scopeType: 'global' })).error.code, 'invalid_selection')
  assert.equal(calls, 0)
  assert.equal((await approvePendingUser(client, USER_ID, { departmentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', roleId: ROLE_ID, scopeType: 'global' })).error.code, 'unexpected_result')
  const cases = [
    [{ code: '55000', message: 'target must be pending approval' }, 'stale_pending_user'],
    [{ code: '42501', message: 'self-approval is not allowed' }, 'self_operation'],
    [{ code: '23514', message: 'target Auth identity is invalid' }, 'auth_identity_invalid'],
    [{ code: '23503', message: 'selected department inactive' }, 'catalog_invalid'],
    [{ code: '23505', message: 'duplicate requested role assignments' }, 'invalid_selection'],
    [{ code: 'XX000', message: 'sensitive SQL stack' }, 'unavailable'],
  ]
  cases.forEach(([error, code]) => {
    const normalized = normalizePendingApprovalError(error)
    assert.equal(normalized.code, code)
    assert.doesNotMatch(normalized.message, /SQL|stack/i)
  })
})

test('role assignment calls only the canonical RPC with a target-bound scope', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ user_role_id: ASSIGNMENT_ID, created: true }], error: null }
  } }
  const result = await assignManagedUserRole(client, {
    targetUserId: USER_ID,
    requestedRoleId: ROLE_ID,
    requestedScopeType: 'department',
    requestedDepartmentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  })
  assert.deepEqual(result, { data: { userRoleId: ASSIGNMENT_ID, created: true }, error: null })
  assert.deepEqual(calls, [{ name: 'assign_user_role', args: {
    target_user_id: USER_ID,
    requested_role_id: ROLE_ID,
    requested_scope_type: 'department',
    requested_department_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    requested_campaign_id: null,
    requested_team_id: null,
  } }])
})

test('role assignment validates local input and surfaces duplicate server success safely', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [{ user_role_id: ASSIGNMENT_ID, created: false }], error: null } } }
  assert.equal((await assignManagedUserRole(client, { targetUserId: 'bad', requestedRoleId: ROLE_ID, requestedScopeType: 'global' })).error.code, 'invalid_request')
  assert.equal((await assignManagedUserRole(client, { targetUserId: USER_ID, requestedRoleId: ROLE_ID, requestedScopeType: 'planet' })).error.code, 'invalid_request')
  assert.equal(calls, 0)
  assert.equal((await assignManagedUserRole(client, { targetUserId: USER_ID, requestedRoleId: ROLE_ID, requestedScopeType: 'global' })).data.created, false)
})

test('role removal addresses one exact assignment through its canonical RPC', async () => {
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'remove_user_role')
    assert.deepEqual(args, { target_user_id: USER_ID, target_user_role_id: ASSIGNMENT_ID })
    return { data: [{ user_role_id: ASSIGNMENT_ID, removed: true }], error: null }
  } }
  assert.deepEqual(await removeManagedUserRole(client, USER_ID, ASSIGNMENT_ID), { data: { userRoleId: ASSIGNMENT_ID, removed: true }, error: null })
})

test('role errors are sanitized for grant, scope, organization, self, and last-role protections', () => {
  const cases = [
    [{ code: '42501', message: 'self role changes are not allowed' }, 'self_operation'],
    [{ code: '42501', message: 'actor cannot grant requested role and scope' }, 'grant_not_allowed'],
    [{ code: '23503', message: 'requested role is inactive or invalid for scope' }, 'catalog_invalid'],
    [{ code: '23514', message: 'team role must match target team' }, 'organization_invalid'],
    [{ code: '55000', message: 'active user must retain at least one active role' }, 'protected_assignment'],
    [{ code: '55000', message: 'the last active Super Admin is protected' }, 'protected_super_admin'],
    [{ code: 'XX000', message: 'sensitive SQL stack' }, 'unavailable'],
  ]
  cases.forEach(([error, code]) => {
    const normalized = normalizeRoleMutationError(error)
    assert.equal(normalized.code, code)
    assert.doesNotMatch(normalized.message, /SQL|stack/i)
  })
})

test('assignable role catalog calls only the target-bound protected RPC', async () => {
  const calls = []
  const result = await loadAssignableRoleOptions({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'global', department_id: null, campaign_id: null, team_id: null }], error: null }
  } }, USER_ID)
  assert.deepEqual(calls, [{ name: 'list_assignable_role_options', args: { target_user_id: USER_ID } }])
  assert.deepEqual(result.data, [{ roleId: ROLE_ID, roleKey: 'admin', roleName: 'Admin', scopeType: 'global', departmentId: null, departmentName: null, campaignId: null, campaignCode: null, campaignName: null, teamId: null, teamName: null }])
})

test('Campaign role options are authoritative and assignments use the six-argument RPC', async () => {
  const campaignId = 'f5000000-0000-4000-8000-000000000001'
  const option = { role_id: ROLE_ID, role_key: 'qa', role_name: 'QA', scope_type: 'campaign', department_id: null, campaign_id: campaignId, campaign_code: 'garrett', campaign_name: 'Garrett', team_id: null }
  const loaded = await loadAssignableRoleOptions({ rpc: async () => ({ data: [option], error: null }) }, USER_ID)
  assert.equal(loaded.data[0].campaignName, 'Garrett')
  const calls = []
  const assigned = await assignManagedUserRole({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ user_role_id: ASSIGNMENT_ID, created: true }], error: null }
  } }, { targetUserId: USER_ID, requestedRoleId: ROLE_ID, requestedScopeType: 'campaign', requestedCampaignId: campaignId })
  assert.equal(assigned.data.created, true)
  assert.equal(calls[0].args.requested_campaign_id, campaignId)
  assert.equal(calls[0].args.requested_department_id, null)
  assert.equal(calls[0].args.requested_team_id, null)
  assert.equal((await assignManagedUserRole({ rpc: async () => { throw new Error('must not run') } }, { targetUserId: USER_ID, requestedRoleId: ROLE_ID, requestedScopeType: 'campaign', requestedCampaignId: null })).error.code, 'invalid_request')
})

test('pending approval preserves independent employment and Campaign authorization', async () => {
  const departmentId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  const campaignId = 'f5000000-0000-4000-8000-000000000001'
  const option = { departmentId, departmentName: 'Quality Assurance', departmentCode: 'qa', teamId: null, roleId: ROLE_ID, roleKey: 'qa', roleName: 'QA', scopeType: 'campaign', campaignId, campaignCode: 'garrett', campaignName: 'Garrett' }
  const calls = []
  const result = await approvePendingUser({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ id: USER_ID, employee_id: 'KK-001234', status: 'active', department_id: departmentId, team_id: null }], error: null }
  } }, USER_ID, option)
  assert.equal(result.data.departmentId, departmentId)
  assert.deepEqual(calls[0].args.requested_roles, [{ role_id: ROLE_ID, scope_type: 'campaign', campaign_id: campaignId }])
})

test('assignable role catalog preserves legitimate empty results and sanitizes failures', async () => {
  assert.deepEqual(await loadAssignableRoleOptions({ rpc: async () => ({ data: [], error: null }) }, USER_ID), { data: [], error: null })
  const failed = await loadAssignableRoleOptions({ rpc: async () => ({ data: null, error: { code: 'XX000', message: 'sensitive SQL' } }) }, USER_ID)
  assert.equal(failed.error.code, 'unavailable')
  assert.doesNotMatch(failed.error.message, /SQL/i)
  assert.equal((await loadAssignableRoleOptions({ rpc: async () => { throw new Error('must not run') } }, 'bad-id')).error.code, 'invalid_request')
})

test('assignable role catalog drops malformed or arbitrary scope combinations', async () => {
  const data = [
    { role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'global', department_id: null, campaign_id: null, team_id: null },
    { role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'global', department_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', campaign_id: null, team_id: null },
    { role_id: ROLE_ID, role_key: 'admin', role_name: 'Admin', scope_type: 'planet', department_id: null, campaign_id: null, team_id: null },
  ]
  const result = await loadAssignableRoleOptions({ rpc: async () => ({ data, error: null }) }, USER_ID)
  assert.equal(result.data.length, 1)
})

const DEPARTMENT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const TEAM_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const UPDATED_AT = '2026-08-27T12:00:00Z'
const departmentRow = {
  id: DEPARTMENT_ID,
  code: 'operations',
  name: 'Operations',
  description: 'Core operations',
  is_active: true,
  updated_at: UPDATED_AT,
  team_count: 2,
  active_team_count: 1,
  user_count: 3,
  active_user_count: 2,
  pending_user_count: 1,
  active_role_assignment_count: 2,
}
const teamRow = {
  id: TEAM_ID,
  department_id: DEPARTMENT_ID,
  department_code: 'operations',
  department_name: 'Operations',
  department_is_active: true,
  code: 'north',
  name: 'North',
  description: 'North team',
  is_active: true,
  updated_at: UPDATED_AT,
  user_count: 2,
  active_user_count: 1,
  pending_user_count: 0,
  active_role_assignment_count: 1,
}

test('organization catalogs use only protected RPCs and preserve parent/count data', async () => {
  const calls = []
  const client = { rpc: async (name) => {
    calls.push(name)
    return { data: name === 'list_managed_departments' ? [departmentRow] : [teamRow], error: null }
  } }
  const departments = await listManagedDepartments(client)
  const teams = await listManagedTeams(client)
  const directory = await loadOrganizationDirectory(client)
  assert.equal(departments.data[0].activeUserCount, 2)
  assert.equal(teams.data[0].departmentId, DEPARTMENT_ID)
  assert.equal(directory.data.departments[0].id, DEPARTMENT_ID)
  assert.deepEqual(calls, ['list_managed_departments', 'list_managed_teams', 'list_managed_departments', 'list_managed_teams'])
})

test('campaign catalog uses only its protected read RPC and normalizes counts', async () => {
  const calls = []
  const result = await listManagedCampaigns({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ id: 'f5000000-0000-4000-8000-000000000001', code: 'campaign_one', name: 'Campaign One', description: null, is_active: true, team_count: 2, active_team_count: 1 }], error: null }
  } })
  assert.deepEqual(calls, [{ name: 'list_managed_campaigns', args: undefined }])
  assert.deepEqual(result.data[0], {
    id: 'f5000000-0000-4000-8000-000000000001',
    code: 'campaign_one',
    name: 'Campaign One',
    description: '',
    isActive: true,
    createdAt: null,
    updatedAt: null,
    teamCount: 2,
    activeTeamCount: 1,
  })
})

test('campaign catalog preserves an empty result, drops malformed rows, and sanitizes errors', async () => {
  assert.deepEqual(await listManagedCampaigns({ rpc: async () => ({ data: [], error: null }) }), { data: [], error: null })
  const malformed = await listManagedCampaigns({ rpc: async () => ({ data: [{ id: 'not-a-uuid', code: 'bad' }], error: null }) })
  assert.deepEqual(malformed, { data: [], error: null })
  const failed = await listManagedCampaigns({ rpc: async () => ({ data: null, error: { code: 'XX000', message: 'campaigns SQL stack' } }) })
  assert.equal(failed.error.code, 'unavailable')
  assert.doesNotMatch(failed.error.message, /campaigns|SQL|stack/i)
})

test('Position catalog uses only its protected read RPC and normalizes safe counts', async () => {
  const calls = []
  const result = await listManagedPositions({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ id: 'f6000000-0000-4000-8000-000000000001', code: 'qa_analyst', name: 'QA Analyst', description: null, is_active: true, current_user_count: 1, assignment_count: 3, active_assignment_count: 2 }], error: null }
  } })
  assert.deepEqual(calls, [{ name: 'list_managed_positions', args: undefined }])
  assert.deepEqual(result.data[0], {
    id: 'f6000000-0000-4000-8000-000000000001',
    code: 'qa_analyst',
    name: 'QA Analyst',
    description: '',
    isActive: true,
    createdAt: null,
    updatedAt: null,
    currentUserCount: 1,
    assignmentCount: 3,
    activeAssignmentCount: 2,
  })
})

test('operational assignments use one protected resolved RPC and preserve Campaign-only history', async () => {
  const calls = []
  const assignment = {
    assignment_id: 'f6000000-0000-4000-8000-000000000010',
    user_id: USER_ID,
    position_id: 'f6000000-0000-4000-8000-000000000001',
    position_code: 'qa_analyst',
    position_name: 'QA Analyst',
    campaign_id: 'f5000000-0000-4000-8000-000000000001',
    campaign_code: 'garrett',
    campaign_name: 'Garrett',
    team_id: null,
    team_code: null,
    team_name: null,
    is_primary: true,
    started_at: '2026-08-31T00:00:00Z',
    ended_at: null,
    is_active: true,
  }
  const result = await getUserOperationalAssignments({ rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [assignment, { ...assignment, assignment_id: 'invalid' }], error: null }
  } }, USER_ID)
  assert.deepEqual(calls, [{ name: 'get_user_operational_assignments', args: { target_user_id: USER_ID } }])
  assert.equal(result.data.length, 1)
  assert.equal(result.data[0].campaignName, 'Garrett')
  assert.equal(result.data[0].teamId, null)
  assert.equal(result.data[0].positionName, 'QA Analyst')
  assert.equal(result.data[0].isActive, true)
  assert.equal((await getUserOperationalAssignments({ rpc: async () => { throw new Error('must not run') } }, 'bad-id')).error.code, 'invalid_request')
})

test('department create and update call exact audited RPC contracts', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ ...departmentRow, [name === 'create_department' ? 'created' : 'changed']: true }], error: null }
  } }
  assert.equal((await createManagedDepartment(client, { code: 'operations', name: 'Operations', description: 'Core operations' })).data.created, true)
  assert.equal((await updateManagedDepartment(client, { id: DEPARTMENT_ID, updatedAt: UPDATED_AT }, { code: 'operations', name: 'Operations', description: 'Updated' })).data.changed, true)
  assert.deepEqual(calls, [
    { name: 'create_department', args: { requested_code: 'operations', requested_name: 'Operations', requested_description: 'Core operations' } },
    { name: 'update_department', args: { target_department_id: DEPARTMENT_ID, expected_updated_at: UPDATED_AT, requested_code: 'operations', requested_name: 'Operations', requested_description: 'Updated' } },
  ])
})

test('team create and update require exact IDs and never accept reparenting on update', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    return { data: [{ ...teamRow, [name === 'create_team' ? 'created' : 'changed']: true }], error: null }
  } }
  assert.equal((await createManagedTeam(client, DEPARTMENT_ID, { code: 'north', name: 'North' })).data.created, true)
  assert.equal((await updateManagedTeam(client, { id: TEAM_ID, updatedAt: UPDATED_AT, departmentId: DEPARTMENT_ID }, { code: 'north', name: 'North Team' })).data.changed, true)
  assert.equal(Object.hasOwn(calls[1].args, 'target_department_id'), false)
  assert.deepEqual(calls[0], { name: 'create_team', args: { target_department_id: DEPARTMENT_ID, requested_code: 'north', requested_name: 'North', requested_description: null } })
})

test('department and team lifecycle actions pass server timestamps and requested state', async () => {
  const calls = []
  const client = { rpc: async (name, args) => {
    calls.push({ name, args })
    const row = name === 'set_department_active'
      ? { ...departmentRow, is_active: false, changed: true }
      : { ...teamRow, is_active: false, changed: true }
    return { data: [row], error: null }
  } }
  assert.equal((await setManagedDepartmentActive(client, { id: DEPARTMENT_ID, updatedAt: UPDATED_AT }, false)).data.isActive, false)
  assert.equal((await setManagedTeamActive(client, { id: TEAM_ID, updatedAt: UPDATED_AT }, false)).data.isActive, false)
  assert.deepEqual(calls, [
    { name: 'set_department_active', args: { target_department_id: DEPARTMENT_ID, requested_active: false, expected_updated_at: UPDATED_AT } },
    { name: 'set_team_active', args: { target_team_id: TEAM_ID, requested_active: false, expected_updated_at: UPDATED_AT } },
  ])
})

test('organization API rejects malformed browser input before any RPC', async () => {
  let calls = 0
  const client = { rpc: async () => { calls += 1; return { data: [], error: null } } }
  assert.equal((await createManagedDepartment(client, { code: 'Bad code', name: 'Valid' })).error.code, 'invalid_request')
  assert.equal((await createManagedTeam(client, 'bad-id', { code: 'team', name: 'Team' })).error.code, 'invalid_request')
  assert.equal((await updateManagedDepartment(client, { id: DEPARTMENT_ID }, { code: 'valid', name: 'Valid' })).error.code, 'invalid_request')
  assert.equal((await setManagedTeamActive(client, { id: TEAM_ID }, true)).error.code, 'invalid_request')
  assert.equal(calls, 0)
})

test('organization errors are sanitized for permissions, duplicates, dependencies, parents, and stale writes', () => {
  const cases = [
    [{ code: '42501', message: 'global teams.manage permission required' }, 'access_denied'],
    [{ code: '23505', message: 'index teams_department_name_unique' }, 'duplicate'],
    [{ code: '23503', message: 'department not found' }, 'parent_invalid'],
    [{ code: '55000', message: 'department changed since it was loaded' }, 'stale_record'],
    [{ code: '55000', message: 'team requires an active parent department' }, 'inactive_parent'],
    [{ code: '55000', message: 'active scoped role assignments still depend on this team' }, 'dependencies'],
    [{ code: 'XX000', message: 'sensitive SQL stack' }, 'unavailable'],
  ]
  cases.forEach(([error, code]) => {
    const normalized = normalizeOrganizationMutationError(error)
    assert.equal(normalized.code, code)
    assert.doesNotMatch(normalized.message, /SQL|stack|index/i)
  })
})

test('audit pages use only the protected RPC and carry an exact keyset cursor', async () => {
  const calls = []
  const first = { event_id: '11111111-1111-4111-8111-111111111111', action: 'role.assigned', category: 'roles', source: 'database', occurred_at: '2026-08-30T12:00:00Z', actor_user_id: USER_ID, actor_full_name: 'Admin', target_type: 'user', target_id: USER_ID, target_name: 'Example', scope_type: 'campaign', safe_metadata: { previous_status: 'pending_approval', campaign_code: 'garrett', campaign_name: 'Garrett', campaign_id: 'hidden', auth_user_id: 'hidden' }, has_more: true }
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: [first], error: null } } }
  const result = await listAuditEvents(client, { limit: 10, category: 'account' })
  assert.equal(result.data.events[0].metadata.auth_user_id, undefined)
  assert.equal(result.data.events[0].metadata.previous_status, 'pending_approval')
  assert.equal(result.data.events[0].scope.campaignName, 'Garrett')
  assert.equal(result.data.events[0].scope.campaignId, null)
  assert.equal(result.data.events[0].metadata.campaign_id, undefined)
  assert.deepEqual(result.data.nextCursor, { occurredAt: first.occurred_at, id: first.event_id })
  assert.equal(calls[0].name, 'list_audit_events')
  assert.equal(calls[0].args.requested_limit, 10)
  assert.equal(calls[0].args.requested_category, 'account')
})

test('user history is target-bound and audit failures never expose backend details', async () => {
  const calls = []
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: [], error: null } } }
  assert.deepEqual((await getUserAuditHistory(client, USER_ID)).data.events, [])
  assert.deepEqual(calls, [{ name: 'get_user_audit_history', args: { target_user_id: USER_ID, requested_limit: 10, before_occurred_at: null, before_event_id: null } }])
  assert.equal((await getUserAuditHistory(client, 'bad')).error.code, 'invalid_request')
  const hidden = normalizeAuditError({ code: 'XX000', message: 'audit_events SQL stack and JWT' })
  assert.equal(hidden.code, 'unavailable')
  assert.doesNotMatch(hidden.message, /SQL|JWT|audit_events/i)
})
