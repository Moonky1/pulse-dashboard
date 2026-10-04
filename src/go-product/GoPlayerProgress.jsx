import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider.jsx'
import { getMyGoProgress } from '../training/trainingApi.js'
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
    {progress && <><div className="go-player-progress__stats">
      <div><strong>{progress.hosted_games}</strong><span>Hosted games</span></div>
      <div><strong>{progress.practice_games}</strong><span>Practice games</span></div>
      <div><strong>{progress.average_accuracy == null ? '—' : `${Math.round(Number(progress.average_accuracy))}%`}</strong><span>Average accuracy</span></div>
      <div><strong>{Number(progress.competitive?.points || 0).toLocaleString()}</strong><span>Hosted points</span></div>
      <div><strong>{progress.competitive?.rank ? `#${progress.competitive.rank}` : '—'}</strong><span>Global rank</span></div>
    </div><section className="go-player-progress__recent"><h2>Recent activity</h2>
      {progress.recent_activity?.length ? <ol>{progress.recent_activity.map(game => <li key={game.attempt_id}>
        <span><strong>{game.game}</strong><small>{game.mode === 'go_hosted' ? 'Hosted' : 'Practice'} · {new Date(game.completed_at).toLocaleDateString()}</small></span>
        <b>{Math.round(Number(game.score_percent))}%</b>
      </li>)}</ol> : <p>Your completed games will show here.</p>}
    </section></>}
  </section></GoShell>
}
