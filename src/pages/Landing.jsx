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
  { id: 'mx', name: 'Mexico Baja', left: '18.7%', top: '42.6%' },
  { id: 'central', name: 'Central America', left: '22.3%', top: '48.5%' },
  { id: 'co', name: 'Colombia', left: '27.0%', top: '56.8%' },
  { id: 've', name: 'Venezuela', left: '30.4%', top: '54.5%' },
  { id: 'asia', name: 'Asia', left: '69.8%', top: '42%' },
  { id: 'ph', name: 'Philippines', left: '80.5%', top: '57.4%' },
]

function scrollToRef(ref) {
  ref.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function WorldMapSvg() {
  return (
    <svg
      className="world-map-svg"
      viewBox="0 0 1200 560"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="world-map-land">
        <path d="M116 163l23-31 54-24 63-9 55 14 28 27 26 7 18 24-19 27-31 15-30 7-20 19-31-5-26 10-11 24-30 5-18-30-27-10-10-23 15-18 11-29z" />
        <path d="M295 239l31 7 34 18 26 39 8 49-16 35-18 43-28 28-31-9-7-41 15-31-9-34-24-52 5-52z" />
        <path d="M347 64l20-20 29-8 18 8 8 19-8 24-20 11-29-1-18-16z" />
        <path d="M353 286l38 16 27 42 16 76-4 67-29 86-39 46-36-14-8-44 14-36-10-49-27-66-8-61 10-43z" />
        <path d="M530 130l24-17 35-3 21 17 27-4 22 14-2 21-23 12-15 10-23 3-26-14-23 7-19-10-1-17z" />
        <path d="M564 206l38 14 35 47 24 72-11 76-41 72-49 45-40-16-17-64 11-74-22-55 7-67z" />
        <path d="M639 155l43-11 56-20 74 2 75 16 50 30 53 10 47 28 38 34-5 34-43 10-35 28-53 16-28 30-58 17-40-8-32-37-44-14-31-36-47-2-39-10-25-33-25-41-16-10z" />
        <path d="M839 292l30 18 20 31-9 27 19 17 25 7 18 26-11 21-29 7-24-11-15-24-20-9-18-25 4-27-13-27z" />
        <path d="M1029 226l15 6 5 15-11 14-15-6-3-15z" />
        <path d="M1068 269l12 5 3 12-8 10-12-4-4-11z" />
        <path d="M959 398l34-12 42 13 21 29-6 32-39 18-51-8-26-25 8-31z" />
      </g>
    </svg>
  )
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
      const edge = Math.floor(Math.random() * 3)

      if (edge === 0) {
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.16,
          size: Math.random() * 1.8 + 0.8,
          speed: Math.random() * 0.011 + 0.006,
          alpha: Math.random() * 0.7 + 0.2,
        }
      }

      if (edge === 1) {
        return {
          x: Math.random() < 0.5 ? -20 : width + 20,
          y: Math.random() * height * 0.28 + 10,
          size: Math.random() * 1.8 + 0.8,
          speed: Math.random() * 0.011 + 0.006,
          alpha: Math.random() * 0.7 + 0.2,
        }
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height * 0.22 + 12,
        size: Math.random() * 1.8 + 0.8,
        speed: Math.random() * 0.011 + 0.006,
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

      const count = Math.min(48, Math.max(22, Math.floor(rect.width / 26)))
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

        const fade = Math.max(0, Math.min(1, dist / 360))
        const alpha = p.alpha * fade

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()

        if (dist < 9) {
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
          <div className="section-head">
            <h2 className="section-title">Built to feel smooth and natural.</h2>
          </div>

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
          <div className="section-head">
            <h2 className="section-title">Teams across the globe.</h2>
            <p className="section-sub">
              Explore where each Pulse team operates inside the network.
            </p>
          </div>

          <div className="world-map-stage">
            <WorldMapSvg />
            <div className="world-map-overlay" />

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