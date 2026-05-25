import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

const STARS = [
  { top: '10%', left: '8%', delay: '0s' },
  { top: '16%', left: '24%', delay: '1.2s' },
  { top: '11%', left: '52%', delay: '2s' },
  { top: '18%', left: '77%', delay: '1.6s' },
  { top: '13%', left: '90%', delay: '0.8s' },
  { top: '29%', left: '14%', delay: '2.3s' },
  { top: '34%', left: '32%', delay: '1.1s' },
  { top: '27%', left: '63%', delay: '2.8s' },
  { top: '36%', left: '83%', delay: '1.9s' },
  { top: '49%', left: '10%', delay: '0.6s' },
  { top: '47%', left: '26%', delay: '1.8s' },
  { top: '51%', left: '72%', delay: '2.2s' },
  { top: '60%', left: '16%', delay: '3s' },
  { top: '58%', left: '40%', delay: '1.4s' },
  { top: '63%', left: '85%', delay: '2.6s' },
  { top: '73%', left: '12%', delay: '1.5s' },
  { top: '76%', left: '33%', delay: '3.2s' },
  { top: '81%', left: '68%', delay: '2.7s' },
  { top: '84%', left: '88%', delay: '1.7s' },
]

const ORBITS = [
  { size: 360, duration: 16, delay: 0, dot: 3, angle: 0 },
  { size: 430, duration: 19, delay: -3, dot: 2, angle: 120 },
  { size: 520, duration: 24, delay: -7, dot: 3, angle: 220 },
  { size: 620, duration: 28, delay: -10, dot: 2, angle: 40 },
  { size: 700, duration: 33, delay: -15, dot: 2, angle: 180 },
  { size: 780, duration: 38, delay: -21, dot: 3, angle: 300 },
]

const DRIFT_PARTICLES = [
  { x: '20%', y: '69%', dx: '180px', dy: '-140px', duration: '8s', delay: '0s', size: '3px' },
  { x: '26%', y: '73%', dx: '170px', dy: '-120px', duration: '9s', delay: '-2s', size: '2px' },
  { x: '30%', y: '78%', dx: '140px', dy: '-150px', duration: '7s', delay: '-4s', size: '3px' },
  { x: '66%', y: '75%', dx: '-150px', dy: '-135px', duration: '8.5s', delay: '-1s', size: '2px' },
  { x: '72%', y: '70%', dx: '-175px', dy: '-145px', duration: '10s', delay: '-5s', size: '3px' },
  { x: '78%', y: '76%', dx: '-190px', dy: '-110px', duration: '9.2s', delay: '-3s', size: '2px' },
  { x: '39%', y: '82%', dx: '60px', dy: '-170px', duration: '7.5s', delay: '-2.6s', size: '2px' },
  { x: '60%', y: '83%', dx: '-50px', dy: '-175px', duration: '8.7s', delay: '-6s', size: '3px' },
]

export default function GoLanding() {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const rafRef = useRef(null)

  const targetRef = useRef({ x: 0.5, y: 0.45 })
  const currentRef = useRef({ x: 0.5, y: 0.45 })

  const [code, setCode] = useState('')

  useEffect(() => {
    const animate = () => {
      const page = pageRef.current
      if (!page) return

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.06
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.06

      const mx = `${currentRef.current.x * 100}%`
      const my = `${currentRef.current.y * 100}%`
      const shiftX = (currentRef.current.x - 0.5) * 22
      const shiftY = (currentRef.current.y - 0.5) * 16

      page.style.setProperty('--mx', mx)
      page.style.setProperty('--my', my)
      page.style.setProperty('--orb-shift-x', `${shiftX}px`)
      page.style.setProperty('--orb-shift-y', `${shiftY}px`)

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

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
    targetRef.current.y = 0.45
  }

  const handleHostGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const handlePractice = () => {
    navigate('/go/quiz?mode=solo')
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

  return (
    <div
      ref={pageRef}
      className="pgl-page"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="pgl-bg" />
      <div className="pgl-grid" />
      <div className="pgl-cursor-glow" />

      <div className="pgl-stars" aria-hidden="true">
        {STARS.map((star, i) => (
          <span
            key={`star-${i}`}
            className="pgl-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      <div className="pgl-orb-scene" aria-hidden="true">
        <div className="pgl-orb-ambient" />
        <div className="pgl-orb-smoke pgl-orb-smoke-1" />
        <div className="pgl-orb-smoke pgl-orb-smoke-2" />
        <div className="pgl-orb-smoke pgl-orb-smoke-3" />
        <div className="pgl-orb-halo" />
        <div className="pgl-orb-ring pgl-orb-ring-1" />
        <div className="pgl-orb-ring pgl-orb-ring-2" />
        <div className="pgl-orb-ring pgl-orb-ring-3" />
        <div className="pgl-orb-ring pgl-orb-ring-4" />
        <div className="pgl-orb-core-glow" />
        <div className="pgl-orb-core" />
        <div className="pgl-orb-reflection" />

        <div className="pgl-orbits">
          {ORBITS.map((orbit, i) => (
            <span
              key={`orbit-${i}`}
              className="pgl-orbit"
              style={{
                '--orbit-size': `${orbit.size}px`,
                '--orbit-duration': `${orbit.duration}s`,
                '--orbit-delay': `${orbit.delay}s`,
                '--orbit-dot': `${orbit.dot}px`,
                '--orbit-angle': `${orbit.angle}deg`,
              }}
            >
              <span className="pgl-orbit-dot" />
            </span>
          ))}
        </div>

        <div className="pgl-drift-particles">
          {DRIFT_PARTICLES.map((p, i) => (
            <span
              key={`drift-${i}`}
              className="pgl-drift-particle"
              style={{
                left: p.x,
                top: p.y,
                '--dx': p.dx,
                '--dy': p.dy,
                '--drift-duration': p.duration,
                '--drift-delay': p.delay,
                '--drift-size': p.size,
              }}
            />
          ))}
        </div>
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

      <main className="pgl-content">
        <h1 className="pgl-title">
          <span className="pgl-title-main">PULSE</span>
          <span className="pgl-title-go">GO</span>
        </h1>

        <p className="pgl-subtitle">
          Live rooms, solo practice, and sharper call-flow drills.
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