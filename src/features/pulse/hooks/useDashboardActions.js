import {
  useCallback,
} from 'react'

import { useAuth } from '../../../auth/AuthProvider.jsx'
import {
  playPulseSound,
  todayKey,
} from '../utils/dashboardViewHelpers'

export function useDashboardActions({
  loadToday,
  navigate,
  searchSuggestions,
  setActiveView,
  setRangeMode,
  setSearchQuery,
  setSelectedDateSafe,
  setSelectedTeam,
  setSidebarCollapsed,
  setSortMetric,
  setTeamReveal,
  setUserMenuOpen,
}) {
  const { signOut } = useAuth()

  const handleSidebarNavigate = useCallback(item => {
    playPulseSound('click')

    if (item.id === 'overview') {
      setActiveView('overview')
      setSelectedTeam('all')
      setSelectedDateSafe(todayKey())
      setSortMetric('english')
      setRangeMode('day')
      setSearchQuery('')
      setUserMenuOpen(false)
      navigate('/dashboard')
      loadToday().catch(() => {})
      return
    }

    if (item.id === 'teams') {
      setActiveView('teams')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'rankings') {
      setActiveView('rankings')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'analytics') {
      setActiveView('analytics')
      setSelectedTeam('all')
      setRangeMode('all_time')
      setSearchQuery('')
      setUserMenuOpen(false)
      return
    }

    if (item.id === 'pulse-go') {
      navigate('/go')
      return
    }

    if (item.id === 'settings') {
      navigate('/settings')
      return
    }

    window.alert(
      `${item.label} is coming soon.`
    )
  }, [
    loadToday,
    navigate,
    setActiveView,
    setRangeMode,
    setSearchQuery,
    setSelectedDateSafe,
    setSelectedTeam,
    setSortMetric,
    setUserMenuOpen,
  ])

  const openTeamWithReveal = useCallback(teamId => {
    if (!teamId || teamId === 'all') {
      playPulseSound('click')
      setActiveView('overview')
      setRangeMode('day')
      setSelectedTeam('all')
      return
    }

    playPulseSound('team')

    setTeamReveal({
      teamId,
      key: `${teamId}-${Date.now()}`,
    })

    setActiveView('overview')
    setRangeMode('day')
    setSelectedTeam(teamId)
  }, [
    setActiveView,
    setRangeMode,
    setSelectedTeam,
    setTeamReveal,
  ])

  const handleTeamTabChange = useCallback(teamId => {
    openTeamWithReveal(teamId)
  }, [openTeamWithReveal])

  const handleSuggestionClick = useCallback(item => {
    if (!item) return

    playPulseSound('click')

    if (item.type === 'agent') {
      setSearchQuery('')
      setUserMenuOpen(false)
      navigate(`/profile/${item.id}`)
      return
    }

    if (item.type === 'team') {
      setSearchQuery('')
      setUserMenuOpen(false)
      openTeamWithReveal(item.id)
    }
  }, [
    navigate,
    openTeamWithReveal,
    setSearchQuery,
    setUserMenuOpen,
  ])

  const handleSearchSubmit = useCallback(() => {
    const firstSuggestion =
      searchSuggestions[0]

    if (firstSuggestion) {
      handleSuggestionClick(
        firstSuggestion
      )
    }
  }, [
    handleSuggestionClick,
    searchSuggestions,
  ])

  const handleUserAction = useCallback(async action => {
    setUserMenuOpen(false)

    if (action === 'profile') {
      navigate('/profile/3134')
      return
    }

    if (action === 'settings') {
      navigate('/settings')
      return
    }

    if (action === 'logout') {
      try {
        await signOut()
      } finally {
        navigate('/signin')
      }
    }
  }, [
    navigate,
    setUserMenuOpen,
    signOut,
  ])

  const handleToggleSidebar = useCallback(() => {
    playPulseSound('click')

    setSidebarCollapsed(previous => (
      !previous
    ))
  }, [setSidebarCollapsed])

  const handleCloseSidebar = useCallback(() => {
    setSidebarCollapsed(true)
  }, [setSidebarCollapsed])

  const handleToggleUserMenu = useCallback(() => {
    setUserMenuOpen(previous => (
      !previous
    ))
  }, [setUserMenuOpen])

  const handlePulseGo = useCallback(() => {
    playPulseSound('click')
    navigate('/go')
  }, [navigate])

  const handleAcademy = useCallback(() => {
    playPulseSound('click')
    navigate('/academy')
  }, [navigate])

  const handleTeamRevealDone = useCallback(() => {
    setTeamReveal(null)
  }, [setTeamReveal])

  return {
    handleAcademy,
    handleCloseSidebar,
    handlePulseGo,
    handleSearchSubmit,
    handleSidebarNavigate,
    handleSuggestionClick,
    handleTeamRevealDone,
    handleTeamTabChange,
    handleToggleSidebar,
    handleToggleUserMenu,
    handleUserAction,
    openTeamWithReveal,
  }
}
