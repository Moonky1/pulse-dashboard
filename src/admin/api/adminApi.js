const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function publicError(code, message) {
  return { code, message }
}

function messageIncludes(error, value) {
  return String(error?.message ?? '').toLowerCase().includes(value.toLowerCase())
}

export function normalizeAdminError(error) {
  if (!error) return null
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission to view User Administration.')
  }
  if (['22023', '22P02'].includes(error.code)) {
    return publicError('invalid_request', 'The requested user or filter is not valid.')
  }
  return publicError('unavailable', 'Pulse could not load administration data. Try again shortly.')
}

export function normalizeLifecycleMutationError(error) {
  if (!error) return null
  if (messageIncludes(error, 'self-')) {
    return publicError('self_operation', 'You cannot perform this lifecycle action on your own account.')
  }
  if (messageIncludes(error, 'last active super admin')) {
    return publicError('protected_super_admin', 'The last active Super Admin is protected. Another active Super Admin is required first.')
  }
  if (messageIncludes(error, 'only a super admin')) {
    return publicError('privileged_target', 'Only an active Super Admin may manage another Super Admin account.')
  }
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission to perform this lifecycle action.')
  }
  if (error.code === 'P0002') {
    return publicError('not_found', 'This Pulse user could not be found.')
  }
  if (error.code === '22023') {
    return publicError('invalid_reason', 'The audit note must be 500 characters or fewer.')
  }
  if (error.code === '55000') {
    return publicError('invalid_transition', 'The account changed or is not eligible for this lifecycle action. Refresh and try again.')
  }
  if (messageIncludes(error, 'auth identity') || messageIncludes(error, 'email does not match')) {
    return publicError('auth_identity_invalid', 'The account Auth identity is not eligible for reactivation. Review the verified email and Auth status.')
  }
  if (messageIncludes(error, 'employee id')) {
    return publicError('profile_incomplete', 'The account profile is missing its employee ID and cannot be reactivated.')
  }
  if (messageIncludes(error, 'role assignment') || messageIncludes(error, 'active role')) {
    return publicError('role_required', 'The account needs at least one valid active role assignment before reactivation.')
  }
  if (error.code === '23503' || messageIncludes(error, 'department') || messageIncludes(error, 'team')) {
    return publicError('organization_invalid', 'The account department or team is missing, inactive, or no longer valid.')
  }
  if (error.code === '23514') {
    return publicError('account_invalid', 'The account is not eligible for this lifecycle action. Review its Auth, profile, and role state.')
  }
  return publicError('unavailable', 'Pulse could not complete the lifecycle action. No client-side change was applied.')
}

export function normalizePendingMutationError(error) {
  if (!error) return null
  if (messageIncludes(error, 'self-')) {
    return publicError('self_operation', 'You cannot review your own pending account.')
  }
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission to review pending Pulse users.')
  }
  if (error.code === '22023') {
    return publicError('invalid_reason', 'The audit note must be 500 characters or fewer.')
  }
  if (error.code === '55000') {
    return publicError('stale_pending_user', 'This account is no longer pending approval. Refresh before taking another action.')
  }
  if (error.code === 'P0002') {
    return publicError('not_found', 'This pending Pulse user could not be found.')
  }
  return publicError('unavailable', 'Pulse could not complete the pending-user action. No client-side change was applied.')
}

export function normalizePendingApprovalError(error) {
  if (!error) return null
  if (messageIncludes(error, 'self-')) {
    return publicError('self_operation', 'You cannot approve your own pending account.')
  }
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission to approve pending Pulse users.')
  }
  if (error.code === 'P0002') {
    return publicError('not_found', 'This pending Pulse user could not be found.')
  }
  if (error.code === '55000') {
    return publicError('stale_pending_user', 'This account is no longer pending approval. Refresh before taking another action.')
  }
  if (error.code === '23514' || messageIncludes(error, 'auth identity') || messageIncludes(error, 'email does not match')) {
    return publicError('auth_identity_invalid', 'The pending account no longer has an eligible verified Auth identity.')
  }
  if (error.code === '23503') {
    return publicError('catalog_invalid', 'The selected department, team, role, or scope is no longer available. Refresh the approval options.')
  }
  if (['22023', '22P02', '23505'].includes(error.code)) {
    return publicError('invalid_selection', 'The selected approval combination is invalid or duplicated. Refresh the approval options.')
  }
  return publicError('unavailable', 'Pulse could not approve the pending account. No client-side change was applied.')
}

export function normalizeRoleMutationError(error) {
  if (!error) return null
  if (messageIncludes(error, 'self role changes')) {
    return publicError('self_operation', 'You cannot change your own role assignments.')
  }
  if (messageIncludes(error, 'last active super admin')) {
    return publicError('protected_super_admin', 'The last active Super Admin is protected. Another active Super Admin is required first.')
  }
  if (messageIncludes(error, 'only a super admin')) {
    return publicError('privileged_role', 'Only an active Super Admin may change a Super Admin role assignment.')
  }
  if (messageIncludes(error, 'cannot grant') || messageIncludes(error, 'cannot remove')) {
    return publicError('grant_not_allowed', 'Your current access cannot change that role and scope.')
  }
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission to manage role assignments.')
  }
  if (error.code === 'P0002') {
    return publicError('not_found', 'This Pulse user could not be found.')
  }
  if (error.code === '22023' || error.code === '22P02') {
    return publicError('invalid_request', 'The requested role assignment is not valid.')
  }
  if (error.code === '23503') {
    return publicError('catalog_invalid', 'The requested role or organization catalog entry is inactive or unavailable.')
  }
  if (error.code === '23514') {
    return publicError('organization_invalid', 'That role scope must match the target user’s current organization.')
  }
  if (error.code === '55000') {
    return publicError('protected_assignment', 'This role assignment is protected or no longer eligible. Refresh and try again.')
  }
  return publicError('unavailable', 'Pulse could not complete the role change. No client-side change was applied.')
}

export function normalizeOrganizationMutationError(error) {
  if (!error) return null
  if (['42501', '28000'].includes(error.code)) {
    return publicError('access_denied', 'You do not have permission to manage this organization catalog.')
  }
  if (error.code === 'P0002') {
    return publicError('not_found', 'This organization record could not be found. Refresh before trying again.')
  }
  if (error.code === '23505') {
    return publicError('duplicate', 'That code or name already exists in the selected organization scope.')
  }
  if (error.code === '23503') {
    return publicError('parent_invalid', 'The selected parent department is unavailable.')
  }
  if (['22023', '22P02'].includes(error.code)) {
    return publicError('invalid_request', 'Review the code, name, and description before trying again.')
  }
  if (error.code === '55000' && messageIncludes(error, 'changed since')) {
    return publicError('stale_record', 'This record changed after it was loaded. Refresh before trying again.')
  }
  if (error.code === '55000' && messageIncludes(error, 'active parent')) {
    return publicError('inactive_parent', 'A team can be created or reactivated only under an active department.')
  }
  if (error.code === '55000' && messageIncludes(error, 'depend')) {
    return publicError('dependencies', 'Active or pending identities or scoped access still depend on this record. Resolve those dependencies first.')
  }
  if (error.code === '55000' && messageIncludes(error, 'active teams')) {
    return publicError('dependencies', 'Deactivate every active team in this department before deactivating the department.')
  }
  return publicError('unavailable', 'Pulse could not complete the organization change. No client-side change was applied.')
}

function normalizeRole(role = {}) {
  return {
    userRoleId: role.user_role_id ?? null,
    roleId: role.role_id ?? null,
    key: role.role_key ?? '',
    name: role.role_name ?? 'Unknown role',
    scopeType: role.scope_type ?? 'global',
    departmentId: role.department_id ?? null,
    teamId: role.team_id ?? null,
  }
}

export function normalizeManagedUser(row = {}) {
  return {
    id: row.id ?? null,
    email: row.email ?? '',
    fullName: row.full_name ?? '',
    displayName: row.display_name ?? '',
    employeeId: row.employee_id ?? null,
    status: row.status ?? 'inactive',
    departmentId: row.department_id ?? null,
    teamId: row.team_id ?? null,
    authEmailConfirmed: Boolean(row.auth_email_confirmed),
    roles: Array.isArray(row.roles) ? row.roles.map(normalizeRole) : [],
  }
}

function nestedPermissions(assignment) {
  const scopes = Array.isArray(assignment.role_scopes) ? assignment.role_scopes : [assignment.role_scopes]
  const roles = scopes.flatMap((scope) => Array.isArray(scope?.roles) ? scope.roles : [scope?.roles])
  return roles.flatMap((role) => {
    if (!role?.is_active) return []
    const grants = Array.isArray(role.role_permissions) ? role.role_permissions : []
    return grants.flatMap((grant) => {
      const permissions = Array.isArray(grant.permissions) ? grant.permissions : [grant.permissions]
      return permissions.filter((permission) => permission?.is_active).map((permission) => permission.key)
    })
  })
}

export function extractGlobalPermissionKeys(assignments = []) {
  return [...new Set(assignments
    .filter((assignment) => assignment.scope_type === 'global')
    .flatMap(nestedPermissions)
    .filter(Boolean))]
}

export async function loadOwnGlobalPermissionKeys(client, userId) {
  if (!userId) return { data: [], error: publicError('access_denied', 'A trusted Pulse profile is required.') }
  const { data, error } = await client
    .from('user_roles')
    .select('scope_type, role_scopes!user_roles_role_scope_fk!inner(roles!role_scopes_role_fk!inner(is_active, role_permissions!role_permissions_role_fk(permissions!role_permissions_permission_fk!inner(key,is_active))))')
    .eq('user_id', userId)
    .eq('scope_type', 'global')
  if (error) return { data: [], error: normalizeAdminError(error) }
  return { data: extractGlobalPermissionKeys(data ?? []), error: null }
}

export async function listManagedUsers(client, { status = null } = {}) {
  const { data, error } = await client.rpc('list_managed_users', { requested_status: status || null })
  if (error) return { data: [], error: normalizeAdminError(error) }
  return { data: (data ?? []).map(normalizeManagedUser), error: null }
}

export async function getManagedUser(client, userId) {
  if (!UUID_PATTERN.test(userId ?? '')) {
    return { data: null, error: publicError('invalid_request', 'The requested user is not valid.') }
  }
  const { data, error } = await client.rpc('get_managed_user', { target_user_id: userId })
  if (error) return { data: null, error: normalizeAdminError(error) }
  const row = data?.[0] ?? data ?? null
  if (!row || Array.isArray(row)) return { data: null, error: publicError('not_found', 'This Pulse user could not be found.') }
  return { data: normalizeManagedUser(row), error: null }
}

function normalizeLifecycleResult(row, targetUserId, expectedStatus) {
  if (!row || row.id !== targetUserId || row.status !== expectedStatus) return null
  return {
    id: row.id,
    status: row.status,
    statusChangedAt: row.status_changed_at ?? null,
    changed: Boolean(row.changed),
  }
}

async function mutateManagedUser(client, rpcName, targetUserId, reason, expectedStatus) {
  if (!UUID_PATTERN.test(targetUserId ?? '')) {
    return { data: null, error: publicError('invalid_request', 'The requested user is not valid.') }
  }
  const normalizedReason = String(reason ?? '').trim()
  if (normalizedReason.length > 500) {
    return { data: null, error: publicError('invalid_reason', 'The audit note must be 500 characters or fewer.') }
  }
  const { data, error } = await client.rpc(rpcName, {
    target_user_id: targetUserId,
    reason: normalizedReason || null,
  })
  if (error) return { data: null, error: normalizeLifecycleMutationError(error) }
  const row = Array.isArray(data) ? data[0] : data
  const normalized = normalizeLifecycleResult(row, targetUserId, expectedStatus)
  if (!normalized) {
    return { data: null, error: publicError('unexpected_result', 'Pulse did not confirm the expected lifecycle state. Refresh before trying again.') }
  }
  return { data: normalized, error: null }
}

export function blockManagedUser(client, targetUserId, reason = null) {
  return mutateManagedUser(client, 'block_user', targetUserId, reason, 'blocked')
}

export function reactivateManagedUser(client, targetUserId, reason = null) {
  return mutateManagedUser(client, 'reactivate_user', targetUserId, reason, 'active')
}

export function inactivateManagedUser(client, targetUserId, reason = null) {
  return mutateManagedUser(client, 'inactivate_user', targetUserId, reason, 'inactive')
}

export async function blockPendingUser(client, targetUserId, reason = null) {
  if (!UUID_PATTERN.test(targetUserId ?? '')) {
    return { data: null, error: publicError('invalid_request', 'The requested user is not valid.') }
  }
  const normalizedReason = String(reason ?? '').trim()
  if (normalizedReason.length > 500) {
    return { data: null, error: publicError('invalid_reason', 'The audit note must be 500 characters or fewer.') }
  }
  const { data, error } = await client.rpc('block_pending_user', {
    target_user_id: targetUserId,
    reason: normalizedReason || null,
  })
  if (error) return { data: null, error: normalizePendingMutationError(error) }
  const row = Array.isArray(data) ? data[0] : data
  if (!row || row.id !== targetUserId || row.status !== 'blocked') {
    return { data: null, error: publicError('unexpected_result', 'Pulse did not confirm the pending account was blocked. Refresh before trying again.') }
  }
  return {
    data: {
      id: row.id,
      status: row.status,
      statusChangedAt: row.status_changed_at ?? null,
    },
    error: null,
  }
}

function normalizePendingApprovalOption(row = {}) {
  const scopeType = row.scope_type ?? ''
  const departmentId = row.department_id ?? null
  const teamId = row.team_id ?? null
  if (!UUID_PATTERN.test(departmentId ?? '') || !UUID_PATTERN.test(row.role_id ?? '')) return null
  if (!['global', 'department', 'team'].includes(scopeType)) return null
  if (teamId !== null && !UUID_PATTERN.test(teamId)) return null
  if (scopeType === 'team' && !teamId) return null
  return {
    departmentId,
    departmentCode: row.department_code ?? '',
    departmentName: row.department_name ?? 'Unknown department',
    teamId,
    teamCode: row.team_code ?? null,
    teamName: row.team_name ?? null,
    roleId: row.role_id,
    roleKey: row.role_key ?? '',
    roleName: row.role_name ?? 'Unknown role',
    scopeType,
  }
}

export async function loadPendingApprovalOptions(client, targetUserId) {
  if (!UUID_PATTERN.test(targetUserId ?? '')) {
    return { data: [], error: publicError('invalid_request', 'The requested pending user is not valid.') }
  }
  const { data, error } = await client.rpc('get_pending_approval_options', { target_user_id: targetUserId })
  if (error) return { data: [], error: normalizePendingApprovalError(error) }
  return { data: (data ?? []).map(normalizePendingApprovalOption).filter(Boolean), error: null }
}

export async function approvePendingUser(client, targetUserId, approvalOption = {}) {
  if (!UUID_PATTERN.test(targetUserId ?? '')) {
    return { data: null, error: publicError('invalid_request', 'The requested pending user is not valid.') }
  }
  const normalizedOption = normalizePendingApprovalOption({
    department_id: approvalOption.departmentId,
    department_code: approvalOption.departmentCode,
    department_name: approvalOption.departmentName,
    team_id: approvalOption.teamId ?? null,
    team_code: approvalOption.teamCode,
    team_name: approvalOption.teamName,
    role_id: approvalOption.roleId,
    role_key: approvalOption.roleKey,
    role_name: approvalOption.roleName,
    scope_type: approvalOption.scopeType,
  })
  if (!normalizedOption) {
    return { data: null, error: publicError('invalid_selection', 'Select one exact server-provided approval option.') }
  }
  const { data, error } = await client.rpc('approve_pending_user', {
    target_user_id: targetUserId,
    selected_department_id: normalizedOption.departmentId,
    selected_team_id: normalizedOption.teamId,
    requested_roles: [{ role_id: normalizedOption.roleId, scope_type: normalizedOption.scopeType }],
  })
  if (error) return { data: null, error: normalizePendingApprovalError(error) }
  const row = Array.isArray(data) ? data[0] : data
  if (!row || row.id !== targetUserId || row.status !== 'active'
      || row.department_id !== normalizedOption.departmentId
      || (row.team_id ?? null) !== normalizedOption.teamId) {
    return { data: null, error: publicError('unexpected_result', 'Pulse did not confirm the expected approved profile. Refresh before trying again.') }
  }
  return {
    data: {
      id: row.id,
      employeeId: row.employee_id ?? null,
      status: row.status,
      departmentId: row.department_id,
      teamId: row.team_id ?? null,
      approvedAt: row.approved_at ?? null,
    },
    error: null,
  }
}

function normalizeRoleMutationResult(row, expectedUserRoleId, resultKey) {
  if (!row || row.user_role_id !== expectedUserRoleId) return null
  return { userRoleId: row.user_role_id, [resultKey]: Boolean(row[resultKey]) }
}

async function mutateRoleAssignment(client, rpcName, args, expectedUserRoleId, resultKey) {
  const { data, error } = await client.rpc(rpcName, args)
  if (error) return { data: null, error: normalizeRoleMutationError(error) }
  const row = Array.isArray(data) ? data[0] : data
  const normalized = normalizeRoleMutationResult(row, expectedUserRoleId, resultKey)
  if (!normalized) return { data: null, error: publicError('unexpected_result', 'Pulse did not confirm the expected role assignment. Refresh before trying again.') }
  return { data: normalized, error: null }
}

export async function assignManagedUserRole(client, {
  targetUserId,
  requestedRoleId,
  requestedScopeType,
  requestedDepartmentId = null,
  requestedTeamId = null,
} = {}) {
  if (!UUID_PATTERN.test(targetUserId ?? '') || !UUID_PATTERN.test(requestedRoleId ?? '')) {
    return { data: null, error: publicError('invalid_request', 'The requested user or role is not valid.') }
  }
  if (!['global', 'department', 'team'].includes(requestedScopeType)) {
    return { data: null, error: publicError('invalid_request', 'The requested role scope is not valid.') }
  }
  if ((requestedDepartmentId && !UUID_PATTERN.test(requestedDepartmentId)) || (requestedTeamId && !UUID_PATTERN.test(requestedTeamId))) {
    return { data: null, error: publicError('invalid_request', 'The requested organization scope is not valid.') }
  }
  const { data, error } = await client.rpc('assign_user_role', {
    target_user_id: targetUserId,
    requested_role_id: requestedRoleId,
    requested_scope_type: requestedScopeType,
    requested_department_id: requestedDepartmentId,
    requested_team_id: requestedTeamId,
  })
  if (error) return { data: null, error: normalizeRoleMutationError(error) }
  const row = Array.isArray(data) ? data[0] : data
  if (!row || !UUID_PATTERN.test(row.user_role_id ?? '')) {
    return { data: null, error: publicError('unexpected_result', 'Pulse did not confirm the expected role assignment. Refresh before trying again.') }
  }
  return { data: { userRoleId: row.user_role_id, created: Boolean(row.created) }, error: null }
}

export function removeManagedUserRole(client, targetUserId, targetUserRoleId) {
  if (!UUID_PATTERN.test(targetUserId ?? '') || !UUID_PATTERN.test(targetUserRoleId ?? '')) {
    return Promise.resolve({ data: null, error: publicError('invalid_request', 'The requested user or role assignment is not valid.') })
  }
  return mutateRoleAssignment(client, 'remove_user_role', {
    target_user_id: targetUserId,
    target_user_role_id: targetUserRoleId,
  }, targetUserRoleId, 'removed')
}

export async function loadOrganizationDirectory(client) {
  const [departments, teams] = await Promise.all([
    listManagedDepartments(client),
    listManagedTeams(client),
  ])
  const error = departments.error || teams.error
  if (error) return { data: { departments: [], teams: [] }, error }
  return { data: { departments: departments.data, teams: teams.data }, error: null }
}

function count(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function normalizeDepartment(row = {}) {
  if (!UUID_PATTERN.test(row.id ?? '')) return null
  return {
    id: row.id,
    code: row.code ?? '',
    name: row.name ?? 'Unknown department',
    description: row.description ?? '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    teamCount: count(row.team_count),
    activeTeamCount: count(row.active_team_count),
    userCount: count(row.user_count),
    activeUserCount: count(row.active_user_count),
    pendingUserCount: count(row.pending_user_count),
    activeRoleAssignmentCount: count(row.active_role_assignment_count),
  }
}

function normalizeTeam(row = {}) {
  if (!UUID_PATTERN.test(row.id ?? '') || !UUID_PATTERN.test(row.department_id ?? '')) return null
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentCode: row.department_code ?? '',
    departmentName: row.department_name ?? 'Unknown department',
    departmentIsActive: Boolean(row.department_is_active),
    code: row.code ?? '',
    name: row.name ?? 'Unknown team',
    description: row.description ?? '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    userCount: count(row.user_count),
    activeUserCount: count(row.active_user_count),
    pendingUserCount: count(row.pending_user_count),
    activeRoleAssignmentCount: count(row.active_role_assignment_count),
  }
}

export async function listManagedDepartments(client) {
  const { data, error } = await client.rpc('list_managed_departments')
  if (error) return { data: [], error: normalizeAdminError(error) }
  return { data: (data ?? []).map(normalizeDepartment).filter(Boolean), error: null }
}

export async function listManagedTeams(client) {
  const { data, error } = await client.rpc('list_managed_teams')
  if (error) return { data: [], error: normalizeAdminError(error) }
  return { data: (data ?? []).map(normalizeTeam).filter(Boolean), error: null }
}

function validOrganizationInput({ code, name, description = '' } = {}) {
  return /^[a-z][a-z0-9_]{1,31}$/.test(code ?? '')
    && String(name ?? '').trim().length >= 2
    && String(name ?? '').trim().length <= 120
    && String(description ?? '').trim().length <= 500
}

function normalizeOrganizationMutationRow(row, entityType, resultKey) {
  const normalized = entityType === 'team' ? normalizeTeam(row) : normalizeDepartment(row)
  if (!normalized) return null
  return { ...normalized, [resultKey]: Boolean(row[resultKey]) }
}

async function runOrganizationRpc(client, rpcName, args, entityType, resultKey) {
  const { data, error } = await client.rpc(rpcName, args)
  if (error) return { data: null, error: normalizeOrganizationMutationError(error) }
  const row = Array.isArray(data) ? data[0] : data
  const normalized = normalizeOrganizationMutationRow(row, entityType, resultKey)
  if (!normalized) return { data: null, error: publicError('unexpected_result', 'Pulse did not confirm the expected organization record. Refresh before trying again.') }
  return { data: normalized, error: null }
}

export function createManagedDepartment(client, values = {}) {
  if (!validOrganizationInput(values)) return Promise.resolve({ data: null, error: publicError('invalid_request', 'Review the department code, name, and description.') })
  return runOrganizationRpc(client, 'create_department', {
    requested_code: values.code,
    requested_name: values.name,
    requested_description: values.description || null,
  }, 'department', 'created')
}

export function updateManagedDepartment(client, department, values = {}) {
  if (!UUID_PATTERN.test(department?.id ?? '') || !department?.updatedAt || !validOrganizationInput(values)) {
    return Promise.resolve({ data: null, error: publicError('invalid_request', 'Review the department record before trying again.') })
  }
  return runOrganizationRpc(client, 'update_department', {
    target_department_id: department.id,
    expected_updated_at: department.updatedAt,
    requested_code: values.code,
    requested_name: values.name,
    requested_description: values.description || null,
  }, 'department', 'changed')
}

export function setManagedDepartmentActive(client, department, active) {
  if (!UUID_PATTERN.test(department?.id ?? '') || !department?.updatedAt || typeof active !== 'boolean') {
    return Promise.resolve({ data: null, error: publicError('invalid_request', 'The requested department state is invalid.') })
  }
  return runOrganizationRpc(client, 'set_department_active', {
    target_department_id: department.id,
    requested_active: active,
    expected_updated_at: department.updatedAt,
  }, 'department', 'changed')
}

export function createManagedTeam(client, departmentId, values = {}) {
  if (!UUID_PATTERN.test(departmentId ?? '') || !validOrganizationInput(values)) {
    return Promise.resolve({ data: null, error: publicError('invalid_request', 'Select an active department and review the team details.') })
  }
  return runOrganizationRpc(client, 'create_team', {
    target_department_id: departmentId,
    requested_code: values.code,
    requested_name: values.name,
    requested_description: values.description || null,
  }, 'team', 'created')
}

export function updateManagedTeam(client, team, values = {}) {
  if (!UUID_PATTERN.test(team?.id ?? '') || !team?.updatedAt || !validOrganizationInput(values)) {
    return Promise.resolve({ data: null, error: publicError('invalid_request', 'Review the team record before trying again.') })
  }
  return runOrganizationRpc(client, 'update_team', {
    target_team_id: team.id,
    expected_updated_at: team.updatedAt,
    requested_code: values.code,
    requested_name: values.name,
    requested_description: values.description || null,
  }, 'team', 'changed')
}

export function setManagedTeamActive(client, team, active) {
  if (!UUID_PATTERN.test(team?.id ?? '') || !team?.updatedAt || typeof active !== 'boolean') {
    return Promise.resolve({ data: null, error: publicError('invalid_request', 'The requested team state is invalid.') })
  }
  return runOrganizationRpc(client, 'set_team_active', {
    target_team_id: team.id,
    requested_active: active,
    expected_updated_at: team.updatedAt,
  }, 'team', 'changed')
}

function normalizeAssignableRoleOption(row = {}) {
  const scopeType = row.scope_type ?? ''
  const departmentId = row.department_id ?? null
  const teamId = row.team_id ?? null
  if (!UUID_PATTERN.test(row.role_id ?? '') || !['global', 'department', 'team'].includes(scopeType)) return null
  if (scopeType === 'global' && (departmentId || teamId)) return null
  if (scopeType === 'department' && (!UUID_PATTERN.test(departmentId ?? '') || teamId)) return null
  if (scopeType === 'team' && (!UUID_PATTERN.test(departmentId ?? '') || !UUID_PATTERN.test(teamId ?? ''))) return null
  return {
    roleId: row.role_id,
    roleKey: row.role_key ?? '',
    roleName: row.role_name ?? 'Unknown role',
    scopeType,
    departmentId,
    departmentName: row.department_name ?? null,
    teamId,
    teamName: row.team_name ?? null,
  }
}

export async function loadAssignableRoleOptions(client, targetUserId) {
  if (!UUID_PATTERN.test(targetUserId ?? '')) {
    return { data: [], error: publicError('invalid_request', 'The requested user is not valid.') }
  }
  const { data, error } = await client.rpc('list_assignable_role_options', { target_user_id: targetUserId })
  if (error) return { data: [], error: normalizeAdminError(error) }
  return { data: (data ?? []).map(normalizeAssignableRoleOption).filter(Boolean), error: null }
}
