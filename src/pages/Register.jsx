import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import { validateToken } from '../utils/token'
import './Register.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMYoW8aLdaXUOOuRDkTgU38XTKJj5CMr0fiy7Z3AFCtasJKbzy0VLuc5RWcDC5OCZZ/exec'

const ROLES = [
  { id: 'supervisor', label: 'Supervisor', icon: '👔' },
  { id: 'qa',         label: 'QA',         icon: '🔍' },
  { id: 'leader',     label: 'Team Leader', icon: '🏆' },
]

const STEPS = ['name', 'role', 'team', 'token']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState({ name: '', role: null, team: null, token: '' })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  const update = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError('') }

  const saveToSheets = async (data) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch(e) {
      console.error('Sheets error:', e)
    }
  }

  const next = async () => {
    if (step === 0 && !form.name.trim()) return setError('Enter your name')
    if (step === 1 && !form.role)        return setError('Select your role')
    if (step === 2 && !form.team)        return setError('Select your team')
    if (step === 3) {
      if (!form.token.trim()) return setError('Enter the access token')
      if (!validateToken(form.token)) return setError('Invalid token — ask your admin for the current code')

      setSaving(true)
      const roleLabel = ROLES.find(r => r.id === form.role)?.label || form.role
      const teamLabel = APP_CONFIG.teams.find(t => t.id === form.team)?.name || form.team

      await saveToSheets({
        name: form.name,
        team: teamLabel,
        role: roleLabel,
      })

      localStorage.setItem('pulse_user', JSON.stringify({
        name: form.name,
        team: form.team,
        role: form.role,
        registeredAt: Date.now(),
      }))
      window.location.href = '/dashboard'
      return
    }
    setStep(s => s + 1)
  }

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="reg-wrap">
      <div className="reg-card">

        <div className="reg-header">
          <div className="reg-logo"><span>P</span></div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="reg-step">{step + 1} / {STEPS.length}</div>
        </div>

        {step === 0 && (
          <div className="reg-body">
            <h2>What's your name?</h2>
            <p>This is how you'll appear in the dashboard</p>
            <input
              className="reg-input"
              placeholder="Your name"
              value={form.name}
              onChange={e => update('name', e.target.value)}
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
                  className={`role-card ${form.role === r.id ? 'selected' : ''}`}
                  onClick={() => update('role', r.id)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-label">{r.label}</span>
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
                  className={`team-card ${form.team === t.id ? 'selected' : ''}`}
                  onClick={() => update('team', t.id)}
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
              value={form.token}
              onChange={e => update('token', e.target.value.replace(/\D/g, '').slice(0,6))}
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
            <button className="btn-back" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button className="btn-next" onClick={next} disabled={saving}>
            {saving ? 'Entering...' : step === STEPS.length - 1 ? 'Enter Pulse →' : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  )
}