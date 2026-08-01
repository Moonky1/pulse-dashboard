import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

const STUDIO_MODULES = [
  {
    id: 'live-games',
    eyebrow: 'Live Games',
    title: 'Host a Game',
    desc: 'Start hosting',
    icon: '🎮',
    action: 'Open',
  },
  {
    id: 'builder',
    eyebrow: 'Builder',
    title: 'Create Your Game',
    desc: 'Coming soon',
    icon: '🧩',
    action: 'Soon',
  },
  {
    id: 'audio-audits',
    eyebrow: 'Audio Audit',
    title: 'Call-based Training',
    desc: 'Coming soon',
    icon: '🎧',
    action: 'Soon',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Official Questions',
    desc: 'Coming soon',
    icon: '🧠',
    action: 'Soon',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Final Results',
    desc: 'Open reports',
    icon: '📊',
    action: 'Open',
  },
]

const STARS = [
  { top: '10%', left: '10%' },
  { top: '12%', left: '30%' },
  { top: '14%', left: '52%' },
  { top: '15%', left: '76%' },
  { top: '22%', left: '18%' },
  { top: '26%', left: '42%' },
  { top: '24%', left: '66%' },
  { top: '28%', left: '86%' },
  { top: '36%', left: '12%' },
  { top: '40%', left: '32%' },
  { top: '38%', left: '58%' },
  { top: '44%', left: '82%' },
  { top: '56%', left: '14%' },
  { top: '58%', left: '44%' },
  { top: '54%', left: '72%' },
  { top: '64%', left: '24%' },
  { top: '70%', left: '54%' },
  { top: '68%', left: '84%' },
  { top: '80%', left: '18%' },
  { top: '82%', left: '40%' },
  { top: '78%', left: '64%' },
  { top: '84%', left: '88%' },
]

const SHOOTING_STARS = [
  { top: '20%', left: '76%', delay: '0s', duration: '7s' },
  { top: '30%', left: '63%', delay: '2.3s', duration: '7.4s' },
  { top: '18%', left: '56%', delay: '4.4s', duration: '6.8s' },
  { top: '38%', left: '84%', delay: '6.8s', duration: '7.8s' },
]

function cleanRoomCode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^KK/, '')
    .slice(0, 6)
}

export default function Studio() {
  const navigate = useNavigate()
  const [reportCode, setReportCode] = useState('')
  const [activeCard, setActiveCard] = useState('reports')

  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  const openHostGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
  }

  const handleCardClick = (moduleId) => {
    setActiveCard(moduleId)

    if (moduleId === 'live-games') {
      openHostGame()
      return
    }

    if (moduleId === 'reports') {
      document.getElementById('studio-reports')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="studio-page">
      <div className="studio-bg" />
      <div className="studio-grid" />
      <div className="studio-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="studio-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: `${index * 0.2}s`,
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

      <main className="studio-main">
        <section className="studio-hero">
          <div className="studio-kicker">
            <span />
            Host tools for QA, supervisors, and leaders
          </div>

          <h1 className="studio-title">
            <span className="studio-title-main">PULSE</span>
            <span className="studio-title-badge">Studio</span>
          </h1>

          <p className="studio-subtitle">
            Create live games, build future audio audits, review reports, and manage training content
            from one interactive workspace.
          </p>

          <div className="studio-crystal-wrap">
            <div className="studio-crystal-glow" />
            <div className="studio-glass-stack" aria-hidden="true">
              <div className="studio-glass-base" />
              <div className="studio-glass-layer studio-layer-3" />
              <div className="studio-glass-layer studio-layer-2" />
              <div className="studio-glass-layer studio-layer-1">
                <span>PULSE</span>
                <strong>STUDIO</strong>
              </div>
            </div>
          </div>

          <div className="studio-actions">
            <button className="studio-primary" onClick={openHostGame}>
              Host a Game →
            </button>

            <button className="studio-secondary" type="button">
              Create Your Game
            </button>
          </div>
        </section>

        <section className="studio-modules">
          {STUDIO_MODULES.map((item) => (
            <button
              key={item.id}
              className={`studio-module ${activeCard === item.id ? 'active' : ''}`}
              onClick={() => handleCardClick(item.id)}
              type="button"
            >
              <div className="studio-module-icon">{item.icon}</div>

              <div className="studio-module-copy">
                <span>{item.eyebrow}</span>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </div>
            </button>
          ))}
        </section>

        <section id="studio-reports" className="studio-report-panel">
          <div className="studio-report-copy">
            <span>Reports</span>
            <h2>Open a final report by room code.</h2>
            <p>Type a KK code and jump directly to the results page.</p>
          </div>

          <div className="studio-report-box">
            <div className="studio-report-input">
              <span>KK</span>

              <input
                value={reportCode}
                onChange={(event) => setReportCode(cleanRoomCode(event.target.value))}
                onKeyDown={(event) => event.key === 'Enter' && openReport()}
                placeholder="1234"
                autoComplete="off"
              />
            </div>

            <button onClick={openReport} disabled={cleanCode.length < 4}>
              View Report →
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}