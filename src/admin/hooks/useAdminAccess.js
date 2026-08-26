import { useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { useAuth } from '../../auth/AuthProvider.jsx'
import { loadOwnGlobalPermissionKeys } from '../api/adminApi.js'
import { resolveAdminAccess } from '../access.js'

export function useAdminAccess() {
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

  return {
    ...currentResult,
    state: resolveAdminAccess(currentResult),
  }
}
