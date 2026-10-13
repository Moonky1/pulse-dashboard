import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadSelectedReport, loadDashboardScopes } from './dashboardApi.js'
import { browserDate, calendarDate } from './dashboardModel.js'
import { dashboardTimeZone } from './shiftTargets.js'
import { selectedDashboardScope } from './allTeamsScope.js'
import { reportSelection, selectReport } from './reportSelection.js'

export function useDashboard(client) {
  const [catalog, setCatalog] = useState({ loading: true, data: [], error: null })
  const [params, setParams] = useSearchParams()
  const { scope: selectedScope, date: selectedDate } = reportSelection(params)
  const setSelectedScope = value => setParams(previous => selectReport(previous, { scope: value }), { replace: true })
  const [retry, setRetry] = useState(0)
  const [report, setReport] = useState({ key: '', data: null, error: null, loading: false })
  const refreshRef = useRef(() => {})
  const accepted = useRef(null)
  const generation = useRef(0)
  useEffect(() => {
    let active = true
    void loadDashboardScopes(client).then(result => { if (active) setCatalog({ loading: false, data: result.data || [], error: result.error }) })
    return () => { active = false }
  }, [client, retry])
  const scope = selectedDashboardScope(catalog.data, selectedScope)
  const scopeId = scope?.id
  const setSelectedDate = value => setParams(previous => selectReport(previous, { date: value, scope: scopeId }), { replace: true })
  const date = selectedDate || calendarDate(dashboardTimeZone(scope)) || browserDate()
  const key = scope ? `${scope.id}/${date}` : ''
  useEffect(() => {
    if (!scope) return
    let active = true, inFlight = false, denied = false, lastStarted = 0, queued = false
    async function read(force = false) {
      if (inFlight && force) queued = true
      if (!active || inFlight || (denied && !force) || (!force && Date.now() - lastStarted < 60000)) return
      const ticket = generation.current
      inFlight = true
      lastStarted = Date.now()
      setReport(previous => ({ key, data: previous.key === key ? previous.data : null, error: null, loading: true }))
      const result = await loadSelectedReport(client, scope.id, date, catalog.data)
      inFlight = false
      if (!active) return
      if (queued) { queued = false; void read(true); return }
      if (ticket !== generation.current) return
      denied = result.error?.code === 'access_denied'
      setReport(previous => ({ key, data: denied ? null : result.data || (previous.key === key ? previous.data : null), error: result.error, loading: false }))
    }
    refreshRef.current = () => { void read(true) }
    if (accepted.current === key) { accepted.current = null; lastStarted = Date.now() } else void read()
    // Reads stored Pulse snapshots, never contacts Vici or triggers its collector.
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') void read() }, 60000)
    const onVisible = () => { if (document.visibilityState === 'visible') void read() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; refreshRef.current = () => {}; clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [client, scope, date, key, catalog.data])
  const refresh = () => { if (!catalog.data.length) setRetry(value => value + 1); else refreshRef.current() }
  const imported = outcome => {
    setSelectedDate(outcome.report_date)
    if (outcome.report) {
      generation.current++
      const importedKey = outcome.report.scope.id + '/' + outcome.report_date
      accepted.current = importedKey === key ? null : importedKey
      setReport({ key: importedKey, data: outcome.report, error: null, loading: false })
    } else refreshRef.current()
  }
  return { catalog, scope, date, setScope: setSelectedScope, setDate: setSelectedDate, refresh, imported, report: key && report.key === key ? report : { key, data: null, error: null, loading: Boolean(scope) } }
}
