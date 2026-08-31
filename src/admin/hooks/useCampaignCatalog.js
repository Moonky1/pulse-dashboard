import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { listManagedCampaigns } from '../api/adminApi.js'

export function useCampaignCatalog() {
  const [state, setState] = useState({ campaigns: [], loading: true, error: null })

  const apply = useCallback((result) => {
    setState({ campaigns: result.data, loading: false, error: result.error })
    return result
  }, [])

  const load = useCallback(() => listManagedCampaigns(supabase), [])
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    return apply(await load())
  }, [apply, load])

  useEffect(() => {
    let current = true
    void load().then((result) => { if (current) apply(result) })
    return () => { current = false }
  }, [apply, load])

  return { ...state, refresh }
}
