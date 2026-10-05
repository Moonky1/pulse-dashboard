import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getStaffAgentProfile, validAgentCode } from '../profile/agentProfileService.js'
import { getMyGoProgress } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { GoProgressOverview } from './GoProgressOverview.jsx'
import { GoShell } from './GoShell.jsx'
import { useGoIdentity } from './useGoIdentity.js'
import { goPlayerName } from './goPlayerIdentity.js'
import { GoTeamBadge } from './GoTeamBadge.jsx'

export function AgentProfilePage() {
  const { agentCode } = useParams()
  const identity = useGoIdentity()
  const [state, setState] = useState({ code: null, loading: true, data: null, error: null })

  useEffect(() => {
    if (!validAgentCode(agentCode) || (identity.kind === 'agent' && identity.agent?.agent_code !== agentCode)) return undefined
    let active = true
    const request = identity.kind === 'staff'
      ? getStaffAgentProfile(supabase, agentCode)
      : getMyGoProgress(identity.client).then(({ data, error }) => ({
        data: error ? null : {
          ...identity.agent,
          go: data,
        }, error,
      }))
    void request.then(({ data, error }) => {
      if (active) setState({ code: agentCode, loading: false, data, error })
    })
    return () => { active = false }
  }, [agentCode, identity.kind, identity.agent, identity.client])

  const allowed = validAgentCode(agentCode) && (identity.kind === 'staff' || identity.agent?.agent_code === agentCode)
  const loading = allowed && (state.loading || state.code !== agentCode)
  const profile = allowed && !loading ? state.data : null
  return <GoShell><section className="go-player-progress go-agent-profile">
    <Link to="/go">← Back to GO</Link>
    {loading && <p role="status">Loading Agent profile…</p>}
    {!loading && !profile && <div className="go-agent-profile__empty"><h1>Profile unavailable</h1><p>{state.error ? 'We couldn’t load this Agent profile right now.' : 'This Agent profile is not available to your account.'}</p></div>}
    {profile && <>
      <header className="go-agent-profile__hero">
        <div className="go-agent-profile__avatar" aria-hidden="true">{goPlayerName(profile).slice(0, 1).toUpperCase()}</div>
        <p className="go-eyebrow">Pulse · Profile</p>
        <h1>{goPlayerName(profile)}</h1>
        <p className="go-agent-profile__meta"><span>ID: {profile.agent_code}</span><GoTeamBadge player={profile} />{identity.kind === 'staff' && <span>{profile.status}</span>}</p>
      </header>
      <div className="go-agent-profile__section-heading"><p className="go-eyebrow">Your game record</p><h2>Pulse GO</h2><p>Completed games and ranking from Pulse GO.</p></div>
      {profile.go && <GoProgressOverview progress={profile.go} />}
    </>}
  </section></GoShell>
}
