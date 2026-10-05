import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { joinGoHostedSession } from '../training/trainingApi.js'
import { canHost, canPractice } from './goAccess.js'
import { normalizeRoomCode, roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'
import { useGoIdentity } from './useGoIdentity.js'
import { GoGlobalRanking } from './GoGlobalRanking.jsx'

export function GoLandingPage() {
  const access = useGoAccess()
  const identity = useGoIdentity()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [roomCode, setRoomCode] = useState(() => normalizeRoomCode(searchParams.get('code') || ''))
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)
  if (access.state !== 'allowed' && access.state !== 'anonymous') return <GoAccessState access={access} />

  async function joinRoom(event) {
    event.preventDefault()
    if (identity.kind === 'anonymous') {
      navigate(`/agent/signin?code=${encodeURIComponent(roomCode)}`)
      return
    }
    setJoining(true); setJoinError(null)
    const { data, error } = await joinGoHostedSession(identity.client, roomCode)
    setJoining(false)
    if (error) return setJoinError(error.message)
    navigate(roomPath(data))
  }
  return <GoShell>
    <section className="go-mode-heading">
      <div><p className="go-eyebrow">Pulse GO</p><h1>Choose a game</h1><p>{canHost(access.capabilities) ? 'Practice, host, or join a live round' : 'Practice or join a live round'}</p>{identity.kind === 'staff' && <Link className="go-mode-heading__progress" to="/go/progress">My progress →</Link>}</div>
      <div className="go-mode-heading__rewards" aria-hidden="true"><img src={GO_ART.points} alt="" /><img src={GO_ART.medal1} alt="" /></div>
    </section>
    <section className={`go-mode-grid${canHost(access.capabilities) ? '' : ' go-mode-grid--player'}`} aria-label="GO game modes">
      {(canPractice(access.capabilities) || identity.kind === 'anonymous') && <article className="go-mode-card go-mode-card--practice">
        <div className="go-mode-art"><img src={GO_ART.goal} alt="" /><span>Solo</span></div>
        <div><p className="go-eyebrow">Practice</p><h2>Play solo</h2><p>Pick a topic and play at your pace</p></div>
        <Link className="go-primary" to={identity.kind === 'anonymous' ? '/agent/signin?next=%2Fgo%2Fpractice' : '/go/practice'}>Start practice</Link>
      </article>}
      {canHost(access.capabilities) && <article className="go-mode-card go-mode-card--host">
        <div className="go-mode-art"><img src={GO_ART.certification} alt="" /><span>Live</span></div>
        <div><p className="go-eyebrow">Host a game</p><h2>Bring the team in</h2><p>Choose a game and share one room code</p></div>
        <Link className="go-secondary" to="/go/host">Host a game</Link>
      </article>}
      <article className="go-mode-card go-mode-card--join" aria-labelledby="go-join-title">
        <div className="go-mode-art"><img src={GO_ART.classic} alt="" /><span>Room code</span></div>
        <div><p className="go-eyebrow">Join a game</p><h2 id="go-join-title">Join a round</h2><p>Enter your code and play with the team</p></div>
        <form onSubmit={joinRoom}><label htmlFor="go-room-code">Game code</label><input id="go-room-code" inputMode="text" autoComplete="off" value={roomCode} onChange={event => setRoomCode(normalizeRoomCode(event.target.value))} placeholder="KK 1234" maxLength="7" aria-describedby={joinError ? 'go-join-error' : undefined} /><Button loading={joining} disabled={!/^KK \d{4}$/.test(roomCode)}>Join</Button>{joinError && <p id="go-join-error" className="go-join-error" role="alert">{joinError}</p>}</form>
      </article>
    </section>
    <GoGlobalRanking />
  </GoShell>
}
