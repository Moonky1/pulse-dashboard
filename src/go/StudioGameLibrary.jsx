import { useEffect, useMemo, useState } from 'react'
import { getStudioLibrary, toggleStudioGameStar } from './studioLibraryApi'
import './StudioGameLibrary.css'

const LANGUAGE_LABELS = { en: 'English', es: 'Spanish', mixed: 'Mixed' }
const TEAM_LABELS = {
  global: 'All Teams',
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

const clean = (value) => String(value || '').trim().toLowerCase()
const number = (value) => Number(value || 0).toLocaleString('en-US')

function dateLabel(value) {
  if (!value) return 'Recently published'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently published'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function initials(name) {
  const parts = String(name || 'Pulse Creator').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function GameCard({ game, starBusy, onStar }) {
  const team = TEAM_LABELS[clean(game.team)] || game.team || 'All Teams'
  const ownerTeam = TEAM_LABELS[clean(game.ownerTeam)] || game.ownerTeam || 'Global'
  const role = ROLE_LABELS[clean(game.ownerRole)] || game.ownerRole || 'Creator'
  const language = LANGUAGE_LABELS[clean(game.language)] || game.language || 'English'

  return (
    <article className="studio-library-card">
      <div className="studio-library-cover">
        <span className="studio-library-cover-emoji">{game.coverEmoji || '🎮'}</span>
        <span className="studio-library-mode">Classic Quiz</span>
        <span className="studio-library-published">Published</span>
      </div>

      <div className="studio-library-body">
        <div className="studio-library-title-row">
          <div>
            <span className="studio-library-language">{language}</span>
            <h2>{game.title || 'Untitled Game'}</h2>
          </div>

          <div className="studio-library-stars">
            <span>★</span>
            <strong>{number(game.starCount)}</strong>
          </div>
        </div>

        {game.description && (
          <p className="studio-library-description">{game.description}</p>
        )}

        <div className="studio-library-meta">
          <div><span>Team</span><strong>{team}</strong></div>
          <div><span>Questions</span><strong>{number(game.questionCount)}</strong></div>
          <div><span>Plays</span><strong>{number(game.playCount)}</strong></div>
          <div><span>Published</span><strong>{dateLabel(game.publishedAt)}</strong></div>
        </div>

        <div className="studio-library-author">
          <div className="studio-library-avatar">{initials(game.ownerName)}</div>
          <div>
            <span>Created by</span>
            <strong>{game.ownerName || 'Pulse Creator'}</strong>
            <small>{role} · {ownerTeam}</small>
          </div>
        </div>

        <div className="studio-library-footer">
          <small>
            {clean(game.visibility) === 'team'
              ? `Visible to ${team}`
              : 'Available to all teams'}
          </small>

          {game.canStar ? (
            <button
              type="button"
              className={game.viewerStarred ? 'active' : ''}
              disabled={starBusy === game.id}
              onClick={() => onStar(game)}
            >
              ★ {starBusy === game.id
                ? 'Saving...'
                : game.viewerStarred
                  ? 'Starred'
                  : 'Give a star'}
            </button>
          ) : (
            <span className="studio-library-own">Your game</span>
          )}
        </div>
      </div>
    </article>
  )
}

export default function StudioGameLibrary({ user, role, onStarChanged }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [team, setTeam] = useState('all')
  const [starBusy, setStarBusy] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return undefined

    let cancelled = false
    setLoading(true)
    setError('')

    getStudioLibrary({ user, role })
      .then((data) => {
        if (!cancelled) setGames(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load the Studio game library.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, role, refreshKey])

  const teams = useMemo(() => {
    return [...new Set(games.map((game) => clean(game.team)).filter(Boolean))].sort()
  }, [games])

  const filtered = useMemo(() => {
    const query = clean(search)

    return games.filter((game) => {
      const teamMatches = team === 'all' || clean(game.team) === team
      if (!teamMatches) return false
      if (!query) return true

      return [
        game.title,
        game.description,
        game.ownerName,
        game.ownerRole,
        game.ownerTeam,
        game.team,
        game.language,
      ].map(clean).join(' ').includes(query)
    })
  }, [games, search, team])

  const totalStars = useMemo(
    () => games.reduce((sum, game) => sum + Number(game.starCount || 0), 0),
    [games]
  )

  const toggleStar = async (game) => {
    if (!game?.id || !game.canStar || starBusy) return

    setStarBusy(game.id)
    setError('')

    try {
      const result = await toggleStudioGameStar({
        gameId: game.id,
        user,
        role,
      })

      setGames((current) =>
        current.map((item) =>
          item.id === game.id
            ? {
                ...item,
                viewerStarred: result.starred,
                starCount: result.starCount,
              }
            : item
        )
      )

      onStarChanged?.(result)
    } catch (err) {
      setError(err?.message || 'Could not update this star.')
    } finally {
      setStarBusy('')
    }
  }

  return (
    <section className="studio-game-library">
      <header className="studio-library-header">
        <div>
          <span className="studio-section-eyebrow">Community Library</span>
          <h1>Game Library</h1>
          <p>
            Discover published games from Pulse Studio creators and recognize the
            best training content.
          </p>
        </div>

        <div className="studio-library-summary">
          <div>
            <span>Published Games</span>
            <strong>{loading ? '…' : number(games.length)}</strong>
          </div>
          <div>
            <span>Community Stars</span>
            <strong>{loading ? '…' : number(totalStars)}</strong>
          </div>
        </div>
      </header>

      <div className="studio-library-toolbar">
        <input
          type="search"
          placeholder="Search games or creators..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={team} onChange={(event) => setTeam(event.target.value)}>
          <option value="all">All teams</option>
          {teams.map((teamId) => (
            <option key={teamId} value={teamId}>
              {TEAM_LABELS[teamId] || teamId}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <div className="studio-library-error">! {error}</div>}

      {loading ? (
        <div className="studio-library-empty">Loading published games...</div>
      ) : filtered.length ? (
        <div className="studio-library-grid">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              starBusy={starBusy}
              onStar={toggleStar}
            />
          ))}
        </div>
      ) : (
        <div className="studio-library-empty">
          <div>◇</div>
          <h2>No published games found</h2>
          <p>Published games available to your account will appear here.</p>
        </div>
      )}
    </section>
  )
}
