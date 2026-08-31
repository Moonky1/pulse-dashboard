import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { useAuth } from '../AuthProvider.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'
import { PasswordInput } from '../components/PasswordInput.jsx'
import { validateRegistration } from '../pulseAuthService.js'
import { getAuthRedirect } from '../authRedirects.js'
import { STAFF_SIGN_IN_PATH } from '../authRoutes.js'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = validateRegistration(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    setSubmitError('')
    const submittedEmail = form.email.trim().toLowerCase()
    const { data, error } = await register({ ...form, emailRedirectTo: getAuthRedirect('verification') })
    setForm((current) => ({ ...current, password: '', confirmPassword: '' }))
    if (error) {
      setSubmitError('We could not create your account. Review your details or contact support.')
      setSubmitting(false)
      return
    }
    navigate('/auth/verify', { replace: true, state: { submitted: true, hasSession: Boolean(data.session), email: submittedEmail } })
  }

  return (
    <AuthShell eyebrow="Staff access request" title="Create your Pulse account" description="Your access will be reviewed by an authorized company administrator." footer={<><span>Already registered?</span> <Link to={STAFF_SIGN_IN_PATH}>Sign in</Link></>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <Input id="register-name" label="Full name" autoComplete="name" value={form.fullName} onChange={update('fullName')} error={errors.fullName} required />
        <Input id="register-email" label="Email address" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} required />
        <PasswordInput id="register-password" label="Password" autoComplete="new-password" hint="Use at least 8 characters." value={form.password} onChange={update('password')} error={errors.password} required />
        <PasswordInput id="register-confirm" label="Confirm password" autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} required />
        {submitError && <AuthNotice>{submitError}</AuthNotice>}
        <Button type="submit" size="lg" loading={submitting}>Create account</Button>
        <p className="auth-consent">Creating an account does not grant access. Company approval is required.</p>
      </form>
    </AuthShell>
  )
}
