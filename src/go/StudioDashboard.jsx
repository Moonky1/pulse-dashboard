import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'
import './StudioDashboard.css'
import StudioGameBuilder from './StudioGameBuilder'
import StudioGameModeSelector from './StudioGameModeSelector'
import StudioMyGames from './StudioMyGames'
import { getStudioOverview } from './studioLibraryApi'
import './StudioOverview.css'

const STUDIO_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '⌂',
  },
  {
    id: 'my-games',
    label: 'My Games',
    icon: '◫',
  },
  {
    id: 'library',
    label: 'Game Library',
    icon: '◇',
  },
  {
    id: 'create',
    label: 'Create Game',
    icon: '+',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '↗',
  },
]

const TEAM_LABELS = {
  global: 'Global',
  philippines: 'Philippines',
  venezuela: 'Venezuela',
  colombia: 'Colombia',
  mexico: 'Mexico BJ',
  central: 'Central America',
  asia: 'Asia',
}

const ALLOWED_STUDIO_ROLES = [
  'global',
  'supervisor',
  'qa',
  'leader',
]

const BUILDER_STEPS = [
  {
    number: '01',
    title: 'Game Details',
    description:
      'Title, description, language, team and visibility.',
  },
  {
    number: '02',
    title: 'Game Settings',
    description:
      'Question timer, scoring and game behavior.',
  },
  {
    number: '03',
    title: 'Questions',
    description:
      'Create questions, answers, explanations and media.',
  },
  {
    number: '04',
    title: 'Preview',
    description:
      'Play through the game before publishing it.',
  },
  {
    number: '05',
    title: 'Publish & Host',
    description:
      'Publish the game and generate a live KK room.',
  },
]

const EMPTY_OVERVIEW = {
  myGames: 0,
  published: 0,
  drafts: 0,
  archived: 0,
  totalPlays: 0,
  averageScore: null,
  starsReceived: 0,
  recentDrafts: [],
  latestGames: [],
}

const LANGUAGE_LABELS = {
  en: 'English',
  es: 'Spanish',
  mixed: 'Mixed',
}

function formatOverviewDate(value) {
  if (!value) return 'Recently updated'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatOverviewNumber(value) {
  return Number(value || 0).toLocaleString('en-US')
}

function OverviewGameList({
  games,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onOpen,
  onCreate,
}) {
  if (!games.length) {
    return (
      <StudioEmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onCreate ? 'Create Your Game' : undefined}
        onAction={onCreate}
      />
    )
  }

  return (
    <div className="studio-overview-game-list">
      {games.map((game) => (
        <button
          key={game.id}
          type="button"
          className="studio-overview-game-row"
          onClick={() => onOpen(game)}
        >
          <span className="studio-overview-game-icon">
            {game.coverEmoji || '🎮'}
          </span>

          <span className="studio-overview-game-copy">
            <strong>{game.title}</strong>

            <small>
              {LANGUAGE_LABELS[game.language] || 'English'}
              {' · '}
              {game.status === 'published'
                ? `${formatOverviewNumber(game.playCount)} plays`
                : `Step ${Math.min(5, Math.max(1, Number(game.currentStep || 1)))} of 5`}
            </small>
          </span>

          <span className="studio-overview-game-side">
            <b
              className={`studio-overview-status studio-overview-status--${game.status}`}
            >
              {game.status}
            </b>

            <small>
              {formatOverviewDate(game.updatedAt || game.publishedAt)}
            </small>
          </span>

          <span className="studio-overview-game-arrow">→</span>
        </button>
      ))}
    </div>
  )
}


function readStoredUser() {
  try {
    const rawUser = localStorage.getItem('pulse_user')

    if (!rawUser) return null

    const parsedUser = JSON.parse(rawUser)

    if (!parsedUser || typeof parsedUser !== 'object') {
      return null
    }

    return parsedUser
  } catch (error) {
    console.error('Could not read Pulse user:', error)
    return null
  }
}

function resolveRole(rawRole, rawTeam) {
  const cleanRole = String(rawRole || '')
    .trim()
    .toLowerCase()

  const cleanTeam = String(rawTeam || '')
    .trim()
    .toLowerCase()

  if (cleanRole === 'global' || cleanTeam === 'global') {
    return {
      id: 'global',
      label: 'Global',
    }
  }

  if (cleanRole === 'supervisor') {
    return {
      id: 'supervisor',
      label: 'Supervisor',
    }
  }

  if (cleanRole === 'qa') {
    return {
      id: 'qa',
      label: 'QA',
    }
  }

  if (
    cleanRole === 'leader' ||
    cleanRole === 'team leader' ||
    cleanRole === 'team-leader'
  ) {
    return {
      id: 'leader',
      label: 'Team Leader',
    }
  }

  return {
    id: 'unknown',
    label: rawRole || 'Unknown Role',
  }
}

function getInitials(name) {
  const parts = String(name || 'Pulse User')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'P'

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'

  return 'Good evening'
}

function RoleBadge({ role }) {
  return (
    <span
      className={`studio-role-badge studio-role-badge--${role.id}`}
    >
      {role.label}
    </span>
  )
}

function AuthorIdentity({
  user,
  role,
  team,
  compact = false,
}) {
  return (
    <div
      className={`studio-author-identity ${
        compact ? 'studio-author-identity--compact' : ''
      }`}
    >
      <div
        className={`studio-author-avatar studio-author-avatar--${role.id}`}
      >
        <span>{getInitials(user?.name)}</span>
        <i />
      </div>

      <div className="studio-author-information">
        <div className="studio-author-name-line">
          <strong>{user?.name || 'Pulse User'}</strong>
          <RoleBadge role={role} />
        </div>

        <small>{team}</small>
      </div>
    </div>
  )
}

function StudioEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="studio-dashboard-empty">
      <div className="studio-dashboard-empty-icon">
        {icon}
      </div>

      <strong>{title}</strong>
      <p>{description}</p>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default function StudioDashboard() {
  const navigate = useNavigate()

  const [activeView, setActiveView] =
    useState('overview')

  const [editingGame, setEditingGame] =
    useState(null)

  const [selectedGameMode, setSelectedGameMode] =
    useState(null)


  const [overview, setOverview] =
    useState(EMPTY_OVERVIEW)

  const [overviewLoading, setOverviewLoading] =
    useState(true)

  const [overviewError, setOverviewError] =
    useState('')

  const [overviewRefreshKey, setOverviewRefreshKey] =
    useState(0)

  const user = useMemo(() => readStoredUser(), [])

  const role = useMemo(
    () => resolveRole(user?.role, user?.team),
    [user]
  )

  const team =
    TEAM_LABELS[
      String(user?.team || '').toLowerCase()
    ] ||
    user?.team ||
    'Global'

  const hasStudioAccess =
    ALLOWED_STUDIO_ROLES.includes(role.id)

  const firstName =
    String(user?.name || 'Creator')
      .trim()
      .split(/\s+/)[0] || 'Creator'

  const openNewGame = () => {
    setEditingGame(null)
    setSelectedGameMode(null)
    setActiveView('create')
  }

  const openExistingGame = (game) => {
    setEditingGame(game)
    setSelectedGameMode(game?.gameMode || 'classic')
    setActiveView('create')
  }

  useEffect(() => {
    if (user) return

    localStorage.setItem(
      'pulse_return_after_auth',
      '/studio/dashboard'
    )

    navigate('/signin', {
      replace: true,
    })
  }, [user, navigate])


  useEffect(() => {
    if (
      !user ||
      !hasStudioAccess ||
      activeView !== 'overview'
    ) {
      return undefined
    }

    let cancelled = false

    setOverviewLoading(true)
    setOverviewError('')

    getStudioOverview({
      user,
      role,
    })
      .then((data) => {
        if (cancelled) return

        setOverview({
          ...EMPTY_OVERVIEW,
          ...data,
        })
      })
      .catch((loadError) => {
        if (cancelled) return

        console.error(loadError)

        setOverviewError(
          loadError?.message ||
            'Could not load the Studio overview.'
        )
      })
      .finally(() => {
        if (!cancelled) {
          setOverviewLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    activeView,
    hasStudioAccess,
    overviewRefreshKey,
    role,
    user,
  ])

  const refreshOverview = () => {
    setOverviewRefreshKey(
      (current) => current + 1
    )
  }

  if (!user) {
    return (
      <div className="studio-page studio-workspace-page">
        <div className="studio-bg" />
        <div className="studio-grid" />
        <div className="studio-soft-glow" />

        <div className="studio-workspace-loading">
          Opening Pulse Studio...
        </div>
      </div>
    )
  }

  if (!hasStudioAccess) {
    return (
      <div className="studio-page studio-workspace-page">
        <div className="studio-bg" />
        <div className="studio-grid" />
        <div className="studio-soft-glow" />

        <section className="studio-access-denied">
          <div className="studio-access-denied-icon">
            ✦
          </div>

          <span>Pulse Studio</span>
          <h1>Creator access required</h1>

          <p>
            Studio is available to Team Leaders, QA,
            Supervisors and Global users.
          </p>

          <AuthorIdentity
            user={user}
            role={role}
            team={team}
          />

          <button
            type="button"
            onClick={() => navigate('/studio')}
          >
            Back to Studio
          </button>
        </section>
      </div>
    )
  }

  const renderOverview = () => (
    <>
      <section className="studio-dashboard-hero">
        <div className="studio-dashboard-hero-copy">
          <span>Creator Workspace</span>

          <h1>
            {getGreeting()}, {firstName}.
          </h1>

          <p>
            Build interactive games, organize training
            content and launch live rooms for your team.
          </p>
        </div>

        <button
          className="studio-create-game-button"
          type="button"
          onClick={openNewGame}
        >
          <span>+</span>
          Create New Game
        </button>
      </section>

      {overviewError && (
        <div className="studio-overview-alert">
          <div>
            <span>!</span>

            <div>
              <strong>Could not refresh Overview</strong>
              <small>{overviewError}</small>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshOverview}
          >
            Try Again
          </button>
        </div>
      )}

      <section className="studio-creator-profile">
        <div>
          <span className="studio-section-eyebrow">
            Your Studio identity
          </span>

          <h2>Publisher profile</h2>

          <p>
            This identity and role will appear beside every
            game you publish in the Kampaign Kings library.
          </p>
        </div>

        <div className="studio-overview-profile-side">
          <AuthorIdentity
            user={user}
            role={role}
            team={team}
          />

          <div className="studio-overview-star-total">
            <span>★</span>

            <div>
              <strong>
                {overviewLoading
                  ? '…'
                  : formatOverviewNumber(
                      overview.starsReceived
                    )}
              </strong>

              <small>Stars received</small>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-dashboard-stats studio-dashboard-stats--dynamic">
        <article>
          <span>My Games</span>

          <strong>
            {overviewLoading
              ? '…'
              : formatOverviewNumber(
                  overview.myGames
                )}
          </strong>

          <small>
            {overviewLoading
              ? 'Loading your library'
              : `${overview.drafts} draft${overview.drafts === 1 ? '' : 's'}`}
          </small>
        </article>

        <article>
          <span>Published</span>

          <strong>
            {overviewLoading
              ? '…'
              : formatOverviewNumber(
                  overview.published
                )}
          </strong>

          <small>
            {overview.published > 0
              ? 'Available from Studio'
              : 'Nothing published yet'}
          </small>
        </article>

        <article>
          <span>Total Plays</span>

          <strong>
            {overviewLoading
              ? '…'
              : formatOverviewNumber(
                  overview.totalPlays
                )}
          </strong>

          <small>Live Studio rooms created</small>
        </article>

        <article>
          <span>Average Score</span>

          <strong>
            {overviewLoading
              ? '…'
              : overview.averageScore === null
                ? '—'
                : formatOverviewNumber(
                    overview.averageScore
                  )}
          </strong>

          <small>
            {overview.averageScore === null
              ? 'Waiting for completed games'
              : 'Across finished Studio sessions'}
          </small>
        </article>

        <article className="studio-overview-stat-star">
          <span>Stars Received</span>

          <strong>
            {overviewLoading
              ? '…'
              : formatOverviewNumber(
                  overview.starsReceived
                )}
          </strong>

          <small>Community recognition</small>
        </article>
      </section>

      <section className="studio-dashboard-panels">
        <article className="studio-dashboard-panel">
          <div className="studio-dashboard-panel-header">
            <div>
              <span className="studio-section-eyebrow">
                Continue Building
              </span>

              <h2>Draft Games</h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('my-games')}
            >
              View all
            </button>
          </div>

          {overviewLoading ? (
            <div className="studio-overview-panel-loading">
              <i />
              <span>Loading drafts...</span>
            </div>
          ) : (
            <OverviewGameList
              games={overview.recentDrafts}
              emptyIcon="✦"
              emptyTitle="No drafts yet"
              emptyDescription="Start your first custom game and it will be saved here while you build it."
              onOpen={openExistingGame}
              onCreate={openNewGame}
            />
          )}
        </article>

        <article className="studio-dashboard-panel">
          <div className="studio-dashboard-panel-header">
            <div>
              <span className="studio-section-eyebrow">
                Recent Activity
              </span>

              <h2>Latest Games</h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('library')}
            >
              Open library
            </button>
          </div>

          {overviewLoading ? (
            <div className="studio-overview-panel-loading">
              <i />
              <span>Loading activity...</span>
            </div>
          ) : (
            <OverviewGameList
              games={overview.latestGames}
              emptyIcon="◇"
              emptyTitle="No recent games"
              emptyDescription="Your latest saved and published games will appear here."
              onOpen={openExistingGame}
            />
          )}
        </article>
      </section>

      <section className="studio-library-intro">
        <div className="studio-library-intro-icon">
          ◈
        </div>

        <div>
          <span className="studio-section-eyebrow">
            Kampaign Kings Library
          </span>

          <h2>
            Games created by your leadership team.
          </h2>

          <p>
            Browse games published by Team Leaders, QA,
            Supervisors and Global creators. Every game
            will show its author, team and verified role.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('library')}
        >
          Explore Library →
        </button>
      </section>
    </>
  )

  const renderBuilderOverview = () => {
    if (!editingGame && !selectedGameMode) {
      return (
        <StudioGameModeSelector
          onSelect={(gameModeId) => {
            setSelectedGameMode(gameModeId)
          }}
          onExit={() => {
            setActiveView('overview')
          }}
        />
      )
    }

    const initialBuilderGame =
      editingGame || {
        gameMode: selectedGameMode || 'classic',
        livesEnabled: false,
        livesCount: 3,
      }

    return (
      <StudioGameBuilder
        key={
          editingGame?.id ||
          `new-${selectedGameMode || 'classic'}`
        }
        user={user}
        role={role}
        teamLabel={team}
        steps={BUILDER_STEPS}
        initialGame={initialBuilderGame}
        onSaved={(savedGame) => {
          setEditingGame(savedGame)
          setSelectedGameMode(
            savedGame?.gameMode || 'classic'
          )
          refreshOverview()
        }}
        onExit={() => {
          if (!editingGame?.id) {
            setSelectedGameMode(null)
            return
          }

          setEditingGame(null)
          setSelectedGameMode(null)
          setActiveView('my-games')
        }}
      />
    )
  }

  const renderMyGames = () => (
    <StudioMyGames
      user={user}
      role={role}
      onCreate={openNewGame}
      onContinue={openExistingGame}
    />
  )

  const renderEmptyView = () => {
    const view = STUDIO_NAV_ITEMS.find(
      (item) => item.id === activeView
    )

    const descriptions = {
      library:
        'Games published by Kampaign Kings creators will appear here.',
      reports:
        'Studio game reports and live-session analytics will appear here.',
    }

    return (
      <section className="studio-dashboard-view-empty">
        <div>{view?.icon || '✦'}</div>

        <span className="studio-section-eyebrow">
          Pulse Studio
        </span>

        <h1>{view?.label}</h1>

        <p>
          {descriptions[activeView] ||
            'This Studio module is being prepared.'}
        </p>

        <button
          type="button"
          onClick={() => setActiveView('overview')}
        >
          Back to Overview
        </button>
      </section>
    )
  }

  return (
    <div className="studio-page studio-workspace-page">
      <div className="studio-bg" />
      <div className="studio-grid" />
      <div className="studio-soft-glow" />

      <div className="studio-workspace-shell">
        <aside className="studio-workspace-sidebar">
          <button
            className="studio-workspace-logo"
            type="button"
            onClick={() => navigate('/studio')}
          >
            <span>PULSE</span>
            <strong>STUDIO</strong>
          </button>

          <div className="studio-sidebar-label">
            Workspace
          </div>

          <nav className="studio-workspace-navigation">
            {STUDIO_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  activeView === item.id ? 'active' : ''
                }
                onClick={() => {
                  if (item.id === 'create') {
                    openNewGame()
                    return
                  }

                  setEditingGame(null)
                  setSelectedGameMode(null)

                  if (item.id === 'overview') {
                    refreshOverview()
                  }

                  setActiveView(item.id)
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="studio-sidebar-account">
            <AuthorIdentity
              user={user}
              role={role}
              team={team}
              compact
            />
          </div>
        </aside>

        <main className="studio-workspace-main">
          <header className="studio-workspace-topbar">
            <button
              type="button"
              onClick={() => navigate('/studio')}
            >
              ← Studio Home
            </button>

            <div className="studio-workspace-topbar-user">
              <span>{user.name}</span>
              <RoleBadge role={role} />
            </div>
          </header>

          <div className="studio-workspace-content">
            {activeView === 'overview' &&
              renderOverview()}

            {activeView === 'my-games' &&
              renderMyGames()}

            {activeView === 'create' &&
              renderBuilderOverview()}

            {activeView !== 'overview' &&
              activeView !== 'my-games' &&
              activeView !== 'create' &&
              renderEmptyView()}
          </div>
        </main>
      </div>
    </div>
  )
}
