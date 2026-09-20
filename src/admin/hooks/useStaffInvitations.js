import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { listStaffInvitations, loadStaffInvitationOptions } from '../api/adminApi.js'

const EMPTY_OPTIONS = Object.freeze({ departments: [], teams: [], positions: [], roleOptions: [] })

export function useStaffInvitations(status = null) {
  const [state, setState] = useState({ invitations: [], options: EMPTY_OPTIONS, loading: true, error: null })
  const load = useCallback(async () => {
    const [invitations, options] = await Promise.all([listStaffInvitations(supabase, { status }), loadStaffInvitationOptions(supabase)])
    return { invitations: invitations.data, options: options.data ?? EMPTY_OPTIONS, error: invitations.error || options.error }
  }, [status])
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    const result = await load()
    setState({ ...result, loading: false })
    return result
  }, [load])
  useEffect(() => {
    let current = true
    void load().then((result) => { if (current) setState({ ...result, loading: false }) })
    return () => { current = false }
  }, [load])
  return { ...state, refresh }
}
