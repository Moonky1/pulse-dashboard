import { useEffect } from 'react'

import { SIDEBAR_GROUPS, TEAMS } from '../config/dashboardConfig'
import { getTeamColor } from '../utils/dashboardHelpers'
import { FlagImg } from './DashboardPrimitives'

export function TeamRevealOverlay({ reveal, onDone }) {
  const teamId = reveal?.teamId
  const team = TEAMS[teamId]

  useEffect(() => {
    if (!teamId) return undefined

    const timer = window.setTimeout(() => {
      onDone?.()
    }, 1220)

    return () => window.clearTimeout(timer)
  }, [teamId, reveal?.key, onDone])

  if (!team) return null

  return (
    <div className="team-reveal-overlay" key={reveal?.key}>
      <div className="team-reveal-bg" />

      <div
        className="team-reveal-natural"
        style={{ '--team-reveal-accent': getTeamColor(teamId) }}
      >
        <div className="team-reveal-warm-glow" />

        <div className="team-reveal-flag-wrap">
          <FlagImg src={team.flag} size={82} alt={team.label} />
        </div>

        <div className="team-reveal-kicker">Team</div>
        <div className="team-reveal-name">{team.label}</div>
      </div>
    </div>
  )
}

export function LovableSidebar({
  collapsed,
  activeItem,
  onNavigate,
}) {
  return (
    <aside className={`lov-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="lov-brand">
        <div className="lov-brand-glow" />
        <span>Pulse</span>
      </div>

      <div className="lov-sidebar-scroll">
        {SIDEBAR_GROUPS.map(group => (
          <div className="lov-sidebar-group" key={group.title}>
            <div className="lov-sidebar-title">{group.title}</div>

            <div className="lov-sidebar-list">
              {group.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  className={`lov-sidebar-item ${
                    activeItem === item.id ? 'active' : ''
                  }`}
                  onClick={() => onNavigate(item)}
                >
                  <span className="lov-sidebar-icon">{item.icon}</span>
                  <span className="lov-sidebar-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="lov-sidebar-status">
        <div className="lov-status-dot-row">
          <span className="lov-status-dot" />
          <strong>Pulse GO active</strong>
        </div>

        <span>All systems nominal</span>
      </div>
    </aside>
  )
}

export function LovableHeader({
  sidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  suggestions = [],
  onSuggestionClick,
  userMenuOpen,
  onToggleUserMenu,
  onUserAction,
  onPulseGo,
  onAcademy,
}) {
  return (
    <header className="lov-header">
      <button
        type="button"
        className={`lov-icon-btn lov-menu-toggle ${
          sidebarCollapsed ? 'active' : ''
        }`}
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        ☰
      </button>

      <div className="lov-search-wrap">
        <div className="lov-search">
          <span className="lov-search-icon">⌕</span>

          <input
            value={searchQuery}
            placeholder="Search agent name or extension..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            name="pulse-global-search"
            onChange={event => onSearchChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') onSearchSubmit()
            }}
          />

          {searchQuery ? (
            <button
              type="button"
              className="lov-search-clear"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        {searchQuery && suggestions.length > 0 ? (
          <div className="lov-search-suggestions">
            {suggestions.map(item => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="lov-search-suggestion"
                onClick={() => onSuggestionClick(item)}
              >
                <span className="lov-suggestion-icon">{item.icon}</span>

                <span className="lov-suggestion-text">
                  <strong>{item.label}</strong>
                  <small>{item.sub}</small>
                </span>

                <span className="lov-suggestion-action">
                  {item.type === 'agent'
                    ? 'Open profile'
                    : 'Open team'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <nav className="lov-nav-pill" aria-label="Primary navigation">
        <button type="button">
          Home
        </button>

        <button type="button" onClick={onPulseGo}>
          Pulse GO
        </button>

        <button type="button" onClick={onAcademy}>
          Academy
        </button>
      </nav>

      <div className="lov-header-actions">
        <div className="lov-user-wrap">
          <button
            type="button"
            className={`lov-user ${userMenuOpen ? 'active' : ''}`}
            onClick={onToggleUserMenu}
          >
            <div>
              <strong>Simon</strong>
              <span>Asia · Team Leader</span>
            </div>

            <div className="lov-avatar">SM</div>
          </button>

          {userMenuOpen ? (
            <div className="lov-user-menu">
              <button
                type="button"
                onClick={() => onUserAction('profile')}
              >
                Profile
              </button>

              <button
                type="button"
                onClick={() => onUserAction('settings')}
              >
                Settings
              </button>

              <button
                type="button"
                onClick={() => onUserAction('logout')}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}