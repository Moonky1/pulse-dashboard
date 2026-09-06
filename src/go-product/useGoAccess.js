import { useEffect, useState } from 'react'

import { useAuth } from '../auth/AuthProvider.jsx'
import { getGoCapabilities } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { resolveGoAccess } from './goAccess.js'

export function useGoAccess() {
  const { profile } = useAuth()
  const profileId = profile?.id ?? null
  const [result, setResult] = useState({ profileId: null, capabilities: null, loading: true, error: null })

  useEffect(() => {
    let current = true
    void getGoCapabilities(supabase).then(({ data, error }) => {
      if (current) setResult({ profileId, capabilities: data, loading: false, error })
    })
    return () => { current = false }
  }, [profileId])

  const current = result.profileId === profileId
    ? result
    : { profileId, capabilities: null, loading: true, error: null }
  return { ...current, state: resolveGoAccess(current) }
}
