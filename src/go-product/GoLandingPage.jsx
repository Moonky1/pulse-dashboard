import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { joinGoHostedSession } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canHost, canPractice } from './goAccess.js'
import { normalizeRoomCode, roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { GO_ART } from './goVisualAssets.js'
import { useGoAccess } from './useGoAccess.js'

export function GoLandingPage() {
  const access = useGoAccess()
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)
  if (access.state !== 'allowed') return <GoAccessState access={access} />

  async function joinRoom(event) {
    event.preventDefault()
    setJoining(true); setJoinError(null)
    const { data, error } = await joinGoHostedSession(supabase, roomCode)
    setJoining(false)
    if (error) return setJoinError(error.message)
    navigate(roomPath(data))
  }
  return <GoShell>
    <section className="go-mode-heading">
      <div><p className="go-eyebrow">Pulse GO</p><h1>Choose a game</h1><p>Practice, host, or join a live round</p></div>
      <div className="go-mode-heading__rewards" aria-hidden="true"><img src={GO_ART.points} alt="" /><img src={GO_ART.medal1} alt="" /></div>
    </section>
    <section className="go-mode-grid" aria-label="GO game modes">
      {canPractice(access.capabilities) && <article className="go-mode-card go-mode-card--practice">
        <div className="go-mode-art"><img src={GO_ART.goal} alt="" /><span>Solo</span></div>
        <div><p className="go-eyebrow">Practice</p><h2>Sharpen your skills</h2><p>Pick a topic and play at your pace</p></div>
        <Link className="go-primary" to="/go/practice">Start practice</Link>
      </article>}
      {canHost(access.capabilities) && <article className="go-mode-card go-mode-card--host">
        <div className="go-mode-art"><img src={GO_ART.certification} alt="" /><span>Live</span></div>
        <div><p className="go-eyebrow">Host a game</p><h2>Bring the team in</h2><p>Choose a game and share one room code</p></div>
        <Link className="go-secondary" to="/go/host">Host a game</Link>
      </article>}
      <article className="go-mode-card go-mode-card--join" aria-labelledby="go-join-title">
        <div className="go-mode-art"><img src={GO_ART.classic} alt="" /><span>Room code</span></div>
        <div><p className="go-eyebrow">Join a game</p><h2 id="go-join-title">Enter your code</h2></div>
        <form onSubmit={joinRoom}><label htmlFor="go-room-code">Game code</label><input id="go-room-code" inputMode="text" autoComplete="off" value={roomCode} onChange={event => setRoomCode(normalizeRoomCode(event.target.value))} placeholder="KK 1234" maxLength="7" aria-describedby={joinError ? 'go-join-error' : undefined} /><Button loading={joining} disabled={!/^KK \d{4}$/.test(roomCode)}>Join</Button>{joinError && <p id="go-join-error" className="go-join-error" role="alert">{joinError}</p>}</form>
      </article>
    </section>
  </GoShell>
}
