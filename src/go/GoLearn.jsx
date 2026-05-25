import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { learnCategories } from './goContent'
import './GoLanding.css'

const STARS = [
  { top: '12%', left: '10%' },
  { top: '16%', left: '28%' },
  { top: '14%', left: '48%' },
  { top: '18%', left: '78%' },
  { top: '24%', left: '84%' },
  { top: '32%', left: '18%' },
  { top: '36%', left: '38%' },
  { top: '30%', left: '62%' },
  { top: '41%', left: '78%' },
  { top: '52%', left: '14%' },
  { top: '58%', left: '28%' },
  { top: '55%', left: '70%' },
  { top: '66%', left: '18%' },
  { top: '72%', left: '42%' },
  { top: '69%', left: '82%' },
  { top: '83%', left: '20%' },
  { top: '86%', left: '58%' },
  { top: '80%', left: '88%' },
]

const SHOOTING_STARS = [
  { top: '18%', left: '78%', delay: '0s', duration: '6.5s' },
  { top: '28%', left: '64%', delay: '2.4s', duration: '7.5s' },
  { top: '12%', left: '58%', delay: '4.8s', duration: '6.8s' },
  { top: '34%', left: '86%', delay: '7.2s', duration: '8s' },
  { top: '22%', left: '72%', delay: '9.4s', duration: '7.2s' },
]

export default function GoLearn() {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const rafRef = useRef(null)
  const audioRef = useRef(null)

  const [ripples, setRipples] = useState([])

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!audioRef.current) {
        audioRef.current = new AudioContext()
      }

      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(520, now)
      oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.07)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.1)
    } catch {
      // ignore
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

    playClickSound()
  }

  const handlePreventCopy = (e) => {
    e.preventDefault()
  }

  const handlePreventContextMenu = (e) => {
    e.preventDefault()
  }

  const handleDragStart = (e) => {
    e.preventDefault()
  }

  return (
    <div
      ref={pageRef}
      className="pgl-page"
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
      onCopy={handlePreventCopy}
      onCut={handlePreventCopy}
      onContextMenu={handlePreventContextMenu}
      onDragStart={handleDragStart}
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

      <div className="pgl-shooting-stars" aria-hidden="true">
        {SHOOTING_STARS.map((item, index) => (
          <span
            key={index}
            className="pgl-shooting-star"
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
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

          <button className="pgl-nav-link" onClick={() => navigate('/go')}>
            Pulse GO
          </button>

          <button className="pgl-nav-link pgl-nav-link-active" onClick={() => navigate('/academy')}>
            Academy
          </button>
        </div>
      </nav>

      <main className="pgl-content academy-content">
        <h1 className="pgl-title academy-title" draggable="false">
          <span className="pgl-title-main">ACADEMY</span>
        </h1>

        <div className="academy-grid">
          {learnCategories.map((cat) => (
            <button
              key={cat.id}
              className="academy-card"
              onClick={() => navigate(`/academy/${cat.id}`)}
            >
              <span className="academy-card-icon">{cat.icon}</span>

              <div className="academy-card-body">
                <h2>{cat.title}</h2>
                <p>{cat.description}</p>
              </div>

              <span className="academy-card-arrow">→</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}