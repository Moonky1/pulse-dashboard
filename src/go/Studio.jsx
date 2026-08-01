import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Studio.css'

const STUDIO_MODULES = [
  {
    id: 'live-games',
    eyebrow: 'Live Games',
    title: 'Host team games from the official Pulse GO bank.',
    desc: 'Create a room, choose the team, language, game mode, and difficulty, then launch a live competition for agents.',
    icon: '🎮',
    status: 'Ready',
  },
  {
    id: 'audio-audits',
    eyebrow: 'Audio Audits',
    title: 'Turn real calls into training games.',
    desc: 'Upload a call, add questions, select correct answers, and train agents using real QA scenarios.',
    icon: '🎧',
    status: 'Next',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Manage questions by mode, topic, language, and difficulty.',
    desc: 'Browse official questions, prepare new scenarios, and keep Pulse GO training organized.',
    icon: '🧠',
    status: 'Soon',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Search any KK code and review final performance.',
    desc: 'Open result reports, compare scores, review missed questions, and identify coaching opportunities.',
    icon: '📊',
    status: 'Ready',
  },
  {
    id: 'proposals',
    eyebrow: 'Proposals',
    title: 'Let leaders submit questions without touching the official bank.',
    desc: 'Supervisors and QA can propose new questions, then admins approve them before they become official.',
    icon: '📝',
    status: 'Planned',
  },
]

const ORBITS = [
  { label: 'Games', angle: 8, delay: '0s' },
  { label: 'Audio', angle: -12, delay: '0.5s' },
  { label: 'Reports', angle: 16, delay: '1s' },
  { label: 'QA', angle: -6, delay: '1.4s' },
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
      <div className="studio-noise" />
      <div className="studio-glow one" />
      <div className="studio-glow two" />

      <header className="studio-topbar">
        <button className="studio-brand" onClick={() => navigate('/studio')}>
          <span>BoostGO</span>
          <b>Studio</b>
        </button>

        <div className="studio-top-actions">
          <button onClick={() => navigate('/go')}>Pulse GO</button>
          <button onClick={() => navigate('/academy')}>Academy</button>
          <button className="primary" onClick={openLiveGame}>Create Game</button>
        </div>
      </header>

      <main className="studio-hero">
        <section className="studio-copy">
          <div className="studio-kicker">
            <span className="studio-dot" />
            Host tools for QA, supervisors, and leaders
          </div>

          <h1>
            Build smarter training inside
            <span> BoostGO Studio.</span>
          </h1>

          <p>
            Create live games, prepare audio audits, review reports, and organize question proposals from one cinematic workspace.
          </p>

          <div className="studio-hero-actions">
            <button className="studio-cta" onClick={openLiveGame}>
              Create Live Game →
            </button>

            <button
              className="studio-ghost"
              onClick={() => document.getElementById('studio-reports')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Open Reports
            </button>
          </div>
        </section>

        <section className="studio-orbit" aria-label="BoostGO Studio modules preview">
          <div className="studio-core">
            <span>BOOST</span>
            <b>GO</b>
            <small>STUDIO</small>
          </div>

          {ORBITS.map((item, index) => (
            <div
              key={item.label}
              className={`studio-orbit-card card-${index + 1}`}
              style={{ '--angle': `${item.angle}deg`, '--delay': item.delay }}
            >
              {item.label}
            </div>
          ))}
        </section>
      </main>

      <section className="studio-modules" aria-label="Studio modules">
        {STUDIO_MODULES.map((item, index) => (
          <article key={item.id} className="studio-module" style={{ '--i': index }}>
            <div className="studio-module-icon">{item.icon}</div>

            <div>
              <span className="studio-module-eyebrow">{item.eyebrow}</span>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </div>

            <span className={`studio-status ${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </article>
        ))}
      </section>

      <section id="studio-reports" className="studio-report-panel">
        <div>
          <span className="studio-module-eyebrow">Reports</span>
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