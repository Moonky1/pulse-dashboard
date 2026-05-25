import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GoLanding.css'

const STARS = [
  { top: '10%', left: '8%' },
  { top: '15%', left: '24%' },
  { top: '12%', left: '52%' },
  { top: '18%', left: '78%' },
  { top: '30%', left: '14%' },
  { top: '34%', left: '33%' },
  { top: '27%', left: '64%' },
  { top: '36%', left: '84%' },
  { top: '49%', left: '11%' },
  { top: '47%', left: '27%' },
  { top: '51%', left: '72%' },
  { top: '61%', left: '16%' },
  { top: '59%', left: '41%' },
  { top: '63%', left: '86%' },
  { top: '74%', left: '12%' },
  { top: '77%', left: '34%' },
  { top: '82%', left: '68%' },
  { top: '85%', left: '88%' },
]

export default function GoLanding() {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const rafRef = useRef(null)
  const audioRef = useRef(null)

  const [code, setCode] = useState('')
  const [ripples, setRipples] = useState([])

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!audioRef.current) {
        audioRef.current = new AudioContext()
      }

      const ctx = audioRef.current

      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(540, now)
      oscillator.frequency.exponentialRampToValueAtTime(260, now + 0.08)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.1)
    } catch {
      // Browser blocked or unsupported audio. Ignore silently.
    }
  }

  const handleMouseMove = (e) => {
    const page = pageRef.current
    if (!page) return

    const rect = page.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      page.style.setProperty('--mx', `${x}px`)
      page.style.setProperty('--my', `${y}px`)
    })
  }

  const handlePointerDown = (e) => {
    const page = pageRef.current
    if (!page) return

    const rect = page.getBoundingClientRect()
    const ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    setRipples((prev) => [...prev.slice(-4), ripple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id))
    }, 650)

    if (!e.target.closest('input')) {
      playClickSound()
    }
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
      onPointerDown={handlePointerDown}
    >
      <div className="pgl-bg" />
      <div className="pgl-grid" />
      <div className="pgl-soft-glow" />
      <div className="pgl-cursor-glow" />

      <div className="pgl-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="pgl-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: `${index * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="pgl-ripples" aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pgl-ripple"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
            }}
          />
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