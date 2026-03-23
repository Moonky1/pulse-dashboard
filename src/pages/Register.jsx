import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './register.css'

const STEPS = ['name', 'team', 'role', 'sheet']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState({ name: '', team: null, role: null, sheetUrl: '' })
  const [error, setError] = useState('')

  const update = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError('') }

  const next = () => {
    if (step === 0 && !form.name.trim()) return setError('Enter your name')
    if (step === 1 && !form.team)        return setError('Select your team')
    if (step === 2 && !form.role)        return setError('Select your role')
    if (step === 3) {
      if (!form.sheetUrl.trim()) return setError('Paste your Google Sheet URL')
      localStorage.setItem('pulse_user', JSON.stringify({ ...form, registeredAt: Date.now() }))
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
            <h2>Your role</h2>
            <p>Select your position in the team</p>
            <div className="role-list">
              {APP_CONFIG.roles.map(r => (
                <div
                  key={r}
                  className={`role-card ${form.role === r ? 'selected' : ''}`}
                  onClick={() => update('role', r)}
                >
                  <span className="role-icon">
                    {r === 'Supervisor' ? '👑' : r === 'QA' ? '✅' : '🎯'}
                  </span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="reg-body">
            <h2>Connect your Sheet</h2>
            <p>Paste the Google Sheets URL where your team data lives</p>
            <input
              className="reg-input"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={form.sheetUrl}
              onChange={e => update('sheetUrl', e.target.value)}
              autoFocus
            />
            <div className="sheet-note">
              Make sure the sheet is set to "Anyone with the link can view"
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