import { useState } from 'react'
import { validateToken } from '../utils/token'
import './Register.css'

export default function SignIn() {
  const [name, setName]   = useState('')
  const [token, setToken] = useState('')
  const [step, setStep]   = useState(0) // 0=name, 1=token
  const [error, setError] = useState('')

  const next = () => {
    setError('')
    if (step === 0) {
      if (!name.trim()) return setError('Enter your name')
      return setStep(1)
    }
    if (step === 1) {
      if (!token.trim()) return setError('Enter the access token')
      if (!validateToken(token)) return setError('Invalid token — ask your admin for the current code')
      // Preserve existing role/team if same user
      const existing = JSON.parse(localStorage.getItem('pulse_user') || 'null')
      const sameUser = existing?.name?.toLowerCase() === name.trim().toLowerCase()
      localStorage.setItem('pulse_user', JSON.stringify({
        name: name.trim(),
        team: sameUser ? existing.team : null,
        role: sameUser ? existing.role : null,
        registeredAt: sameUser ? existing.registeredAt : Date.now(),
      }))
      window.location.href = '/dashboard'
    }
  }

  const progress = step === 0 ? 0 : 100

  return (
    <div className="reg-wrap">
      <div className="reg-card">
        <div className="reg-header">
          <div className="reg-logo">P</div>
          <div className="prog-bar"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>
          <div className="reg-step">{step + 1} / 2</div>
        </div>

        {step === 0 && (
          <div className="reg-body">
            <h2>Welcome back</h2>
            <p>Enter your name to continue</p>
            <input
              className="reg-input"
              placeholder="Your name"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && next()}
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="reg-body">
            <h2>Access token</h2>
            <p>Enter the 6-digit code from your admin</p>
            <input
              className="reg-input token-input"
              placeholder="000000"
              value={token}
              onChange={e => { setToken(e.target.value.replace(/\D/g,'').slice(0,6)); setError('') }}
              onKeyDown={e => e.key === 'Enter' && next()}
              maxLength={6}
              autoFocus
            />
            <div className="sheet-note">
              This code changes every 5 minutes. Contact your Team Leader if you don't have it.
            </div>
          </div>
        )}

        {error && <div className="reg-error">{error}</div>}

        <div className="reg-actions">
          {step > 0 && (
            <button className="btn-back" onClick={() => { setStep(0); setError('') }}>← Back</button>
          )}
          <button className="btn-next" onClick={next}>
            {step === 1 ? 'Enter Pulse →' : 'Continue →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: 12, color: '#6b7280' }}>
          New here?{' '}
          <span
            onClick={() => window.location.href = '/register'}
            style={{ color: '#f97316', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Register instead
          </span>
        </p>
      </div>
    </div>
  )
}