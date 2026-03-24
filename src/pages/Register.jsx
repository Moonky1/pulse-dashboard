import { useState } from 'react'
import { APP_CONFIG } from '../config'
import { validateToken } from '../utils/token'
import './Register.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMYoW8aLdaXUOOuRDkTgU38XTKJj5CMr0fiy7Z3AFCtasJKbzy0VLuc5RWcDC5OCZZ/exec'

const ROLES = [
  { id: 'supervisor', label: 'Supervisor',  icon: '🧑‍💼' },
  { id: 'qa',         label: 'QA',          icon: '🔍' },
  { id: 'leader',     label: 'Team Leader', icon: '🏆' },
]

const STEPS = ['name', 'role', 'team', 'token']

export default function Register() {
  const [step, setStep]     = useState(0)
  const [name, setName]     = useState('')
  const [role, setRole]     = useState(null)
  const [team, setTeam]     = useState(null)
  const [token, setToken]   = useState('')
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  const saveToSheets = async (data) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch(e) { console.error(e) }
  }

  const next = async () => {
    setError('')
    if (step === 0) {
      if (!name.trim()) return setError('Enter your name')
      return setStep(1)
    }
    if (step === 1) {
      if (!role) return setError('Select your role')
      return setStep(2)
    }
    if (step === 2) {
      if (!team) return setError('Select your team')
      return setStep(3)
    }
    if (step === 3) {
      if (!token.trim()) return setError('Enter the access token')
      if (!validateToken(token)) return setError('Invalid token — ask your admin for the current code')
      setSaving(true)
      const roleLabel = ROLES.find(r => r.id === role)?.label || role
      const teamLabel = APP_CONFIG.teams.find(t => t.id === team)?.name || team
      await saveToSheets({ name, team: teamLabel, role: roleLabel })
      localStorage.setItem('pulse_user', JSON.stringify({ name, team, role, registeredAt: Date.now() }))
      window.location.href = '/dashboard'
    }
  }

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="reg-wrap">
      <div className="reg-card">
        <div className="reg-header">
          <div className="reg-logo">P</div>
          <div className="prog-bar"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>
          <div className="reg-step">{step + 1} / {STEPS.length}</div>
        </div>

        {step === 0 && (
          <div className="reg-body">
            <h2>What's your name?</h2>
            <p>This is how you'll appear in the dashboard</p>
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
            <h2>Select your role</h2>
            <p>Choose your position in the team</p>
            <div className="role-grid">
              {ROLES.map(r => (
                <div
                  key={r.id}
                  className={`role-card${role === r.id ? ' selected' : ''}`}
                  onClick={() => { setRole(r.id); setError('') }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-label">{r.label}</span>
                  {role === r.id && <span className="role-check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="reg-body">
            <h2>Select your team</h2>
            <p>This cannot be changed later</p>
            <div className="team-grid">
              {APP_CONFIG.teams.map(t => (
                <div
                  key={t.id}
                  className={`team-card${team === t.id ? ' selected' : ''}`}
                  onClick={() => { setTeam(t.id); setError('') }}
                  style={{ cursor: 'pointer' }}
                >
                  <img className="t-flag" src={`https://flagcdn.com/w40/${t.code}.png`} alt={t.name} />
                  <div className="t-name">{t.name}</div>
                  <div className="t-count">{t.agents} agents</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
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
            <button className="btn-back" onClick={() => { setStep(s => s - 1); setError('') }}>← Back</button>
          )}
          <button className="btn-next" onClick={next} disabled={saving}>
            {saving ? 'Entering...' : step === STEPS.length - 1 ? 'Enter Pulse →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}