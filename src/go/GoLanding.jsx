import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

export default function GoLanding() {
  const navigate = useNavigate()
  const titleRef = useRef(null)

  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')

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
    return () => clearTimeout(t)
  }, [])

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
            Train faster, compete with your team, and sharpen every call skill in one place.
          </p>

          <div className="gol-hero-actions">
            <button
              className="gol-action primary"
              onClick={() => navigate('/go/quiz?mode=host')}
            >
              Host a Game →
            </button>

            <button
              className="gol-action ghost"
              onClick={() => navigate('/go/quiz?mode=solo')}
            >
              Practice
            </button>
          </div>
        </section>

        <section className="gol-dashboard-grid gol-dashboard-grid-single">
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
    </div>
  )
}