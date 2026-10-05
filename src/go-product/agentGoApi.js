import { supabase } from '../utils/supabase.js'
import { agentGoOperation } from './agentGoOperations.js'

export async function agentRequest(action, args = {}) {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, args }),
    })
    const payload = await response.json()
    return payload?.error ? { data: null, error: payload.error } : { data: payload?.data ?? null, error: null }
  } catch {
    return { data: null, error: { code: 'unavailable', message: 'Pulse GO is temporarily unavailable.' } }
  }
}

export async function getAgentSession() {
  try {
    const response = await fetch('/api/agent', { credentials: 'same-origin', cache: 'no-store' })
    const payload = await response.json()
    return payload?.error ? { data: null, error: payload.error } : { data: payload?.data ?? null, error: null }
  } catch {
    return { data: null, error: { code: 'unavailable', message: 'Pulse GO is temporarily unavailable.' } }
  }
}

export const agentGoClient = {
  // Preserve existing GO destination guards while routing Agent calls through
  // the same-origin cookie boundary. This is never a privileged browser client.
  supabaseUrl: supabase.supabaseUrl,
  async rpc(name, args = {}) {
    if (name === 'get_go_capabilities') return { data: { can_practice: true, can_host: false }, error: null }
    const operation = agentGoOperation(name, args)
    if (!operation) return { data: null, error: { code: 'access_denied', message: 'This action is not available to Agent players.' } }
    return agentRequest(operation[0], operation[1])
  },
}
