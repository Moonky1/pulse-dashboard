import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'
import './StudioDashboard.css'

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

const ROLE_LABELS = {
  global: 'Global',
  supervisor: 'Supervisor',
  qa: 'QA',
  leader: 'Team Leader',
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
    description: 'Title, description, language, team and visibility.',
  },
  {
    number: '02',
    title: 'Game Settings',
    description: 'Question timer, scoring and game behavior.',
  },
  {
    number: '03',
    title: 'Questions',
    description: 'Create questions, answers, explanations and audio.',
  },
  {
    number: '04',
    title: 'Preview',
    description: 'Play through the game before publishing it.',
  },
  {
    number: '05',
    title: 'Publish & Host',
    description: 'Publish the game and generate a live KK room.',
  },
]

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

  const [activeView, setActiveView] = useState('overview')

  const user = useMemo(() => readStoredUser(), [])

  const role = useMemo(
    () => resolveRole(user?.role, user?.team),
    [user]
  )

  const team =
    TEAM_LABELS[String(user?.team || '').toLowerCase()] ||
    user?.team ||
    'Global'

  const hasStudioAccess =
    ALLOWED_STUDIO_ROLES.includes(role.id)

  const firstName =
    String(user?.name || 'Creator')
      .trim()
      .split(/\s+/)[0] || 'Creator'

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
          onClick={() => setActiveView('create')}
        >
          <span>+</span>
          Create New Game
        </button>
      </section>

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

        <AuthorIdentity
          user={user}
          role={role}
          team={team}
        />
      </section>

      <section className="studio-dashboard-stats">
        <article>
          <span>My Games</span>
          <strong>0</strong>
          <small>No games created yet</small>
        </article>

        <article>
          <span>Published</span>
          <strong>0</strong>
          <small>Nothing published yet</small>
        </article>

        <article>
          <span>Total Plays</span>
          <strong>0</strong>
          <small>Live game sessions</small>
        </article>

        <article>
          <span>Average Score</span>
          <strong>—</strong>
          <small>Waiting for results</small>
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

          <StudioEmptyState
            icon="✦"
            title="No drafts yet"
            description="Start your first custom game and it will be saved here while you build it."
            actionLabel="Create Your Game"
            onAction={() => setActiveView('create')}
          />
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

          <StudioEmptyState
            icon="◇"
            title="The library is ready"
            description="Published games from authorized creators will appear here."
          />
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

          <h2>Games created by your leadership team.</h2>

          <p>
            Browse games published by Team Leaders, QA,
            Supervisors and Global creators. Every game will
            show its author, team and verified role.
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

  const renderBuilderOverview = () => (
    <section className="studio-builder-overview">
      <div className="studio-builder-heading">
        <span className="studio-section-eyebrow">
          Game Builder
        </span>

        <h1>Create Your Game</h1>

        <p>
          The builder will guide creators from the first
          question to a live Pulse GO lobby.
        </p>
      </div>

      <AuthorIdentity
        user={user}
        role={role}
        team={team}
        compact
      />

      <div className="studio-builder-steps">
        {BUILDER_STEPS.map((step) => (
          <article key={step.number}>
            <span>{step.number}</span>

            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="studio-builder-next">
        <div>
          <span>Next development phase</span>
          <strong>
            Game details and draft saving
          </strong>
        </div>

        <button
          type="button"
          disabled
        >
          Builder coming next
        </button>
      </div>
    </section>
  )

  const renderEmptyView = () => {
    const view = STUDIO_NAV_ITEMS.find(
      (item) => item.id === activeView
    )

    const descriptions = {
      'my-games':
        'Your drafts and published games will be managed from this section.',
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
                onClick={() => setActiveView(item.id)}
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

            {activeView === 'create' &&
              renderBuilderOverview()}

            {activeView !== 'overview' &&
              activeView !== 'create' &&
              renderEmptyView()}
          </div>
        </main>
      </div>
    </div>
  )
}