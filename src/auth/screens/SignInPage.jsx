import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { isEmailFormatValid } from '../pulseAuthService.js'
import { STAFF_FORGOT_PASSWORD_PATH, STAFF_REGISTER_PATH } from '../authRoutes.js'
import { useAuth } from '../AuthProvider.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'
import { PasswordInput } from '../components/PasswordInput.jsx'
import { getAuthRedirect } from '../authRedirects.js'
import { rememberStaffReturnPath } from '../staffOAuth.js'

export function SignInPage() {
  const { signIn, signInGoogle } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  const continueWithGoogle = async () => {
    setGoogleSubmitting(true)
    setError('')
    rememberStaffReturnPath(location.state?.from)
    const { error: authError } = await signInGoogle({ redirectTo: getAuthRedirect('google') })
    if (authError) {
      setError('Google sign-in could not be started. Please try again.')
      setGoogleSubmitting(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!isEmailFormatValid(email)) return setError('Enter a valid email address.')
    if (!password) return setError('Enter your password.')
    setSubmitting(true)
    setError('')
    const { error: authError } = await signIn({ email, password })
    setPassword('')
    if (authError) {
      setError('We could not sign you in. Check your details and try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthShell eyebrow="Welcome back" title="Sign in to Pulse" footer={<><span>New to Pulse?</span> <Link to={STAFF_REGISTER_PATH}>Create an account</Link></>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        {location.state?.passwordUpdated && <AuthNotice tone="info">Your password was updated. Sign in with your new password.</AuthNotice>}
        <Button className="auth-trace-action" type="button" size="lg" variant="secondary" loading={googleSubmitting} disabled={submitting} onClick={continueWithGoogle}>
          <span className="auth-google-mark" aria-hidden="true">G</span>
          Continue with Google
        </Button>
        <div className="auth-option-divider" role="separator"><span>or use Corporate Email</span></div>
        <Input id="signin-email" label="Email address" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required />
        <PasswordInput id="signin-password" label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <div className="auth-form-meta auth-form-meta--end"><Link className="auth-text-button" to={STAFF_FORGOT_PASSWORD_PATH}>Forgot password?</Link></div>
        {error && <AuthNotice>{error}</AuthNotice>}
        <Button className="auth-trace-action" type="submit" size="lg" loading={submitting} disabled={googleSubmitting}>Sign in</Button>
      </form>
    </AuthShell>
  )
}
