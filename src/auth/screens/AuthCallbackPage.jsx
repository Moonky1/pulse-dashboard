import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Spinner } from '../../components/ui/Spinner.jsx'
import { supabase } from '../../utils/supabase.js'
import { AUTH_STATES, routeForAuthState } from '../authState.js'
import { useAuth } from '../AuthProvider.jsx'
import { exchangeAuthCode } from '../pulseAuthService.js'
import { Brand } from '../components/AuthShell.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'

export function AuthCallbackPage() {
  const { authState, recoveryMode } = useAuth()
  const [callbackError, setCallbackError] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.has('error') || params.has('error_code')
  })
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (params.has('error') || params.has('error_code')) return
    if (code) {
      void exchangeAuthCode(supabase, code).then(({ error }) => setCallbackError(Boolean(error)))
    }
  }, [])

  if (callbackError) return <AuthShell eyebrow="Authentication link" title="This link is invalid or expired" description="Pulse could not establish a trusted Auth session."><div className="auth-state-stack"><AuthNotice>Request a new verification or recovery email and try again.</AuthNotice></div></AuthShell>
  if (recoveryMode) return <Navigate to="/auth/reset-password" replace />
  if (![AUTH_STATES.LOADING, AUTH_STATES.ANONYMOUS].includes(authState)) return <Navigate to={routeForAuthState(authState)} replace />

  return <main className="auth-loading-page"><Brand compact /><Spinner size="lg" label="Completing secure authentication" /><p>Completing secure authentication…</p></main>
}
