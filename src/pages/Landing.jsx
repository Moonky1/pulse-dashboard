import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

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

const TEAM_MARKERS = [
  { id: 'ph', name: 'Philippines', left: '79.5%', top: '53%' },
  { id: 'asia', name: 'Asia', left: '71.5%', top: '42%' },
  { id: 'mx', name: 'Mexico Baja', left: '20.8%', top: '44%' },
  { id: 'central', name: 'Central America', left: '24.4%', top: '49.5%' },
  { id: 'co', name: 'Colombia', left: '28.8%', top: '57.5%' },
  { id: 've', name: 'Venezuela', left: '31.8%', top: '55.2%' },
]

function scrollToRef(ref) {
  ref.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export default function Landing() {
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)
  const [hoveredTeam, setHoveredTeam] = useState(null)

  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const teamsRef = useRef(null)
  const solarCanvasRef = useRef(null)
  const solarZoneRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 70)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = solarCanvasRef.current
    const zone = solarZoneRef.current
    if (!canvas || !zone) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let particles = []

    const getTarget = () => {
      const rect = zone.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        x: rect.width / 2,
        y: rect.height * 0.62,
      }
    }

    const spawnParticle = (width, height) => {
      const side = Math.floor(Math.random() * 3)

      if (side === 0) {
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.18,
          size: Math.random() * 1.8 + 0.8,
          speed: Math.random() * 0.012 + 0.006,
          alpha: Math.random() * 0.7 + 0.2,
        }
      }

      if (side === 1) {
        return {
          x: Math.random() < 0.5 ? -20 : width + 20,
          y: Math.random() * height * 0.32 + 10,
          size: Math.random() * 1.8 + 0.8,
          speed: Math.random() * 0.012 + 0.006,
          alpha: Math.random() * 0.7 + 0.2,
        }
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height * 0.28 + 10,
        size: Math.random() * 1.8 + 0.8,
        speed: Math.random() * 0.012 + 0.006,
        alpha: Math.random() * 0.7 + 0.2,
      }
    }

    const setup = () => {
      const rect = zone.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1

      canvas.width = Math.floor(rect.width * ratio)
      canvas.height = Math.floor(rect.height * ratio)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      const count = Math.min(46, Math.max(22, Math.floor(rect.width / 28)))
      particles = Array.from({ length: count }, () => spawnParticle(rect.width, rect.height))
    }

    const draw = () => {
      const { width, height, x: tx, y: ty } = getTarget()

      ctx.clearRect(0, 0, width, height)

      particles.forEach((p, i) => {
        const dx = tx - p.x
        const dy = ty - p.y
        const dist = Math.hypot(dx, dy) || 1

        p.x += dx * p.speed
        p.y += dy * p.speed

        const life = Math.max(0, Math.min(1, dist / 340))
        const alpha = p.alpha * life

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()

        if (dist < 10) {
          particles[i] = spawnParticle(width, height)
        }
      })

      raf = requestAnimationFrame(draw)
    }

    setup()
    draw()

    const onResize = () => setup()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="landing">
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

          <div ref={solarZoneRef} className="hero-solar-zone">
            <canvas ref={solarCanvasRef} className="solar-particle-canvas" />

            <div className="solar-space-glow solar-space-glow-a" />
            <div className="solar-space-glow solar-space-glow-b" />

            <div className="solar-ring solar-ring-a" />
            <div className="solar-ring solar-ring-b" />

            <div className="solar-blackhole-mass solar-blackhole-mass-a" />
            <div className="solar-blackhole-mass solar-blackhole-mass-b" />
            <div className="solar-blackhole-mass solar-blackhole-mass-c" />

            <div className="solar-line" />

            <div className="solar-sun">
              <div className="solar-sun-haze" />
              <div className="solar-sun-core" />
              <div className="solar-sun-ring" />
            </div>

            <div className="solar-bottom-mask" />
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

        <section ref={teamsRef} className="teams-section">
          <h2 className="section-title center-title">Teams across the globe.</h2>
          <p className="section-sub center-sub">
            Explore where each Pulse team operates inside the network.
          </p>

          <div className="world-map-panel">
            <div className="map-grid" />

            <svg
              className="world-map-svg"
              viewBox="0 0 1000 520"
              aria-hidden="true"
            >
              <g className="world-land">
                <path d="M123 144l26-18 45-12 33 8 20 18 17 4 15 20-13 15-31 10-13 16-28-6-20 5-10 18-18 3-14-21-21-6-5-17 10-13 7-24z" />
                <path d="M254 250l23 7 20 28 15 40 4 41-13 29-12 30-18 17-20-8-4-23 9-20-8-28-19-41 5-38z" />
                <path d="M446 125l23-13 29-2 16 14 18-2 16 10-2 14-20 10-8 12-17 3-17-10-19 6-18-14z" />
                <path d="M470 183l24 9 24 26 18 49-6 33-22 41-28 25-30-13-9-32 6-31-17-34 6-44z" />
                <path d="M556 130l36-13 56 1 48 11 35 20 41 7 36 19 22 19-4 19-27 6-22 20-31 12-15 19-30 8-22-5-12-20-27-14-20-21-38-3-31-11-20-29-20-11 2-25z" />
                <path d="M801 344l25-6 19 8 11 19-5 18-24 10-24-8-8-18z" />
              </g>
            </svg>

            <div className="map-markers">
              {TEAM_MARKERS.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`map-marker ${hoveredTeam === team.id ? 'is-active' : ''}`}
                  style={{ left: team.left, top: team.top }}
                  onMouseEnter={() => setHoveredTeam(team.id)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onFocus={() => setHoveredTeam(team.id)}
                  onBlur={() => setHoveredTeam(null)}
                >
                  <span className="map-marker-dot" />
                  <span className="map-marker-label">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}