import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { getManagedUser, listManagedUsers, loadOrganizationDirectory } from '../api/adminApi.js'

function useAdminRequest(load, requestKey) {
  const [state, setState] = useState({ requestKey: null, data: null, directory: { departments: [], teams: [] }, loading: true, error: null })
  const applyResult = useCallback((resource, directory) => {
    setState({
      requestKey,
      data: resource.data,
      directory: directory.data,
      loading: false,
      error: resource.error || directory.error,
    })
  }, [requestKey])
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    const [resource, directory] = await Promise.all([load(), loadOrganizationDirectory(supabase)])
    applyResult(resource, directory)
    return { data: resource.data, error: resource.error || directory.error }
  }, [applyResult, load])
  useEffect(() => {
    let current = true
    void Promise.all([load(), loadOrganizationDirectory(supabase)]).then(([resource, directory]) => {
      if (current) applyResult(resource, directory)
    })
    return () => { current = false }
  }, [applyResult, load])
  const currentState = state.requestKey === requestKey
    ? state
    : { requestKey, data: null, directory: { departments: [], teams: [] }, loading: true, error: null }
  return { ...currentState, refresh }
}

export function useManagedUsers() {
  const load = useCallback(() => listManagedUsers(supabase), [])
  const state = useAdminRequest(load, 'users')
  return { ...state, users: state.data ?? [] }
}

export function useManagedUser(userId) {
  const load = useCallback(() => getManagedUser(supabase, userId), [userId])
  const state = useAdminRequest(load, userId)
  return { ...state, user: state.data }
}
