import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './GoLanding.css'

const NAV_ITEMS = [
  { label: 'Pulse GO', path: '/go' },
  { label: 'Academy', path: '/go/academy' },
  { label: 'Quiz', path: '/go/quiz' },
  { label: 'Present', path: '/go/present' },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live Quizzes',
    desc: 'Kahoot-style rooms with fast scoring and team competition.',
  },
  {
    icon: '🎮',
    title: 'Training Games',
    desc: 'Objection battles, dispositions, valid XFER drills, and more.',
  },
  {
    icon: '🎓',
    title: 'Academy',
    desc: 'Scripts, rebuttals, call flow, product rules, and dialer guides.',
  },
]

function GoTopNav({ navigate }) {
  return (
    <nav className="gol-nav">
      <button className="gol-nav-left" onClick={() => navigate('/dashboard')}>
        ← Dashboard
      </button>

      <div className="gol-nav-tabs" aria-label="Pulse GO navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={`gol-nav-tab ${item.path === '/go' ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default function GoLanding() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [code, setCode] = useState('')
  const titleRef = useRef(null)
  const canvasRef = useRef(null)

  const particles = useMemo(() => Array.from({ length: 28 }, (_, i) => i), [])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const title = titleRef.current
    if (!title) return

    const onMove = (e) => {
      const rect = title.getBoundingClientRect()
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      title.style.transform = `perspective(700px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg) scale(1.015)`
    }

    const onLeave = () => {
      title.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)'
    }

    title.addEventListener('mousemove', onMove)
    title.addEventListener('mouseleave', onLeave)

    return () => {
      title.removeEventListener('mousemove', onMove)
      title.removeEventListener('mouseleave', onLeave)
    }
  }, [visible])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let raf
    const pts = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const onMove = (e) => {
      for (let i = 0; i < 2; i += 1) {
        pts.push({
          x: e.clientX + (Math.random() - 0.5) * 18,
          y: e.clientY + (Math.random() - 0.5) * 18,
          size: Math.random() * 2.8 + 0.8,
          life: 1,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.4,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = pts.length - 1; i >= 0; i -= 1) {
        const p = pts[i]
        p.life -= 0.03
        p.x += p.vx
        p.y += p.vy

        if (p.life <= 0) {
          pts.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(217, 156, 84, ${p.life * 0.55})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const handleEnter = () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length >= 4) navigate(`/go/quiz/${trimmed}`)
  }

  return (
    <div className="gol-wrap">
      <canvas ref={canvasRef} className="gol-canvas" />
      <div className="gol-grid" />
      <div className="gol-spotlight one" />
      <div className="gol-spotlight two" />
      <div className="gol-particles">
        {particles.map((i) => (
          <span key={i} className="gol-particle" style={{ '--i': i }} />
        ))}
      </div>

      <GoTopNav navigate={navigate} />

      <main className={`gol-hero ${visible ? 'visible' : ''}`}>
        <div className="gol-eyebrow">✨ Training hub</div>

        <h1 className="gol-title" ref={titleRef}>
          <span>PULSE</span>
          <span className="gol-title-badge">GO</span>
        </h1>

        <p className="gol-sub">
          Live, Kahoot-style training rooms for Kampaign Kings. Run quizzes,
          drills, and team battles in real time.
        </p>

        <section className="gol-feature-grid" aria-label="Pulse GO features">
          {FEATURES.map((feature) => (
            <button
              key={feature.title}
              className="gol-feature-card"
              onClick={() => feature.title === 'Academy' ? navigate('/go/academy') : navigate('/go/quiz')}
            >
              <span className="gol-feature-icon">{feature.icon}</span>
              <span className="gol-feature-title">{feature.title}</span>
              <span className="gol-feature-desc">{feature.desc}</span>
            </button>
          ))}
        </section>

        <section className="gol-card" aria-label="Join a room">
          <span className="gol-card-label">Enter a room code</span>
          <div className="gol-input-wrap">
            <span>KK</span>
            <input
              className="gol-input"
              type="text"
              placeholder="1234"
              value={code.replace(/^KK/i, '')}
              onChange={(e) => setCode(`KK${e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              maxLength={6}
              autoComplete="off"
            />
          </div>
          <button className="gol-btn-primary" onClick={handleEnter} disabled={code.trim().length < 4}>
            Join Room →
          </button>
          <p className="gol-card-note">Or start training from Quiz or Academy above.</p>
        </section>
      </main>
    </div>
  )
}
