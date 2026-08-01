import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

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

const STUDIO_MODULES = [
  {
    id: 'live',
    eyebrow: 'Live Games',
    title: 'Host a Game',
    desc: 'Launch the official Pulse GO live room flow for teams.',
    icon: '🎮',
    action: 'Start hosting',
    theme: 'blue',
    enabled: true,
  },
  {
    id: 'create',
    eyebrow: 'Builder',
    title: 'Create Your Game',
    desc: 'Build custom questions, answers, timers, and future game styles.',
    icon: '🧩',
    action: 'Coming soon',
    theme: 'violet',
    enabled: false,
  },
  {
    id: 'audio',
    eyebrow: 'Audio Audit',
    title: 'Call-based Training',
    desc: 'Upload a real call, add questions, and turn QA into a game.',
    icon: '🎧',
    action: 'Coming soon',
    theme: 'mint',
    enabled: false,
  },
  {
    id: 'bank',
    eyebrow: 'Question Bank',
    title: 'Official Questions',
    desc: 'Browse and organize questions by language, mode, topic, and difficulty.',
    icon: '🧠',
    action: 'Coming soon',
    theme: 'gold',
    enabled: false,
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Final Results',
    desc: 'Open a KK room report and review performance.',
    icon: '📊',
    action: 'Open reports',
    theme: 'rose',
    enabled: true,
  },
]

const SHARDS = Array.from({ length: 42 }, (_, index) => {
  const angle = (index / 42) * Math.PI * 2
  const distance = 180 + (index % 7) * 34
  const drift = index % 2 === 0 ? 1 : -1

  return {
    id: index,
    x: `${Math.cos(angle) * distance}px`,
    y: `${Math.sin(angle) * distance * 0.72}px`,
    z: `${90 + (index % 8) * 28}px`,
    r: `${index * 31 * drift}deg`,
    s: `${0.72 + (index % 5) * 0.12}`,
    w: `${20 + (index % 6) * 8}px`,
    h: `${24 + (index % 7) * 9}px`,
    d: `${index * 0.018}s`,
  }
})

function cleanRoomCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^KK/, '')
    .slice(0, 6)
}

export default function Studio() {
  const navigate = useNavigate()
  const pageRef = useRef(null)

  const [reportCode, setReportCode] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [theme, setTheme] = useState('blue')

  const activeModule = STUDIO_MODULES[activeIndex] || STUDIO_MODULES[0]
  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight)
      const progress = window.scrollY / maxScroll

      const nextIndex = Math.min(
        STUDIO_MODULES.length - 1,
        Math.floor(progress * STUDIO_MODULES.length)
      )

      setActiveIndex(nextIndex)
      setTheme(STUDIO_MODULES[nextIndex]?.theme || 'blue')
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openLiveGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
  }

  const handleModuleClick = (item, index) => {
    setActiveIndex(index)
    setTheme(item.theme)

    if (item.id === 'live') openLiveGame()

    if (item.id === 'reports') {
      document.getElementById('studio-reports')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleMouseMove = (event) => {
    const page = pageRef.current
    if (!page) return

    const rect = page.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const px = x / rect.width
    const py = y / rect.height

    page.style.setProperty('--mx', `${x}px`)
    page.style.setProperty('--my', `${y}px`)
    page.style.setProperty('--rx', `${(py - 0.5) * -9}deg`)
    page.style.setProperty('--ry', `${(px - 0.5) * 12}deg`)
    page.style.setProperty('--tx', `${(px - 0.5) * 24}px`)
    page.style.setProperty('--ty', `${(py - 0.5) * 24}px`)
  }

  return (
    <div
      ref={pageRef}
      className={`studio-page theme-${theme} ${isPressed ? 'is-pressed' : ''}`}
      onMouseMove={handleMouseMove}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
    >
      <div className="studio-bg" />
      <div className="studio-aurora" />
      <div className="studio-grid" />
      <div className="studio-soft-glow" />
      <div className="studio-cursor-glow" />

      <div className="studio-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="studio-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: `${index * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="studio-shooting-stars" aria-hidden="true">
        {SHOOTING_STARS.map((item, index) => (
          <span
            key={index}
            className="studio-shooting-star"
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}
      </div>

      <nav className="studio-nav">
        <div className="studio-nav-pill">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/go')}>Pulse GO</button>
          <button className="active" onClick={() => navigate('/studio')}>
            Studio
          </button>
          <button onClick={() => navigate('/academy')}>Academy</button>
        </div>
      </nav>

      <main className="studio-hero">
        <section className="studio-copy">
          <div className="studio-kicker">
            <span />
            Host tools for QA, supervisors, and leaders
          </div>

          <h1 className="studio-title">
            <span className="studio-title-main">PULSE</span>
            <span className="studio-title-badge">Studio</span>
          </h1>

          <p>
            Create live games, build future audio audits, review reports, and manage training content from one interactive workspace.
          </p>

          <div className="studio-actions">
            <button className="studio-primary" onClick={openLiveGame}>
              Host a Game →
            </button>

            <button className="studio-secondary" onClick={() => setActiveIndex(1)}>
              Create Your Game
            </button>
          </div>

          <div className="studio-active-preview">
            <span>{activeModule.eyebrow}</span>
            <strong>{activeModule.title}</strong>
            <p>{activeModule.desc}</p>
          </div>
        </section>

        <section className="studio-stage" aria-label="Pulse Studio interactive object">
          <div className="studio-crystal-field">
            <span className="studio-field-ring one" />
            <span className="studio-field-ring two" />
            <span className="studio-field-ring three" />

            <div className="studio-device">
              <div className="studio-device-glow" />

              <div className="studio-device-shell">
                <div className="studio-device-face">
                  <span>PULSE</span>
                  <strong>STUDIO</strong>
                </div>

                {SHARDS.map((shard) => (
                  <i
                    key={shard.id}
                    className="studio-shard"
                    style={{
                      '--sx': shard.x,
                      '--sy': shard.y,
                      '--sz': shard.z,
                      '--sr': shard.r,
                      '--ss': shard.s,
                      '--sw': shard.w,
                      '--sh': shard.h,
                      '--sd': shard.d,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="studio-option-deck">
        {STUDIO_MODULES.map((item, index) => (
          <button
            key={item.id}
            className={`studio-option-card ${activeIndex === index ? 'active' : ''}`}
            onClick={() => handleModuleClick(item, index)}
          >
            <span className="studio-option-icon">{item.icon}</span>

            <span className="studio-option-copy">
              <small>{item.eyebrow}</small>
              <strong>{item.title}</strong>
              <em>{item.action}</em>
            </span>
          </button>
        ))}
      </section>

      <section id="studio-reports" className="studio-report-panel">
        <div>
          <span>Reports</span>
          <h2>Open a final report by room code.</h2>
          <p>Type a KK code and jump directly to the results page.</p>
        </div>

        <div className="studio-report-box">
          <span>KK</span>

          <input
            value={reportCode}
            onChange={(event) => setReportCode(cleanRoomCode(event.target.value))}
            onKeyDown={(event) => event.key === 'Enter' && openReport()}
            placeholder="1234"
            autoComplete="off"
          />

          <button onClick={openReport} disabled={cleanCode.length < 4}>
            View Report →
          </button>
        </div>
      </section>
    </div>
  )
}