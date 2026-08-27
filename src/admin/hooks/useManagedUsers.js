import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { getManagedUser, listManagedUsers, loadAssignableRoleOptions, loadOrganizationDirectory } from '../api/adminApi.js'

const EMPTY_ROLE_OPTIONS = Object.freeze({ data: [], error: null })

function useAdminRequest(load, requestKey, loadRoleOptions = null) {
  const [state, setState] = useState({ requestKey: null, data: null, directory: { departments: [], teams: [] }, roleOptions: [], roleOptionsError: null, loading: true, error: null })
  const applyResult = useCallback((resource, directory, roleOptions) => {
    setState({
      requestKey,
      data: resource.data,
      directory: directory.data,
      roleOptions: roleOptions.data,
      roleOptionsError: roleOptions.error,
      loading: false,
      error: resource.error || directory.error,
    })
  }, [requestKey])
  const loadAll = useCallback(() => Promise.all([
    load(),
    loadOrganizationDirectory(supabase),
    loadRoleOptions ? loadRoleOptions() : Promise.resolve(EMPTY_ROLE_OPTIONS),
  ]), [load, loadRoleOptions])
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    const [resource, directory, roleOptions] = await loadAll()
    applyResult(resource, directory, roleOptions)
    return { data: resource.data, error: resource.error || directory.error }
  }, [applyResult, loadAll])
  useEffect(() => {
    let current = true
    void loadAll().then(([resource, directory, roleOptions]) => {
      if (current) applyResult(resource, directory, roleOptions)
    })
    return () => { current = false }
  }, [applyResult, loadAll])
  const currentState = state.requestKey === requestKey
    ? state
    : { requestKey, data: null, directory: { departments: [], teams: [] }, roleOptions: [], roleOptionsError: null, loading: true, error: null }
  return { ...currentState, refresh }
}

export function useManagedUsers() {
  const load = useCallback(() => listManagedUsers(supabase), [])
  const state = useAdminRequest(load, 'users')
  return { ...state, users: state.data ?? [] }
}

export function useManagedUser(userId) {
  const load = useCallback(() => getManagedUser(supabase, userId), [userId])
  const loadRoleOptions = useCallback(() => loadAssignableRoleOptions(supabase, userId), [userId])
  const state = useAdminRequest(load, userId, loadRoleOptions)
  return { ...state, user: state.data }
}
