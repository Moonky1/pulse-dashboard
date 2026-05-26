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
  { id: 'dialer', label: 'Dialer' },
  { id: 'compliance', label: 'Compliance' },
]

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function trimText(value, max = 155) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}...`
}

function buildSearchIndex() {
  const index = []

  learnCategories.forEach((cat) => {
    index.push({
      id: `category-${cat.id}`,
      type: cat.type === 'dosdonts' && cat.id === 'dialer-guide' ? 'dialer' : cat.type,
      categoryId: cat.id,
      icon: cat.icon,
      title: cat.title,
      subtitle: 'Academy category',
      description: cat.description,
      keywords: [cat.title, cat.description, cat.id, cat.type, cat.ref].join(' '),
      route: `/academy/${cat.id}`,
    })
  })

  Object.entries(scripts).forEach(([lang, script]) => {
    const categoryId = lang === 'es' ? 'script-es' : 'script-en'

    script.steps.forEach((step) => {
      index.push({
        id: `script-${lang}-${step.id}`,
        type: 'script',
        categoryId,
        icon: script.flag,
        title: `${step.label}`,
        subtitle: script.title,
        description: step.tip ? `${step.text} ${step.tip}` : step.text,
        keywords: [script.title, step.label, step.text, step.tip, lang].join(' '),
        route: `/academy/${categoryId}`,
      })
    })
  })

  objections.forEach((obj) => {
    index.push({
      id: `objection-en-${obj.id}`,
      type: 'objections',
      categoryId: 'objections-en',
      icon: obj.emoji,
      title: obj.title,
      subtitle: 'English objection rebuttal',
      description: `${obj.goal}. ${obj.rebuttalEn}`,
      keywords: [obj.title, obj.goal, obj.rebuttalEn, obj.id, 'rebuttal objection english'].join(' '),
      route: '/academy/objections-en',
    })

    index.push({
      id: `objection-es-${obj.id}`,
      type: 'objections',
      categoryId: 'objections-es',
      icon: obj.emoji,
      title: obj.titleEs,
      subtitle: 'Spanish objection rebuttal',
      description: `${obj.goal}. ${obj.rebuttalEs}`,
      keywords: [obj.titleEs, obj.goal, obj.rebuttalEs, obj.id, 'rebuttal objection spanish español'].join(' '),
      route: '/academy/objections-es',
    })
  })

  productKnowledge.comparison.items.forEach((item) => {
    index.push({
      id: `product-${item.name}`,
      type: 'product',
      categoryId: 'product-knowledge',
      icon: '📦',
      title: item.name,
      subtitle: 'Product knowledge',
      description: item.points.join(' · '),
      keywords: [item.name, item.points.join(' '), 'coverage product warranty insurance'].join(' '),
      route: '/academy/product-knowledge',
    })
  })

  productKnowledge.canCover.items.forEach((item, indexNumber) => {
    index.push({
      id: `can-cover-${indexNumber}`,
      type: 'product',
      categoryId: 'product-knowledge',
      icon: '✅',
      title: 'What we cover',
      subtitle: 'Coverage eligibility',
      description: item,
      keywords: [item, 'cover coverage eligible warranty'].join(' '),
      route: '/academy/product-knowledge',
    })
  })

  productKnowledge.cannotCover.items.forEach((item, indexNumber) => {
    index.push({
      id: `cannot-cover-${indexNumber}`,
      type: 'product',
      categoryId: 'product-knowledge',
      icon: '🚫',
      title: 'What we cannot cover',
      subtitle: 'Coverage exclusions',
      description: item,
      keywords: [item, 'cannot cover exclusion not eligible'].join(' '),
      route: '/academy/product-knowledge',
    })
  })

  callFlow.steps.forEach((step) => {
    index.push({
      id: `call-flow-${step.id}`,
      type: 'callflow',
      categoryId: 'call-flow',
      icon: step.icon,
      title: step.title,
      subtitle: 'Call flow',
      description: `${step.description} ${step.keyPoints.join(' · ')}`,
      keywords: [step.title, step.description, step.keyPoints.join(' '), 'call flow transfer'].join(' '),
      route: '/academy/call-flow',
    })
  })

  callFlow.transferProtocol.forEach((step, indexNumber) => {
    index.push({
      id: `transfer-protocol-${indexNumber}`,
      type: 'callflow',
      categoryId: 'call-flow',
      icon: '🔄',
      title: `Transfer protocol step ${indexNumber + 1}`,
      subtitle: 'Transfer protocol',
      description: step,
      keywords: [step, 'transfer protocol service advisor SA 15 seconds'].join(' '),
      route: '/academy/call-flow',
    })
  })

  callFlow.waitingQuestions.forEach((question, indexNumber) => {
    index.push({
      id: `waiting-question-${indexNumber}`,
      type: 'callflow',
      categoryId: 'call-flow',
      icon: '⏳',
      title: 'While waiting for an advisor',
      subtitle: 'Waiting questions',
      description: question,
      keywords: [question, 'waiting advisor questions'].join(' '),
      route: '/academy/call-flow',
    })
  })

  dosAndDonts.donts.forEach((item, indexNumber) => {
    index.push({
      id: `dont-${indexNumber}`,
      type: 'compliance',
      categoryId: 'dos-donts',
      icon: '⚠️',
      title: item.rule,
      subtitle: "Do's and Don'ts",
      description: item.detail,
      keywords: [item.rule, item.detail, 'compliance dont do not'].join(' '),
      route: '/academy/dos-donts',
    })
  })

  dosAndDonts.formFields.use.forEach((item, indexNumber) => {
    index.push({
      id: `form-use-${indexNumber}`,
      type: 'compliance',
      categoryId: 'dos-donts',
      icon: '✅',
      title: 'Use this form field',
      subtitle: 'Reading the form',
      description: item,
      keywords: [item, 'form field use'].join(' '),
      route: '/academy/dos-donts',
    })
  })

  dosAndDonts.formFields.ignore.forEach((item, indexNumber) => {
    index.push({
      id: `form-ignore-${indexNumber}`,
      type: 'compliance',
      categoryId: 'dos-donts',
      icon: '🚫',
      title: 'Ignore this form field',
      subtitle: 'Reading the form',
      description: item,
      keywords: [item, 'form field ignore never mention'].join(' '),
      route: '/academy/dos-donts',
    })
  })

  dosAndDonts.deliveryStandards.forEach((item, indexNumber) => {
    index.push({
      id: `delivery-standard-${indexNumber}`,
      type: 'compliance',
      categoryId: 'dos-donts',
      icon: '🎙️',
      title: 'Delivery standard',
      subtitle: "Do's and Don'ts",
      description: item,
      keywords: [item, 'delivery standard script compliance'].join(' '),
      route: '/academy/dos-donts',
    })
  })

  dialer.dispositions.forEach((item) => {
    index.push({
      id: `disposition-${item.code}`,
      type: 'dialer',
      categoryId: 'dialer-guide',
      icon: '🖥️',
      title: item.code,
      subtitle: item.label,
      description: item.description,
      keywords: [item.code, item.label, item.description, 'disposition dialer'].join(' '),
      route: '/academy/dialer-guide',
    })
  })

  dialer.pauseCodes.forEach((item) => {
    index.push({
      id: `pause-${item.label}`,
      type: 'dialer',
      categoryId: 'dialer-guide',
      icon: '⏸️',
      title: item.label,
      subtitle: item.code,
      description: `${item.desc} · ${item.time}`,
      keywords: [item.label, item.code, item.desc, item.time, 'pause code dialer'].join(' '),
      route: '/academy/dialer-guide',
    })
  })

  return index
}

function scoreResult(item, query) {
  const q = normalizeText(query)
  const title = normalizeText(item.title)
  const subtitle = normalizeText(item.subtitle)
  const description = normalizeText(item.description)
  const keywords = normalizeText(item.keywords)

  let score = 0

  if (title === q) score += 120
  if (title.includes(q)) score += 70
  if (subtitle.includes(q)) score += 35
  if (description.includes(q)) score += 25
  if (keywords.includes(q)) score += 40

  q.split(' ')
    .filter(Boolean)
    .forEach((word) => {
      if (title.includes(word)) score += 18
      if (subtitle.includes(word)) score += 10
      if (description.includes(word)) score += 8
      if (keywords.includes(word)) score += 12
    })

  return score
}

export default function GoLearn() {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const rafRef = useRef(null)
  const audioRef = useRef(null)

  const [ripples, setRipples] = useState([])
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const searchIndex = useMemo(() => buildSearchIndex(), [])

  const results = useMemo(() => {
    const cleanQuery = query.trim()

    if (!cleanQuery) return []

    return searchIndex
      .map((item) => ({
        ...item,
        score: scoreResult(item, cleanQuery),
      }))
      .filter((item) => item.score > 0)
      .filter((item) => activeFilter === 'all' || item.type === activeFilter)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18)
  }, [activeFilter, query, searchIndex])

  const visibleCategories = useMemo(() => {
    if (activeFilter === 'all') return learnCategories

    return learnCategories.filter((cat) => {
      if (activeFilter === 'dialer') return cat.id === 'dialer-guide'
      if (activeFilter === 'compliance') return cat.id === 'dos-donts'
      if (activeFilter === 'product') return cat.id === 'product-knowledge'
      if (activeFilter === 'callflow') return cat.id === 'call-flow'
      return cat.type === activeFilter
    })
  }, [activeFilter])

  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!audioRef.current) {
        audioRef.current = new AudioContext()
      }

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
      // Browser blocked or unsupported audio.
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

    if (!e.target.closest('input')) {
      playClickSound()
    }
  }

  const handlePreventCopy = (e) => {
    if (!e.target.closest('.academy-search-input')) {
      e.preventDefault()
    }
  }

  const handlePreventContextMenu = (e) => {
    if (!e.target.closest('.academy-search-input')) {
      e.preventDefault()
    }
  }

  const handleDragStart = (e) => {
    if (!e.target.closest('.academy-search-input')) {
      e.preventDefault()
    }
  }

  const openCategory = (categoryId) => {
    navigate(`/academy/${categoryId}`)
  }

  return (
    <div
      ref={pageRef}
      className="pgl-page"
      onMouseMove={handleMouseMove}
      onPointerDown={handlePointerDown}
      onCopy={handlePreventCopy}
      onCut={handlePreventCopy}
      onContextMenu={handlePreventContextMenu}
      onDragStart={handleDragStart}
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
          <button className="pgl-nav-link" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>

          <button className="pgl-nav-link" onClick={() => navigate('/go')}>
            Pulse GO
          </button>

          <button className="pgl-nav-link pgl-nav-link-active" onClick={() => navigate('/academy')}>
            Academy
          </button>
        </div>
      </nav>

      <main className="pgl-content academy-content">
        <h1 className="pgl-title academy-title" draggable="false">
          <span className="pgl-title-main">ACADEMY</span>
        </h1>

        <section className="academy-search-panel">
          <div className="academy-search-box">
            <span className="academy-search-icon">⌕</span>

            <input
              className="academy-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scripts, SPXFER, objections, 15 seconds..."
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
                  ? `${results.length} result${results.length === 1 ? '' : 's'} found`
                  : 'No results found'}
              </span>
              <small>Search reads the Academy training content</small>
            </div>

            {results.length > 0 ? (
              <div className="academy-results-list">
                {results.map((item) => (
                  <button
                    key={item.id}
                    className="academy-result-card"
                    onClick={() => navigate(item.route)}
                  >
                    <span className="academy-result-icon">{item.icon}</span>

                    <span className="academy-result-body">
                      <span className="academy-result-title">{item.title}</span>
                      <span className="academy-result-sub">{item.subtitle}</span>
                      <span className="academy-result-desc">{trimText(item.description)}</span>
                    </span>

                    <span className="academy-result-arrow">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="academy-empty-state">
                <span>🔎</span>
                <h2>No match yet</h2>
                <p>Try keywords like “SPXFER”, “CALLBK”, “not interested”, “15 seconds”, “insurance”, or “pause code”.</p>
              </div>
            )}
          </section>
        ) : (
          <div className="academy-grid">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                className="academy-card"
                onClick={() => openCategory(cat.id)}
              >
                <span className="academy-card-icon">{cat.icon}</span>

                <div className="academy-card-body">
                  <h2>{cat.title}</h2>
                  <p>{cat.description}</p>
                </div>

                <span className="academy-card-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}