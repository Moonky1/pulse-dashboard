import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { agentRequest } from '../../go-product/agentGoApi.js'
import { useAgentSession } from '../../go-product/agentSessionContext.js'
import { roomPath } from '../../go-product/goHostedModel.js'
import { GoShell } from '../../go-product/GoShell.jsx'
import { useGoIdentity } from '../../go-product/useGoIdentity.js'

export function AgentSignInPage() {
  const identity = useGoIdentity()
  const { signIn } = useAgentSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const roomCode = params.get('code') || ''
  const requestedNext = params.get('next') || '/go'
  const next = requestedNext === '/go' || requestedNext === '/go/practice' || /^\/go\/(?:practice|room)\/[0-9a-f-]{36}$/i.test(requestedNext) ? requestedNext : '/go'

  if (identity.kind === 'staff') return <Navigate to="/go" replace />
  if (identity.loading) return <GoShell><section className="go-state"><h1>Opening Pulse GO…</h1></section></GoShell>

  async function continueToGame(event) {
    event.preventDefault()
    setBusy(true); setError('')
    if (identity.kind !== 'agent') {
      const result = await signIn(code.trim(), pin)
      if (result.error) { setBusy(false); setError(result.error.message); return }
    }
    if (roomCode) {
      const joined = await agentRequest('roomJoin', { roomCode })
      setBusy(false)
      if (joined.error) { setError(joined.error.message); return }
      navigate(roomPath(joined.data), { replace: true })
    } else {
      navigate(next, { replace: true })
    }
  }

  return <GoShell><section className="go-agent-entry">
    <div className="go-agent-entry__art" aria-hidden="true">✦</div>
    <p className="go-eyebrow">Pulse GO · Player access</p>
    <h1>{roomCode ? 'Join your game' : 'Welcome to Pulse GO'}</h1>
    <p>{roomCode ? `Room ${roomCode} is waiting for you.` : 'Your games and progress stay with you.'}</p>
    {identity.kind === 'agent' ? <form onSubmit={continueToGame}>
      <p className="go-agent-entry__welcome">Welcome back, <strong>{identity.agent.display_name}</strong><span>{identity.agent.team_name}</span></p>
      <Button loading={busy}>{roomCode ? 'Join room' : 'Continue to GO'}</Button>
    </form> : <form onSubmit={continueToGame}>
      <label htmlFor="agent-code">Agent ID</label>
      <input id="agent-code" inputMode="numeric" autoComplete="username" pattern="[0-9]{4,12}" maxLength="12" required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} placeholder="3248" />
      <label htmlFor="agent-pin">PIN</label>
      <input id="agent-pin" type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{6,12}" minLength="6" maxLength="12" required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} placeholder="Your private PIN" />
      <Button loading={busy}>Continue</Button>
      <p className="go-agent-entry__help">Forgot your PIN? Contact your Team Leader or Pulse administrator.</p>
    </form>}
    {error && <p className="go-agent-entry__error" role="alert">{error}</p>}
  </section></GoShell>
}
