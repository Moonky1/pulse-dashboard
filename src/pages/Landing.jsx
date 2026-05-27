import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const STARS = [
  { top: '12%', left: '10%' },
  { top: '16%', left: '28%' },
  { top: '14%', left: '48%' },
  { top: '18%', left: '72%' },
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

const FEATURES = [
  {
    icon: '📊',
    title: 'Live Operations',
    desc: 'View daily production, team movement, English, Spanish, invalids, and total xfers in one clean workspace.',
  },
  {
    icon: '🏆',
    title: 'Rankings',
    desc: 'Track top performers, consistency, team leaders, and performance trends without manually checking sheets.',
  },
  {
    icon: '👤',
    title: 'Agent Profiles',
    desc: 'Review each agent’s progress, production history, goals, and performance patterns over time.',
  },
  {
    icon: '🧠',
    title: 'Pulse GO Training',
    desc: 'Practice with quizzes, live rooms, objections, call-flow scenarios, and team-based learning games.',
  },
  {
    icon: '📚',
    title: 'Academy Search',
    desc: 'Find scripts, rebuttals, product knowledge, compliance reminders, and dialer guides fast.',
  },
  {
    icon: '✅',
    title: 'QA & Invalid Tracking',
    desc: 'Keep coaching focused by connecting invalid transfer patterns with clear training opportunities.',
  },
]

const TEAMS = [
  {
    name: 'Asia',
    flag: '/flags/asia.png',
    desc: 'English-focused production team with live visibility and daily performance tracking.',
  },
  {
    name: 'Philippines',
    flag: '/flags/philippines.png',
    desc: 'High-volume English operations with clear daily and weekly tracking.',
  },
  {
    name: 'Colombia',
    flag: '/flags/colombia.png',
    desc: 'Bilingual team visibility for English and Spanish production.',
  },
  {
    name: 'Central America',
    emoji: '🌎',
    desc: 'Regional team coverage for production, coaching, and daily support.',
  },
  {
    name: 'Mexico Baja',
    flag: '/flags/mexico.png',
    desc: 'Team performance view for daily production and operational reporting.',
  },
  {
    name: 'Venezuela',
    flag: '/flags/venezuela.png',
    desc: 'Regional team connected to live tracking, support, and performance insights.',
  },
]

export default function Landing() {
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
      oscillator.frequency.setValueAtTime(540, now)
      oscillator.frequency.exponentialRampToValueAtTime(320, now + 0.075)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.11)
    } catch {
      // no sound if browser blocks it
    }
  }

  const handleMouseMove = (e) => {
    const page = pageRef.current
    if (!page) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      page.style.setProperty('--mx', `${e.clientX}px`)
      page.style.setProperty('--my', `${e.clientY}px`)
    })
  }

  const handlePointerDown = (e) => {
    playClickSound()

    const ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    }

    setRipples((prev) => [...prev.slice(-4), ripple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id))
    }, 650)
  }

  const blockCopy = (e) => {
    e.preventDefault()
  }

  return (
    <div
      ref={pageRef}
      className="home-page"
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
      onCopy={blockCopy}
      onCut={blockCopy}
      onContextMenu={blockCopy}
      onDragStart={blockCopy}
    >
      <div className="home-bg" />
      <div className="home-grid" />
      <div className="home-soft-glow" />
      <div className="home-cursor-glow" />

      <div className="home-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="home-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: `${index * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="home-shooting-stars" aria-hidden="true">
        {SHOOTING_STARS.map((item, index) => (
          <span
            key={index}
            className="home-shooting-star"
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}
      </div>

      <div className="home-ripples" aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="home-ripple"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
            }}
          />
        ))}
      </div>

      <nav className="home-nav">
        <div className="home-nav-pill">
          <button
            type="button"
            className="home-nav-link home-nav-link-active"
            onClick={() => navigate('/')}
          >
            Home
          </button>

          <button
            type="button"
            className="home-nav-link"
            onClick={() => navigate('/go')}
          >
            Pulse GO
          </button>

          <button
            type="button"
            className="home-nav-link"
            onClick={() => navigate('/academy')}
          >
            Academy
          </button>
        </div>
      </nav>

      <main className="home-content">
        <section className="home-hero">
          <h1 className="home-title" draggable="false">
            PULSE
          </h1>

          <p className="home-subtitle">Performance intelligence for leaders.</p>

          <div className="home-actions">
            <button
              type="button"
              className="home-action-btn home-action-primary"
              onClick={() => navigate('/signin')}
            >
              Sign In →
            </button>

            <button
              type="button"
              className="home-action-btn"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>

          <div className="home-haze-wrap" aria-hidden="true">
            <div className="home-haze home-haze-1" />
            <div className="home-haze home-haze-2" />
            <div className="home-haze home-haze-3" />
            <div className="home-haze-core" />
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <span className="home-kicker">Features</span>
            <h2>Everything leaders need, without the noise.</h2>
            <p>
              Pulse brings production, learning, performance, and team visibility into one smooth workspace.
            </p>
          </div>

          <div className="home-feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="home-card">
                <span className="home-card-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <span className="home-kicker">Teams</span>
            <h2>Built for every region.</h2>
            <p>
              One platform for Kampaign Kings leaders to track, train, and support every team.
            </p>
          </div>

          <div className="home-team-grid">
            {TEAMS.map((team) => (
              <article key={team.name} className="home-team-card">
                <div className="home-team-top">
                  {team.flag ? (
                    <img className="home-team-flag" src={team.flag} alt="" />
                  ) : (
                    <span className="home-team-emoji">{team.emoji}</span>
                  )}

                  <h3>{team.name}</h3>
                </div>

                <p>{team.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-mission-section">
          <article className="home-mission-card">
            <span className="home-kicker">Mission</span>
            <h2>Make performance easier to see, train, and improve.</h2>
            <p>
              Pulse helps leaders move faster with cleaner data, stronger coaching, better training,
              and one shared place for the team to grow.
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}