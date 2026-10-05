import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { StaffAvatar } from '../components/StaffAvatar.jsx'
import { Button } from '../components/ui/Button.jsx'
import { PulseOrb } from '../components/ui/PulseOrb.jsx'
import '../components/ProductHeader.css'
import { useAgentSession } from './agentSessionContext.js'
import { useGoIdentity } from './useGoIdentity.js'

export function AgentGoHeader({ entry = false }) {
  const { agent, kind } = useGoIdentity()
  const { signOut } = useAgentSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [logoutError, setLogoutError] = useState(false)

  async function leave() {
    setLogoutError(false)
    const response = await signOut()
    if (response.error) { setLogoutError(true); return }
    navigate('/go', { replace: true })
  }

  if (!entry && kind === 'agent') return <header className="pulse-product-header pulse-product-header--agent">
    <nav className="pulse-product-header__inner" aria-label="Pulse products">
      <div className="pulse-product-header__links pulse-product-header__links--left"><Link to="/go" aria-current={pathname === '/go' || pathname.startsWith('/go/') ? 'page' : undefined}>GO</Link></div>
      <Link className="pulse-product-header__brand" to="/go" aria-label="Pulse home"><PulseOrb size="sm" active /><span>Pulse</span></Link>
      <div className="pulse-product-header__links pulse-product-header__links--right"><Link to="/academy" aria-current={pathname === '/academy' || pathname.startsWith('/academy/') ? 'page' : undefined}>Academy</Link></div>
    </nav>
    <details className="pulse-product-account" key={pathname}>
      <summary aria-label={`Account menu for ${agent.display_name}`}><span className="pulse-product-account__avatar"><StaffAvatar name={agent.display_name} size="sm" /></span><span className="pulse-product-account__name">{agent.display_name}</span></summary>
      <div className="pulse-product-account__menu">
        <p className="pulse-product-account__label">Account</p>
        <div className="pulse-product-account__identity"><StaffAvatar name={agent.display_name} size="md" /><span><strong>{agent.display_name}</strong><small>{agent.team_name}</small></span></div>
        <nav className="pulse-product-account__items" aria-label="Account menu">
          <Link to={`/profile/${agent.agent_code}`}>Profile <span aria-hidden="true">↗</span></Link>
          <Link to="/agent/settings">Settings <span aria-hidden="true">↗</span></Link>
        </nav>
        {logoutError && <p role="alert" className="pulse-product-account__error">Couldn’t sign out. Try again.</p>}
        <Button type="button" variant="ghost" onClick={() => void leave()}>Sign out</Button>
      </div>
    </details>
  </header>

  return <header className="go-agent-header">
    <Link to={entry ? '/agent/signin' : '/go'} className="go-agent-header__brand" aria-label={entry ? 'Pulse GO Agent sign in' : 'Pulse GO home'}><span aria-hidden="true">◉</span> Pulse GO</Link>
    {!entry && <nav aria-label="GO access"><Link to="/agent/signin">Agent sign in</Link><Link to="/signin">Staff sign in</Link></nav>}
  </header>
}
