import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { listManagedDepartments, listManagedTeams } from '../api/adminApi.js'

const EMPTY_RESULT = Object.freeze({ data: [], error: null })

export function useOrganizationCatalog({ departments = true, teams = true } = {}) {
  const [state, setState] = useState({ departments: [], teams: [], loading: true, error: null })
  const load = useCallback(() => Promise.all([
    departments ? listManagedDepartments(supabase) : Promise.resolve(EMPTY_RESULT),
    teams ? listManagedTeams(supabase) : Promise.resolve(EMPTY_RESULT),
  ]), [departments, teams])
  const apply = useCallback(([departmentResult, teamResult]) => {
    const error = departmentResult.error || teamResult.error
    setState({
      departments: departmentResult.data,
      teams: teamResult.data,
      loading: false,
      error,
    })
    return { data: { departments: departmentResult.data, teams: teamResult.data }, error }
  }, [])
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    return apply(await load())
  }, [apply, load])

  useEffect(() => {
    let current = true
    void load().then((results) => { if (current) apply(results) })
    return () => { current = false }
  }, [apply, load])

  return { ...state, refresh }
}
