import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'
import {
  isExpectedCorporateEmail,
  normalizeCorporateEmail,
  ROLE_MAP,
  safeReturnPath,
  TEAM_MAP,
} from '../auth/compatibilityProfile.js'
import { supabase } from '../utils/supabase.js'
import { authenticateLinkedStaff, loadLinkedStaffProfile } from '../auth/staffAuthFlow.js'
import './Register.css'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

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
  const { loading: authLoading, isAuthenticated } = useAuth()

  const [loginMode, setLoginMode] = useState('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')

  const close = () => {
    localStorage.removeItem('pulse_return_after_auth')
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
    const returnPath = safeReturnPath(localStorage.getItem('pulse_return_after_auth'))
    localStorage.removeItem('pulse_return_after_auth')
    window.location.href = returnPath
  }

  const hydrateLinkedProfile = async () => {
    const compatibilityProfile = await loadLinkedStaffProfile(supabase)
    localStorage.setItem('pulse_user', JSON.stringify(compatibilityProfile))
    localStorage.setItem('pulse_intro', JSON.stringify({
      mode: 'signin', name: compatibilityProfile.name, at: Date.now(),
    }))
    setWelcomeName(compatibilityProfile.name)
    window.setTimeout(goDashboard, 2450)
  }

  const handleExistingSession = async () => {
    setLoading(true)
    setError('')
    try {
      await hydrateLinkedProfile()
    } catch {
      localStorage.removeItem('pulse_user')
      await supabase.auth.signOut()
      setError('This Auth account is not linked to an active Pulse staff profile.')
      setLoading(false)
    }
  }

  const handleAuthSignIn = async () => {
    const normalizedEmail = normalizeCorporateEmail(email)
    if (!isExpectedCorporateEmail(normalizedEmail)) {
      setError('Enter your Kampaign Kings corporate email.')
      return
    }
    if (!password) {
      setError('Enter your password.')
      return
    }
    setLoading(true)
    setError('')
    const result = await authenticateLinkedStaff(supabase, normalizedEmail, password)
    setPassword('')
    if (!result.ok) {
      localStorage.removeItem('pulse_user')
      setError(result.code === 'INVALID_CREDENTIALS'
        ? 'Invalid email or password.'
        : 'Your Auth account is not linked to an active Pulse staff profile.')
      setLoading(false)
      return
    }
    try {
      const compatibilityProfile = result.profile
      localStorage.setItem('pulse_user', JSON.stringify(compatibilityProfile))
      localStorage.setItem('pulse_intro', JSON.stringify({
        mode: 'signin', name: compatibilityProfile.name, at: Date.now(),
      }))
      setWelcomeName(compatibilityProfile.name)
      window.setTimeout(goDashboard, 2450)
    } catch {
      setError('Invalid email or password.')
      setLoading(false)
    }
  }

  const handleLegacySignIn = async () => {
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
          <p>{isAuthenticated ? 'A verified Supabase session is active. Continue to restore your Pulse profile.' : loginMode === 'auth' ? 'Sign in with your corporate account.' : 'Temporary access for staff not migrated yet.'}</p>
          {!isAuthenticated && <div className="auth-path-switch">
            <button type="button" className={loginMode === 'auth' ? 'active' : ''} onClick={() => { setLoginMode('auth'); setError('') }}>Corporate email</button>
            <button type="button" className={loginMode === 'legacy' ? 'active' : ''} onClick={() => { setLoginMode('legacy'); setError('') }}>Legacy name</button>
          </div>}

          {!isAuthenticated && (loginMode === 'auth' ? <>
            <input className="reg-input" type="email" autoComplete="email" placeholder="name@kampaignkings.com" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoFocus />
            <input className="reg-input" style={{ marginTop: 10 }} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleAuthSignIn() }} />
            <div className="sheet-note">Access is granted only through your verified Pulse staff mapping.</div>
          </> : <>
            <input className="reg-input" placeholder="Your name" value={name} onChange={(e) => { setName(e.target.value); setError('') }} onKeyDown={(e) => { if (e.key === 'Enter') handleLegacySignIn() }} autoFocus />
            <div className="sheet-note">Legacy access remains available while staff migration continues.</div>
          </>)}
        </div>

        {error && <div className="reg-error">{error}</div>}

        <div className="reg-actions">
          <button
            type="button"
            className="btn-next"
            onClick={isAuthenticated ? handleExistingSession : loginMode === 'auth' ? handleAuthSignIn : handleLegacySignIn}
            disabled={loading || authLoading || Boolean(welcomeName)}
          >
            {loading || authLoading ? 'Checking...' : isAuthenticated ? 'Continue with verified session →' : loginMode === 'auth' ? 'Sign in securely →' : 'Enter with legacy access →'}
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
