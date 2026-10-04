import { useAuth } from '../auth/AuthProvider.jsx'
import { AUTH_STATES } from '../auth/authState.js'
import { supabase } from '../utils/supabase.js'
import { agentGoClient } from './agentGoApi.js'
import { useAgentSession } from './agentSessionContext.js'

export function useGoIdentity() {
  const { authState } = useAuth()
  const { agent, loading: agentLoading } = useAgentSession()
  if (authState === AUTH_STATES.ACTIVE) return { kind: 'staff', client: supabase, agent: null, loading: false }
  if (authState === AUTH_STATES.LOADING || agentLoading) return { kind: 'loading', client: null, agent: null, loading: true }
  if (agent) return { kind: 'agent', client: agentGoClient, agent, loading: false }
  return { kind: 'anonymous', client: null, agent: null, loading: false }
}
