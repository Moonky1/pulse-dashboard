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

export function SignInPage() {
  const { signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    <AuthShell eyebrow="Staff access" title="Sign in to Pulse" description="Use your verified company account." footer={<><span>New to Pulse Staff?</span> <Link to={STAFF_REGISTER_PATH}>Request an account</Link></>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        {location.state?.passwordUpdated && <AuthNotice tone="info">Your password was updated. Sign in with your new password.</AuthNotice>}
        <Input id="signin-email" label="Email address" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required />
        <PasswordInput id="signin-password" label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <div className="auth-form-meta"><span>Secure company access</span><Link className="auth-text-button" to={STAFF_FORGOT_PASSWORD_PATH}>Forgot password?</Link></div>
        {error && <AuthNotice>{error}</AuthNotice>}
        <Button type="submit" size="lg" loading={submitting}>Sign in</Button>
        <p className="auth-helper">Google sign-in is available from the Staff access chooser when the supported OAuth flow is ready.</p>
      </form>
    </AuthShell>
  )
}
