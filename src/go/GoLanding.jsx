import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

export default function GoLanding() {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const rafRef = useRef(null)

  const targetRef = useRef({ x: 0.5, y: 0.55 })
  const currentRef = useRef({ x: 0.5, y: 0.55 })

  const [code, setCode] = useState('')

  useEffect(() => {
    const tick = () => {
      const page = pageRef.current
      if (!page) return

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.08
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.08

      const px = `${currentRef.current.x * 100}%`
      const py = `${currentRef.current.y * 100}%`

      const shiftX = (currentRef.current.x - 0.5) * 30
      const shiftY = (currentRef.current.y - 0.5) * 18

      page.style.setProperty('--mx', px)
      page.style.setProperty('--my', py)
      page.style.setProperty('--orb-x', `${shiftX}px`)
      page.style.setProperty('--orb-y', `${shiftY}px`)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleMouseMove = (e) => {
    const page = pageRef.current
    if (!page) return

    const rect = page.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    targetRef.current.x = Math.max(0, Math.min(1, x))
    targetRef.current.y = Math.max(0, Math.min(1, y))
  }

  const handleMouseLeave = () => {
    targetRef.current.x = 0.5
    targetRef.current.y = 0.55
  }

  const handleJoinRoom = () => {
    const clean = code
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .replace(/^KK/, '')
      .slice(0, 6)

    if (clean.length < 4) return

    navigate(`/go/quiz/KK${clean}`)
  }

  const handleHostGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const handlePractice = () => {
    navigate('/go/quiz?mode=solo')
  }

  return (
    <div
      ref={pageRef}
      className="pgl-page"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="pgl-bg" />
      <div className="pgl-grid" />
      <div className="pgl-noise" />
      <div className="pgl-cursor-glow" />

      <div className="pgl-orb-wrap" aria-hidden="true">
        <div className="pgl-orb-ambient" />
        <div className="pgl-orb-ring pgl-orb-ring-1" />
        <div className="pgl-orb-ring pgl-orb-ring-2" />
        <div className="pgl-orb-ring pgl-orb-ring-3" />
        <div className="pgl-orb-ring pgl-orb-ring-4" />
        <div className="pgl-orb-wave pgl-orb-wave-1" />
        <div className="pgl-orb-wave pgl-orb-wave-2" />
        <div className="pgl-orb-wave pgl-orb-wave-3" />
        <div className="pgl-orb-glow" />
        <div className="pgl-orb-core" />
        <div className="pgl-orb-horizon" />
        <div className="pgl-orb-reflection" />
      </div>

      <div className="pgl-stars" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`pgl-star pgl-star-${i + 1}`} />
        ))}
      </div>

      <nav className="pgl-nav">
        <div className="pgl-nav-pill">
          <button className="pgl-nav-link" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>

          <button className="pgl-nav-link pgl-nav-link-active" onClick={() => navigate('/go')}>
            Pulse GO
          </button>

          <button className="pgl-nav-link" onClick={() => navigate('/go/learn')}>
            Academy
          </button>
        </div>
      </nav>

      <main className="pgl-hero">
        <h1 className="pgl-title">
          <span className="pgl-title-main">PULSE</span>
          <span className="pgl-title-go">GO</span>
        </h1>

        <p className="pgl-subtitle">
          Train faster, compete with your team, and sharpen every call skill in one place.
        </p>

        <div className="pgl-actions">
          <button className="pgl-action-btn" onClick={handleHostGame}>
            Host a Game →
          </button>

          <button className="pgl-action-btn" onClick={handlePractice}>
            Practice
          </button>
        </div>

        <section className="pgl-room-card">
          <span className="pgl-room-kicker">Join room</span>
          <h2 className="pgl-room-title">Enter a code</h2>

          <div className="pgl-code-box">
            <span className="pgl-code-prefix">KK</span>
            <input
              type="text"
              className="pgl-code-input"
              placeholder="1234"
              value={code}
              onChange={(e) => {
                const clean = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .replace(/^KK/, '')
                  .slice(0, 6)

                setCode(clean)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinRoom()
              }}
              autoComplete="off"
            />
          </div>

          <button
            className="pgl-join-btn"
            onClick={handleJoinRoom}
            disabled={code.trim().length < 4}
          >
            Join Room →
          </button>
        </section>
      </main>
    </div>
  )
}