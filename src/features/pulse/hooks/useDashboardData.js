import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  CLEAN_START_DATE,
  POLL_MS,
  TEAM_ORDER,
} from '../config/dashboardConfig'

import {
  fetchSupabaseDashboardDate,
  fetchSupabaseDates,
} from '../services/dashboardData'

import {
  agentReachedGoal,
  playPulseSound,
  todayKey,
} from '../utils/dashboardViewHelpers'

import {
  fetchHistoryRows,
} from '../utils/historyInsights'

export function useDashboardData(activeView) {
  const [selectedDate, setSelectedDate] = useState(
    todayKey()
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamData, setTeamData] = useState({})
  const [remoteDates, setRemoteDates] = useState([])

  const [historyState, setHistoryState] = useState({
    insights: null,
    loading: false,
    error: '',
  })

  const goalSoundSeenRef = useRef(new Set())

  const isToday = selectedDate === todayKey()

  const setSelectedDateSafe = useCallback(date => {
    setSelectedDate(date)
  }, [])

  const loadRemoteDates = useCallback(async () => {
    const dates = await fetchSupabaseDates()
    setRemoteDates(dates)
  }, [])

  const loadDashboardDate = useCallback(async date => {
    setError('')

    const supabaseData =
      await fetchSupabaseDashboardDate(date)

    setTeamData(supabaseData)
  }, [])

  const loadToday = useCallback(async () => {
    await loadDashboardDate(todayKey())
    loadRemoteDates().catch(() => {})
  }, [
    loadDashboardDate,
    loadRemoteDates,
  ])

  const loadHistory = useCallback(async () => {
    setHistoryState(previous => ({
      ...previous,
      loading: true,
      error: '',
    }))

    try {
      const insights = await fetchHistoryRows()

      setHistoryState({
        insights,
        loading: false,
        error: '',
      })
    } catch (loadError) {
      console.error(
        'Failed loading history:',
        loadError
      )

      setHistoryState({
        insights: null,
        loading: false,
        error: String(
          loadError?.message
          || loadError
          || 'Failed loading history'
        ),
      })
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const requestedDate = selectedDate

    const run = async () => {
      setLoading(true)
      setError('')
      setTeamData({})

      try {
        await loadDashboardDate(requestedDate)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            String(
              loadError?.message
              || loadError
              || 'Failed to load dashboard data'
            )
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [
    selectedDate,
    loadDashboardDate,
  ])

  useEffect(() => {
    loadRemoteDates().catch(() => {})
  }, [loadRemoteDates])

  useEffect(() => {
    const needsHistory =
      activeView === 'rankings'
      || activeView === 'teams'
      || activeView === 'analytics'

    if (!needsHistory) return
    if (historyState.loading) return
    if (historyState.insights) return

    loadHistory().catch(() => {})
  }, [
    activeView,
    historyState.insights,
    historyState.loading,
    loadHistory,
  ])

  useEffect(() => {
    if (!isToday) return undefined

    let cancelled = false
    let timer = null

    const scheduleNext = () => {
      if (cancelled) return

      timer = window.setTimeout(async () => {
        try {
          await loadToday()
        } catch (loadError) {
          console.warn(
            'Live refresh failed:',
            loadError
          )
        } finally {
          scheduleNext()
        }
      }, POLL_MS)
    }

    scheduleNext()

    return () => {
      cancelled = true

      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [
    isToday,
    loadToday,
  ])

  useEffect(() => {
    if (!isToday) return
    if (!teamData) return
    if (!Object.keys(teamData).length) return

    const reachedNow = new Set()

    TEAM_ORDER.forEach(teamId => {
      const parsed = teamData[teamId]

      ;(parsed?.agents || []).forEach(agent => {
        if (!agent?.ext) return

        const candidate = {
          ...agent,
          teamId,
          team: teamId,
          date: selectedDate,
          total: Number(
            agent.total
            || agent.rawTotal
            || 0
          ),
          rawTotal: Number(
            agent.rawTotal
            || agent.total
            || 0
          ),
        }

        if (agentReachedGoal(candidate)) {
          reachedNow.add(
            `${selectedDate}|${teamId}|${agent.ext}`
          )
        }
      })
    })

    const previous = goalSoundSeenRef.current
    const hasPrevious = previous.size > 0

    const hasNewGoal =
      hasPrevious
      && [...reachedNow].some(
        key => !previous.has(key)
      )

    goalSoundSeenRef.current = reachedNow

    if (hasNewGoal) {
      playPulseSound('goal')
    }
  }, [
    isToday,
    selectedDate,
    teamData,
  ])

  const dateTabs = useMemo(() => {
    const dates = new Set([
      todayKey(),
      ...remoteDates,
    ])

    return [...dates]
      .filter(date => date >= CLEAN_START_DATE)
      .sort((first, second) =>
        second.localeCompare(first)
      )
  }, [remoteDates])

  return {
    selectedDate,
    setSelectedDateSafe,
    loading,
    error,
    teamData,
    dateTabs,
    historyState,
    loadToday,
  }
}