import { Link, Navigate } from 'react-router-dom'

import { StaffAvatar } from '../components/StaffAvatar.jsx'
import '../auth/screens/AccountSettingsPage.css'
import { GoShell } from './GoShell.jsx'
import { GoSoundToggle } from './GoSoundToggle.jsx'
import { useGoIdentity } from './useGoIdentity.js'

export function AgentSettingsPage() {
  const { agent, kind } = useGoIdentity()
  if (kind !== 'agent') return <Navigate to="/go" replace />
  return <GoShell>
    <section className="pulse-account-page__main go-agent-settings">
      <div className="pulse-account-page__hero"><p>KAMPAIGN KINGS · PULSE</p><h1>Your account</h1><span>Your profile and game preferences.</span></div>
      <div className="pulse-account-page__overview">
        <section className="pulse-account-card pulse-account-card--intro">
          <StaffAvatar name={agent.display_name} size="lg" />
          <div><p className="pulse-account-card__eyebrow">PROFILE</p><h2>{agent.display_name}</h2><p>Agent ID {agent.agent_code} · {agent.team_name}</p><Link to={`/profile/${agent.agent_code}`}>View profile <span aria-hidden="true">↗</span></Link></div>
        </section>
        <section className="pulse-account-card pulse-account-card--details">
          <p className="pulse-account-card__eyebrow">ACCOUNT DETAILS</p><h2>Signed in to Pulse</h2>
          <dl><div><dt>Agent ID</dt><dd>{agent.agent_code}</dd></div><div><dt>Team</dt><dd>{agent.team_name}</dd></div></dl>
          <p>Game sounds</p><GoSoundToggle />
        </section>
      </div>
    </section>
  </GoShell>
}
