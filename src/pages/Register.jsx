import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import { validateToken } from '../utils/token'
import './Register.css'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

const ROLES = [
  { id: 'supervisor', label: 'Supervisor', icon: '🧑‍💼' },
  { id: 'qa', label: 'QA', icon: '🔍' },
  { id: 'leader', label: 'Team Leader', icon: '🏆' },
]

const STEPS = ['name', 'role', 'team', 'token']

async function callScript(params, retries = 2) {
  const url = `${SCRIPT_URL}?${new URLSearchParams(params).toString()}&t=${Date.now()}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    })

    const data = await res.json()
    return data
  } catch (err) {
    if (retries > 0) {
      return callScript(params, retries - 1)
    }
    throw err
  }
}

export default function Register() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [role, setRole] = useState(null)
  const [team, setTeam] = useState(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem('pulse_user')
    if (existing) {
      window.location.href = '/dashboard'
    }
  }, [])

  const next = async () => {
    setError('')

    if (step === 0) {
      if (!name.trim()) {
        setError('Enter your name')
        return
      }
      setStep(1)
      return
    }

    if (step === 1) {
      if (!role) {
        setError('Select your role')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      if (!team) {
        setError('Select your team')
        return
      }
      setStep(3)
      return
    }

    if (step === 3) {
      if (!token.trim()) {
        setError('Enter the access token')
        return
      }

      if (!validateToken(token)) {
        setError('Invalid token — ask your admin for the current code')
        return
      }

      setSaving(true)

      try {
        const cleanName = name.trim()
        const roleLabel = ROLES.find((r) => r.id === role)?.label || role
        const teamLabel = APP_CONFIG.teams.find((t) => t.id === team)?.name || team

        const bannedCheck = await callScript({
          action: 'isBanned',
          name: cleanName,
        })

        if (bannedCheck?.banned) {
          setError('This user is blocked. Contact your admin.')
          setSaving(false)
          return
        }

        const registerRes = await callScript({
          action: 'register',
          name: cleanName,
          team: teamLabel,
          role: roleLabel,
        })

        if (!registerRes?.ok) {
          throw new Error(registerRes?.error || 'Could not save registration')
        }

        localStorage.setItem(
          'pulse_user',
          JSON.stringify({
            name: cleanName,
            team,
            role,
            registeredAt: Date.now(),
            rowIndex: registerRes.rowIndex || null,
            bookId: registerRes.bookId || null,
          })
        )

        localStorage.setItem(
          'pulse_intro',
          JSON.stringify({
            mode: 'register',
            name: cleanName,
            at: Date.now(),
          })
        )

        window.location.href = '/dashboard'
      } catch (e) {
        console.error('Register failed:', e)
        setError('Could not complete registration. Please try again.')
        setSaving(false)
      }
    }
  }

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <div className="auth-overlay-page">
      <div className="auth-overlay-blur" onClick={() => navigate('/')} />

      <div className="reg-wrap auth-modal-wrap">
        <button className="auth-close" onClick={() => navigate('/')}>
          ✕
        </button>

        <div className="reg-card auth-modal-card">
          <div className="reg-header">
            <div className="reg-logo">P</div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="reg-step">
              {step + 1} / {STEPS.length}
            </div>
          </div>

          {step === 0 && (
            <div className="reg-body">
              <h2>What's your name?</h2>
              <p>This is how you'll appear in the dashboard</p>

              <input
                className="reg-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                autoFocus
              />

              <div className="role-warning" style={{ marginTop: 12 }}>
                📝 <strong>Remember this name exactly.</strong> You'll use it to sign in later.
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="reg-body">
              <h2>Select your role</h2>
              <p>Choose your position in the team</p>

              <div className="role-warning">
                ⚠️ Your role <strong>cannot be changed</strong> later. Only an admin can modify it.
              </div>

              <div className="role-grid">
                {ROLES.map((r) => (
                  <div
                    key={r.id}
                    className={`role-card${role === r.id ? ' selected' : ''}`}
                    onClick={() => {
                      setRole(r.id)
                      setError('')
                    }}
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
              <p>Your team will be highlighted in the dashboard</p>

              <div className="team-grid">
                {APP_CONFIG.teams.map((t) => (
                  <div
                    key={t.id}
                    className={`team-card${team === t.id ? ' selected' : ''}`}
                    onClick={() => {
                      setTeam(t.id)
                      setError('')
                    }}
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

          {step === 3 && (
            <div className="reg-body">
              <h2>Access token</h2>
              <p>Enter the 6-digit code from your admin</p>

              <input
                className="reg-input token-input"
                placeholder="000000"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                maxLength={6}
                autoFocus
              />

              <div className="sheet-note">
                This code changes every 5 minutes. Contact your Team Leader if you do not have it.
              </div>
            </div>
          )}

          {error && <div className="reg-error">{error}</div>}

          <div className="reg-actions">
            {step > 0 && (
              <button
                className="btn-back"
                onClick={() => {
                  setStep((s) => s - 1)
                  setError('')
                }}
              >
                ← Back
              </button>
            )}

            <button className="btn-next" onClick={next} disabled={saving}>
              {saving ? 'Entering...' : step === STEPS.length - 1 ? 'Enter Pulse →' : 'Continue →'}
            </button>
          </div>

          {step === 0 && (
            <p className="auth-switch-text">
              Already registered?{' '}
              <span onClick={() => navigate('/signin')}>Sign in instead</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}