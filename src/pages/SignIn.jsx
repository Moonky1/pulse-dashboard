import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Register.css'

const SHEET_ID = '1d6j3FEPnFzE-fAl0K6O43apdbNvB0NzbLSJLEJF-TxI'

const TEAM_MAP = {
  Philippines: 'philippines',
  Venezuela: 'venezuela',
  Colombia: 'colombia',
  'Mexico Baja': 'mexico',
  'Central America': 'central',
  Asia: 'asia',
}

const ROLE_MAP = {
  Supervisor: 'supervisor',
  QA: 'qa',
  'Team Leader': 'leader',
}

export default function SignIn() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    if (!name.trim()) {
      setError('Enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1&t=${Date.now()}`
      const res = await fetch(url)
      const text = await res.text()

      const rows = text
        .trim()
        .split('\n')
        .slice(1)
        .map((row) => {
          const cols = row.split(',').map((c) => c.replace(/"/g, '').trim())
          return {
            name: cols[0],
            team: cols[1],
            role: cols[2],
          }
        })
        .filter((r) => r.name && r.name !== 'Name')

      const found = rows.find(
        (r) => r.name.toLowerCase() === name.trim().toLowerCase()
      )

      if (!found) {
        setError('Name not found. Check spelling or register first.')
        setLoading(false)
        return
      }

      const teamId =
        Object.entries(TEAM_MAP).find(
          ([k]) => k.toLowerCase() === (found.team || '').toLowerCase()
        )?.[1] || null

      const roleId =
        Object.entries(ROLE_MAP).find(
          ([k]) => k.toLowerCase() === (found.role || '').toLowerCase()
        )?.[1] || null

      localStorage.setItem(
        'pulse_user',
        JSON.stringify({
          name: found.name,
          team: teamId,
          role: roleId,
          registeredAt: Date.now(),
        })
      )

      window.location.href = '/dashboard'
    } catch (e) {
      console.error(e)
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay-page">
      <div className="auth-overlay-blur" onClick={() => navigate('/')} />

      <div className="reg-wrap auth-modal-wrap">
        <button
          type="button"
          className="auth-close"
          onClick={() => navigate('/')}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="reg-card auth-modal-card">
          <div className="reg-header">
            <div className="reg-logo">P</div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: '100%' }} />
            </div>
            <div className="reg-step">Sign In</div>
          </div>

          <div className="reg-body">
            <h2>Welcome back</h2>
            <p>Use the same name you registered with to continue.</p>

            <input
              className="reg-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSignIn()
              }}
              autoFocus
            />

            <div className="sheet-note">
              Your name must match exactly as you registered it.
            </div>
          </div>

          {error && <div className="reg-error">{error}</div>}

          <div className="reg-actions">
            <button
              type="button"
              className="btn-next"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Enter Pulse →'}
            </button>
          </div>

          <p className="auth-switch-text">
            New here?{' '}
            <span onClick={() => navigate('/register')}>Register instead</span>
          </p>
        </div>
      </div>
    </div>
  )
}