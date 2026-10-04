import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../AuthProvider.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { agentRequest } from '../../go-product/agentGoApi.js'
import { useAgentSession } from '../../go-product/agentSessionContext.js'
import { roomPath } from '../../go-product/goHostedModel.js'
import { GoShell } from '../../go-product/GoShell.jsx'
import { useGoIdentity } from '../../go-product/useGoIdentity.js'

export function AgentSignInPage() {
  const identity = useGoIdentity()
  const { signOut: signOutStaff } = useAuth()
  const { signIn } = useAgentSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [activationMode, setActivationMode] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [switching, setSwitching] = useState(false)
  const roomCode = params.get('code') || ''
  const requestedNext = params.get('next') || '/go'
  const next = requestedNext === '/go' || requestedNext === '/go/practice' || requestedNext === '/academy'
    || /^\/(?:go\/(?:practice|room)\/[0-9a-f-]{36}|academy\/[a-z0-9-]+)$/i.test(requestedNext) ? requestedNext : '/go'

  if (identity.loading) return <GoShell forceAgentHeader><section className="go-state"><h1>Opening Pulse GO…</h1></section></GoShell>

  async function switchToAgent() {
    setSwitching(true); setError('')
    const result = await signOutStaff()
    setSwitching(false)
    if (result.error) setError('Could not close your Staff session. Try again.')
  }

  async function continueToGame(event) {
    event.preventDefault()
    setBusy(true); setError('')
    if (identity.kind !== 'agent') {
      let activatedNow = false
      if (activationMode) {
        if (pin !== confirmPin) { setBusy(false); setError('The PINs do not match.'); return }
        const activation = await agentRequest('activate', { code: code.trim(), activationCode, pin })
        if (activation.error) { setBusy(false); setError(activation.error.message); return }
        setActivationCode('')
        setConfirmPin('')
        setActivationMode(false)
        activatedNow = true
      }
      const result = await signIn(code.trim(), pin)
      if (result.error) {
        setBusy(false)
        setError(activatedNow ? 'Your PIN was created. Sign in with your new PIN to continue.' : result.error.message)
        if (activatedNow) setPin('')
        return
      }
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

  if (identity.kind === 'staff') return <GoShell forceAgentHeader><section className="go-agent-entry">
    <div className="go-agent-entry__art" aria-hidden="true">✦</div>
    <p className="go-eyebrow">Pulse GO · Agent access</p>
    <h1>Switch to Agent</h1>
    <p>You are signed in as Staff in this browser. To use an Agent ID here, first close your Staff session. Your Staff account will not be changed.</p>
    <Button type="button" loading={switching} onClick={() => void switchToAgent()}>Sign out of Staff and continue</Button>
    {error && <p className="go-agent-entry__error" role="alert">{error}</p>}
  </section></GoShell>

  return <GoShell forceAgentHeader><section className="go-agent-entry">
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
      {activationMode && <><label htmlFor="agent-activation">One-time activation code</label>
        <input id="agent-activation" inputMode="text" autoComplete="one-time-code" pattern="[0-9A-Fa-f]{16}" maxLength="16" required value={activationCode} onChange={event => setActivationCode(event.target.value.replace(/[^0-9a-f]/gi, '').toLowerCase())} placeholder="16 characters" /></>}
      <label htmlFor="agent-pin">{activationMode ? 'Create your PIN' : 'PIN'}</label>
      <input id="agent-pin" type="password" inputMode="numeric" autoComplete={activationMode ? 'new-password' : 'current-password'} pattern="[0-9]{6,12}" minLength="6" maxLength="12" required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} placeholder={activationMode ? '6–12 digits' : 'Your private PIN'} />
      {activationMode && <><label htmlFor="agent-pin-confirm">Confirm your PIN</label>
        <input id="agent-pin-confirm" type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{6,12}" minLength="6" maxLength="12" required value={confirmPin} onChange={event => setConfirmPin(event.target.value.replace(/\D/g, ''))} placeholder="Repeat your PIN" /></>}
      <Button loading={busy}>{activationMode ? 'Activate and continue' : 'Continue'}</Button>
      <button className="go-agent-entry__mode" type="button" onClick={() => { setActivationMode(!activationMode); setPin(''); setConfirmPin(''); setActivationCode(''); setError('') }}>{activationMode ? 'I already have a PIN' : 'First time here? Create your PIN'}</button>
      <p className="go-agent-entry__help">{activationMode ? 'Ask your Team Leader or Pulse administrator for your one-time code. It expires in 24 hours.' : 'Forgot your PIN? Ask your Team Leader or Pulse administrator for a new activation code.'}</p>
    </form>}
    {error && <p className="go-agent-entry__error" role="alert">{error}</p>}
  </section></GoShell>
}
