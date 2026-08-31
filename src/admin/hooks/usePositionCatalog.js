import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { listManagedPositions } from '../api/adminApi.js'

export function usePositionCatalog() {
  const [state, setState] = useState({ positions: [], loading: true, error: null })

  const apply = useCallback((result) => {
    setState({ positions: result.data, loading: false, error: result.error })
    return result
  }, [])

  const load = useCallback(() => listManagedPositions(supabase), [])
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
