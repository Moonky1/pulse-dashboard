import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PulseGoBackground from './PulseGoBackground'
import {
  scripts,
  objections,
  productKnowledge,
  callFlow,
  dosAndDonts,
  dialer,
} from './goContent'
import {
  ACADEMY_COPY,
  ACADEMY_SECTIONS,
  LANG_OPTIONS,
  getSavedAcademyLang,
  normalizeSearchText,
  saveAcademyLang,
  textFor,
  trimText,
} from './academyData'
import './Academy.css'

const FEATURED_IDS = ['script', 'qa-invalid', 'product', 'dispositions']

function getProductItems(lang) {
  if (lang === 'es') {
    return [
      'Motor y transmisión',
      'Vehículos 2011 o más recientes',
      'Vehículos con hasta 175,000 millas',
      'Vehículos que todavía funcionan correctamente',
      'Reparaciones en talleres autorizados a nivel nacional',
      'Partes no modificadas en vehículos con modificaciones',
    ]
  }

  return [
    ...(productKnowledge?.canCover?.items || []),
    ...(productKnowledge?.cannotCover?.items || []),
  ]
}

function buildSearchIndex(lang) {
  const items = []
  const copy = ACADEMY_COPY[lang]

  ACADEMY_SECTIONS.forEach((section) => {
    items.push({
      id: `section-${section.id}`,
      route: `/academy/${section.id}`,
      icon: section.icon,
      type: section.id,
      title: textFor(section.title, lang),
      subtitle: section.group,
      description: textFor(section.desc, lang),
      keywords: `${section.keywords} ${textFor(section.title, 'en')} ${textFor(section.title, 'es')}`,
    })
  })

  const script = scripts?.[lang] || scripts?.en

  script?.steps?.forEach((step) => {
    items.push({
      id: `script-${step.id}`,
      route: '/academy/script',
      icon: '📋',
      type: 'script',
      title: step.label,
      subtitle: script.title,
      description: `${step.text} ${step.tip || ''}`,
      keywords: `${step.label} ${step.text} ${step.tip || ''} script service advisor transfer`,
    })
  })

  objections?.forEach((item) => {
    const title = lang === 'es' ? item.titleEs : item.title
    const rebuttal = lang === 'es' ? item.rebuttalEs : item.rebuttalEn

    items.push({
      id: `objection-${item.id}`,
      route: '/academy/objections',
      icon: item.emoji || '🛡️',
      type: 'objections',
      title,
      subtitle: lang === 'es' ? 'Objeción' : 'Objection',
      description: `${item.goal}. ${rebuttal}`,
      keywords: `${item.title} ${item.titleEs} ${item.goal} ${item.rebuttalEn} ${item.rebuttalEs}`,
    })
  })

  getProductItems(lang).forEach((line, index) => {
    items.push({
      id: `product-${index}`,
      route: '/academy/product',
      icon: '📦',
      type: 'product',
      title: lang === 'es' ? 'Regla de producto' : 'Product rule',
      subtitle: textFor(ACADEMY_SECTIONS.find((s) => s.id === 'product')?.title, lang),
      description: line,
      keywords: `${line} product coverage vehicle mileage 175000 electric 2011`,
    })
  })

  callFlow?.steps?.forEach((step) => {
    items.push({
      id: `flow-${step.id}`,
      route: '/academy/call-flow',
      icon: step.icon || '📞',
      type: 'call-flow',
      title: step.title,
      subtitle: lang === 'es' ? 'Flujo de llamada' : 'Call flow',
      description: `${step.description} ${(step.keyPoints || []).join(' ')}`,
      keywords: `${step.title} ${step.description} ${(step.keyPoints || []).join(' ')} transfer handoff 15 seconds`,
    })
  })

  dosAndDonts?.donts?.forEach((item, index) => {
    items.push({
      id: `dont-${index}`,
      route: '/academy/mistakes',
      icon: '⚠️',
      type: 'mistakes',
      title: item.rule,
      subtitle: lang === 'es' ? 'Compliance' : "Do's & Don'ts",
      description: item.detail,
      keywords: `${item.rule} ${item.detail} compliance dont mistake`,
    })
  })

  dialer?.dispositions?.forEach((item) => {
    items.push({
      id: `disp-${item.code}`,
      route: '/academy/dispositions',
      icon: '🧾',
      type: 'dispositions',
      title: item.code,
      subtitle: item.label,
      description: item.description,
      keywords: `${item.code} ${item.label} ${item.description} disposition dialer`,
    })
  })

  dialer?.pauseCodes?.forEach((item, index) => {
    items.push({
      id: `pause-${index}`,
      route: '/academy/dialer',
      icon: '⏸️',
      type: 'dialer',
      title: item.label || item.code,
      subtitle: item.code || 'Pause code',
      description: `${item.desc || ''} ${item.time || ''}`,
      keywords: `${item.label || ''} ${item.code || ''} ${item.desc || ''} ${item.time || ''} pause code rr lunch tech`,
    })
  })

  items.push({
    id: 'search-tip',
    route: '/academy/overview',
    icon: '💡',
    type: 'overview',
    title: copy.searchLabel,
    subtitle: copy.updated,
    description: copy.searchTip,
    keywords: copy.searchTip,
  })

  return items
}

function scoreItem(item, query) {
  const q = normalizeSearchText(query)
  const title = normalizeSearchText(item.title)
  const subtitle = normalizeSearchText(item.subtitle)
  const description = normalizeSearchText(item.description)
  const keywords = normalizeSearchText(item.keywords)

  let score = 0

  if (title === q) score += 100
  if (title.includes(q)) score += 60
  if (subtitle.includes(q)) score += 25
  if (description.includes(q)) score += 18
  if (keywords.includes(q)) score += 35

  q.split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      if (title.includes(word)) score += 16
      if (subtitle.includes(word)) score += 8
      if (description.includes(word)) score += 7
      if (keywords.includes(word)) score += 10
    })

  return score
}

export default function GoLearn() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => getSavedAcademyLang())
  const [query, setQuery] = useState('')
  const activeType = 'all'

  const copy = ACADEMY_COPY[lang]

  const goHome = () => {
    const loggedIn = Boolean(localStorage.getItem('pulse_user'))
    navigate(loggedIn ? '/dashboard' : '/')
  }

  const changeLang = (nextLang) => {
    setLang(nextLang)
    saveAcademyLang(nextLang)
  }

  const searchIndex = useMemo(() => buildSearchIndex(lang), [lang])

  const results = useMemo(() => {
    const clean = query.trim()
    if (!clean) return []

    return searchIndex
      .map((item) => ({ ...item, score: scoreItem(item, clean) }))
      .filter((item) => item.score > 0)
      .filter((item) => activeType === 'all' || item.type === activeType)
      .sort((a, b) => b.score - a.score)
      .slice(0, 16)
  }, [query, searchIndex])

  const featuredSections = FEATURED_IDS
    .map((id) => ACADEMY_SECTIONS.find((section) => section.id === id))
    .filter(Boolean)

  return (
    <div className="ac-page">
      <PulseGoBackground />

      <header className="ac-topnav">
<nav className="ac-nav-pill">
  <button onClick={goHome}>
    {copy.navHome}
  </button>

  <button onClick={() => navigate('/go')}>
    {copy.navGo}
  </button>

  <button onClick={() => navigate('/studio')}>
    Studio
  </button>

  <button
    className="active"
    onClick={() => navigate('/academy')}
  >
    {copy.navAcademy}
  </button>
</nav>

        <div className="ac-lang-switch" aria-label="Academy language">
          {LANG_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={lang === option.id ? 'active' : ''}
              onClick={() => changeLang(option.id)}
            >
              <span>{option.icon}</span>
              {option.short}
            </button>
          ))}
        </div>
      </header>

      <main className="ac-home">
        <section className="ac-hero">
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </section>

        <section className="ac-wiki-grid">
          <aside className="ac-sidebar">
            <div className="ac-sidebar-head">
              <strong>{copy.sidebarTitle}</strong>
              <span>{copy.sectionLibrary}</span>
            </div>

            <div className="ac-side-list">
              {ACADEMY_SECTIONS.map((section) => (
                <button key={section.id} onClick={() => navigate(`/academy/${section.id}`)}>
                  <span>{section.icon}</span>
                  <b>{textFor(section.title, lang)}</b>
                </button>
              ))}
            </div>
          </aside>

          <section className="ac-main-panel">
            <div className="ac-search-card">
              <span className="ac-kicker">{copy.searchLabel}</span>

              <div className="ac-search-box">
                <span>⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  autoComplete="off"
                />

                {query.trim() && (
                  <button onClick={() => setQuery('')}>
                    {lang === 'es' ? 'Limpiar' : 'Clear'}
                  </button>
                )}
              </div>

            </div>

            {query.trim() ? (
              <section className="ac-results">
                <div className="ac-section-title">
                  <span>{results.length ? `${results.length} ${copy.results}` : copy.noResults}</span>
                </div>

                <div className="ac-result-list">
                  {results.map((item) => (
                    <button key={item.id} className="ac-result-card" onClick={() => navigate(item.route)}>
                      <span className="ac-result-icon">{item.icon}</span>

                      <span className="ac-result-body">
                        <b>{item.title}</b>
                        <small>{item.subtitle}</small>
                        <em>{trimText(item.description, 170)}</em>
                      </span>

                      <span>→</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <>
                <section className="ac-start-card">
                  <div>
                    <span className="ac-kicker">{copy.startHere}</span>
                    <h2>{lang === 'es' ? 'Todo el training en un solo lugar' : 'Everything training in one place'}</h2>
                    <p>{copy.startDesc}</p>
                  </div>

                  <button onClick={() => navigate('/academy/overview')}>
                    {copy.openGuide} →
                  </button>
                </section>

                <section>
                  <div className="ac-section-title">
                    <span>{copy.quickCards}</span>
                  </div>

                  <div className="ac-card-grid">
                    {featuredSections.map((section) => (
                      <button
                        key={section.id}
                        className="ac-section-card"
                        onClick={() => navigate(`/academy/${section.id}`)}
                      >
                        <span>{section.icon}</span>
                        <h3>{textFor(section.title, lang)}</h3>
                        <p>{textFor(section.desc, lang)}</p>
                        <b>{copy.openGuide} →</b>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="ac-tip-card">
                  <span>💡</span>
                  <p>{copy.searchTip}</p>
                </section>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}
