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
    <section className="go-hero">
      <p className="go-eyebrow">Pulse GO</p>
      <h1>Train. Practice. Play.</h1>
      <p>Turn what you know into momentum.</p>
      <div className="go-hero-actions">
        {canPractice(access.capabilities) && <Link className="go-primary" to="/go/practice">Start Practice</Link>}
        {canHost(access.capabilities) && <Link className="go-secondary" to="/go/host">Host a game</Link>}
      </div>
    </section>
    <section className="go-join" aria-labelledby="go-join-title">
      <div><p className="go-eyebrow">Live play</p><h2 id="go-join-title">Join a game</h2><p>Enter the code from your host.</p></div>
      <form onSubmit={joinRoom}><label htmlFor="go-room-code">Game code</label><input id="go-room-code" inputMode="text" autoComplete="off" value={roomCode} onChange={event => setRoomCode(normalizeRoomCode(event.target.value))} placeholder="KK 0000" maxLength="7" /><Button loading={joining} disabled={!/^KK \d{4}$/.test(roomCode)}>Join</Button>{joinError && <p className="go-join-error" role="alert">{joinError}</p>}</form>
    </section>
  </GoShell>
}
