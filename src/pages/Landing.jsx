import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './Landing.css'

const TEAM_POINTS = [
  { id: 'philippines', name: 'Philippines', short: 'PH', left: '78%', top: '36%' },
  { id: 'asia', name: 'Asia', short: 'AS', left: '70%', top: '28%' },
  { id: 'central', name: 'Central America', short: 'CA', left: '31%', top: '42%' },
  { id: 'mexico', name: 'Mexico Baja', short: 'MX', left: '25%', top: '36%' },
  { id: 'colombia', name: 'Colombia', short: 'CO', left: '36%', top: '49%' },
  { id: 'venezuela', name: 'Venezuela', short: 'VE', left: '41%', top: '46%' },
]

const FEATURES = [
  {
    title: 'Live tracking',
    desc: 'Monitor performance and movement in real time.',
  },
  {
    title: 'Pulse GO',
    desc: 'Training, quizzes and internal learning in one place.',
  },
  {
    title: 'Team visibility',
    desc: 'See regions and team presence inside the Pulse network.',
  },
  {
    title: 'Built for leaders',
    desc: 'Fast access for supervisors, QA and team leaders.',
  },
]

const SOLAR_SPARKS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  delay: `${(i * 0.22).toFixed(2)}s`,
  duration: `${(4.8 + (i % 6) * 0.35).toFixed(2)}s`,
  left: `${8 + (i * 3.6) % 84}%`,
  top: `${18 + (i * 5.2) % 42}%`,
  size: `${1.6 + (i % 3) * 0.7}px`,
}))

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [hoveredTeam, setHoveredTeam] = useState(null)
  const [sunHover, setSunHover] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 70)
    return () => clearTimeout(t)
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
      const amount = Math.min(34, Math.floor(window.innerWidth / 60))
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.7 + 0.5,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        a: Math.random() * 0.22 + 0.03,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.a})`
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

  const globeMarkers = useMemo(
    () =>
      TEAM_POINTS.map((team) => (
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
      )),
    [hoveredTeam]
  )

  return (
    <div className="landing">
      <canvas ref={canvasRef} className="landing-canvas" />
      <div className="landing-grid" />
      <div className="landing-noise" />

      <header className="landing-navbar">
        <div className="landing-brand">
          <div className="landing-brand-icon">
            <span className="brand-orb brand-orb-1" />
            <span className="brand-orb brand-orb-2" />
            <span className="brand-orb brand-orb-3" />
          </div>
          <span className="landing-brand-text">Pulse</span>
        </div>

        <nav className="landing-nav-pill">
          <a href="#hero">Home</a>
          <a href="#features">Features</a>
          <a href="#teams">Teams</a>
          <a href="#access">Access</a>
        </nav>

        <div className="landing-nav-actions">
          <button className="nav-login-btn" onClick={() => navigate('/signin')}>
            Login
          </button>
          <button className="nav-register-btn" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </header>

      <main className={`landing-shell ${visible ? 'is-visible' : ''}`}>
        <section id="hero" className="hero-section">
          <div className="hero-chip">Kampaign Kings platform</div>

          <h1 className="hero-title">PULSE</h1>

          <p className="hero-sub">Performance intelligence for leaders.</p>

          <div
            className={`hero-solar-zone ${sunHover ? 'is-hovered' : ''}`}
            onMouseEnter={() => setSunHover(true)}
            onMouseLeave={() => setSunHover(false)}
          >
            <div className="hero-solar-bg-arc hero-solar-bg-arc-1" />
            <div className="hero-solar-bg-arc hero-solar-bg-arc-2" />

            <div className="hero-solar-particles">
              {SOLAR_SPARKS.map((spark) => (
                <span
                  key={spark.id}
                  className="solar-spark"
                  style={{
                    '--spark-left': spark.left,
                    '--spark-top': spark.top,
                    '--spark-delay': spark.delay,
                    '--spark-duration': spark.duration,
                    '--spark-size': spark.size,
                  }}
                />
              ))}
            </div>

            <div className="hero-sun-glow" />
            <div className="hero-horizon" />

            <div className="hero-sun-wrap">
              <div className="hero-sun-shell" />
              <div className="hero-sun-core" />
              <div className="hero-sun-inner-ring" />
              <div className="hero-sun-reflection" />
            </div>
          </div>

          <div className="hero-actions">
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

          <p className="hero-note">Supervisors, QA &amp; Team Leaders</p>
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
              <div className="globe-outline" />
              <div className="globe-dots globe-dots-a" />
              <div className="globe-dots globe-dots-b" />
              <div className="globe-dots globe-dots-c" />
              {globeMarkers}
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
              <p>Open the main Pulse dashboard for visibility, movement and follow-up.</p>
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