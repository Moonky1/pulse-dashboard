import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { Spinner } from '../../components/ui/Spinner.jsx'
import { supabase } from '../../utils/supabase.js'
import { AUTH_STATES, routeForAuthState } from '../authState.js'
import { useAuth } from '../AuthProvider.jsx'
import { exchangeAuthCode } from '../pulseAuthService.js'
import { Brand } from '../components/AuthShell.jsx'
import { AuthNotice } from '../components/AuthNotice.jsx'
import { AuthShell } from '../components/AuthShell.jsx'
import { discardStaffReturnPath, readStaffReturnPath } from '../staffOAuth.js'

function CallbackDestination({ authState }) {
  const [returnPath] = useState(() => readStaffReturnPath())

  useEffect(() => {
    discardStaffReturnPath()
  }, [])

  const destination = authState === AUTH_STATES.ACTIVE && returnPath ? returnPath : routeForAuthState(authState)
  return <Navigate to={destination} replace />
}

export function AuthCallbackPage() {
  const { authState, recoveryMode } = useAuth()
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const googleFlow = params.get('flow') === 'google'
  const [callbackError, setCallbackError] = useState(() => {
    const providerError = params.has('error') || params.has('error_code')
    const hasAuthPayload = params.has('code') || window.location.hash.includes('access_token=')
    return providerError || (googleFlow && !hasAuthPayload)
  })
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true
    const code = params.get('code')
    if (params.has('error') || params.has('error_code')) {
      discardStaffReturnPath()
      return
    }
    if (code) {
      void exchangeAuthCode(supabase, code).then(({ error }) => {
        if (error) discardStaffReturnPath()
        setCallbackError(Boolean(error))
      })
    }
  }, [params])

  if (callbackError) return <AuthShell eyebrow={googleFlow ? 'Staff sign in' : 'Authentication link'} title={googleFlow ? 'Google sign-in was not completed' : 'This link is invalid or expired'} description="Pulse could not establish a trusted Auth session."><div className="auth-state-stack"><AuthNotice>{googleFlow ? 'You can safely return and try again.' : 'Request a new verification or recovery email and try again.'}</AuthNotice>{googleFlow && <Link className="auth-inline-link" to="/signin">Back to Staff Sign In</Link>}</div></AuthShell>
  if (recoveryMode) return <Navigate to="/auth/reset-password" replace />
  if (![AUTH_STATES.LOADING, AUTH_STATES.ANONYMOUS].includes(authState)) return <CallbackDestination authState={authState} />

  return <main className="auth-loading-page"><Brand compact /><Spinner size="lg" label="Completing secure authentication" /><p>Completing secure authentication…</p></main>
}
