import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { supabase } from '../../utils/supabase.js'
import { getAuthRedirect } from '../authRedirects.js'
import { STAFF_SIGN_IN_PATH } from '../authRoutes.js'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'
import { isEmailFormatValid, requestPasswordRecovery } from '../pulseAuthService.js'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!isEmailFormatValid(email)) return setError('Enter a valid email address.')
    setSubmitting(true)
    setError('')
    await requestPasswordRecovery(supabase, { email, redirectTo: getAuthRedirect('recovery') })
    setSubmitting(false)
    setSent(true)
  }

  return (
    <AuthShell eyebrow="Staff account recovery" title="Reset your password" description="Enter your verified company email and we’ll send recovery instructions." footer={<Link to={STAFF_SIGN_IN_PATH}>Return to Staff sign in</Link>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <Input id="recovery-email" label="Email address" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={error} required />
        {sent && <AuthNotice tone="info">If the address is eligible, password recovery instructions are on their way.</AuthNotice>}
        <Button type="submit" size="lg" loading={submitting} disabled={sent}>Send recovery email</Button>
      </form>
    </AuthShell>
  )
}
