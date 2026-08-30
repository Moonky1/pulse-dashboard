import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../utils/supabase.js'
import { getUserAuditHistory, listAuditEvents } from '../api/adminApi.js'

export function useAuditEvents({ enabled = true, userId = null, filters = {}, limit = 25 } = {}) {
  const [state, setState] = useState({ events: [], loading: enabled, loadingMore: false, error: null, hasMore: false, cursor: null })
  const category = filters.category || ''
  const from = filters.from || ''
  const to = filters.to || ''
  const request = useCallback((cursor = null) => userId
    ? getUserAuditHistory(supabase, userId, { limit, cursor })
    : listAuditEvents(supabase, { limit, cursor, category: category || null, from: from ? `${from}T00:00:00` : null, to: to ? `${to}T23:59:59.999` : null }), [category, from, limit, to, userId])

  const refresh = useCallback(async () => {
    if (!enabled) return { data: null, error: null }
    setState((current) => ({ ...current, loading: true, error: null }))
    const result = await request()
    setState({ events: result.data.events, loading: false, loadingMore: false, error: result.error, hasMore: result.data.hasMore, cursor: result.data.nextCursor })
    return result
  }, [enabled, request])

  const loadMore = useCallback(async () => {
    if (!enabled || state.loadingMore || !state.hasMore || !state.cursor) return
    setState((current) => ({ ...current, loadingMore: true, error: null }))
    const result = await request(state.cursor)
    setState((current) => ({ ...current, events: result.error ? current.events : [...current.events, ...result.data.events], loadingMore: false, error: result.error, hasMore: result.error ? current.hasMore : result.data.hasMore, cursor: result.error ? current.cursor : result.data.nextCursor }))
  }, [enabled, request, state.cursor, state.hasMore, state.loadingMore])

  useEffect(() => {
    if (!enabled) return undefined
    let current = true
    void request().then((result) => {
      if (current) setState({ events: result.data.events, loading: false, loadingMore: false, error: result.error, hasMore: result.data.hasMore, cursor: result.data.nextCursor })
    })
    return () => { current = false }
  }, [enabled, request])
  return { ...state, refresh, loadMore }
}
