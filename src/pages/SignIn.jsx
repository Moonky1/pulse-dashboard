import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Register.css'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

const TEAM_MAP = {
  Philippines: 'philippines',
  Venezuela: 'venezuela',
  Colombia: 'colombia',
  'Mexico Baja': 'mexico',
  'Mexico BJ': 'mexico',
  'Central America': 'central',
  Asia: 'asia',
}

const ROLE_MAP = {
  Supervisor: 'supervisor',
  QA: 'qa',
  'Team Leader': 'leader',
}

async function callScript(params) {
  const url = `${SCRIPT_URL}?${new URLSearchParams(params).toString()}&t=${Date.now()}`
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  })
  return res.json()
}

function AuthWelcome({ mode, name }) {
  if (!name) return null

  return (
    <div className="auth-welcome-overlay">
      <div className="auth-welcome-bg" />
      <div className="auth-welcome-card">
        <div className="auth-welcome-glow" />
        <div className="auth-welcome-logo">P</div>
        <div className="auth-welcome-kicker">
          {mode === 'register' ? 'Welcome' : 'Welcome back'}
        </div>
        <div className="auth-welcome-name">{name}</div>
        <div className="auth-welcome-sub">Opening Pulse...</div>
      </div>
    </div>
  )
}

export default function SignIn({ embedded = false, onClose, onSwitchMode }) {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')

  const close = () => {
    if (embedded) {
      onClose?.()
      return
    }

    navigate('/')
  }

  const switchToRegister = () => {
    if (embedded) {
      onSwitchMode?.()
      return
    }

    navigate('/register')
  }

  const goDashboard = () => {
    window.location.href = '/dashboard'
  }

  const handleSignIn = async () => {
    if (!name.trim()) {
      setError('Enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await callScript({
        action: 'findUser',
        name: name.trim(),
      })

      if (data?.banned) {
        setError('This user is blocked. Contact your admin.')
        setLoading(false)
        return
      }

      if (!data?.ok || !data?.found || !data?.user) {
        setError('Name not found. Check spelling or register first.')
        setLoading(false)
        return
      }

      const found = data.user

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
          rowIndex: found.rowIndex || null,
          bookId: found.bookId || null,
        })
      )

      localStorage.setItem(
        'pulse_intro',
        JSON.stringify({
          mode: 'signin',
          name: found.name,
          at: Date.now(),
        })
      )

      setWelcomeName(found.name)

      window.setTimeout(() => {
        goDashboard()
      }, 2450)
    } catch (e) {
      console.error(e)
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  const card = (
    <>
      <AuthWelcome mode="signin" name={welcomeName} />

      <button
        type="button"
        className="auth-close"
        onClick={close}
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
          <div className="reg-step">Login</div>
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
            disabled={loading || Boolean(welcomeName)}
          >
            {loading ? 'Checking...' : 'Enter Pulse →'}
          </button>
        </div>

        <p className="auth-switch-text">
          New here?{' '}
          <span onClick={switchToRegister}>Register instead</span>
        </p>
      </div>
    </>
  )

  if (embedded) {
    return <div className="reg-wrap auth-modal-wrap auth-embedded-wrap">{card}</div>
  }

  return (
    <div className="auth-overlay-page">
      <div className="auth-overlay-blur" onClick={close} />
      <div className="reg-wrap auth-modal-wrap">{card}</div>
    </div>
  )
}