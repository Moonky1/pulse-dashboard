import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

export default function GoLanding() {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const titleRef = useRef(null)
  const rafRef = useRef(null)
  const pointerRef = useRef({ x: 0, y: 0 })

  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')
  const [ripples, setRipples] = useState([])

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

      title.style.transform = `perspective(760px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg)`
    }

    const onLeave = () => {
      title.style.transform = 'perspective(760px) rotateX(0deg) rotateY(0deg)'
    }

    title.addEventListener('mousemove', onMove)
    title.addEventListener('mouseleave', onLeave)

    return () => {
      title.removeEventListener('mousemove', onMove)
      title.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const wrap = wrapRef.current
      if (wrap) {
        wrap.style.setProperty('--mx', `${pointerRef.current.x}px`)
        wrap.style.setProperty('--my', `${pointerRef.current.y}px`)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleMouseMove = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    pointerRef.current.x = e.clientX - rect.left
    pointerRef.current.y = e.clientY - rect.top
  }

  const handlePointerDown = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()

    const ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    setRipples((prev) => [...prev.slice(-2), ripple])

    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id))
    }, 850)
  }

  const handleEnter = () => {
    const clean = code.trim().toUpperCase().replace(/\s+/g, '')
    if (!clean) return

    const roomCode = clean.startsWith('KK') ? clean : `KK${clean}`

    if (roomCode.length >= 6) {
      navigate(`/go/quiz/${roomCode}`)
    }
  }

  return (
    <div
      ref={wrapRef}
      className="gol-wrap"
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
    >
      <div className="gol-bg-base" />
      <div className="gol-bg-noise" />
      <div className="gol-grid" />
      <div className="gol-sun-wrap">
        <div className="gol-sun-halo" />
        <div className="gol-sun-rays" />
        <div className="gol-sun-ring gol-sun-ring-1" />
        <div className="gol-sun-ring gol-sun-ring-2" />
        <div className="gol-sun-ring gol-sun-ring-3" />
        <div className="gol-sun-core" />
      </div>

      <div className="gol-ambient gol-ambient-left" />
      <div className="gol-ambient gol-ambient-right" />
      <div className="gol-cursor-glow" />

      <div className="gol-stars">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`gol-star gol-star-${(i % 6) + 1}`} />
        ))}
      </div>

      <div className="gol-ripples">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="gol-ripple"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
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
              className="gol-action"
              onClick={() => navigate('/go/quiz?mode=host')}
            >
              Host a Game →
            </button>

            <button
              className="gol-action"
              onClick={() => navigate('/go/quiz?mode=solo')}
            >
              Practice
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
    </div>
  )
}