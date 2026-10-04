const AGENT_CODE = /^\d{4,12}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeAgentError(error, action) {
  if (error.code === '23505') return { code: 'duplicate', message: 'That Agent ID is already in use.' }
  if (['42501', '28000'].includes(error.code)) return { code: 'access_denied', message: `Your Staff account cannot ${action} Agents.` }
  if (error.code === 'P0002') return { code: 'not_found', message: 'That Agent ID was not found.' }
  if (['22023', '22P02'].includes(error.code)) return { code: 'invalid_request', message: 'Review the Agent details and choose an active team.' }
  return { code: 'unavailable', message: `Could not ${action} this Agent. Try again.` }
}

export async function provisionAgent(client, { code, teamId }) {
  const normalizedCode = String(code ?? '').trim()
  if (!AGENT_CODE.test(normalizedCode) || !UUID.test(teamId ?? '')) {
    return { data: null, error: { code: 'invalid_request', message: 'Check the Agent ID and team.' } }
  }
  const { data, error } = await client.rpc('admin_prepare_agent_activation', {
    requested_agent_code: normalizedCode,
    requested_display_name: `Agent ${normalizedCode}`,
    requested_team_id: teamId,
    requested_full_name: null,
    requested_operating_unit_id: null,
  })
  return error ? { data: null, error: normalizeAgentError(error, 'provision') } : { data, error: null }
}

export async function reissueAgentActivation(client, code) {
  const normalizedCode = String(code ?? '').trim()
  if (!AGENT_CODE.test(normalizedCode)) {
    return { data: null, error: { code: 'invalid_request', message: 'Enter a valid Agent ID.' } }
  }
  const { data, error } = await client.rpc('admin_reissue_agent_activation', { requested_agent_code: normalizedCode })
  return error ? { data: null, error: normalizeAgentError(error, 'reactivate') } : { data, error: null }
}
