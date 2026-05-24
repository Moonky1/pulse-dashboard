import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

export default function GoLanding() {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const titleRef = useRef(null)

  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')
  const [ripples, setRipples] = useState([])

  const nodes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: 5 + ((i * 19) % 91),
        y: 7 + ((i * 31) % 84),
        size: 2 + (i % 3),
        delay: `${i * 0.12}s`,
        speed: `${4.8 + (i % 6) * 0.45}s`,
      })),
    []
  )

  const lines = useMemo(() => {
    const pairs = []

    for (let i = 0; i < nodes.length; i += 1) {
      const nextA = nodes[(i + 3) % nodes.length]
      const nextB = nodes[(i + 7) % nodes.length]

      if (i % 2 === 0) {
        pairs.push({
          id: `a-${i}`,
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nextA.x,
          y2: nextA.y,
        })
      }

      if (i % 5 === 0) {
        pairs.push({
          id: `b-${i}`,
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nextB.x,
          y2: nextB.y,
        })
      }
    }

    return pairs
  }, [nodes])

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

      title.style.transform = `perspective(760px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`
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

  const handleMouseMove = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    wrap.style.setProperty('--mx', `${x}px`)
    wrap.style.setProperty('--my', `${y}px`)
    wrap.style.setProperty('--mxp', `${(x / rect.width) * 100}%`)
    wrap.style.setProperty('--myp', `${(y / rect.height) * 100}%`)
  }

  const handlePointerDown = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    setRipples((prev) => [...prev.slice(-5), ripple])

    window.setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id))
    }, 950)
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
      <div className="gol-grid" />
      <div className="gol-radar" />
      <div className="gol-cursor-glow" />

      <svg className="gol-constellation" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ))}
      </svg>

      <div className="gol-nodes">
        {nodes.map((node) => (
          <span
            key={node.id}
            className="gol-node"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              animationDelay: node.delay,
              animationDuration: node.speed,
            }}
          />
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