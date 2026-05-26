import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  learnCategories,
  scripts,
  objections,
  productKnowledge,
  callFlow,
  dosAndDonts,
  dialer,
} from './goContent'
import './GoLanding.css'

const STARS = [
  { top: '12%', left: '10%' },
  { top: '16%', left: '28%' },
  { top: '14%', left: '48%' },
  { top: '18%', left: '78%' },
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

const VISUAL_GUIDES = [
  {
    title: 'Campaign Login',
    desc: 'Where agents enter the campaign system.',
    img: '/training/vici-campaign-login.png',
  },
  {
    title: 'Phone Login',
    desc: 'Phone login and extension setup.',
    img: '/training/vici-phone-login.png',
  },
  {
    title: 'Welcome Screen',
    desc: 'Main screen after logging in.',
    img: '/training/vici-welcome.png',
  },
  {
    title: 'Go Active',
    desc: 'Where agents activate calling status.',
    img: '/training/vici-go-active.png',
  },
  {
    title: 'Lead Form',
    desc: 'Customer information and lead fields.',
    img: '/training/vici-lead-form.png',
  },
  {
    title: 'Live Call',
    desc: 'Live call controls and call handling.',
    img: '/training/vici-live-call.png',
  },
  {
    title: 'Transfer Functions',
    desc: 'Transfer and conference controls.',
    img: '/training/vici-transfer-functions.png',
  },
  {
    title: 'Dispositions',
    desc: 'Disposition list and call outcome tags.',
    img: '/training/vici-dispositions.png',
  },
  {
    title: 'Full Dispositions',
    desc: 'Expanded disposition reference.',
    img: '/training/vici-dispositions-full.png',
  },
  {
    title: 'Pause Codes',
    desc: 'Break, lunch, restroom, tech, callbacks, and manage.',
    img: '/training/vici-pauses-codes.png',
  },
  {
    title: 'IP Validation',
    desc: 'Validation screen for access troubleshooting.',
    img: '/training/vici-ip-validation.png',
  },
]

function getCategoryType(cat) {
  if (cat.id === 'dialer-guide') return 'dialer'
  return cat.type || 'general'
}

function AcademyBackground({ children, active = 'Academy' }) {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const rafRef = useRef(null)
  const audioRef = useRef(null)

  const [ripples, setRipples] = useState([])

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!audioRef.current) audioRef.current = new AudioContext()

      const ctx = audioRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(520, now)
      oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.07)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.1)
    } catch {
      // ignore
    }
  }

  const handleMouseMove = (e) => {
    const page = pageRef.current
    if (!page) return

    const rect = page.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      page.style.setProperty('--mx', `${x}px`)
      page.style.setProperty('--my', `${y}px`)
    })
  }

  const handlePointerDown = (e) => {
    const page = pageRef.current
    if (!page) return

    const rect = page.getBoundingClientRect()
    const ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    setRipples((prev) => [...prev.slice(-4), ripple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((item) => item.id !== ripple.id))
    }, 650)

    if (!e.target.closest('input')) playClickSound()
  }

  return (
    <div
      ref={pageRef}
      className="pgl-page"
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
    >
      <div className="pgl-bg" />
      <div className="pgl-grid" />
      <div className="pgl-soft-glow" />
      <div className="pgl-cursor-glow" />

      <div className="pgl-stars" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="pgl-star"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: `${index * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div className="pgl-shooting-stars" aria-hidden="true">
        {SHOOTING_STARS.map((item, index) => (
          <span
            key={index}
            className="pgl-shooting-star"
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          />
        ))}
      </div>

      <div className="pgl-ripples" aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pgl-ripple"
            style={{
              left: `${ripple.x}px`,
              top: `${ripple.y}px`,
            }}
          />
        ))}
      </div>

      <button className="academy-back-top" onClick={() => navigate('/academy')}>
        ← Back
      </button>

      <nav className="pgl-nav">
        <div className="pgl-nav-pill">
          <button className="pgl-nav-link" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>

          <button className="pgl-nav-link" onClick={() => navigate('/go')}>
            Pulse GO
          </button>

          <button
            className={`pgl-nav-link ${active === 'Academy' ? 'pgl-nav-link-active' : ''}`}
            onClick={() => navigate('/academy')}
          >
            Academy
          </button>
        </div>
      </nav>

      {children}
    </div>
  )
}

function PageHeader({ category }) {
  return (
    <section className="academy-detail-hero academy-main-card">
      <span className="academy-detail-icon">{category.icon}</span>

      <div>
        <span className="academy-card-kicker">Academy</span>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </div>
    </section>
  )
}

function ScriptView({ lang }) {
  const script = scripts[lang]

  return (
    <div className="academy-detail-stack">
      {script.steps.map((step) => (
        <article key={step.id} className="academy-glass-card academy-topic-card">
          <div className="academy-topic-number">{String(step.id).padStart(2, '0')}</div>

          <div className="academy-topic-body">
            <span className="academy-result-sub">{step.type}</span>
            <h2>{step.label}</h2>
            <p>{step.text}</p>

            {step.tip && (
              <div className="academy-note-card">
                <strong>Coach tip</strong>
                <span>{step.tip}</span>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function ObjectionsView({ lang }) {
  return (
    <div className="academy-detail-grid">
      {objections.map((obj) => {
        const title = lang === 'es' ? obj.titleEs : obj.title
        const rebuttal = lang === 'es' ? obj.rebuttalEs : obj.rebuttalEn

        return (
          <article key={obj.id} className="academy-glass-card academy-topic-card">
            <span className="academy-card-icon">{obj.emoji}</span>

            <div className="academy-topic-body">
              <span className="academy-result-sub">{obj.goal}</span>
              <h2>{title}</h2>
              <p>{rebuttal}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function ProductView() {
  return (
    <div className="academy-detail-stack">
      <section className="academy-detail-grid">
        {productKnowledge.comparison.items.map((item) => (
          <article key={item.name} className="academy-glass-card academy-topic-card">
            <span className="academy-card-icon">📦</span>

            <div className="academy-topic-body">
              <span className="academy-result-sub">Comparison</span>
              <h2>{item.name}</h2>

              <ul className="academy-clean-list">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="academy-two-columns">
        <article className="academy-glass-card academy-topic-card">
          <span className="academy-card-icon">✅</span>
          <div className="academy-topic-body">
            <h2>{productKnowledge.canCover.title}</h2>
            <ul className="academy-clean-list">
              {productKnowledge.canCover.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="academy-glass-card academy-topic-card">
          <span className="academy-card-icon">🚫</span>
          <div className="academy-topic-body">
            <h2>{productKnowledge.cannotCover.title}</h2>
            <ul className="academy-clean-list">
              {productKnowledge.cannotCover.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </div>
  )
}

function CallFlowView() {
  return (
    <div className="academy-detail-stack">
      <section className="academy-detail-grid">
        {callFlow.steps.map((step) => (
          <article key={step.id} className="academy-glass-card academy-topic-card">
            <span className="academy-card-icon">{step.icon}</span>

            <div className="academy-topic-body">
              <span className="academy-result-sub">Step {step.id}</span>
              <h2>{step.title}</h2>
              <p>{step.description}</p>

              <ul className="academy-clean-list">
                {step.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <article className="academy-main-card academy-wide-card">
        <span className="academy-card-kicker">Transfer protocol</span>
        <h2>Clean handoff checklist</h2>

        <div className="academy-mini-grid">
          {callFlow.transferProtocol.map((step, index) => (
            <div key={step} className="academy-mini-card">
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="academy-main-card academy-wide-card">
        <span className="academy-card-kicker">While waiting</span>
        <h2>Questions to keep control</h2>

        <div className="academy-mini-grid">
          {callFlow.waitingQuestions.map((question) => (
            <div key={question} className="academy-mini-card">
              <span>{question}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

function DosDontsView() {
  return (
    <div className="academy-detail-stack">
      <section className="academy-detail-grid">
        {dosAndDonts.donts.map((item) => (
          <article key={item.rule} className="academy-glass-card academy-topic-card">
            <span className="academy-card-icon">⚠️</span>

            <div className="academy-topic-body">
              <span className="academy-result-sub">Do not</span>
              <h2>{item.rule}</h2>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="academy-two-columns">
        <article className="academy-glass-card academy-topic-card">
          <span className="academy-card-icon">✅</span>
          <div className="academy-topic-body">
            <h2>Use these fields</h2>
            <ul className="academy-clean-list">
              {dosAndDonts.formFields.use.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="academy-glass-card academy-topic-card">
          <span className="academy-card-icon">🚫</span>
          <div className="academy-topic-body">
            <h2>Ignore these fields</h2>
            <ul className="academy-clean-list">
              {dosAndDonts.formFields.ignore.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <article className="academy-main-card academy-wide-card">
        <span className="academy-card-kicker">Delivery standards</span>
        <h2>What every opener must keep consistent</h2>

        <div className="academy-mini-grid">
          {dosAndDonts.deliveryStandards.map((item) => (
            <div key={item} className="academy-mini-card">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

function DialerGuideView() {
  return (
    <div className="academy-detail-stack">
      <article className="academy-main-card academy-wide-card">
        <span className="academy-card-kicker">Visual guide</span>
        <h2>Vici dialer walkthrough</h2>
      </article>

      <section className="academy-visual-grid">
        {VISUAL_GUIDES.map((item) => (
          <article key={item.img} className="academy-visual-card">
            <img src={item.img} alt={item.title} />
            <div>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </div>
          </article>
        ))}
      </section>

      <article className="academy-main-card academy-wide-card">
        <span className="academy-card-kicker">Dispositions</span>
        <h2>Call result tags</h2>

        <div className="academy-mini-grid">
          {dialer.dispositions.map((item) => (
            <div key={item.code} className="academy-mini-card">
              <strong>{item.code}</strong>
              <span>{item.label}</span>
              <small>{item.description}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="academy-main-card academy-wide-card">
        <span className="academy-card-kicker">Pause codes</span>
        <h2>Correct pause usage</h2>

        <div className="academy-mini-grid">
          {dialer.pauseCodes.map((item) => (
            <div key={item.code} className="academy-mini-card">
              <strong>{item.label}</strong>
              <span>{item.code}</span>
              <small>{item.time} · {item.desc}</small>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

export default function GoLearnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const category = useMemo(
    () => learnCategories.find((item) => item.id === id),
    [id]
  )

  if (!category) {
    return (
      <AcademyBackground>
        <main className="pgl-content academy-detail-content">
          <section className="academy-main-card academy-wide-card">
            <span className="academy-card-kicker">Not found</span>
            <h1>Academy section not found</h1>
            <p>This section does not exist yet.</p>
            <button className="pgl-action-btn" onClick={() => navigate('/academy')}>
              Back to Academy
            </button>
          </section>
        </main>
      </AcademyBackground>
    )
  }

  const type = getCategoryType(category)

  return (
    <AcademyBackground>
      <main className="pgl-content academy-detail-content">
        <PageHeader category={category} />

        {type === 'script' && <ScriptView lang={category.ref} />}
        {type === 'objections' && <ObjectionsView lang={category.ref} />}
        {type === 'product' && <ProductView />}
        {type === 'callflow' && <CallFlowView />}
        {type === 'dosdonts' && <DosDontsView />}
        {type === 'dialer' && <DialerGuideView />}
      </main>
    </AcademyBackground>
  )
}