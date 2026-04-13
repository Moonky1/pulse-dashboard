import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './Landing.css'

const TEAM_POINTS = [
  { id: 'philippines', name: 'Philippines', short: 'PH', left: '79%', top: '38%' },
  { id: 'asia', name: 'Asia', short: 'AS', left: '72%', top: '30%' },
  { id: 'central', name: 'Central America', short: 'CA', left: '28%', top: '42%' },
  { id: 'mexico', name: 'Mexico Baja', short: 'MX', left: '22%', top: '36%' },
  { id: 'colombia', name: 'Colombia', short: 'CO', left: '33%', top: '50%' },
  { id: 'venezuela', name: 'Venezuela', short: 'VE', left: '39%', top: '47%' },
]

const FEATURES = [
  {
    title: 'Live tracking',
    desc: 'Monitor performance and operational movement in real time.',
  },
  {
    title: 'Pulse GO',
    desc: 'Training, quizzes and internal learning inside the same ecosystem.',
  },
  {
    title: 'Team presence',
    desc: 'Visualize teams and regions from one clean interface.',
  },
  {
    title: 'Built for leaders',
    desc: 'Made for supervisors, QA and team leaders with fast access to what matters.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [hoveredTeam, setHoveredTeam] = useState(null)
  const [sunHover, setSunHover] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 70)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18
      const y = (e.clientY / window.innerHeight - 0.5) * 14
      setMouse({ x, y })
    }

    const onScroll = () => setScrollY(window.scrollY || 0)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = Math.max(document.body.scrollHeight, window.innerHeight * 2)
    }

    const createParticles = () => {
      const amount = Math.min(40, Math.floor(window.innerWidth / 52))
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.7 + 0.6,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.28 + 0.05,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
        if (p.y < -20) p.y = canvas.height + 20
        if (p.y > canvas.height + 20) p.y = -20

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249, 115, 22, ${p.a})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    resize()
    createParticles()
    draw()

    const onResize = () => {
      resize()
      createParticles()
    }

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  const heroMotion = useMemo(() => {
    const scrollLift = Math.min(scrollY * 0.08, 30)
    const hoverBoost = sunHover ? 1.1 : 1

    return {
      title: `translate3d(${mouse.x * 0.08}px, ${scrollLift * 0.08}px, 0)`,
      sub: `translate3d(${mouse.x * 0.05}px, ${scrollLift * 0.05}px, 0)`,
      chip: `translate3d(${mouse.x * 0.04}px, 0, 0)`,
      glow: `translate3d(${mouse.x * 0.42}px, ${mouse.y * 0.18}px, 0) scale(${hoverBoost})`,
      core: `translate3d(${mouse.x * 0.24}px, ${mouse.y * 0.12}px, 0) scale(${hoverBoost})`,
    }
  }, [mouse.x, mouse.y, scrollY, sunHover])

  return (
    <div className="landing">
      <canvas ref={canvasRef} className="landing-canvas" />
      <div className="landing-grid" />
      <div className="landing-noise" />

      <header className="landing-navbar">
        <button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/kk-logo.png" alt="Pulse" className="landing-brand-logo" />
          <span className="landing-brand-text">Pulse</span>
        </button>

        <nav className="landing-nav-pill">
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#teams">Teams</a>
          <a href="#access">Access</a>
        </nav>

        <div className="landing-nav-actions">
          <button className="nav-link-btn" onClick={() => navigate('/go')}>
            GO
          </button>
          <button className="nav-cta-btn" onClick={() => navigate('/signin')}>
            Dashboard
          </button>
        </div>
      </header>

      <main className={`landing-shell ${visible ? 'is-visible' : ''}`}>
        <section id="hero" className="hero-section">
          <div className="hero-chip hero-chip-top" style={{ transform: heroMotion.chip }}>
            Kampaign Kings platform
          </div>

          <h1 className="hero-title hero-title-center" style={{ transform: heroMotion.title }}>
            PULSE
          </h1>

          <p className="hero-sub hero-sub-center" style={{ transform: heroMotion.sub }}>
            Performance intelligence for leaders.
          </p>

          <div
            className="hero-solar-zone"
            onMouseEnter={() => setSunHover(true)}
            onMouseLeave={() => setSunHover(false)}
          >
            <div className="hero-sun-glow" style={{ transform: heroMotion.glow }} />
            <div className="hero-sun-aura hero-sun-aura-1" />
            <div className="hero-sun-aura hero-sun-aura-2" />
            <div className="hero-horizon" />
            <div className="hero-sun-wrap" style={{ transform: heroMotion.core }}>
              <div className="hero-sun-core" />
              <div className="hero-sun-ring hero-sun-ring-1" />
              <div className="hero-sun-ring hero-sun-ring-2" />
              <div className="hero-sun-reflection" />
            </div>
          </div>

          <div className="hero-actions hero-actions-center">
            <button className="hero-btn hero-btn-primary" onClick={() => navigate('/register')}>
              Registrarse
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/signin')}>
              Iniciar sesión
            </button>
            <button className="hero-btn hero-btn-go" onClick={() => navigate('/go')}>
              Pulse GO
            </button>
          </div>

          <p className="hero-note hero-note-center">Supervisors, QA &amp; Team Leaders</p>
        </section>

        <section id="features" className="feature-section">
          <div className="section-chip">Platform</div>
          <h2 className="section-title">Built to feel smooth and natural.</h2>

          <div className="feature-grid">
            {FEATURES.map((item) => (
              <article key={item.title} className="feature-card">
                <div className="feature-dot" />
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="teams" className="globe-section">
          <div className="section-chip">Presence</div>
          <h2 className="section-title">Teams across the globe.</h2>
          <p className="section-sub">
            Explore where each Pulse team operates inside the network.
          </p>

          <div className="globe-stage">
            <div className="globe-stars" />
            <div className="globe-sphere">
              <div className="globe-grid globe-grid-v" />
              <div className="globe-grid globe-grid-h" />

              {TEAM_POINTS.map((team) => (
                <button
                  key={team.id}
                  className={`team-marker ${hoveredTeam === team.id ? 'is-active' : ''}`}
                  style={{ left: team.left, top: team.top }}
                  onMouseEnter={() => setHoveredTeam(team.id)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onFocus={() => setHoveredTeam(team.id)}
                  onBlur={() => setHoveredTeam(null)}
                  type="button"
                >
                  <span className="team-marker-dot" />
                  <span className="team-marker-label">
                    <strong>{team.name}</strong>
                    <small>{team.short}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="access" className="access-section">
          <div className="section-chip">Access</div>
          <h2 className="section-title">One ecosystem. Two paths.</h2>

          <div className="access-cards">
            <article className="access-card">
              <div className="access-card-tag">Dashboard</div>
              <h3>Track live performance</h3>
              <p>Open the main Pulse dashboard for visibility, movement and daily follow-up.</p>
              <button className="hero-btn hero-btn-secondary access-btn" onClick={() => navigate('/signin')}>
                Open dashboard
              </button>
            </article>

            <article className="access-card">
              <div className="access-card-tag">GO</div>
              <h3>Train inside Pulse GO</h3>
              <p>Use quizzes, learning flows and internal training in one dedicated space.</p>
              <button className="hero-btn hero-btn-primary access-btn" onClick={() => navigate('/go')}>
                Open Pulse GO
              </button>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}