import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scripts, objections, productKnowledge, callFlow, dosAndDonts } from './goContent'
import './GoPresent.css'

// Build slide deck
const buildSlides = () => [
  // ── Cover ──
  { id: 's0', type: 'cover', title: 'Opener Training Session', sub: 'Auto Warranty · Kampaign Kings', icon: '🎧' },

  // ── Objective ──
  { id: 's1', type: 'bullets', title: 'Training Objective', icon: '🎯',
    items: ['Deliver the official script word-for-word', 'Verify vehicle eligibility correctly', 'Handle objections professionally', 'Execute clean, compliant transfers', 'Use the dialer and dispositions properly'] },

  // ── Script Mastery ──
  { id: 's2', type: 'four-box', title: 'Script Mastery — 4 Steps', icon: '📋',
    boxes: [
      { label: 'Introduction & Financing Info', color: '#f97316' },
      { label: 'Vehicle Condition Verification', color: '#ea580c' },
      { label: 'Setting Expectations',           color: '#c2410c' },
      { label: 'Professional Transfer',          color: '#9a3412' },
    ] },

  // ── English Script ──
  { id: 's3', type: 'script', title: 'English Script 🇺🇸', steps: scripts.en.steps },

  // ── Spanish Script ──
  { id: 's4', type: 'script', title: 'Spanish Script 🇪🇸', steps: scripts.es.steps },

  // ── Product Knowledge ──
  { id: 's5', type: 'comparison', title: 'Extended Warranty vs. Others', icon: '📦',
    cols: productKnowledge.comparison.items },

  // ── Cannot Cover ──
  { id: 's6', type: 'bullets', title: 'What We CANNOT Cover', icon: '🚫', danger: true,
    items: productKnowledge.cannotCover.items },

  // ── What NOT to say ──
  { id: 's7', type: 'donts', title: "What NOT to Say", icon: '⛔',
    items: dosAndDonts.donts },

  // ── Transfer Protocol ──
  { id: 's8', type: 'steps', title: 'Transfer Protocol', icon: '🔄',
    steps: callFlow.transferProtocol },

  // ── Core Objections ──
  ...objections.slice(0, 8).map((o, i) => ({
    id: `obj${i}`, type: 'objection',
    title: o.title, emoji: o.emoji,
    goal: o.goal, rebuttal: o.rebuttalEn,
  })),

  // ── End ──
  { id: 'send', type: 'cover', title: 'Start Dialing!', sub: 'Kampaign Kings · Auto Warranty Garrett', icon: '📞' },
]

const SLIDES = buildSlides()

export default function GoPresent() {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const slide = SLIDES[idx]
  const prev = () => setIdx(i => Math.max(0, i - 1))
  const next = () => setIdx(i => Math.min(SLIDES.length - 1, i + 1))

  const handleKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') next()
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'Escape') setFullscreen(false)
  }

  const renderSlide = (s) => {
    switch (s.type) {
      case 'cover':
        return (
          <div className="gpr-slide-cover">
            <div className="gpr-cover-icon">{s.icon}</div>
            <h1 className="gpr-cover-title">{s.title}</h1>
            <p className="gpr-cover-sub">{s.sub}</p>
          </div>
        )
      case 'bullets':
        return (
          <div className="gpr-slide-content">
            <h2 className="gpr-slide-title">{s.icon} {s.title}</h2>
            <ul className="gpr-bullets">
              {s.items.map((item, i) => (
                <li key={i} className={`gpr-bullet ${s.danger ? 'danger' : ''}`}>
                  <span className="gpr-bullet-dot" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )
      case 'four-box':
        return (
          <div className="gpr-slide-content">
            <h2 className="gpr-slide-title">{s.title}</h2>
            <div className="gpr-four-box">
              {s.boxes.map((b, i) => (
                <div key={i} className="gpr-box" style={{ background: b.color }}>
                  <span className="gpr-box-num">{i + 1}</span>
                  <span className="gpr-box-label">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 'script':
        return (
          <div className="gpr-slide-content gpr-script">
            <h2 className="gpr-slide-title">{s.title}</h2>
            <div className="gpr-script-steps">
              {s.steps.filter(st => st.type === 'line' || st.type === 'bridge').map((st, i) => (
                <div key={i} className={`gpr-script-line type-${st.type}`}>
                  <span className="gpr-script-label">{st.label}</span>
                  <span className="gpr-script-text">{st.text}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 'comparison':
        return (
          <div className="gpr-slide-content">
            <h2 className="gpr-slide-title">{s.title}</h2>
            <div className="gpr-comparison">
              {s.cols.map((col, i) => (
                <div key={i} className="gpr-comp-col">
                  <div className="gpr-comp-title" style={{ color: col.color }}>{col.name}</div>
                  <ul>
                    {col.points.map((p, j) => <li key={j}>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )
      case 'donts':
        return (
          <div className="gpr-slide-content">
            <h2 className="gpr-slide-title">{s.icon} {s.title}</h2>
            <div className="gpr-donts">
              {s.items.map((item, i) => (
                <div key={i} className="gpr-dont">
                  <span className="gpr-dont-num">{i + 1}</span>
                  <div>
                    <div className="gpr-dont-rule">{item.rule}</div>
                    <div className="gpr-dont-detail">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case 'steps':
        return (
          <div className="gpr-slide-content">
            <h2 className="gpr-slide-title">{s.icon} {s.title}</h2>
            <div className="gpr-steps">
              {s.steps.map((step, i) => (
                <div key={i} className="gpr-step">
                  <span className="gpr-step-num">{i + 1}</span>
                  <span className="gpr-step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 'objection':
        return (
          <div className="gpr-slide-content gpr-obj">
            <div className="gpr-obj-emoji">{s.emoji}</div>
            <h2 className="gpr-obj-title">"{s.title}"</h2>
            <div className="gpr-obj-goal">Goal: {s.goal}</div>
            <div className="gpr-obj-rebuttal">"{s.rebuttal}"</div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={`gpr-page ${fullscreen ? 'fullscreen' : ''}`} onKeyDown={handleKey} tabIndex={0}>
      <nav className="gpr-nav">
        <div className="gpr-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gpr-nav-text">Pulse</span>
          <span className="gpr-nav-badge">GO</span>
        </div>
        <div className="gpr-nav-meta">
          <span className="gpr-nav-counter">{idx + 1} / {SLIDES.length}</span>
        </div>
        <div className="gpr-nav-actions">
          <button className="gpr-btn-icon" onClick={() => setFullscreen(f => !f)} title="Fullscreen">
            {fullscreen ? '⊡' : '⛶'}
          </button>
          <button className="gpr-nav-back" onClick={() => navigate('/go')}>← Back</button>
        </div>
      </nav>

      {/* Thumbnail sidebar */}
      {!fullscreen && (
        <div className="gpr-sidebar">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className={`gpr-thumb ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
            >
              <span className="gpr-thumb-num">{i + 1}</span>
              <span className="gpr-thumb-title">{s.title?.slice(0, 22)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main slide */}
      <div className="gpr-main">
        <div className="gpr-slide">
          {renderSlide(slide)}
        </div>

        {/* Controls */}
        <div className="gpr-controls">
          <button className="gpr-ctrl-btn" onClick={prev} disabled={idx === 0}>← Prev</button>
          <div className="gpr-progress-bar">
            <div className="gpr-progress-fill" style={{ width: `${((idx + 1) / SLIDES.length) * 100}%` }} />
          </div>
          <button className="gpr-ctrl-btn primary" onClick={next} disabled={idx === SLIDES.length - 1}>Next →</button>
        </div>
      </div>
    </div>
  )
}