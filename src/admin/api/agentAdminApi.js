const AGENT_CODE = /^\d{4,12}$/
const PIN = /^\d{6,12}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function provisionAgent(client, { code, displayName, teamId, pin }) {
  const normalizedCode = String(code ?? '').trim()
  const normalizedName = String(displayName ?? '').trim()
  if (!AGENT_CODE.test(normalizedCode) || normalizedName.length < 2 || normalizedName.length > 80
      || !UUID.test(teamId ?? '') || !PIN.test(String(pin ?? ''))) {
    return { data: null, error: { code: 'invalid_request', message: 'Check the Agent ID, name, team and 6–12 digit PIN.' } }
  }

  const { data, error } = await client.rpc('admin_provision_agent', {
    requested_agent_code: normalizedCode,
    requested_display_name: normalizedName,
    requested_team_id: teamId,
    requested_pin: pin,
    requested_full_name: null,
    requested_operating_unit_id: null,
  })
  if (!error) return { data, error: null }
  if (error.code === '23505') {
    return { data: null, error: { code: 'duplicate', message: 'That Agent ID is already in use.' } }
  }
  if (['42501', '28000'].includes(error.code)) {
    return { data: null, error: { code: 'access_denied', message: 'Your Staff account cannot provision Agents.' } }
  }
  if (['22023', '22P02'].includes(error.code)) {
    return { data: null, error: { code: 'invalid_request', message: 'Review the Agent details and choose an active team.' } }
  }
  return { data: null, error: { code: 'unavailable', message: 'Could not create this Agent. No account was added.' } }
}
