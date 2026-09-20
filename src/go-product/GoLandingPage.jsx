import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { joinGoHostedSession } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { canHost, canPractice } from './goAccess.js'
import { normalizeRoomCode, roomPath } from './goHostedModel.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
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
    <section className="go-landing-grid">
      <div className="go-hero">
        <div className="go-hero-copy">
          <p className="go-eyebrow">Pulse GO</p>
          <h1>Ready for the next round?</h1>
          <p>Practice solo or bring the team into a live game.</p>
          <div className="go-hero-actions">
            {canPractice(access.capabilities) && <Link className="go-primary" to="/go/practice">Start practice</Link>}
            {canHost(access.capabilities) && <Link className="go-secondary" to="/go/host">Host a game</Link>}
          </div>
        </div>
        <div className="go-hero-art" aria-hidden="true">
          <img className="go-hero-art__main" src="/emojis/classic.webp" alt="" />
          <img className="go-hero-art__medal" src="/emojis/medal1.webp" alt="" />
          <img className="go-hero-art__points" src="/emojis/points.webp" alt="" />
        </div>
      </div>
      <aside className="go-join" aria-labelledby="go-join-title">
        <div className="go-join-icon" aria-hidden="true">⚡</div>
        <div><p className="go-eyebrow">Live game</p><h2 id="go-join-title">Have a room code?</h2><p>Jump in when your host is ready.</p></div>
        <form onSubmit={joinRoom}><label htmlFor="go-room-code">Game code</label><div><input id="go-room-code" inputMode="text" autoComplete="off" value={roomCode} onChange={event => setRoomCode(normalizeRoomCode(event.target.value))} placeholder="KK 0000" maxLength="7" /><Button loading={joining} disabled={!/^KK \d{4}$/.test(roomCode)}>Join</Button></div>{joinError && <p className="go-join-error" role="alert">{joinError}</p>}</form>
      </aside>
    </section>
  </GoShell>
}
