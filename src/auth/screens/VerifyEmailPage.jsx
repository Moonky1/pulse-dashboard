import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { supabase } from '../../utils/supabase.js'
import { AUTH_STATES, routeForAuthState } from '../authState.js'
import { getAuthRedirect } from '../authRedirects.js'
import { useAuth } from '../AuthProvider.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'
import { resendSignupVerification } from '../pulseAuthService.js'

const RESEND_COOLDOWN_SECONDS = 60

export function VerifyEmailPage() {
  const { authState, authUser } = useAuth()
  const location = useLocation()
  const email = location.state?.email || ''
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!cooldown) return undefined
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  if (![AUTH_STATES.LOADING, AUTH_STATES.ANONYMOUS].includes(authState)) return <Navigate to={routeForAuthState(authState)} replace />

  const resend = async () => {
    if (!email || sending || cooldown) return
    setSending(true)
    setNotice('')
    await resendSignupVerification(supabase, { email, emailRedirectTo: getAuthRedirect('verification') })
    setSending(false)
    setCooldown(RESEND_COOLDOWN_SECONDS)
    setNotice('If the address is eligible, a new verification email is on its way.')
  }

  return (
    <AuthShell eyebrow="Email verification" title="Check your inbox" description="We sent a secure verification link to the email address you provided.">
      <div className="auth-state-stack">
        <div className="auth-state-icon" aria-hidden="true">✦</div>
        <p>Open the link on this device or another trusted device. Pulse uses the verified Supabase session—not URL identity data—to continue.</p>
        {authUser?.email && <p className="auth-safe-detail">Signed in as {authUser.email}</p>}
        {notice && <AuthNotice tone="info">{notice}</AuthNotice>}
        {email ? <Button type="button" variant="secondary" loading={sending} disabled={cooldown > 0} onClick={resend}>{cooldown ? `Resend available in ${cooldown}s` : 'Resend verification email'}</Button> : <p className="auth-safe-detail">For security, resend is available only immediately after registration. Return to registration if your link expired.</p>}
        <Button type="button" variant="ghost" onClick={() => window.location.reload()}>I verified my email</Button>
        <Link className="auth-inline-link" to="/signin">Return to sign in</Link>
      </div>
    </AuthShell>
  )
}
