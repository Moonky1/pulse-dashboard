import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PulseBrandTitle from '../components/PulseBrandTitle'
import './Studio.css'

const STUDIO_MODULES = [
  {
    id: 'live-games',
    eyebrow: 'Live Games',
    title: 'Host a Game',
    desc: 'Start hosting',
    longDesc: 'Launch the official Pulse GO live room flow for teams.',
    icon: '🎮',
    action: 'host',
  },
  {
    id: 'builder',
    eyebrow: 'Builder',
    title: 'Create Your Game',
    desc: 'Coming soon',
    longDesc: 'Build custom questions, answers, timers, and future game styles.',
    icon: '🧩',
    action: 'builder',
  },
  {
    id: 'audio-audit',
    eyebrow: 'Audio Audit',
    title: 'Call-based Training',
    desc: 'Coming soon',
    longDesc: 'Upload a real call, add questions, and turn QA into a game.',
    icon: '🎧',
    action: 'audio',
  },
  {
    id: 'question-bank',
    eyebrow: 'Question Bank',
    title: 'Official Questions',
    desc: 'Coming soon',
    longDesc: 'Organize official questions by topic, language, mode, and difficulty.',
    icon: '🧠',
    action: 'questions',
  },
  {
    id: 'reports',
    eyebrow: 'Reports',
    title: 'Final Results',
    desc: 'Open reports',
    longDesc: 'Open a KK room report and review performance.',
    icon: '📊',
    action: 'reports',
  },
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
  const [activeModule, setActiveModule] = useState(STUDIO_MODULES[0])

  const cleanCode = useMemo(() => cleanRoomCode(reportCode), [reportCode])

  const openLiveGame = () => {
    navigate('/go/quiz?mode=host')
  }

  const openBuilder = () => {
  let storedUser = null

  try {
    storedUser = JSON.parse(
      localStorage.getItem('pulse_user')
    )
  } catch (error) {
    console.error('Could not read Pulse user:', error)
  }

  if (!storedUser) {
    localStorage.setItem(
      'pulse_return_after_auth',
      '/studio/dashboard'
    )

    navigate('/signin')
    return
  }

  navigate('/studio/dashboard')
}

  const openReport = () => {
    if (cleanCode.length < 4) return
    navigate(`/go/results/KK${cleanCode}`)
  }

  const handlePrimaryAction = () => {
    if (activeModule.action === 'host') {
      openLiveGame()
      return
    }

    if (activeModule.action === 'builder') {
  openBuilder()
  return
}

    if (activeModule.action === 'reports') {
      document.getElementById('studio-reports')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
  }

  return (
    <div className="studio-page">
      <div className="studio-bg" />
      <div className="studio-grid" />
      <div className="studio-soft-glow" />

      <div className="studio-stars">
        <span className="studio-star" style={{ left: '8%', top: '16%', animationDelay: '0s' }} />
        <span className="studio-star" style={{ left: '16%', top: '56%', animationDelay: '1.2s' }} />
        <span className="studio-star" style={{ left: '31%', top: '28%', animationDelay: '2.2s' }} />
        <span className="studio-star" style={{ left: '47%', top: '18%', animationDelay: '0.7s' }} />
        <span className="studio-star" style={{ left: '59%', top: '67%', animationDelay: '1.8s' }} />
        <span className="studio-star" style={{ left: '71%', top: '34%', animationDelay: '2.8s' }} />
        <span className="studio-star" style={{ left: '86%', top: '48%', animationDelay: '0.9s' }} />
        <span className="studio-star" style={{ left: '79%', top: '21%', animationDelay: '1.5s' }} />
      </div>

      <div className="studio-shooting-stars">
        <span className="studio-shooting-star star-1" />
        <span className="studio-shooting-star star-2" />
        <span className="studio-shooting-star star-3" />
        <span className="studio-shooting-star star-4" />
      </div>

      <nav className="studio-nav">
        <div className="studio-nav-pill">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/go')}>GO</button>
          <button className="active" onClick={() => navigate('/studio')}>Studio</button>
          <button onClick={() => navigate('/academy')}>Academy</button>
        </div>
      </nav>

      <section className="studio-brand-header">
  <PulseBrandTitle suffix="STUDIO" />
</section>

      <main className="studio-hero">
        <section className="studio-copy">

          <p>
            Create live games, build future audio audits, review reports, and
            manage training content from one interactive workspace.
          </p>

          <div className="studio-actions">
            <button className="studio-primary" onClick={openLiveGame}>
              Host a Game →
            </button>

<button
  className="studio-secondary"
  onClick={openBuilder}
>
  Create Your Game
</button>
          </div>

          <div className="studio-active-preview">
            <span>{activeModule.eyebrow}</span>
            <strong>{activeModule.title}</strong>
            <p>{activeModule.longDesc}</p>
          </div>
        </section>

        <section className="studio-stage">
          <div className="studio-device">
            <div className="studio-device-glow" />
            <div className="studio-device-shell">
              <div className="studio-device-face">
                <span>PULSE</span>
                <strong>STUDIO</strong>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="studio-option-deck">
        {STUDIO_MODULES.map((item) => (
          <button
            key={item.id}
            className={`studio-option-card ${activeModule.id === item.id ? 'active' : ''}`}
            onClick={() => {
  if (item.action === 'builder') {
    openBuilder()
    return
  }

  setActiveModule(item)
}}
            type="button"
          >
            <div className="studio-option-icon">{item.icon}</div>

            <div className="studio-option-copy">
              <small>{item.eyebrow}</small>
              <strong>{item.title}</strong>
              <em>{item.desc}</em>
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