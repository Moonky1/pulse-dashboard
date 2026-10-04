import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAgentSession } from './agentSessionContext.js'
import { useGoIdentity } from './useGoIdentity.js'

export function AgentGoHeader() {
  const { agent, kind } = useGoIdentity()
  const { signOut } = useAgentSession()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState(false)

  async function leave() {
    setLogoutError(false)
    const response = await signOut()
    if (response.error) { setLogoutError(true); return }
    navigate('/go', { replace: true })
  }

  return <header className="go-agent-header">
    <Link to="/go" className="go-agent-header__brand" aria-label="Pulse GO home"><span aria-hidden="true">◉</span> Pulse GO</Link>
    {kind === 'agent' ? <nav aria-label="Agent player">
      <Link to={`/profile/${agent.agent_code}`}>My profile</Link>
      <span className="go-agent-header__identity"><strong>{agent.display_name}</strong><small>{agent.team_name}</small></span>
      <button type="button" onClick={() => void leave()}>Sign out</button>
      {logoutError && <span role="alert" className="go-agent-header__error">Couldn’t sign out. Try again.</span>}
    </nav> : <nav aria-label="GO access"><Link to="/agent/signin">Agent sign in</Link><Link to="/signin">Staff sign in</Link></nav>}
  </header>
}
