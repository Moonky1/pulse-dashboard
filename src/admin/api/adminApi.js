const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function publicError(code, message) {
  return { code, message }
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

export async function loadOrganizationDirectory(client) {
  const [departments, teams] = await Promise.all([
    client.from('departments').select('id,name,code,is_active').order('name'),
    client.from('teams').select('id,name,code,department_id,is_active').order('name'),
  ])
  const error = departments.error || teams.error
  if (error) return { data: { departments: [], teams: [] }, error: normalizeAdminError(error) }
  return { data: { departments: departments.data ?? [], teams: teams.data ?? [] }, error: null }
}
