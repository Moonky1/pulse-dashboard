import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { loadBusinessCatalog } from '../api/adminApi.js'

const EMPTY_CATALOG = Object.freeze({
  version: null,
  businessAreas: [],
  departments: [],
  campaigns: [],
  operatingUnits: [],
  teams: [],
  positions: [],
})

export function useBusinessCatalog() {
  const [state, setState] = useState({ catalog: EMPTY_CATALOG, loading: true, error: null })
  const load = useCallback(() => loadBusinessCatalog(supabase), [])
  const apply = useCallback((result) => {
    setState({ catalog: result.data ?? EMPTY_CATALOG, loading: false, error: result.error })
    return result
  }, [])
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
