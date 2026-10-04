import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider.jsx'
import { getMyGoProgress } from '../training/trainingApi.js'
import { GoProgressOverview } from './GoProgressOverview.jsx'
import { GoShell } from './GoShell.jsx'
import { useGoIdentity } from './useGoIdentity.js'

export function GoPlayerProgress() {
  const identity = useGoIdentity()
  const { profile } = useAuth()
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => {
    if (!identity.client) return undefined
    let active = true
    void getMyGoProgress(identity.client).then(({ data, error }) => {
      if (active) setState({ data, error, loading: false })
    })
    return () => { active = false }
  }, [identity.client])
  const playerName = identity.agent?.display_name || profile?.display_name || profile?.full_name || 'Player'
  const progress = state.data
  return <GoShell><section className="go-player-progress">
    <Link to="/go">← Back to GO</Link>
    <p className="go-eyebrow">Pulse GO player</p><h1>{playerName}</h1>
    {identity.kind === 'agent' && <p className="go-player-progress__identity">Agent ID {identity.agent.agent_code} · {identity.agent.team_name}</p>}
    {state.loading && <p role="status">Loading your progress…</p>}
    {state.error && <p role="alert">Your progress is unavailable right now.</p>}
    {progress && <GoProgressOverview progress={progress} />}
  </section></GoShell>
}
