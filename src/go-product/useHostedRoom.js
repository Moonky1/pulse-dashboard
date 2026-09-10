import { useCallback, useEffect, useRef, useState } from 'react'

import { getGoHostedSession } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { normalizeHostedRoom } from './goHostedModel.js'

export function useHostedRoom(sessionId) {
  const [state, setState] = useState({ room: null, loading: true, error: null })
  const mounted = useRef(true)
  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setState(previous => ({ ...previous, loading: true, error: null }))
    const { data, error } = await getGoHostedSession(supabase, sessionId)
    if (!mounted.current) return null
    const room = normalizeHostedRoom(data)
    setState({ room, loading: false, error: error || (!room ? { message: 'This game is unavailable.' } : null) })
    return room
  }, [sessionId])

  useEffect(() => {
    mounted.current = true
    const timer = setTimeout(() => { void refresh() }, 0)
    // Realtime is primary. This slow reconciliation is a reconnect safety net
    // for cold local channels or a laptop resuming after its socket was paused.
    const reconciliation = setInterval(() => { void refresh({ quiet: true }) }, 2500)
    const channel = supabase.channel(`go-room-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'go_sessions', filter: `id=eq.${sessionId}` }, () => { void refresh({ quiet: true }) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'go_session_participants', filter: `session_id=eq.${sessionId}` }, () => { void refresh({ quiet: true }) })
      .subscribe(status => {
        // A subscription can finish connecting just after a participant joins.
        // Reconcile once on SUBSCRIBED so missed startup events never stale the lobby.
        if (status === 'SUBSCRIBED') void refresh({ quiet: true })
      })
    return () => {
      mounted.current = false
      clearTimeout(timer)
      clearInterval(reconciliation)
      void supabase.removeChannel(channel)
    }
  }, [refresh, sessionId])

  return { ...state, refresh }
}
