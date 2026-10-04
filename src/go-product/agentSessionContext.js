import { createContext, useContext } from 'react'

export const AgentSessionContext = createContext(null)

export function useAgentSession() {
  const value = useContext(AgentSessionContext)
  if (!value) throw new Error('Agent session is unavailable.')
  return value
}
