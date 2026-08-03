import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { getStudioMyGames } from './studioGamesApi'
import './StudioMyGames.css'

const FILTERS = [
  {
    id: 'all',
    label: 'All',
  },
  {
    id: 'draft',
    label: 'Drafts',
  },
  {
    id: 'published',
    label: 'Published',
  },
  {
    id: 'archived',
    label: 'Archived',
  },
]

const LANGUAGE_LABELS = {
  en: {
    label: 'English',
    icon: '🇺🇸',
  },
  es: {
    label: 'Spanish',
    icon: '🇲🇽',
  },
  mixed: {
    label: 'Mixed',
    icon: '🔀',
  },
}

const TEAM_LABELS = {
  global: 'All Teams',
  philippines: 'Philippines',
  venezuela: 'Venezuela',
  colombia: 'Colombia',
  mexico: 'Mexico BJ',
  central: 'Central America',
  asia: 'Asia',
}

const VISIBILITY_LABELS = {
  private: {
    label: 'Private',
    icon: '🔒',
  },
  team: {
    label: 'My Team',
    icon: '👥',
  },
  global: {
    label: 'All Kampaign Kings',
    icon: '🌐',
  },
}

const ROLE_LABELS = {
  global: 'Global',
  supervisor: 'Supervisor',
  qa: 'QA',
  leader: 'Team Leader',
}

function getInitials(name) {
  const parts = String(name || 'Pulse Creator')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'P'

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase()
}

function formatUpdatedAt(value) {
  if (!value) return 'Recently updated'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function clampStep(value) {
  return Math.min(
    5,
    Math.max(1, Number(value || 1))
  )
}

function StudioGameCard({
  game,
  onContinue,
}) {
  const language =
    LANGUAGE_LABELS[game.language] ||
    LANGUAGE_LABELS.en

  const visibility =
    VISIBILITY_LABELS[game.visibility] ||
    VISIBILITY_LABELS.private

  const team =
    TEAM_LABELS[game.team] ||
    game.team ||
    'All Teams'

  const roleLabel =
    ROLE_LABELS[game.ownerRole] ||
    game.ownerRole ||
    'Creator'

  const currentStep = clampStep(
    game.currentStep
  )

  const progress =
    (currentStep / 5) * 100

  const isDraft = game.status === 'draft'

  return (
    <article className="studio-my-game-card">
      <div className="studio-my-game-cover">
        <div className="studio-my-game-cover-glow" />

        <span className="studio-my-game-cover-icon">
          {game.coverEmoji || '🎮'}
        </span>

        <span
          className={`studio-my-game-status studio-my-game-status--${game.status}`}
        >
          {game.status}
        </span>
      </div>

      <div className="studio-my-game-body">
        <div className="studio-my-game-chips">
          <span>
            {language.icon}
            {language.label}
          </span>

          <span>{team}</span>
        </div>

        <h2>{game.title}</h2>

        <p>
          {game.description ||
            'No description has been added yet.'}
        </p>

        <div className="studio-my-game-visibility">
          <span>{visibility.icon}</span>

          <div>
            <strong>
              {visibility.label}
            </strong>

            <small>
              {game.visibility === 'team'
                ? team
                : visibility.label}
            </small>
          </div>
        </div>

        <div className="studio-my-game-progress">
          <div className="studio-my-game-progress-header">
            <span>
              {isDraft
                ? `Step ${currentStep} of 5`
                : 'Game completed'}
            </span>

            <strong>
              {Math.round(progress)}%
            </strong>
          </div>

          <div className="studio-my-game-progress-track">
            <i
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="studio-my-game-updated">
          Last edited{' '}
          {formatUpdatedAt(game.updatedAt)}
        </div>

        <div className="studio-my-game-footer">
          <div className="studio-my-game-author">
            <div
              className={`studio-my-game-avatar studio-author-avatar--${game.ownerRole}`}
            >
              {getInitials(game.ownerName)}
              <i />
            </div>

            <div>
              <span>Created by</span>
              <strong>{game.ownerName}</strong>
            </div>

            <span
              className={`studio-role-badge studio-role-badge--${game.ownerRole}`}
            >
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onContinue(game)}
          >
            {isDraft
              ? 'Continue Building'
              : 'Open Game'}

            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  )
}

export default function StudioMyGames({
  user,
  role,
  onCreate,
  onContinue,
}) {
  const [games, setGames] = useState([])
  const [activeFilter, setActiveFilter] =
    useState('all')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] = useState('')

  const loadGames = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const loadedGames =
        await getStudioMyGames({
          user,
          role,
        })

      setGames(loadedGames)
    } catch (loadError) {
      console.error(loadError)

      setError(
        loadError?.message ||
          'Could not load your Studio games.'
      )
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  const filterCounts = useMemo(() => {
    return {
      all: games.length,

      draft: games.filter(
        (game) => game.status === 'draft'
      ).length,

      published: games.filter(
        (game) =>
          game.status === 'published'
      ).length,

      archived: games.filter(
        (game) =>
          game.status === 'archived'
      ).length,
    }
  }, [games])

  const visibleGames = useMemo(() => {
    if (activeFilter === 'all') {
      return games
    }

    return games.filter(
      (game) =>
        game.status === activeFilter
    )
  }, [games, activeFilter])

  return (
    <section className="studio-my-games">
      <header className="studio-my-games-header">
        <div>
          <span className="studio-section-eyebrow">
            Creator Library
          </span>

          <h1>My Games</h1>

          <p>
            Continue your drafts, manage published
            games and review everything you have
            created in Pulse Studio.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
        >
          <span>+</span>
          Create New Game
        </button>
      </header>

      <nav className="studio-my-games-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={
              activeFilter === filter.id
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveFilter(filter.id)
            }
          >
            {filter.label}

            <span>
              {filterCounts[filter.id]}
            </span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="studio-my-games-state">
          <div className="studio-my-games-loader" />

          <strong>
            Loading your games...
          </strong>

          <p>
            Reading your Studio library from
            Supabase.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="studio-my-games-state studio-my-games-state--error">
          <div>!</div>

          <strong>
            Could not load My Games
          </strong>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadGames}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        visibleGames.length === 0 && (
          <div className="studio-my-games-state">
            <div>
              {activeFilter === 'draft'
                ? '✦'
                : '◇'}
            </div>

            <strong>
              {games.length === 0
                ? 'Your Studio library is empty'
                : `No ${activeFilter} games`}
            </strong>

            <p>
              {games.length === 0
                ? 'Create your first custom game and save it as a draft.'
                : 'There are no games inside this category yet.'}
            </p>

            {games.length === 0 && (
              <button
                type="button"
                onClick={onCreate}
              >
                Create Your First Game
              </button>
            )}
          </div>
        )}

      {!loading &&
        !error &&
        visibleGames.length > 0 && (
          <div className="studio-my-games-grid">
            {visibleGames.map((game) => (
              <StudioGameCard
                key={game.id}
                game={game}
                onContinue={onContinue}
              />
            ))}
          </div>
        )}
    </section>
  )
}