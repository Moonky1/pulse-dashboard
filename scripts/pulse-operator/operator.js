export const SUPER_ADMIN_ROLE_ID = '10000000-0000-0000-0000-000000000010'

const SENSITIVE_ACTIONS = new Set(['approve', 'block', 'reactivate', 'inactivate', 'role-assign', 'role-remove'])

export function confirmationPhrase(action, targetUserId, { roleId } = {}) {
  if (action === 'role-assign' && roleId === SUPER_ADMIN_ROLE_ID) {
    return `GRANT SUPER ADMIN ${targetUserId}`
  }
  return `CONFIRM ${action.toUpperCase()} ${targetUserId}`
}

function requireUuid(value, label) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '')) {
    throw new Error(`${label} must be a UUID`)
  }
  return value
}

async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(error.message || `${name} failed`)
  return data
}

async function inspect(client, targetUserId) {
  const rows = await rpc(client, 'get_managed_user', { target_user_id: requireUuid(targetUserId, 'target user ID') })
  const target = Array.isArray(rows) ? rows[0] : rows
  if (!target) throw new Error('target user not found or not visible to this operator')
  return target
}

export async function executeOperatorCommand({ client, args, confirm, output = () => {} }) {
  const [group, verb, ...rest] = args
  if (group !== 'users' && group !== 'roles') throw new Error('command must start with users or roles')

  if (group === 'users' && verb === 'pending') {
    return rpc(client, 'list_managed_users', { requested_status: 'pending_approval' })
  }
  if (group === 'users' && verb === 'inspect') return inspect(client, rest[0])

  let action
  let targetUserId
  let rpcName
  let rpcArgs
  let roleId

  if (group === 'users' && ['block', 'reactivate', 'inactivate'].includes(verb)) {
    action = verb
    targetUserId = requireUuid(rest[0], 'target user ID')
    rpcName = verb === 'inactivate' ? 'inactivate_user' : `${verb}_user`
    rpcArgs = { target_user_id: targetUserId, reason: rest.slice(1).join(' ').trim() || null }
  } else if (group === 'users' && verb === 'approve') {
    action = 'approve'
    targetUserId = requireUuid(rest[0], 'target user ID')
    const departmentId = requireUuid(rest[1], 'department ID')
    const teamId = rest[2] === 'none' ? null : requireUuid(rest[2], 'team ID')
    let requestedRoles
    try { requestedRoles = JSON.parse(rest.slice(3).join(' ')) } catch { throw new Error('roles must be valid JSON') }
    if (!Array.isArray(requestedRoles) || requestedRoles.length === 0) throw new Error('roles JSON must be a non-empty array')
    rpcName = 'approve_pending_user'
    rpcArgs = { target_user_id: targetUserId, selected_department_id: departmentId, selected_team_id: teamId, requested_roles: requestedRoles }
  } else if (group === 'roles' && verb === 'assign') {
    action = 'role-assign'
    targetUserId = requireUuid(rest[0], 'target user ID')
    roleId = requireUuid(rest[1], 'role ID')
    const scopeType = rest[2]
    rpcName = 'assign_user_role'
    rpcArgs = {
      target_user_id: targetUserId,
      requested_role_id: roleId,
      requested_scope_type: scopeType,
      requested_department_id: !rest[3] || rest[3] === 'none' ? null : requireUuid(rest[3], 'department ID'),
      requested_team_id: !rest[4] || rest[4] === 'none' ? null : requireUuid(rest[4], 'team ID'),
    }
  } else if (group === 'roles' && verb === 'remove') {
    action = 'role-remove'
    targetUserId = requireUuid(rest[0], 'target user ID')
    rpcName = 'remove_user_role'
    rpcArgs = { target_user_id: targetUserId, target_user_role_id: requireUuid(rest[1], 'user role ID') }
  } else {
    throw new Error('unsupported operator command')
  }

  if (!SENSITIVE_ACTIONS.has(action)) throw new Error('internal command classification error')
  const target = await inspect(client, targetUserId)
  output({ target, action, rolesRetained: ['block', 'reactivate', 'inactivate'].includes(action) })
  const phrase = confirmationPhrase(action, targetUserId, { roleId })
  if (!(await confirm(phrase))) throw new Error('operator cancelled; no RPC executed')
  return rpc(client, rpcName, rpcArgs)
}
