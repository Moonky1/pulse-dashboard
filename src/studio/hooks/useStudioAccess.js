import { useEffect, useState } from 'react'

import { useAuth } from '../../auth/AuthProvider.jsx'
import { loadOwnGlobalPermissionKeys } from '../../admin/api/adminApi.js'
import { supabase } from '../../utils/supabase.js'
import { resolveStudioAccess } from '../studioAccess.js'

export function useStudioAccess() {
  const { profile } = useAuth()
  const profileId = profile?.id ?? null
  const [result, setResult] = useState({ profileId: null, permissionKeys: [], loading: true, error: null })

  useEffect(() => {
    let current = true
    void loadOwnGlobalPermissionKeys(supabase, profileId).then(({ data, error }) => {
      if (current) setResult({ profileId, permissionKeys: data, loading: false, error })
    })
    return () => { current = false }
  }, [profileId])

  const currentResult = result.profileId === profileId
    ? result
    : { profileId, permissionKeys: [], loading: true, error: null }

  return { ...currentResult, state: resolveStudioAccess(currentResult) }
}
