import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

const LEADERBOARD_KEY = 'pulse_go_leaderboard'

function readLeaderboard() {
  if (typeof window === 'undefined') return []

  const keys = [LEADERBOARD_KEY, 'pulseGoLeaderboard', 'pulse_go_scores']

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue

      const parsed = JSON.parse(raw)

      if (Array.isArray(parsed)) {
        return parsed
          .map((item, index) => ({
            id: item.id || item.name || index,
            name: item.name || item.player || item.agent || 'Unknown',
            avatar: item.avatar || '👑',
            points: Number(item.points || item.score || item.total || 0),
            games: Number(item.games || 0),
            bestScore: Number(item.bestScore || 0),
            lastScore: Number(item.lastScore || 0),
          }))
          .filter((item) => item.name)
          .sort((a, b) => b.points - a.points)
      }

      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([name, value], index) => ({
            id: name || index,
            name,
            avatar: value?.avatar || '👑',
            points: Number(value?.points || value?.score || value?.total || 0),
            games: Number(value?.games || 0),
            bestScore: Number(value?.bestScore || 0),
            lastScore: Number(value?.lastScore || 0),
          }))
          .filter((item) => item.name)
          .sort((a, b) => b.points - a.points)
      }
    } catch {
      // Ignore invalid localStorage data
    }
  }

  return []
}

function formatPoints(value) {
  return Number(value || 0).toLocaleString()
}

export default function GoLanding() {
  const navigate = useNavigate()
  const titleRef = useRef(null)

  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')
  const [leaders, setLeaders] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: `${4 + ((i * 17) % 92)}%`,
        y: `${8 + ((i * 29) % 84)}%`,
        delay: `${i * 0.13}s`,
        speed: `${4.4 + (i % 7) * 0.35}s`,
      })),
    []
  )

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120)
    setLeaders(readLeaderboard())
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const refreshLeaderboard = () => setLeaders(readLeaderboard())

    window.addEventListener('storage', refreshLeaderboard)
    window.addEventListener('focus', refreshLeaderboard)

    return () => {
      window.removeEventListener('storage', refreshLeaderboard)
      window.removeEventListener('focus', refreshLeaderboard)
    }
  }, [])

  useEffect(() => {
    if (!showLeaderboard) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setShowLeaderboard(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showLeaderboard])

  useEffect(() => {
    const title = titleRef.current
    if (!title) return

    const onMove = (e) => {
      const rect = title.getBoundingClientRect()
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)

      title.style.transform = `perspective(700px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`
    }

    const onLeave = () => {
      title.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)'
    }

    title.addEventListener('mousemove', onMove)
    title.addEventListener('mouseleave', onLeave)

    return () => {
      title.removeEventListener('mousemove', onMove)
      title.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  const handleEnter = () => {
    const clean = code.trim().toUpperCase().replace(/\s+/g, '')
    if (!clean) return

    const roomCode = clean.startsWith('KK') ? clean : `KK${clean}`

    if (roomCode.length >= 6) {
      navigate(`/go/quiz/${roomCode}`)
    }
  }

  const openLeaderboard = () => {
    setLeaders(readLeaderboard())
    setShowLeaderboard(true)
  }

  const displayedLeaders = leaders.slice(0, 10)

  return (
    <div className="gol-wrap">
      <div className="gol-grid" />
      <div className="gol-glow gol-glow-one" />
      <div className="gol-glow gol-glow-two" />

      <div className="gol-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="gol-particle"
            style={{
              left: p.x,
              top: p.y,
              animationDelay: p.delay,
              animationDuration: p.speed,
            }}
          />
        ))}
      </div>

      <nav className="gol-nav">
        <div className="gol-nav-tabs">
          <button className="gol-nav-tab" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>

          <button className="gol-nav-tab active" onClick={() => navigate('/go')}>
            Pulse GO
          </button>

          <button className="gol-nav-tab" onClick={() => navigate('/go/academy')}>
            Academy
          </button>
        </div>
      </nav>

      <main className={`gol-hero ${visible ? 'visible' : ''}`}>
        <section className="gol-hero-main">
          <h1 className="gol-title" ref={titleRef}>
            <span>PULSE</span>
            <strong>GO</strong>
          </h1>

          <p className="gol-sub">
            Train faster, compete with your team, and track learning performance in one place.
          </p>

          <div className="gol-hero-actions">
            <button className="gol-action primary" onClick={() => navigate('/go/quiz')}>
              Start Training →
            </button>

            <button className="gol-action ghost" onClick={() => navigate('/go/academy')}>
              Open Academy
            </button>

            <button className="gol-action ghost" onClick={openLeaderboard}>
              Leaderboard
            </button>
          </div>
        </section>

        <section className="gol-room-section">
          <div className="gol-room-card">
            <div className="gol-panel-head small">
              <div>
                <span className="gol-panel-kicker">Join room</span>
                <h2>Enter a code</h2>
              </div>
            </div>

            <div className="gol-input-wrap">
              <span>KK</span>
              <input
                className="gol-input"
                type="text"
                placeholder="1234"
                value={code}
                onChange={(e) => {
                  const next = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .replace(/^KK/, '')
                    .slice(0, 6)

                  setCode(next)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                autoComplete="off"
              />
            </div>

            <button
              className="gol-btn-primary"
              onClick={handleEnter}
              disabled={code.trim().length < 4}
            >
              Join Room →
            </button>

            <p className="gol-card-note">
              Use a room code from a hosted Pulse GO game.
            </p>
          </div>
        </section>
      </main>

      {showLeaderboard && (
        <div className="gol-modal-backdrop" onMouseDown={() => setShowLeaderboard(false)}>
          <section className="gol-leader-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="gol-modal-head">
              <div>
                <span className="gol-panel-kicker">Leaderboard</span>
                <h2>Top Pulse GO</h2>
              </div>

              <button className="gol-modal-close" onClick={() => setShowLeaderboard(false)}>
                ×
              </button>
            </div>

            <div className="gol-leader-list">
              {displayedLeaders.length > 0 ? (
                displayedLeaders.map((player, index) => (
                  <div key={player.id} className="gol-leader-row">
                    <span className={`gol-rank rank-${index + 1}`}>#{index + 1}</span>

                    <div className="gol-player">
                      <span className="gol-avatar">{player.avatar}</span>
                      <div>
                        <strong>{player.name}</strong>
                        <small>
                          {player.games > 0
                            ? `${player.games} game${player.games !== 1 ? 's' : ''} · best ${formatPoints(player.bestScore)}`
                            : 'Training score'}
                        </small>
                      </div>
                    </div>

                    <b>{formatPoints(player.points)}</b>
                  </div>
                ))
              ) : (
                <div className="gol-empty-leaderboard">
                  <span>🏆</span>
                  <strong>No scores yet</strong>
                  <p>
                    Play a hosted room or training game. Scores saved on this device will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
