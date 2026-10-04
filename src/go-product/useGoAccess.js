import { useEffect, useState } from 'react'

import { useAuth } from '../auth/AuthProvider.jsx'
import { getGoCapabilities } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { resolveGoAccess } from './goAccess.js'
import { useGoIdentity } from './useGoIdentity.js'

export function useGoAccess() {
  const { profile } = useAuth()
  const identity = useGoIdentity()
  const profileId = profile?.id ?? null
  const [result, setResult] = useState({ profileId: null, capabilities: null, loading: true, error: null })

  useEffect(() => {
    if (identity.kind !== 'staff') return undefined
    let current = true
    void getGoCapabilities(supabase).then(({ data, error }) => {
      if (current) setResult({ profileId, capabilities: data, loading: false, error })
    })
    return () => { current = false }
  }, [profileId, identity.kind])

  if (identity.kind === 'agent') return { capabilities: { can_practice: true, can_host: false }, loading: false, error: null, state: 'allowed' }
  if (identity.kind === 'anonymous') return { capabilities: null, loading: false, error: null, state: 'anonymous' }
  if (identity.loading) return { capabilities: null, loading: true, error: null, state: 'loading' }

  const current = result.profileId === profileId
    ? result
    : { profileId, capabilities: null, loading: true, error: null }
  return { ...current, state: resolveGoAccess(current) }
}
