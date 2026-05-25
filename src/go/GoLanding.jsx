import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

export default function GoLanding() {
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const titleRef = useRef(null)
  const rafRef = useRef(null)
  const cubeFrameRef = useRef(null)

  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })

  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')
  const [ripples, setRipples] = useState([])

  const cubeCells = useMemo(() => {
    const cells = []

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const edgeCount = [x, y, z].filter((v) => Math.abs(v) === 1).length

          cells.push({
            id: `${x}-${y}-${z}`,
            x,
            y,
            z,
            edgeCount,
            tone: Math.abs(x + y + z + 5) % 5,
          })
        }
      }
    }

    return cells
  }, [])

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
    const animateCube = () => {
      const wrap = wrapRef.current
      if (!wrap) return

      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.12
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.12

      const rx = currentRef.current.y * -9
      const ry = currentRef.current.x * 15
      const tx = currentRef.current.x * 14
      const ty = currentRef.current.y * 10

      wrap.style.setProperty('--cube-rx', `${rx}deg`)
      wrap.style.setProperty('--cube-ry', `${ry}deg`)
      wrap.style.setProperty('--cube-tx', `${tx}px`)
      wrap.style.setProperty('--cube-ty', `${ty}px`)

      cubeFrameRef.current = requestAnimationFrame(animateCube)
    }

    cubeFrameRef.current = requestAnimationFrame(animateCube)

    return () => {
      if (cubeFrameRef.current) cancelAnimationFrame(cubeFrameRef.current)
    }
  }, [])

  const handleMouseMove = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return

    const rect = wrap.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    targetRef.current.x = (x / rect.width - 0.5) * 2
    targetRef.current.y = (y / rect.height - 0.5) * 2

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      wrap.style.setProperty('--mx', `${x}px`)
      wrap.style.setProperty('--my', `${y}px`)
      wrap.style.setProperty('--mxp', `${(x / rect.width) * 100}%`)
      wrap.style.setProperty('--myp', `${(y / rect.height) * 100}%`)
    })
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
    }, 760)
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
      <div className="gol-bg" />
      <div className="gol-grid" />
      <div className="gol-floor-light" />
      <div className="gol-cursor-glow" />

      <div className="gol-stars">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} className={`gol-star gol-star-${i + 1}`} />
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
        <section className="gol-copy">
          <h1 className="gol-title" ref={titleRef}>
            <span>PULSE</span>
            <strong>GO</strong>
          </h1>

          <p className="gol-sub">
            Host live training rooms or practice solo with fast, competitive call-flow drills.
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

          <section className="gol-room-section">
            <div className="gol-room-card">
              <div className="gol-panel-head">
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
            </div>
          </section>
        </section>

        <section className="gol-visual" aria-hidden="true">
          <div className="gol-cube-light" />

          <div className="gol-cube-stage">
            <div className="gol-cube-shadow" />

            <div className="gol-cube-orbit">
              <div className="gol-cube-spinner">
                <div className="gol-cube">
                  {cubeCells.map((cell) => (
                    <div
                      key={cell.id}
                      className={`gol-cubie tone-${cell.tone} edge-${cell.edgeCount}`}
                      style={{
                        '--x': cell.x,
                        '--y': cell.y,
                        '--z': cell.z,
                      }}
                    >
                      <span className="gol-face front" />
                      <span className="gol-face back" />
                      <span className="gol-face right" />
                      <span className="gol-face left" />
                      <span className="gol-face top" />
                      <span className="gol-face bottom" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}