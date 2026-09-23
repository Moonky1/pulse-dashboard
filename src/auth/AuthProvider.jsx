import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { supabase } from '../utils/supabase.js'
import { acceptOwnStaffInvitation, createPendingProfile, getPendingProfileName, loadOwnProfile, refreshOwnGoogleAvatar, signInWithGoogle, signInWithPassword, signOutSession, signUpWithPassword } from './pulseAuthService.js'
import { deriveAuthState } from './authState.js'

const AuthContext = createContext(null)
const RECOVERY_MARKER = 'pulse_auth_recovery'

function recoveryStorage() {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage
}

export function AuthProvider({ children, client = supabase }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)
  const [invitationNotice, setInvitationNotice] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(() => recoveryStorage()?.getItem(RECOVERY_MARKER) === 'active')
  const requestId = useRef(0)
  const sessionKey = useRef(null)

  const resolveProfile = useCallback(async (nextSession, { allowCreate = true, force = false } = {}) => {
    const nextKey = nextSession?.access_token ?? 'anonymous'
    if (!force && sessionKey.current === nextKey) return null
    sessionKey.current = nextKey
    const currentRequest = ++requestId.current
    setSession(nextSession)
    setProfileError(null)
    setInvitationNotice(null)

    if (!nextSession?.user) {
      setProfile(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    let result = await loadOwnProfile(client, nextSession.user.id)
    const pendingProfileName = getPendingProfileName(nextSession.user)
    if (!result.data && !result.error && allowCreate && nextSession.user.email_confirmed_at && pendingProfileName) {
      const accepted = await acceptOwnStaffInvitation(client)
      if (accepted.data?.accepted || accepted.data?.status === 'reissue_required') {
        result = await loadOwnProfile(client, nextSession.user.id)
      } else {
        result = await createPendingProfile(client, pendingProfileName)
      }
      if (accepted.data?.status === 'reissue_required') {
        setInvitationNotice('This Staff invitation can no longer be accepted. Ask an authorized administrator to issue a new invitation.')
      }
    } else if (result.data?.status === 'pending_approval' && nextSession.user.email_confirmed_at) {
      const accepted = await acceptOwnStaffInvitation(client)
      if (accepted.data?.accepted) result = await loadOwnProfile(client, nextSession.user.id)
      else if (accepted.data?.status === 'reissue_required') {
        setInvitationNotice('This Staff invitation can no longer be accepted. Ask an authorized administrator to issue a new invitation.')
      }
    }
    if (result.data) {
      const avatarRefresh = await refreshOwnGoogleAvatar(client)
      if (!avatarRefresh.error) result = await loadOwnProfile(client, nextSession.user.id)
    }
    if (currentRequest !== requestId.current) return null

    setProfile(result.data ?? null)
    setProfileError(result.error ?? null)
    setLoading(false)
    return result.data ?? null
  }, [client])

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      const { data, error } = await client.auth.getSession()
      if (!active) return
      if (error) {
        setProfileError(error)
        setLoading(false)
        return
      }
      await resolveProfile(data.session)
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') {
        recoveryStorage()?.setItem(RECOVERY_MARKER, 'active')
        setRecoveryMode(true)
      }
      if (event === 'TOKEN_REFRESHED' && nextSession) {
        sessionKey.current = nextSession.access_token
        setSession(nextSession)
        return
      }
      void resolveProfile(nextSession)
    })
    void bootstrap()
    return () => {
      active = false
      requestId.current += 1
      subscription.unsubscribe()
    }
  }, [client, resolveProfile])

  const signIn = useCallback(async (credentials) => {
    setProfileError(null)
    setInvitationNotice(null)
    return signInWithPassword(client, credentials)
  }, [client])

  const signInGoogle = useCallback(async (options) => {
    setProfileError(null)
    setInvitationNotice(null)
    return signInWithGoogle(client, options)
  }, [client])

  const register = useCallback((registration) => signUpWithPassword(client, registration), [client])
  const signOut = useCallback(async () => {
    requestId.current += 1
    const result = await signOutSession(client)
    recoveryStorage()?.removeItem(RECOVERY_MARKER)
    setRecoveryMode(false)
    sessionKey.current = 'anonymous'
    setSession(null)
    setProfile(null)
    setProfileError(null)
    setInvitationNotice(null)
    setLoading(false)
    return result
  }, [client])
  const refreshProfile = useCallback(() => resolveProfile(session, { force: true }), [resolveProfile, session])
  const completeRecovery = useCallback(() => {
    recoveryStorage()?.removeItem(RECOVERY_MARKER)
    setRecoveryMode(false)
  }, [])
  const authState = deriveAuthState({ loading, session, profile, profileError })
  const value = useMemo(() => ({
    session,
    authUser: session?.user ?? null,
    profile,
    profileError,
    invitationNotice,
    loading,
    authState,
    isAuthenticated: Boolean(session?.user),
    recoveryMode,
    signIn,
    signInGoogle,
    register,
    signOut,
    refreshProfile,
    completeRecovery,
  }), [session, profile, profileError, invitationNotice, loading, authState, recoveryMode, signIn, signInGoogle, register, signOut, refreshProfile, completeRecovery])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
