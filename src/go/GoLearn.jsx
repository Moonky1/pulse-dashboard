import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { learnCategories } from './goContent'
import './go.css'

const ACADEMY_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'objections', label: 'Objections' },
  { id: 'systems', label: 'Systems' },
  { id: 'compliance', label: 'Compliance' },
]

function getGroup(category) {
  if (category.type === 'script') return 'scripts'
  if (category.type === 'objections') return 'objections'
  if (category.type === 'dialer') return 'systems'
  if (category.type === 'dosdонts') return 'compliance'
  return 'all'
}

export default function GoLearn() {
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')

  const filteredCategories = useMemo(() => {
    const text = query.trim().toLowerCase()

    return learnCategories.filter((cat) => {
      const matchesGroup = group === 'all' || getGroup(cat) === group
      const matchesText = !text
        || cat.title.toLowerCase().includes(text)
        || cat.description.toLowerCase().includes(text)
        || cat.type.toLowerCase().includes(text)

      return matchesGroup && matchesText
    })
  }, [query, group])

  return (
    <div className="go-page academy-page">
      <div className="go-grid-bg" />
      <div className="go-glow one" />
      <div className="go-glow two" />

      <nav className="go-nav academy-nav">
        <button className="go-nav-left" onClick={() => nav('/dashboard')}>
          ← Dashboard
        </button>

        <div className="go-nav-tabs">
          <button className="go-nav-tab" onClick={() => nav('/go')}>Pulse GO</button>
          <button className="go-nav-tab active" onClick={() => nav('/go/academy')}>Academy</button>
          <button className="go-nav-tab" onClick={() => nav('/go/quiz')}>Quiz</button>
        </div>
      </nav>

      <main className="academy-shell">
        <section className="academy-hero">
          <div className="academy-eyebrow">✨ In development</div>
          <h1 className="academy-title">Academy</h1>
          <p className="academy-sub">
            The Kampaign Kings wiki — searchable scripts, training, playbooks, and call handling guides for every team.
          </p>

          <div className="academy-search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the academy..."
              type="search"
            />
          </div>

          <div className="academy-filter-row">
            {ACADEMY_GROUPS.map((item) => (
              <button
                key={item.id}
                className={`academy-filter ${group === item.id ? 'active' : ''}`}
                onClick={() => setGroup(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="academy-category-grid">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              className="academy-card"
              onClick={() => nav(`/academy/${cat.id}`)}
            >
              <span className="academy-card-icon">{cat.icon}</span>
              <span className="academy-card-count">
                {cat.type === 'script' ? '9 steps' : cat.type === 'objections' ? '12 articles' : cat.type === 'dialer' ? 'Guide' : 'Training'}
              </span>
              <span className="academy-card-title">{cat.title}</span>
              <span className="academy-card-desc">{cat.description}</span>
              <span className="academy-card-arrow">Open →</span>
            </button>
          ))}
        </section>
      </main>
    </div>
  )
}
