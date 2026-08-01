import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

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

const STUDIO_OPTIONS = [
  {
    id: 'builder',
    eyebrow: 'Builder',
    title: 'Create Your Game',
    desc: 'Build future custom games, questions, timers, and answer flows.',
    icon: '🧩',
    action: 'Soon',
  },
  {
    id: 'audio',
    eyebrow: 'Audio Audit',
    title: 'Call Training',
    desc: 'Turn real calls into training scenarios with audio-based questions.',
    icon: '🎧',
    action: 'Soon',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Official Questions',
    desc: 'Manage questions by mode, topic, language, and difficulty.',
    icon: '🧠',
    action: 'Soon',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Final Results',
    desc: 'Search any KK room and open the final results report.',
    icon: '📊',
    action: 'Open',
  },
  {
    id: 'proposals',
    eyebrow: 'Proposals',
    title: 'Ideas & Submissions',
    desc: 'Let supervisors and QA suggest new questions safely.',
    icon: '📝',
    action: 'Planned',
  },
]

const STUDIO_TEAMS = [
  { id: 'philippines', name: 'Philippines', flag: '🇵🇭' },
  { id: 'venezuela', name: 'Venezuela', flag: '🇻🇪' },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴' },
  { id: 'mexico', name: 'Mexico BJ', flag: '🇲🇽' },
  { id: 'central', name: 'Central America', flag: '🇭🇳' },
  { id: 'asia', name: 'Asia', flag: '🇵🇭' },
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [hostZoom, setHostZoom] = useState(false)

  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
  }

  const openHostFlow = () => {
    setHostZoom(true)
  }

  const chooseTeam = (teamId) => {
    navigate(`/go/quiz?mode=host&team=${teamId}`)
  }

  const handleOptionClick = (item, index) => {
    setActiveIndex(index)

    if (item.id === 'reports') {
      document.getElementById('studio-reports')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={`studio-page ${isPressed ? 'is-pressed' : ''} ${hostZoom ? 'host-zoom' : ''}`}>
      <div className="studio-bg" />
      <div className="studio-aurora" />
      <div className="studio-grid" />
      <div className="studio-soft-glow" />

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
        <section className="studio-header">
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
        </section>

        <section className="studio-stage">
          <div
            className="studio-glass-scene"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture?.(event.pointerId)
              setIsPressed(true)
            }}
            onPointerUp={() => setIsPressed(false)}
            onPointerCancel={() => setIsPressed(false)}
            onPointerLeave={() => setIsPressed(false)}
          >
            <div className="studio-stage-glow" />

            <div className="studio-glass-stack">
              <div className="studio-glass-base" />
              <div className="studio-glass-layer studio-layer-3" />
              <div className="studio-glass-layer studio-layer-2" />
              <div className="studio-glass-layer studio-layer-1">
                <span>PULSE</span>
                <strong>STUDIO</strong>
              </div>
            </div>

            {hostZoom && (
              <div className="studio-team-panel">
                <button className="studio-back" onClick={() => setHostZoom(false)}>
                  ← Back
                </button>

                <span className="studio-panel-kicker">Create Live Game</span>
                <h2>Choose Team</h2>
                <p>Select which team will play this live game.</p>

                <div className="studio-team-grid">
                  {STUDIO_TEAMS.map((team) => (
                    <button key={team.id} onClick={() => chooseTeam(team.id)}>
                      <span>{team.flag}</span>
                      <strong>{team.name}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="studio-primary-actions">
          <button className="studio-primary" onClick={openHostFlow}>
            Host a Game →
          </button>

          <button
            className="studio-secondary"
            onClick={() => setActiveIndex(0)}
          >
            Create Your Game
          </button>
        </section>

        <section className="studio-option-deck">
          {STUDIO_OPTIONS.map((item, index) => (
            <button
              key={item.id}
              className={`studio-option-card ${activeIndex === index ? 'active' : ''}`}
              onClick={() => handleOptionClick(item, index)}
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
          <div className="studio-report-copy">
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
      </main>
    </div>
  )
}