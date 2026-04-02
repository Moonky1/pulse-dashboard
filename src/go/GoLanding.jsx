import { useNavigate } from 'react-router-dom'
import './go.css'

export default function GoLanding() {
  const nav = useNavigate()

  const modes = [
    {
      icon: '📚',
      title: 'Learn',
      desc: 'Study scripts, objections, product knowledge, and call flow — all in one place.',
      cta: 'Start Learning →',
      path: '/go/learn',
    },
    {
      icon: '🧠',
      title: 'Quiz',
      desc: 'Test your knowledge with timed questions. Play solo or compete with your team.',
      cta: 'Take a Quiz →',
      path: '/go/quiz',
    },
    {
      icon: '📊',
      title: 'Present',
      desc: 'Slide-ready training material for team leaders to use in live sessions.',
      cta: 'Open Slides →',
      path: '/go/present',
    },
  ]

  return (
    <div className="go-page">
      {/* Nav */}
      <nav className="go-nav">
        <a className="go-nav-logo" href="/dashboard">
          <span>Pulse</span>
          <span className="go-badge">GO</span>
        </a>
        <button className="go-nav-back" onClick={() => nav('/dashboard')}>
          ← Dashboard
        </button>
      </nav>

      {/* Hero */}
      <div className="go-landing-hero">
        <span className="go-landing-eyebrow">
          ⚡ Kampaign Kings Training Hub
        </span>
        <h1 className="go-landing-title">Pulse Go</h1>
        <p className="go-landing-sub">
          Learn the script, master objections, and level up your calls — all in one place.
        </p>
      </div>

      {/* Mode Cards */}
      <div className="go-mode-grid">
        {modes.map((m) => (
          <div
            key={m.title}
            className="go-mode-card"
            onClick={() => nav(m.path)}
          >
            <span className="go-mode-icon">{m.icon}</span>
            <div className="go-mode-title">{m.title}</div>
            <p className="go-mode-desc">{m.desc}</p>
            <span className="go-mode-cta">{m.cta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}