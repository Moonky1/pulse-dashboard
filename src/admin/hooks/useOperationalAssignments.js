import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { getUserOperationalAssignments } from '../api/adminApi.js'

export function useOperationalAssignments(userId, { enabled = true } = {}) {
  const requestKey = enabled ? userId : null
  const [state, setState] = useState({ requestKey: null, assignments: [], loading: enabled, error: null })
  const load = useCallback(() => enabled
    ? getUserOperationalAssignments(supabase, userId)
    : Promise.resolve({ data: [], error: null }), [enabled, userId])

  const refresh = useCallback(async () => {
    if (!enabled) return { data: [], error: null }
    setState((current) => ({ ...current, loading: true, error: null }))
    const result = await load()
    setState({ requestKey, assignments: result.data, loading: false, error: result.error })
    return result
  }, [enabled, load, requestKey])

  useEffect(() => {
    let current = true
    void load().then((result) => {
      if (current) setState({ requestKey, assignments: result.data, loading: false, error: result.error })
    })
    return () => { current = false }
  }, [load, requestKey])

  return state.requestKey === requestKey
    ? { ...state, refresh }
    : { requestKey, assignments: [], loading: enabled, error: null, refresh }
}
