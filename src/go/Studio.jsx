import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

const STUDIO_MODULES = [
  {
    id: 'live-games',
    eyebrow: 'Live Games',
    title: 'Host team games',
    desc: 'Create a room, choose team, language, game mode, and difficulty, then launch a live competition.',
    icon: '🎮',
    status: 'Ready',
    action: 'Create Game',
  },
  {
    id: 'audio-audits',
    eyebrow: 'Audio Audits',
    title: 'Train from real calls',
    desc: 'Upload calls and create questions based on real QA scenarios, objections, invalids, and consent.',
    icon: '🎧',
    status: 'Next',
    action: 'Coming Soon',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Manage official questions',
    desc: 'Organize questions by mode, topic, language, difficulty, and future approval status.',
    icon: '🧠',
    status: 'Soon',
    action: 'Coming Soon',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Review final results',
    desc: 'Search any KK room code and open a full performance report with scores and missed questions.',
    icon: '📊',
    status: 'Ready',
    action: 'Open Reports',
  },
  {
    id: 'proposals',
    eyebrow: 'Proposals',
    title: 'Submit training ideas',
    desc: 'Let leaders submit new questions without touching the official Pulse GO question bank.',
    icon: '📝',
    status: 'Planned',
    action: 'Planned',
  },
]

const ORBITS = [
  { label: 'Live', className: 'orb-live' },
  { label: 'Audio', className: 'orb-audio' },
  { label: 'Reports', className: 'orb-reports' },
  { label: 'QA', className: 'orb-qa' },
  { label: 'Bank', className: 'orb-bank' },
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
  const pageRef = useRef(null)
  const [reportCode, setReportCode] = useState('')

  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  const openLiveGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
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
    page.style.setProperty('--rx', `${(py - 0.5) * -10}deg`)
    page.style.setProperty('--ry', `${(px - 0.5) * 14}deg`)
    page.style.setProperty('--tx', `${(px - 0.5) * 20}px`)
    page.style.setProperty('--ty', `${(py - 0.5) * 20}px`)
  }

  return (
    <div ref={pageRef} className="studio-page" onMouseMove={handleMouseMove}>
      <div className="studio-bg" />
      <div className="studio-grid" />
      <div className="studio-stars" />
      <div className="studio-cursor" />
      <div className="studio-scanline" />

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
            Create live games, prepare audio audits, review reports, and organize training content from one powerful workspace.
          </p>

          <div className="studio-actions">
            <button className="studio-primary" onClick={openLiveGame}>
              Create Live Game →
            </button>

            <button
              className="studio-secondary"
              onClick={() =>
                document
                  .getElementById('studio-reports')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Open Reports
            </button>
          </div>

          <div className="studio-metrics">
            <div>
              <strong>Live</strong>
              <span>Host rooms</span>
            </div>
            <div>
              <strong>QA</strong>
              <span>Training tools</span>
            </div>
            <div>
              <strong>KK</strong>
              <span>Reports</span>
            </div>
          </div>
        </section>

        <section className="studio-stage" aria-label="Pulse Studio 3D module preview">
          <div className="studio-stage-ring ring-one" />
          <div className="studio-stage-ring ring-two" />

          <div className="studio-core">
            <span className="studio-core-top">PULSE</span>
            <strong>GO</strong>
            <span className="studio-core-bottom">STUDIO</span>
          </div>

          {ORBITS.map((item) => (
            <div key={item.label} className={`studio-orbit-card ${item.className}`}>
              {item.label}
            </div>
          ))}
        </section>
      </main>

      <section className="studio-strip">
        <span>LIVE GAMES</span>
        <span>AUDIO AUDITS</span>
        <span>QUESTION BANK</span>
        <span>REPORTS</span>
        <span>PROPOSALS</span>
      </section>

      <section className="studio-modules">
        {STUDIO_MODULES.map((item, index) => (
          <article key={item.id} className="studio-module" style={{ '--i': index }}>
            <div className="studio-module-icon">{item.icon}</div>

            <div className="studio-module-body">
              <span>{item.eyebrow}</span>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </div>

            <div className="studio-module-side">
              <b className={`studio-status ${item.status.toLowerCase()}`}>
                {item.status}
              </b>

              <button
                onClick={() => {
                  if (item.id === 'live-games') openLiveGame()
                  if (item.id === 'reports') {
                    document
                      .getElementById('studio-reports')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                disabled={!['live-games', 'reports'].includes(item.id)}
              >
                {item.action}
              </button>
            </div>
          </article>
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