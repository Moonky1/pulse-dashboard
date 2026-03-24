import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import { validateToken } from '../utils/token'
import './Register.css'

const STEPS = ['name', 'team', 'token']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState({ name: '', team: null, token: '' })
  const [error, setError] = useState('')

  const update = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError('') }

  const next = () => {
    if (step === 0 && !form.name.trim()) return setError('Enter your name')
    if (step === 1 && !form.team)        return setError('Select your team')
    if (step === 2) {
      if (!form.token.trim()) return setError('Enter the access token')
      if (!validateToken(form.token)) return setError('Invalid token — ask your admin for the current code')
      localStorage.setItem('pulse_user', JSON.stringify({
        name: form.name,
        team: form.team,
        registeredAt: Date.now()
      }))
      navigate('/dashboard')
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
            <h2>Select your team</h2>
            <p>This cannot be changed later</p>
            <div className="team-grid">
              {APP_CONFIG.teams.map(t => (
                <div
                  key={t.id}
                  className={`team-card ${form.team === t.id ? 'selected' : ''}`}
                  onClick={() => update('team', t.id)}
                >
                  <img
                    className="t-flag"
                    src={`https://flagcdn.com/w40/${t.code}.png`}
                    alt={t.name}
                  />
                  <div className="t-name">{t.name}</div>
                  <div className="t-count">{t.agents} agents</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
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
          <button className="btn-next" onClick={next}>
            {step === STEPS.length - 1 ? 'Enter Pulse →' : 'Continue →'}
          </button>
        </div>

      </div>
    </div>
  )
}