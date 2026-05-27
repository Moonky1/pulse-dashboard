import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  {
    title: 'Live dashboard',
    desc: 'Track team performance, daily movement, rankings, and key production numbers in one place.',
  },
  {
    title: 'Pulse GO',
    desc: 'Practice, host live training games, review answers, and sharpen call-flow skills with your team.',
  },
  {
    title: 'Academy',
    desc: 'A searchable training hub for scripts, objections, product knowledge, compliance, and dialer guides.',
  },
  {
    title: 'Leader tools',
    desc: 'Built for team leaders, QA, and supervisors who need fast visibility without digging through sheets.',
  },
]

const TEAMS = [
  {
    name: 'Asia',
    region: 'Regional Hub',
    flag: '/flags/asia.png',
    desc: 'English-focused production team with daily tracking and live visibility.',
  },
  {
    name: 'Philippines',
    region: 'Asia Pacific',
    flag: '/flags/philippines.png',
    desc: 'High-volume English operations with strong transfer performance tracking.',
  },
  {
    name: 'Colombia',
    region: 'South America',
    flag: '/flags/colombia.png',
    desc: 'Bilingual support and production visibility for English and Spanish activity.',
  },
  {
    name: 'Central America',
    region: 'LATAM',
    emoji: '🌎',
    desc: 'Regional team coverage with live performance and support coordination.',
  },
  {
    name: 'Mexico Baja',
    region: 'North America',
    flag: '/flags/mexico.png',
    desc: 'Team visibility for daily production, tracking, and operational reporting.',
  },
  {
    name: 'Venezuela',
    region: 'South America',
    flag: '/flags/venezuela.png',
    desc: 'Regional support team connected to Pulse tracking and daily operations.',
  },
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
  const [activeSection, setActiveSection] = useState('home')

  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const teamsRef = useRef(null)
  const missionRef = useRef(null)
  const solarCanvasRef = useRef(null)
  const solarZoneRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 70)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const sections = [
      { key: 'home', ref: heroRef },
      { key: 'features', ref: featuresRef },
      { key: 'teams', ref: teamsRef },
      { key: 'mission', ref: missionRef },
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleEntry) return

        const match = sections.find((section) => section.ref.current === visibleEntry.target)
        if (match) setActiveSection(match.key)
      },
      {
        threshold: [0.25, 0.4, 0.6],
        rootMargin: '-22% 0px -55% 0px',
      }
    )

    sections.forEach((section) => {
      if (section.ref.current) observer.observe(section.ref.current)
    })

    return () => observer.disconnect()
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
        y: rect.height * 0.67,
      }
    }

    const spawnParticle = (width, height) => {
      const side = Math.floor(Math.random() * 3)

      if (side === 0) {
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.28,
          size: Math.random() * 1.45 + 0.55,
          speed: Math.random() * 0.009 + 0.004,
          alpha: Math.random() * 0.48 + 0.16,
        }
      }

      if (side === 1) {
        return {
          x: Math.random() < 0.5 ? -10 : width + 10,
          y: Math.random() * height * 0.34,
          size: Math.random() * 1.45 + 0.55,
          speed: Math.random() * 0.009 + 0.004,
          alpha: Math.random() * 0.48 + 0.16,
        }
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height * 0.22,
        size: Math.random() * 1.45 + 0.55,
        speed: Math.random() * 0.009 + 0.004,
        alpha: Math.random() * 0.48 + 0.16,
      }
    }

    const setup = () => {
      const rect = zone.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(rect.width * ratio)
      canvas.height = Math.floor(rect.height * ratio)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

      const count = Math.min(34, Math.max(14, Math.floor(rect.width / 48)))
      particles = Array.from({ length: count }, () => spawnParticle(rect.width, rect.height))
    }

    const draw = () => {
      const { width, height, x: tx, y: ty } = getTarget()

      ctx.clearRect(0, 0, width, height)

      particles.forEach((particle, index) => {
        const dx = tx - particle.x
        const dy = ty - particle.y
        const dist = Math.hypot(dx, dy) || 1

        particle.x += dx * particle.speed
        particle.y += dy * particle.speed

        const alpha = particle.alpha * Math.max(0, Math.min(1, dist / 360))

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(235, 244, 255, ${alpha})`
        ctx.fill()

        if (dist < 8) {
          particles[index] = spawnParticle(width, height)
        }
      })

      raf = requestAnimationFrame(draw)
    }

    setup()
    draw()

    const handleResize = () => setup()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="landing">
      <header className="landing-navbar">
        <nav className="landing-nav-pill" aria-label="Pulse navigation">
          <button
            type="button"
            className={activeSection === 'home' ? 'active' : ''}
            onClick={() => scrollToRef(heroRef)}
          >
            Home
          </button>

          <button
            type="button"
            className={activeSection === 'features' ? 'active' : ''}
            onClick={() => scrollToRef(featuresRef)}
          >
            Features
          </button>

          <button
            type="button"
            className={activeSection === 'teams' ? 'active' : ''}
            onClick={() => scrollToRef(teamsRef)}
          >
            Teams
          </button>

          <button type="button" onClick={() => navigate('/go')}>
            Pulse GO
          </button>
        </nav>
      </header>

      <main className={`landing-shell ${visible ? 'is-visible' : ''}`}>
        <section ref={heroRef} className="hero-section">
          <h1 className="hero-title">PULSE</h1>

          <p className="hero-sub">Performance intelligence for leaders.</p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-action hero-action-primary"
              onClick={() => navigate('/signin')}
            >
              Sign In →
            </button>

            <button
              type="button"
              className="hero-action hero-action-secondary"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>

          <div ref={solarZoneRef} className="hero-solar-zone">
            <canvas ref={solarCanvasRef} className="solar-particle-canvas" aria-hidden="true" />

            <div className="solar-main-glow" />
            <div className="solar-wave solar-wave-1" />
            <div className="solar-wave solar-wave-2" />
            <div className="solar-wave solar-wave-3" />

            <div className="solar-line" />

            <div className="solar-core-wrap">
              <div className="solar-core-ring" />
              <div className="solar-core" />
            </div>

            <div className="solar-bottom-mask" />
          </div>
        </section>

        <section ref={featuresRef} className="feature-section">
          <div className="section-head">
            <span className="section-kicker">Features</span>
            <h2 className="section-title section-title-xl">
              Everything leaders need, without the noise.
            </h2>
            <p className="section-sub">
              Pulse brings production, learning, performance, and team visibility into one smooth workspace.
            </p>
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
            <span className="section-kicker">Teams</span>
            <h2 className="section-title section-title-xl">Built for every region.</h2>
            <p className="section-sub">
              A clean view for each team connected to Kampaign Kings operations.
            </p>
          </div>

          <div className="teams-grid">
            {TEAMS.map((team) => (
              <article key={team.name} className="team-card">
                <div className="team-card-top">
                  {team.flag ? (
                    <img className="team-flag" src={team.flag} alt="" />
                  ) : (
                    <span className="team-emoji">{team.emoji}</span>
                  )}

                  <span className="team-region">{team.region}</span>
                </div>

                <h3>{team.name}</h3>
                <p>{team.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section ref={missionRef} className="mission-section">
          <div className="mission-card">
            <span className="section-kicker">Mission</span>
            <h2>Make performance easier to see, train, and improve.</h2>
            <p>
              Pulse exists to help leaders move faster: cleaner data, better coaching, stronger training,
              and one shared place for the team to grow.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}