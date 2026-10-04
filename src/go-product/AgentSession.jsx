import { useCallback, useEffect, useMemo, useState } from 'react'

import { agentRequest, getAgentSession } from './agentGoApi.js'
import { AgentSessionContext } from './agentSessionContext.js'

export function AgentSessionProvider({ children }) {
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const response = await getAgentSession()
    setAgent(response.data)
    setLoading(false)
    return response
  }, [])

  useEffect(() => {
    let active = true
    void getAgentSession().then(response => {
      if (active) { setAgent(response.data); setLoading(false) }
    })
    return () => { active = false }
  }, [])

  const signIn = useCallback(async (code, pin) => {
    const response = await agentRequest('login', { code, pin })
    if (!response.error) setAgent(response.data)
    return response
  }, [])

  const signOut = useCallback(async () => {
    const response = await agentRequest('logout')
    if (!response.error) setAgent(null)
    return response
  }, [])

  const value = useMemo(() => ({ agent, loading, refresh, signIn, signOut }), [agent, loading, refresh, signIn, signOut])
  return <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>
}
