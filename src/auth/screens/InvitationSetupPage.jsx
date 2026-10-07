import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { useAuth } from '../AuthProvider.jsx'
import { AUTH_STATES, routeForAuthState } from '../authState.js'
import { getAuthRedirect } from '../authRedirects.js'
import { AuthShell } from '../components/AuthShell.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { PasswordInput } from '../components/PasswordInput.jsx'
import { acceptOwnStaffInvitation, updateAccountPassword, validatePasswordUpdate } from '../pulseAuthService.js'
import { clearInvitationGoogle, hasVerifiedGoogleIdentity, readInvitationGoogle, rememberInvitationGoogle } from '../invitationSetup.js'

export function InvitationSetupPage() {
  const { authState, authUser, invitationSetup: setup, refreshProfile, signInGoogle, signOut } = useAuth()
  const [googleReturn] = useState(() => readInvitationGoogle())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const wrongGoogleAccount = googleReturn && authUser && googleReturn.authUserId !== authUser.id

  async function accept() {
    const result = await acceptOwnStaffInvitation(supabase)
    if (result.error || !result.data?.accepted) throw new Error('acceptance_unavailable')
    clearInvitationGoogle()
    setAccepted(true)
    await refreshProfile()
  }
  async function submit(event) {
    event.preventDefault()
    if (busy || setup?.status !== 'ready') return
    const validation = validatePasswordUpdate({ password, confirmPassword })
    setErrors(validation)
    if (Object.keys(validation).length) return
    setBusy(true); setError('')
    try {
      const result = await updateAccountPassword(supabase, password)
      if (result.error) throw new Error('password_unavailable')
      await accept()
    } catch {
      setError('Your invitation could not be completed. Try again, or ask an administrator to reissue it. No extra access was granted.')
    } finally { setPassword(''); setConfirmPassword(''); setBusy(false) }
  }
  async function google() {
    if (busy || setup?.status !== 'ready') return
    setBusy(true); setError('')
    try {
      rememberInvitationGoogle(setup, authUser)
      const result = await signInGoogle({ redirectTo: getAuthRedirect('google') })
      if (result.error) throw new Error('google_unavailable')
    } catch { clearInvitationGoogle(); setError('Google could not be started. Please try again.'); setBusy(false) }
  }
  async function acceptGoogle() {
    if (busy || setup?.status !== 'ready' || !hasVerifiedGoogleIdentity(authUser)) return
    setBusy(true); setError('')
    try { await accept() } catch { setError('Your invitation could not be completed. Ask an administrator to check or reissue it.') } finally { setBusy(false) }
  }
  async function leave() {
    clearInvitationGoogle()
    await signOut()
  }
  if (authState === AUTH_STATES.LOADING) return <AuthShell title="Checking your invitation" description="Verifying your account securely…" />
  if (wrongGoogleAccount) return <AuthShell title="Use the invited Google account" description="This Google account does not match the account that opened your invitation."><AuthNotice>No invitation access was granted to this account. Sign out and reopen your invitation email.</AuthNotice><Button type="button" onClick={leave}>Sign out</Button></AuthShell>
  if (authState !== AUTH_STATES.INVITED) return <Navigate to={routeForAuthState(authState) || '/signin'} replace state={accepted ? { invitationAccepted: true } : undefined} />
  if (setup.status !== 'ready') return <AuthShell eyebrow="Staff invitation" title="Request a new invitation" description={setup.email}><AuthNotice>This invitation is expired, revoked or no longer available. Ask an administrator to reissue it.</AuthNotice><Button type="button" variant="secondary" onClick={leave}>Sign out</Button></AuthShell>
  return <AuthShell eyebrow="You're invited" title={`Welcome, ${setup.name}`} description="Choose how you want to sign in to Pulse." footer={<button type="button" className="auth-text-button" onClick={leave}>Use another account</button>}>
    <form className="auth-form" onSubmit={submit} noValidate>
      <AuthNotice tone="info">Verified email: {setup.email}. Use this same email with Google or your password.</AuthNotice>
      {hasVerifiedGoogleIdentity(authUser) && googleReturn?.id === setup.id
        ? <Button type="button" size="lg" loading={busy} onClick={acceptGoogle}>Accept invitation with Google</Button>
        : <Button type="button" size="lg" variant="secondary" loading={busy} onClick={google}><span className="auth-google-mark" aria-hidden="true">G</span> Continue with Google</Button>}
      <div className="auth-option-divider" role="separator"><span>or create an email password</span></div>
      <PasswordInput id="invitation-password" label="Create password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} error={errors.password} hint="Use at least 8 characters." required />
      <PasswordInput id="invitation-confirm" label="Confirm password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} error={errors.confirmPassword} required />
      {error && <AuthNotice>{error}</AuthNotice>}
      <Button type="submit" size="lg" loading={busy}>Create password and accept invitation</Button>
      <Link className="auth-inline-link" to="/privacy">Your privacy in Pulse</Link>
    </form>
  </AuthShell>
}
