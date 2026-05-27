import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'script', label: 'Scripts' },
  { id: 'objections', label: 'Objections' },
  { id: 'product', label: 'Product' },
  { id: 'callflow', label: 'Call Flow' },
  { id: 'dosdonts', label: "Do's & Don'ts" },
  { id: 'dialer', label: 'Dialer' },
]

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function trimText(value, max = 145) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}...`
}

function getCategoryType(cat) {
  if (cat.id === 'dialer-guide') return 'dialer'
  return cat.type || 'general'
}

function buildSearchIndex() {
  const index = []

  learnCategories.forEach((cat) => {
    index.push({
      id: `category-${cat.id}`,
      type: getCategoryType(cat),
      route: `/academy/${cat.id}`,
      icon: cat.icon,
      title: cat.title,
      subtitle: 'Academy section',
      description: cat.description,
      keywords: [cat.title, cat.description, cat.id, cat.type, cat.ref].join(' '),
    })
  })

  Object.entries(scripts).forEach(([lang, script]) => {
    const categoryId = lang === 'es' ? 'script-es' : 'script-en'

    script.steps.forEach((step) => {
      index.push({
        id: `script-${lang}-${step.id}`,
        type: 'script',
        route: `/academy/${categoryId}`,
        icon: script.flag,
        title: step.label,
        subtitle: script.title,
        description: step.tip ? `${step.text} ${step.tip}` : step.text,
        keywords: [script.title, step.label, step.text, step.tip, lang].join(' '),
      })
    })
  })

  objections.forEach((obj) => {
    index.push({
      id: `objection-en-${obj.id}`,
      type: 'objections',
      route: '/academy/objections-en',
      icon: obj.emoji,
      title: obj.title,
      subtitle: 'English objection',
      description: `${obj.goal}. ${obj.rebuttalEn}`,
      keywords: [obj.title, obj.goal, obj.rebuttalEn, 'english objection rebuttal'].join(' '),
    })

    index.push({
      id: `objection-es-${obj.id}`,
      type: 'objections',
      route: '/academy/objections-es',
      icon: obj.emoji,
      title: obj.titleEs,
      subtitle: 'Spanish objection',
      description: `${obj.goal}. ${obj.rebuttalEs}`,
      keywords: [obj.titleEs, obj.goal, obj.rebuttalEs, 'spanish objection rebuttal español'].join(' '),
    })
  })

  productKnowledge.comparison.items.forEach((item) => {
    index.push({
      id: `product-${item.name}`,
      type: 'product',
      route: '/academy/product-knowledge',
      icon: '📦',
      title: item.name,
      subtitle: 'Product knowledge',
      description: item.points.join(' · '),
      keywords: [item.name, item.points.join(' '), 'coverage warranty insurance'].join(' '),
    })
  })

  productKnowledge.canCover.items.forEach((item, idx) => {
    index.push({
      id: `cover-${idx}`,
      type: 'product',
      route: '/academy/product-knowledge',
      icon: '✅',
      title: 'What we cover',
      subtitle: 'Coverage eligibility',
      description: item,
      keywords: [item, 'coverage cover eligible'].join(' '),
    })
  })

  productKnowledge.cannotCover.items.forEach((item, idx) => {
    index.push({
      id: `cannot-cover-${idx}`,
      type: 'product',
      route: '/academy/product-knowledge',
      icon: '🚫',
      title: 'What we cannot cover',
      subtitle: 'Coverage exclusions',
      description: item,
      keywords: [item, 'cannot cover exclusion not eligible'].join(' '),
    })
  })

  callFlow.steps.forEach((step) => {
    index.push({
      id: `callflow-${step.id}`,
      type: 'callflow',
      route: '/academy/call-flow',
      icon: step.icon,
      title: step.title,
      subtitle: 'Call flow',
      description: `${step.description} ${step.keyPoints.join(' · ')}`,
      keywords: [step.title, step.description, step.keyPoints.join(' '), 'transfer flow'].join(' '),
    })
  })

  callFlow.transferProtocol.forEach((step, idx) => {
    index.push({
      id: `transfer-${idx}`,
      type: 'callflow',
      route: '/academy/call-flow',
      icon: '🔄',
      title: `Transfer protocol ${idx + 1}`,
      subtitle: 'Transfer protocol',
      description: step,
      keywords: [step, 'transfer protocol service advisor 15 seconds'].join(' '),
    })
  })

  callFlow.waitingQuestions.forEach((question, idx) => {
    index.push({
      id: `waiting-${idx}`,
      type: 'callflow',
      route: '/academy/call-flow',
      icon: '⏳',
      title: 'Waiting question',
      subtitle: 'While waiting for the advisor',
      description: question,
      keywords: [question, 'waiting service advisor'].join(' '),
    })
  })

  dosAndDonts.donts.forEach((item, idx) => {
    index.push({
      id: `dont-${idx}`,
      type: 'dosdonts',
      route: '/academy/dos-donts',
      icon: '⚠️',
      title: item.rule,
      subtitle: "Do's and Don'ts",
      description: item.detail,
      keywords: [item.rule, item.detail, 'compliance do not dont'].join(' '),
    })
  })

  dosAndDonts.deliveryStandards.forEach((item, idx) => {
    index.push({
      id: `standard-${idx}`,
      type: 'dosdonts',
      route: '/academy/dos-donts',
      icon: '🎙️',
      title: 'Delivery standard',
      subtitle: "Do's and Don'ts",
      description: item,
      keywords: [item, 'delivery standard script compliance'].join(' '),
    })
  })

  dialer.dispositions.forEach((item) => {
    index.push({
      id: `disp-${item.code}`,
      type: 'dialer',
      route: '/academy/dialer-guide',
      icon: '🖥️',
      title: item.code,
      subtitle: item.label,
      description: item.description,
      keywords: [item.code, item.label, item.description, 'dialer disposition'].join(' '),
    })
  })

  dialer.pauseCodes.forEach((item) => {
    index.push({
      id: `pause-${item.label}`,
      type: 'dialer',
      route: '/academy/dialer-guide',
      icon: '⏸️',
      title: item.label,
      subtitle: item.code,
      description: `${item.desc} · ${item.time}`,
      keywords: [item.label, item.code, item.desc, item.time, 'pause code'].join(' '),
    })
  })

  return index
}

function scoreResult(item, query) {
  const q = normalizeText(query)
  const title = normalizeText(item.title)
  const subtitle = normalizeText(item.subtitle)
  const desc = normalizeText(item.description)
  const keywords = normalizeText(item.keywords)

  let score = 0

  if (title === q) score += 120
  if (title.includes(q)) score += 70
  if (subtitle.includes(q)) score += 35
  if (desc.includes(q)) score += 25
  if (keywords.includes(q)) score += 40

  q.split(' ')
    .filter(Boolean)
    .forEach((word) => {
      if (title.includes(word)) score += 18
      if (subtitle.includes(word)) score += 10
      if (desc.includes(word)) score += 8
      if (keywords.includes(word)) score += 12
    })

  return score
}

export default function GoLearn() {
 const navigate = useNavigate()

const goHome = () => {
  const loggedIn = Boolean(localStorage.getItem('pulse_user'))
  navigate(loggedIn ? '/dashboard' : '/')
}

const pageRef = useRef(null)
  const rafRef = useRef(null)
  const audioRef = useRef(null)

  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [ripples, setRipples] = useState([])

  const searchIndex = useMemo(() => buildSearchIndex(), [])

  const results = useMemo(() => {
    const clean = query.trim()
    if (!clean) return []

    return searchIndex
      .map((item) => ({ ...item, score: scoreResult(item, clean) }))
      .filter((item) => item.score > 0)
      .filter((item) => activeFilter === 'all' || item.type === activeFilter)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
  }, [activeFilter, query, searchIndex])

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

  const handlePreventCopy = (e) => {
    if (!e.target.closest('.academy-search-input')) e.preventDefault()
  }

  return (
    <div
      ref={pageRef}
      className="pgl-page"
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
      onCopy={handlePreventCopy}
      onCut={handlePreventCopy}
      onContextMenu={handlePreventCopy}
      onDragStart={handlePreventCopy}
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

      <nav className="pgl-nav">
        <div className="pgl-nav-pill">
<button className="pgl-nav-link" onClick={goHome}>
  Home
</button>

          <button className="pgl-nav-link" onClick={() => navigate('/go')}>
            Pulse GO
          </button>

          <button className="pgl-nav-link pgl-nav-link-active" onClick={() => navigate('/academy')}>
            Academy
          </button>
        </div>
      </nav>

      <main className="pgl-content academy-home-content">
        <h1 className="pgl-title academy-title" draggable="false">
          <span className="pgl-title-main">ACADEMY</span>
        </h1>

        <section className="academy-main-card">
          <span className="academy-card-kicker">Search academy</span>

          <div className="academy-search-box academy-search-box-large">
            <span className="academy-search-icon">⌕</span>

            <input
              className="academy-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SPXFER, 15 seconds, not interested, pause codes..."
              autoComplete="off"
              spellCheck="false"
            />

            {query.trim() && (
              <button className="academy-search-clear" onClick={() => setQuery('')}>
                Clear
              </button>
            )}
          </div>

          <div className="academy-filter-row">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`academy-filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {query.trim() ? (
          <section className="academy-results-wrap">
            <div className="academy-results-top">
              <span>
                {results.length > 0
                  ? `${results.length} result${results.length === 1 ? '' : 's'}`
                  : 'No results found'}
              </span>
            </div>

            {results.length > 0 ? (
              <div className="academy-results-grid">
                {results.map((item) => (
                  <button
                    key={item.id}
                    className="academy-glass-card academy-result-card"
                    onClick={() => navigate(item.route)}
                  >
                    <span className="academy-card-icon">{item.icon}</span>

                    <span className="academy-result-body">
                      <span className="academy-result-title">{item.title}</span>
                      <span className="academy-result-sub">{item.subtitle}</span>
                      <span className="academy-result-desc">{trimText(item.description)}</span>
                    </span>

                    <span className="academy-card-arrow">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="academy-main-card academy-empty-state">
                <span>🔎</span>
                <h2>No match yet</h2>
                <p>Try: SPXFER, CALLBK, 15 seconds, insurance, not interested, pause code.</p>
              </div>
            )}
          </section>
        ) : (
          <p className="academy-empty-hint">
            Start typing to search scripts, rebuttals, compliance rules, product notes, and dialer guides.
          </p>
        )}
      </main>
    </div>
  )
}