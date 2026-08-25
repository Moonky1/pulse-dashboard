import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { supabase } from '../../utils/supabase.js'
import { useAuth } from '../AuthProvider.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'
import { PasswordInput } from '../components/PasswordInput.jsx'
import { updateAccountPassword, validatePasswordUpdate } from '../pulseAuthService.js'

export function ResetPasswordPage() {
  const { loading, isAuthenticated, recoveryMode, completeRecovery, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <main className="auth-loading-page"><Spinner size="lg" label="Checking recovery session" /><p>Checking recovery session…</p></main>

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validatePasswordUpdate({ password, confirmPassword })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    setSubmitError('')
    const { error } = await updateAccountPassword(supabase, password)
    setPassword('')
    setConfirmPassword('')
    if (error) {
      setSubmitError('We could not update your password. Request a new recovery email and try again.')
      setSubmitting(false)
      return
    }
    completeRecovery()
    await signOut()
    navigate('/signin', { replace: true, state: { passwordUpdated: true } })
  }

  if (!isAuthenticated || !recoveryMode) {
    return <AuthShell eyebrow="Recovery link" title="This recovery session is invalid or expired" description="Request a new recovery email to continue safely."><div className="auth-state-stack"><AuthNotice>Pulse could not verify an active recovery session.</AuthNotice><Link className="auth-inline-link" to="/forgot-password">Request a new recovery email</Link></div></AuthShell>
  }

  return (
    <AuthShell eyebrow="Secure recovery" title="Choose a new password" description="Your recovery session is verified. Set a new password to continue.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <PasswordInput id="reset-password" label="New password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} hint="Use at least 8 characters." required />
        <PasswordInput id="reset-confirm" label="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={errors.confirmPassword} required />
        {submitError && <AuthNotice>{submitError}</AuthNotice>}
        <Button type="submit" size="lg" loading={submitting}>Update password</Button>
      </form>
    </AuthShell>
  )
}
