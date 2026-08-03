import {
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
  useDashboardViewModel,
} from '../features/pulse/hooks/useDashboardViewModel'

import {
  useDashboardActions,
} from '../features/pulse/hooks/useDashboardActions'

import {
  TEAMS,
} from '../features/pulse/config/dashboardConfig'

import {
  formatDateLabel,
  todayKey,
} from '../features/pulse/utils/dashboardViewHelpers'

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
  
  const {
    activeSidebarItem,
    dashboardTotals,
    searchSuggestions,
    selectedParsed,
    selectedParsedForView,
    selectedTeamMeta,
    visibleAllTeamCards,
  } = useDashboardViewModel({
    activeView,
    historyState,
    rangeMode,
    searchQuery,
    selectedTeam,
    sortMetric,
    teamData,
  })
  
  const {
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
  } = useDashboardActions({
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
  })

  return (
    <div className={`dash-root ${sidebarCollapsed ? 'lov-sidebar-collapsed' : ''}`}>
      {teamReveal ? (
        <TeamRevealOverlay
          reveal={teamReveal}
          onDone={handleTeamRevealDone}
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
            onClick={handleCloseSidebar}
          />
        ) : null}

        <div className="lov-main">
          <LovableHeader
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            suggestions={searchSuggestions}
            onSuggestionClick={handleSuggestionClick}
            userMenuOpen={userMenuOpen}
            onToggleUserMenu={handleToggleUserMenu}
            onUserAction={handleUserAction}
            onPulseGo={handlePulseGo}
            onAcademy={handleAcademy}
          />

          <main className="lov-content">
{activeView !== 'rankings' && activeView !== 'analytics' ? (
  <section
    className={`lov-hero ${
      activeView === 'overview' ? 'lov-hero-overview' : ''
    }`}
    style={{ padding: '22px 28px' }}
  >
    <div className="lov-hero-left">
      {activeView === 'teams' ? null : (
        <div className="lov-hero-badge">
          {selectedDate === todayKey()
            ? '● Today — live data'
            : `Saved snapshot · ${formatDateLabel(selectedDate)}`}
        </div>
      )}

      <h1
        className="lov-hero-title"
        style={{
          fontSize: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {activeView === 'teams' ? (
          <span style={{ fontSize: 30, lineHeight: 1 }}>
            👥
          </span>
        ) : null}

        {activeView === 'teams' ? 'Teams' : 'Overview'}
      </h1>
    </div>

    {activeView === 'overview' ? (
      <div className="pulse-white-portal" aria-hidden="true">
        <span className="pulse-white-portal-glow" />

        <span className="pulse-white-portal-arc pulse-white-portal-arc-outer" />
        <span className="pulse-white-portal-arc pulse-white-portal-arc-middle" />
        <span className="pulse-white-portal-arc pulse-white-portal-arc-inner" />

        <span className="pulse-white-portal-core" />
        <span className="pulse-white-portal-horizon" />
      </div>
    ) : null}
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

            <div className="pulse-sunrise-hero" aria-hidden="true">
  <div className="pulse-sunrise-line" />
  <div className="pulse-sunrise-glow" />
  <div className="pulse-sunrise-arc pulse-sunrise-arc-back" />
  <div className="pulse-sunrise-arc pulse-sunrise-arc-mid" />
  <div className="pulse-sunrise-arc pulse-sunrise-arc-front" />
  <div className="pulse-sunrise-core" />
  <div className="pulse-sunrise-flare pulse-sunrise-flare-left" />
  <div className="pulse-sunrise-flare pulse-sunrise-flare-right" />
</div>

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
                        onOpen={openTeamWithReveal}
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
