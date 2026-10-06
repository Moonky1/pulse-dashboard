const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function admin2Error(error) {
  if (!error) return null
  if (['42501', '28000'].includes(error.code)) return { code: 'access_denied', message: 'Your current access cannot perform this action.' }
  if (error.code === 'P0002') return { code: 'not_found', message: 'This record is no longer available.' }
  if (error.code === '55000') return { code: 'protected', message: 'This record changed or has protected account history. Refresh before trying again.' }
  return { code: 'unavailable', message: 'Pulse could not complete this action. Try again.' }
}

export async function inspectStaffRemoval(client, userId) {
  if (!UUID.test(userId)) return { data: null, error: admin2Error({ code: 'P0002' }) }
  const { data, error } = await client.rpc('inspect_staff_removal', { target_user_id: userId })
  return { data, error: admin2Error(error) }
}

export async function removeStaffIdentity(client, userId, plan, confirmation, requestKey) {
  if (!UUID.test(userId) || !UUID.test(requestKey) || confirmation !== 'REMOVE' || !plan?.version) {
    return { data: null, error: { code: 'confirmation', message: 'Type REMOVE to confirm.' } }
  }
  const { data, error } = await client.functions.invoke('pulse-staff-removal', {
    body: { userId, version: plan.version, confirmation, requestKey },
  })
  if (error || !data?.removed) return { data: null, error: admin2Error(error || {}) }
  return { data, error: null }
}

export async function removeStaffInvitation(client, invitation, confirmation) {
  if (!UUID.test(invitation?.id) || confirmation !== 'REMOVE') return { data: null, error: admin2Error({ code: 'P0002' }) }
  const { data, error } = await client.rpc('remove_staff_invitation', {
    target_invitation_id: invitation.id, expected_updated_at: invitation.updatedAt, requested_confirmation: confirmation,
  })
  return { data, error: admin2Error(error) }
}

export async function listAdminAgents(client, { query = '', teamId = '', status = '', cursor = null } = {}) {
  if (query.length > 160 || teamId && !UUID.test(teamId) || status && !['pending_activation', 'active', 'inactive', 'blocked'].includes(status)) {
    return { data: { agents: [] }, error: admin2Error({}) }
  }
  const { data, error } = await client.rpc('list_admin_agents', {
    requested_query: query.trim() || null, requested_team_id: teamId || null,
    requested_status: status || null, after_agent_code: cursor, requested_limit: 50,
  })
  return { data: data || { agents: [] }, error: admin2Error(error) }
}

export async function loadAdminRoleCatalog(client) {
  const { data, error } = await client.rpc('get_admin_role_catalog')
  return { data: data || [], error: admin2Error(error) }
}

export async function listOwnStaffRemovalTasks(client) {
  const { data, error } = await client.rpc('list_own_staff_removal_tasks')
  return { data: data || [], error: admin2Error(error) }
}

export async function loadStaffPresentation(client, userId) {
  if (!UUID.test(userId)) return { data: null, error: admin2Error({ code: 'P0002' }) }
  const { data, error } = await client.rpc('get_admin_staff_presentation', { target_user_id: userId })
  return { data, error: admin2Error(error) }
}
