import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button.jsx'
import { canHost, canPractice } from './goAccess.js'
import { GoAccessState, GoShell } from './GoShell.jsx'
import { useGoAccess } from './useGoAccess.js'

export function GoLandingPage() {
  const access = useGoAccess()
  const [hostNotice, setHostNotice] = useState(false)
  if (access.state !== 'allowed') return <GoAccessState access={access} />
  return <GoShell>
    <section className="go-hero">
      <p className="go-eyebrow">Pulse GO</p>
      <h1>Train. Practice. Play.</h1>
      <p>Turn what you know into momentum.</p>
      <div className="go-hero-actions">
        {canPractice(access.capabilities) && <Link className="go-primary" to="/go/practice">Start Practice</Link>}
        {canHost(access.capabilities) && <Button variant="secondary" onClick={() => setHostNotice(true)}>Host a game</Button>}
      </div>
      {hostNotice && <p className="go-notice" role="status">Live hosting is being prepared. No room was created.</p>}
    </section>
    <section className="go-join" aria-labelledby="go-join-title">
      <div><p className="go-eyebrow">Live play</p><h2 id="go-join-title">Join a game</h2><p>Live rooms are not open yet.</p></div>
      <div><label htmlFor="go-room-code">Game code</label><input id="go-room-code" disabled placeholder="Coming soon" /><Button disabled>Join</Button></div>
    </section>
  </GoShell>
}
