import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  LovableKpi,
} from '../features/pulse/components/DashboardPrimitives'

import {
  LovableHeader,
  LovableSidebar,
  TeamRevealOverlay,
} from '../features/pulse/components/DashboardShell'

import {
  DateSelectorRow,
  SortTabs,
  TeamTabs,
} from '../features/pulse/components/DashboardControls'

import {
  TeamComingSoonCard,
  TeamDetail,
  TeamOverviewCard,
} from '../features/pulse/components/DashboardTeamComponents'

import {
  RankingsPage,
} from '../features/pulse/components/DashboardRankingComponents'

import {
  AnalyticsPage,
} from '../features/pulse/components/DashboardAnalyticsPage'

import {
  TeamsInsightsPage,
} from '../features/pulse/components/DashboardTeamsPage'

import {
  useDashboardData,
} from '../features/pulse/hooks/useDashboardData'

import {
  TEAM_ORDER,
  TEAMS,
} from '../features/pulse/config/dashboardConfig'

import {
  formatDateLabel,
  normalizeSearchText,
  playPulseSound,
  todayKey,
} from '../features/pulse/utils/dashboardViewHelpers'

import {
  buildSearchSuggestions,
  filterParsedBySearch,
  teamMatchesSearch,
} from '../features/pulse/utils/dashboardSearchHelpers'

import './dashboard.css'
import './dashboardStyles/teamReveal.css'
import './dashboardStyles/dashboardPolish.css'

export default function Dashboard() {
  const navigate = useNavigate()

  const [selectedTeam, setSelectedTeam] =
    useState('all')

  const [sortMetric, setSortMetric] =
    useState('english')

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(() => (
      typeof window !== 'undefined'
      && window.innerWidth <= 760
    ))

  const [searchQuery, setSearchQuery] =
    useState('')

  const [userMenuOpen, setUserMenuOpen] =
    useState(false)

  const [rangeMode, setRangeMode] =
    useState('all_time')

  const [activeView, setActiveView] =
    useState('overview')

  const [teamReveal, setTeamReveal] =
    useState(null)

  const {
    selectedDate,
    setSelectedDateSafe,
    loading,
    error,
    teamData,
    dateTabs,
    historyState,
    loadToday,
  } = useDashboardData(activeView)
  
  const allTeamCards = useMemo(() => {
    const liveCards = TEAM_ORDER
      .filter(teamId => teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: teamData[teamId] }))
      .sort((a, b) => {
        const diff = (b.parsed?.totals?.[sortMetric] || 0) - (a.parsed?.totals?.[sortMetric] || 0)
        if (diff !== 0) return diff
        return (b.parsed?.totals?.total || 0) - (a.parsed?.totals?.total || 0)
      })

    const missingCards = TEAM_ORDER
      .filter(teamId => !teamData[teamId])
      .map(teamId => ({ team: TEAMS[teamId], parsed: null }))

    return [...liveCards, ...missingCards]
  }, [sortMetric, teamData])

  const selectedParsed = selectedTeam !== 'all' ? teamData[selectedTeam] : null
  const selectedTeamMeta = selectedTeam !== 'all' ? TEAMS[selectedTeam] : null

  const dashboardTotals = useMemo(() => {
    if (activeView === 'teams') {
      const weeklyTeams = historyState.insights?.weeklyTeams || []

      return weeklyTeams.reduce((acc, teamInsight) => {
        const totals = teamInsight?.thisWeek?.totals || {}
        acc.english += Number(totals.english || 0)
        acc.spanish += Number(totals.spanish || 0)
        acc.invalid += Number(totals.invalidTransfers || 0)
        acc.total += Number(totals.total || 0)
        acc.activeAgents += Number(totals.activeAgents || 0)
        return acc
      }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
    }

    if ((activeView === 'rankings' || activeView === 'analytics') && rangeMode === 'all_time') {
      const allTimeAgents = historyState.insights?.allTimeAgents || []

      return allTimeAgents.reduce((acc, agent) => {
        acc.english += Number(agent?.english || 0)
        acc.spanish += Number(agent?.spanish || 0)
        acc.invalid += Number(agent?.invalidTransfers || 0)
        acc.total += Number(agent?.total || 0)
        acc.activeAgents += 1
        return acc
      }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
    }

    const source = selectedTeam === 'all'
      ? TEAM_ORDER.map(teamId => teamData[teamId]).filter(Boolean)
      : selectedParsed
        ? [selectedParsed]
        : []

    return source.reduce((acc, parsed) => {
      acc.english += Number(parsed?.totals?.english || 0)
      acc.spanish += Number(parsed?.totals?.spanish || 0)
      acc.invalid += Number(parsed?.invalidTransfers || 0)
      acc.total += Number(parsed?.totals?.total || 0)
      acc.activeAgents += Number(parsed?.totals?.activeAgents || parsed?.agents?.length || 0)
      return acc
    }, { english: 0, spanish: 0, invalid: 0, total: 0, activeAgents: 0 })
  }, [activeView, historyState.insights, rangeMode, selectedParsed, selectedTeam, teamData])

  const normalizedSearch = useMemo(() => normalizeSearchText(searchQuery), [searchQuery])

  const visibleAllTeamCards = useMemo(() => {
    if (!normalizedSearch) return allTeamCards

    return allTeamCards
      .map(({ team, parsed }) => {
        const teamMatch = teamMatchesSearch(team, normalizedSearch)

        if (!parsed) return teamMatch ? { team, parsed } : null

        const filteredParsed = filterParsedBySearch(parsed, normalizedSearch)
        const hasAgentMatches = (filteredParsed?.agents || []).length > 0
        if (!teamMatch && !hasAgentMatches) return null

        return { team, parsed: teamMatch ? parsed : filteredParsed }
      })
      .filter(Boolean)
  }, [allTeamCards, normalizedSearch])

  const selectedParsedForView = useMemo(() => {
    return filterParsedBySearch(selectedParsed, normalizedSearch)
  }, [selectedParsed, normalizedSearch])

  const searchSuggestions = useMemo(() => {
    return buildSearchSuggestions(teamData, searchQuery)
  }, [teamData, searchQuery])

  const activeSidebarItem = activeView === 'rankings'
    ? 'rankings'
    : activeView === 'teams'
      ? 'teams'
      : activeView === 'analytics'
        ? 'analytics'
        : selectedTeam === 'all'
          ? 'overview'
          : 'teams'

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

    window.alert(`${item.label} is coming soon.`)
  }, [loadToday, navigate, setSelectedDateSafe])

  const openTeamWithReveal = useCallback(teamId => {
    if (!teamId || teamId === 'all') {
      playPulseSound('click')
      setActiveView('overview')
      setRangeMode('day')
      setSelectedTeam('all')
      return
    }

    playPulseSound('team')
    setTeamReveal({ teamId, key: `${teamId}-${Date.now()}` })
    setActiveView('overview')
    setRangeMode('day')
    setSelectedTeam(teamId)
  }, [])

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
  }, [navigate, openTeamWithReveal])

  const handleSearchSubmit = useCallback(() => {
    const first = searchSuggestions[0]
    if (first) handleSuggestionClick(first)
  }, [searchSuggestions, handleSuggestionClick])

  const handleUserAction = useCallback(action => {
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
      localStorage.removeItem('pulse_user')
      navigate('/signin')
    }
  }, [navigate])

  return (
    <div className={`dash-root ${sidebarCollapsed ? 'lov-sidebar-collapsed' : ''}`}>
      {teamReveal ? (
        <TeamRevealOverlay
          reveal={teamReveal}
          onDone={() => setTeamReveal(null)}
        />
      ) : null}

      <div className="lov-shell">
        <LovableSidebar
          collapsed={sidebarCollapsed}
          activeItem={activeSidebarItem}
          onNavigate={handleSidebarNavigate}
        />

        {!sidebarCollapsed ? (
          <button
            type="button"
            className="lov-mobile-sidebar-backdrop"
            aria-label="Close sidebar"
            onClick={() => setSidebarCollapsed(true)}
          />
        ) : null}

        <div className="lov-main">
          <LovableHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => {
              playPulseSound('click')
              setSidebarCollapsed(prev => !prev)
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            suggestions={searchSuggestions}
            onSuggestionClick={handleSuggestionClick}
            userMenuOpen={userMenuOpen}
            onToggleUserMenu={() => setUserMenuOpen(prev => !prev)}
            onUserAction={handleUserAction}
            onPulseGo={() => {
              playPulseSound('click')
              navigate('/go')
            }}
            onAcademy={() => {
  playPulseSound('click')
  navigate('/academy')
}}
          />

          <main className="lov-content">
            {activeView !== 'rankings' && activeView !== 'analytics' ? (
              <section className="lov-hero" style={{ padding: '22px 28px' }}>
                <div className="lov-hero-left">
                  {activeView === 'teams' ? null : (
                    <div className="lov-hero-badge">
                      {selectedDate === todayKey()
                        ? '● Today — live data'
                        : `Saved snapshot · ${formatDateLabel(selectedDate)}`}
                    </div>
                  )}

                  <h1 className="lov-hero-title" style={{ fontSize: 34, display: 'flex', alignItems: 'center', gap: 12 }}>
                    {activeView === 'teams' ? <span style={{ fontSize: 30, lineHeight: 1 }}>👥</span> : null}
                    {activeView === 'teams' ? 'Teams' : 'Overview'}
                  </h1>
                </div>
              </section>
            ) : null}

            {activeView !== 'rankings' && activeView !== 'analytics' && activeView !== 'teams' ? (
              <section className="lov-kpi-grid lov-kpi-grid-main">
                <LovableKpi title="English" value={dashboardTotals.english} tone="blue" />
                <LovableKpi title="Spanish" value={dashboardTotals.spanish} tone="green" />
                <LovableKpi title="Invalid" value={dashboardTotals.invalid} tone="red" />
                <LovableKpi title="Total Xfers" value={dashboardTotals.total} tone="orange" />
              </section>
            ) : null}

            {activeView === 'overview' ? (
              <>
                <section className="lov-control-row">
                  <TeamTabs selectedTeam={selectedTeam} onChange={handleTeamTabChange} />
                  <SortTabs sortMetric={sortMetric} onChange={setSortMetric} />
                </section>

                <DateSelectorRow
                  dates={dateTabs}
                  selectedDate={selectedDate}
                  onChange={setSelectedDateSafe}
                />
              </>
            ) : null}

            {loading ? (
              <div className="pulse-loading">Loading team data...</div>
            ) : error ? (
              <div className="pulse-error">{error}</div>
            ) : activeView === 'analytics' ? (
              <AnalyticsPage
                history={historyState.insights}
                historyLoading={historyState.loading}
                historyError={historyState.error}
                dateTabs={dateTabs}
                navigate={navigate}
              />
            ) : activeView === 'teams' ? (
              <TeamsInsightsPage
                historyLoading={historyState.loading}
                historyError={historyState.error}
                onOpenTeam={openTeamWithReveal}
              />
            ) : activeView === 'rankings' ? (
              <RankingsPage
                teamData={teamData}
                selectedDate={selectedDate}
                rangeMode={rangeMode}
                history={historyState.insights}
                historyLoading={historyState.loading}
                historyError={historyState.error}
                navigate={navigate}
              />
            ) : selectedTeam === 'all' ? (
              <div className="pulse-overview-grid">
                {visibleAllTeamCards.map(({ team, parsed }, index) => (
                  parsed
                    ? (
                      <TeamOverviewCard
                        key={team.id}
                        team={team}
                        parsed={parsed}
                        sortMetric={sortMetric}
                        onOpen={teamId => openTeamWithReveal(teamId)}
                        rankIndex={index}
                      />
                    )
                    : <TeamComingSoonCard key={team.id} team={team} />
                ))}
              </div>
            ) : selectedParsed && selectedTeamMeta ? (
              <TeamDetail
                team={selectedTeamMeta}
                parsed={selectedParsedForView}
                selectedDate={selectedDate}
                navigate={navigate}
              />
            ) : (
              <TeamComingSoonCard team={TEAMS[selectedTeam]} />
            )}
          </main>
        </div>
      </div>
    </div>
  )
} 
