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
  { id: 'ph', name: 'Philippines', left: '81.2%', top: '57.8%' },
  { id: 'asia', name: 'Asia', left: '70.5%', top: '43.2%' },
  { id: 'mx', name: 'Mexico Baja', left: '19.8%', top: '42.4%' },
  { id: 'central', name: 'Central America', left: '23.8%', top: '48.4%' },
  { id: 'co', name: 'Colombia', left: '28.2%', top: '57%' },
  { id: 've', name: 'Venezuela', left: '31.5%', top: '54.6%' },
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

          <div className="world-map-panel">
            <img
              src="/world-night-map.jpg"
              alt="World map"
              className="world-map-image"
              draggable="false"
            />

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