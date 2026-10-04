const AGENT_CODE = /^\d{4,12}$/

export function validAgentCode(value) {
  return AGENT_CODE.test(String(value ?? ''))
}

export async function getStaffAgentProfile(client, code) {
  if (!validAgentCode(code)) return { data: null, error: { code: 'invalid_request' } }
  const { data, error } = await client.rpc('get_staff_agent_profile', { requested_agent_code: code })
  return { data: error ? null : data, error }
}
