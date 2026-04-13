import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './Landing.css'

const TEAM_POINTS = [
  { id: 'philippines', name: 'Philippines', short: 'PH', left: '76%', top: '34%' },
  { id: 'asia', name: 'Asia', short: 'AS', left: '68%', top: '27%' },
  { id: 'central', name: 'Central America', short: 'CA', left: '32%', top: '44%' },
  { id: 'mexico', name: 'Mexico Baja', short: 'MX', left: '27%', top: '38%' },
  { id: 'colombia', name: 'Colombia', short: 'CO', left: '38%', top: '50%' },
  { id: 'venezuela', name: 'Venezuela', short: 'VE', left: '43%', top: '47%' },
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

const SOLAR_SPARKS = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  delay: `${(i * 0.12).toFixed(2)}s`,
  duration: `${(2.8 + (i % 7) * 0.2).toFixed(2)}s`,
  left: `${8 + (i * 2.6) % 84}%`,
  top: `${10 + (i * 2.4) % 18}%`,
  size: `${1.2 + (i % 3) * 0.7}px`,
}))

export default function Landing() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [hoveredTeam, setHoveredTeam] = useState(null)
  const [sunHover, setSunHover] = useState(false)
  const canvasRef = useRef(null)

  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const teamsRef = useRef(null)

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
      const amount = Math.min(26, Math.floor(window.innerWidth / 78))
      particles = Array.from({ length: amount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3 + 0.4,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        a: Math.random() * 0.14 + 0.02,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < -8) p.x = canvas.width + 8
        if (p.x > canvas.width + 8) p.x = -8
        if (p.y < -8) p.y = canvas.height + 8
        if (p.y > canvas.height + 8) p.y = -8

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.a})`
        ctx.fill()
      }

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

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

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
          <button type="button" onClick={() => scrollToRef(heroRef)}>Home</button>
          <button type="button" onClick={() => scrollToRef(featuresRef)}>Features</button>
          <button type="button" onClick={() => scrollToRef(teamsRef)}>Teams</button>
          <button type="button" onClick={() => navigate('/go')}>Pulse GO</button>
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
        <section ref={heroRef} className="hero-section">
          <div className="hero-chip">Kampaign Kings platform</div>

          <h1 className="hero-title">PULSE</h1>

          <p className="hero-sub">Performance intelligence for leaders.</p>

          <div
            className={`hero-solar-zone ${sunHover ? 'is-hovered' : ''}`}
            onMouseEnter={() => setSunHover(true)}
            onMouseLeave={() => setSunHover(false)}
          >
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

            <div className="hero-solar-halo hero-solar-halo-1" />
            <div className="hero-solar-halo hero-solar-halo-2" />
            <div className="hero-solar-flow hero-solar-flow-1" />
            <div className="hero-solar-flow hero-solar-flow-2" />

            <div className="hero-horizon" />

            <div className="hero-sun-wrap">
              <div className="hero-sun-glow" />
              <div className="hero-sun-shell" />
              <div className="hero-sun-core" />
              <div className="hero-sun-inner-ring" />
            </div>

            <div className="hero-sun-below-mask" />
          </div>
        </section>

        <section ref={featuresRef} className="feature-section">
          <h2 className="section-title center-title">Built to feel smooth and natural.</h2>

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

        <section ref={teamsRef} className="globe-section">
          <h2 className="section-title center-title">Teams across the globe.</h2>
          <p className="section-sub center-sub">
            Explore where each Pulse team operates inside the network.
          </p>

          <div className="globe-stage">
            <div className="globe-stars" />

            <div className="globe-hemisphere">
              <div className="globe-hemisphere-outline" />

              <div className="globe-rotate-layer globe-rotate-layer-a">
                <div className="globe-dot-shell globe-dot-shell-a" />
              </div>

              <div className="globe-rotate-layer globe-rotate-layer-b">
                <div className="globe-dot-shell globe-dot-shell-b" />
              </div>

              <div className="globe-rotate-layer globe-rotate-layer-c">
                <div className="globe-dot-shell globe-dot-shell-c" />
              </div>

              {globeMarkers}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}