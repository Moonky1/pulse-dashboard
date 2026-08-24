import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../utils/supabase.js'

const AuthContext = createContext(null)

function legacyUserExists() {
  return typeof window !== 'undefined' && localStorage.getItem('pulse_user') !== null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasLegacyUser, setHasLegacyUser] = useState(legacyUserExists)

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return

      setSession(nextSession)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!active) return

      setSession(initialSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      if (session) {
        return await supabase.auth.signOut()
      }

      return { error: null }
    } finally {
      localStorage.removeItem('pulse_user')
      localStorage.removeItem('pulse_return_after_auth')
      setHasLegacyUser(false)
    }
  }, [session])
  const authUser = session?.user ?? null
  const isAuthenticated = Boolean(session && authUser)
  const authenticationState = isAuthenticated
    ? 'authenticated'
    : hasLegacyUser
      ? 'legacy'
      : 'anonymous'

  const value = useMemo(
    () => ({
      session,
      authUser,
      loading,
      isAuthenticated,
      hasLegacyUser,
      authenticationState,
      signOut,
    }),
    [
      session,
      authUser,
      loading,
      isAuthenticated,
      hasLegacyUser,
      authenticationState,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
