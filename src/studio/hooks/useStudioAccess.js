import { useEffect, useState } from 'react'

import { useAuth } from '../../auth/AuthProvider.jsx'
import { getStudioCapabilities } from '../../training/trainingApi.js'
import { supabase } from '../../utils/supabase.js'

export function useStudioAccess() {
  const { profile } = useAuth()
  const profileId = profile?.id ?? null
  const [result, setResult] = useState({ profileId: null, capabilities: null, loading: true, error: null })

  useEffect(() => {
    let current = true
    void getStudioCapabilities(supabase).then(({ data, error }) => {
      if (current) setResult({ profileId, capabilities: data, loading: false, error })
    })
    return () => { current = false }
  }, [profileId])

  const currentResult = result.profileId === profileId
    ? result
    : { profileId, capabilities: null, loading: true, error: null }

  return { ...currentResult, state: currentResult.loading ? 'loading' : currentResult.error ? 'error' : currentResult.capabilities?.can_view_studio ? 'allowed' : 'denied' }
}
