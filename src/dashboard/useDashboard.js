import { useCallback, useEffect, useRef, useState } from 'react'
import { loadDashboardReport, loadDashboardScopes } from './dashboardApi.js'
import { browserDate, calendarDate } from './dashboardModel.js'

export function useDashboard(client) {
  const [catalog, setCatalog] = useState({ loading: true, data: [], error: null })
  const [selectedScope, setSelectedScope] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [retry, setRetry] = useState(0)
  const [report, setReport] = useState({ key: '', data: null, error: null, loading: false })
  const refreshRef = useRef(() => {})
  useEffect(() => {
    let active = true
    void loadDashboardScopes(client).then(result => { if (active) setCatalog({ loading: false, data: result.data || [], error: result.error }) })
    return () => { active = false }
  }, [client, retry])
  const scope = catalog.data.find(s => s.id === selectedScope) || catalog.data[0] || null
  const date = selectedDate || calendarDate(scope?.source_time_zone) || browserDate()
  const key = scope ? `${scope.id}/${date}` : ''
  useEffect(() => {
    if (!scope) return
    let active = true, inFlight = false, denied = false, lastStarted = 0
    async function read(force = false) {
      if (!active || inFlight || (denied && !force) || (!force && Date.now() - lastStarted < 60000)) return
      inFlight = true
      lastStarted = Date.now()
      setReport(previous => ({ key, data: previous.key === key ? previous.data : null, error: null, loading: true }))
      const result = await loadDashboardReport(client, scope.id, date)
      inFlight = false
      if (!active) return
      denied = result.error?.code === 'access_denied'
      setReport(previous => ({ key, data: denied ? null : result.data || (previous.key === key ? previous.data : null), error: result.error, loading: false }))
    }
    refreshRef.current = () => { void read(true) }
    void read()
    // Reads stored Pulse snapshots, never contacts Vici or triggers its collector.
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') void read() }, 60000)
    const onVisible = () => { if (document.visibilityState === 'visible') void read() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; refreshRef.current = () => {}; clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [client, scope, date, key])
  const refresh = useCallback(() => { if (!catalog.data.length) setRetry(value => value + 1); else refreshRef.current() }, [catalog.data.length])
  return { catalog, scope, date, setScope: setSelectedScope, setDate: setSelectedDate, refresh, report: key && report.key === key ? report : { key, data: null, error: null, loading: Boolean(scope) } }
}
