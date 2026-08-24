import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider.jsx'
import { createCompatibilityProfile } from '../auth/compatibilityProfile.js'
import { supabase } from '../utils/supabase.js'
import './Register.css'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { loading, isAuthenticated, authUser } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [passwordSet, setPasswordSet] = useState(false)
  const [error, setError] = useState('')

  const linkProfile = async () => {
    const { data, error: linkError } = await supabase.functions.invoke('pulse-link-current-user', { body: {} })
    if (linkError || !data?.ok || !data.profile) throw new Error('PROFILE_LINK_FAILED')
    localStorage.setItem('pulse_user', JSON.stringify(createCompatibilityProfile(data.profile)))
    navigate('/dashboard', { replace: true })
  }

  const callbackError = useMemo(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    return hash.get('error_code') || hash.get('error')
      ? 'This invitation is invalid or has expired.'
      : ''
  }, [])

  const setAccountPassword = async (event) => {
    event.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setPassword('')
    setConfirmation('')

    if (updateError) {
      setError(updateError.message || 'Could not set your password.')
      setSubmitting(false)
      return
    }

    setPasswordSet(true)
    try {
      await linkProfile()
    } catch {
      setError('Your password was saved, but Pulse could not link your profile. Retry or contact an administrator.')
      setSubmitting(false)
    }
  }

  const invalidSession = !loading && !isAuthenticated

  return (
    <div className="auth-overlay-page">
      <div className="reg-wrap auth-modal-wrap">
        <div className="reg-card auth-modal-card">
          <div className="reg-header">
            <div className="reg-logo">P</div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: passwordSet ? '100%' : '70%' }} />
            </div>
            <div className="reg-step">Account setup</div>
          </div>

          <div className="reg-body">
            <h2>{passwordSet ? 'Password saved' : 'Welcome to Pulse'}</h2>
            {loading && <p>Checking your secure invitation…</p>}
            {(callbackError || invalidSession) && (
              <p>
                {callbackError ||
                  'No valid invitation session was found. Request a new invitation or open the link again.'}
              </p>
            )}

            {!loading && isAuthenticated && !passwordSet && (
              <form onSubmit={setAccountPassword}>
                <p>Set a password for {authUser?.email || 'your verified account'}.</p>
                <input
                  className="reg-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <input
                  className="reg-input"
                  style={{ marginTop: 10 }}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                {error && <div className="reg-error">{error}</div>}
                <div className="reg-actions">
                  <button className="btn-next" type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Set password'}
                  </button>
                </div>
              </form>
            )}

            {passwordSet && <><p>Your password is secure. Finish linking your verified Pulse profile.</p>
              {error && <div className="reg-error">{error}</div>}
              <div className="reg-actions"><button className="btn-next" type="button" disabled={submitting} onClick={async () => { setSubmitting(true); setError(''); try { await linkProfile() } catch { setError('Pulse could not link your profile. Contact an administrator.'); setSubmitting(false) } }}>Retry profile link</button></div></>}
          </div>
        </div>
      </div>
    </div>
  )
}
