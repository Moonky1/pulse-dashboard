import { useCallback, useEffect, useRef, useState } from 'react'

import { getGoHostedSession, getGoHostedTiming } from '../training/trainingApi.js'
import { supabase } from '../utils/supabase.js'
import { normalizeHostedRoom } from './goHostedModel.js'
import { useGoIdentity } from './useGoIdentity.js'

export function useHostedRoom(sessionId) {
  const identity = useGoIdentity()
  const client = identity.client || supabase
  const [state, setState] = useState({ room: null, timing: null, loading: true, error: null })
  const mounted = useRef(true)
  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setState(previous => ({ ...previous, loading: true, error: null }))
    const { data, error } = await getGoHostedSession(client, sessionId)
    if (!mounted.current) return null
    const room = normalizeHostedRoom(data)
    const timingResponse = room?.status === 'active'
      ? await getGoHostedTiming(client, sessionId)
      : { data: null, error: null }
    if (!mounted.current) return null
    const timing = Number(timingResponse.data?.question_position) === room?.current_question_position
      ? timingResponse.data : null
    setState({ room, timing, loading: false, error: error || timingResponse.error || (!room ? { message: 'This game is unavailable.' } : null) })
    return room
  }, [client, sessionId])

  useEffect(() => {
    mounted.current = true
    const timer = setTimeout(() => { void refresh() }, 0)
    // Realtime is primary. This slow reconciliation is a reconnect safety net
    // for cold local channels or a laptop resuming after its socket was paused.
    const reconciliation = setInterval(() => { void refresh({ quiet: true }) }, 2500)
    const channel = supabase.channel(`go-room-${sessionId}`)
    if (identity.kind === 'agent') {
      // Broadcast carries only a change signal. The cookie-bound server API
      // retrieves the fresh, authorized room snapshot.
      channel.on('broadcast', { event: 'changed' }, () => { void refresh({ quiet: true }) })
    } else {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'go_sessions', filter: `id=eq.${sessionId}` }, () => { void refresh({ quiet: true }) })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'go_session_participants', filter: `session_id=eq.${sessionId}` }, () => { void refresh({ quiet: true }) })
    }
    channel
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
  }, [identity.kind, refresh, sessionId])

  return { ...state, refresh }
}
