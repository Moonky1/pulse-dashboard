import { useNavigate } from 'react-router-dom'
import { learnCategories } from './goContent'
import './go.css'

export default function GoLearn() {
  const nav = useNavigate()

  return (
    <div className="go-page">
      <nav className="go-nav">
        <a className="go-nav-logo" href="/go">
          <span>Pulse</span>
          <span className="go-badge">GO</span>
        </a>
        <button className="go-nav-back" onClick={() => nav('/go')}>
          ← Back
        </button>
      </nav>

      <div className="go-container">
        <div className="go-section-header">
          <h1 className="go-section-title">📚 Learn</h1>
          <p className="go-section-sub">Select a category to study</p>
        </div>

        <div className="go-category-grid">
          {learnCategories.map((cat) => (
            <div
              key={cat.id}
              className="go-category-card"
              onClick={() => nav(`/go/learn/${cat.id}`)}
            >
              <span className="go-category-icon">{cat.icon}</span>
              <div className="go-category-title">{cat.title}</div>
              <p className="go-category-desc">{cat.description}</p>
              <span className="go-category-arrow">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}