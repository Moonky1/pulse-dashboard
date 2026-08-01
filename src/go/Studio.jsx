import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

const STUDIO_MODULES = [
  {
    id: 'live-games',
    eyebrow: 'Live Games',
    title: 'Host team games',
    desc: 'Create a room, choose the team, language, game mode, and difficulty.',
    icon: '🎮',
    status: 'Ready',
  },
  {
    id: 'audio-audits',
    eyebrow: 'Audio Audits',
    title: 'Train from real calls',
    desc: 'Upload calls and create questions based on real QA scenarios.',
    icon: '🎧',
    status: 'Next',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Manage official questions',
    desc: 'Organize questions by mode, topic, language, and difficulty.',
    icon: '🧠',
    status: 'Soon',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Review final results',
    desc: 'Search any KK code and open the final performance report.',
    icon: '📊',
    status: 'Ready',
  },
  {
    id: 'proposals',
    eyebrow: 'Proposals',
    title: 'Submit new ideas',
    desc: 'Let leaders suggest questions without touching the official bank.',
    icon: '📝',
    status: 'Planned',
  },
]

const ORBITS = [
  { label: 'Games', delay: '0s' },
  { label: 'Audio', delay: '0.5s' },
  { label: 'Reports', delay: '1s' },
  { label: 'QA', delay: '1.4s' },
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

  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  const openLiveGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
  }

  return (
    <div className="studio-page">
      <div className="studio-bg" />
      <div className="studio-grid" />
      <div className="studio-stars" />

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
        </section>

        <section className="studio-orbit">
          <div className="studio-core">
            <strong>GO</strong>
            <span>STUDIO</span>
          </div>

          {ORBITS.map((item, index) => (
            <div
              key={item.label}
              className={`studio-orbit-card card-${index + 1}`}
              style={{ '--delay': item.delay }}
            >
              {item.label}
            </div>
          ))}
        </section>
      </main>

      <section className="studio-modules">
        {STUDIO_MODULES.map((item) => (
          <article key={item.id} className="studio-module">
            <div className="studio-module-icon">{item.icon}</div>

            <div>
              <span>{item.eyebrow}</span>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </div>

            <b className={`studio-status ${item.status.toLowerCase()}`}>
              {item.status}
            </b>
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