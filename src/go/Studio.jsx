import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

const STUDIO_MODULES = [
  {
    id: 'live-games',
    eyebrow: 'Live Games',
    title: 'Host a Game',
    desc: 'Start hosting',
    longDesc: 'Launch the official Pulse GO live room flow for teams.',
    icon: '🎮',
    action: 'Open',
  },
  {
    id: 'builder',
    eyebrow: 'Builder',
    title: 'Create Your Game',
    desc: 'Coming soon',
    longDesc: 'Build custom game flows, topics, and future training experiences.',
    icon: '🧩',
    action: 'Soon',
  },
  {
    id: 'audio-audits',
    eyebrow: 'Audio Audit',
    title: 'Call-based Training',
    desc: 'Coming soon',
    longDesc: 'Upload a real call, add questions, and turn QA into a game.',
    icon: '🎧',
    action: 'Soon',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Official Questions',
    desc: 'Coming soon',
    longDesc: 'Manage official questions by language, topic, mode, and difficulty.',
    icon: '🧠',
    action: 'Soon',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Final Results',
    desc: 'Open reports',
    longDesc: 'Open a KK room report and review performance.',
    icon: '📊',
    action: 'Open',
  },
]

const STARS = [
  { top: '9%', left: '12%' },
  { top: '14%', left: '34%' },
  { top: '18%', left: '58%' },
  { top: '11%', left: '81%' },
  { top: '27%', left: '10%' },
  { top: '33%', left: '28%' },
  { top: '29%', left: '49%' },
  { top: '35%', left: '72%' },
  { top: '43%', left: '16%' },
  { top: '48%', left: '36%' },
  { top: '45%', left: '61%' },
  { top: '52%', left: '83%' },
  { top: '62%', left: '11%' },
  { top: '68%', left: '32%' },
  { top: '64%', left: '53%' },
  { top: '70%', left: '77%' },
  { top: '83%', left: '15%' },
  { top: '79%', left: '39%' },
  { top: '85%', left: '59%' },
  { top: '82%', left: '87%' },
]

const SHOOTING_STARS = [
  { top: '22%', left: '75%', delay: '0s', duration: '7.2s' },
  { top: '31%', left: '61%', delay: '2.5s', duration: '7.4s' },
  { top: '41%', left: '71%', delay: '5s', duration: '7.1s' },
  { top: '54%', left: '46%', delay: '7.4s', duration: '7.8s' },
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
  const [activeCard, setActiveCard] = useState('audio-audits')

  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  const activeModule =
    STUDIO_MODULES.find((item) => item.id === activeCard) || STUDIO_MODULES[0]

  const openHostGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const openCreateGame = () => {
    // por ahora no hace nada real
    // luego aquí lo conectamos con el builder/studio flow
  }

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
  }

  const handleCardClick = (moduleId) => {
    setActiveCard(moduleId)

    if (moduleId === 'live-games') return
    if (moduleId === 'reports') return
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
              animationDelay: `${index * 0.22}s`,
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
          <div className="studio-copy">
            <h1 className="studio-title">
              <span className="studio-title-main">PULSE</span>
              <span className="studio-title-badge">STUDIO</span>
            </h1>

            <p className="studio-subtitle">
              Create live games, build future audio audits, review reports, and manage
              training content from one interactive workspace.
            </p>

            <div className="studio-actions">
              <button className="studio-primary" onClick={openHostGame}>
                Host a Game →
              </button>

              <button className="studio-secondary" onClick={openCreateGame}>
                Create Your Game
              </button>
            </div>

            <article className="studio-feature-card">
              <span>{activeModule.eyebrow}</span>
              <h2>{activeModule.title}</h2>
              <p>{activeModule.longDesc}</p>
            </article>
          </div>

          <div className="studio-visual">
            <div className="studio-glass-aura" />
            <div className="studio-glass-wrap">
              <div className="studio-glass-shadow" />
              <div className="studio-glass layer-back" />
              <div className="studio-glass layer-middle" />
              <div className="studio-glass layer-front">
                <small>PULSE</small>
                <strong>STUDIO</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="studio-modules">
          {STUDIO_MODULES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`studio-module ${activeCard === item.id ? 'active' : ''}`}
              onClick={() => handleCardClick(item.id)}
            >
              <div className="studio-module-icon">{item.icon}</div>

              <div className="studio-module-copy">
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
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