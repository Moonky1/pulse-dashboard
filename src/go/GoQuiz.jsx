import { useNavigate } from 'react-router-dom'
import './GoQuiz.css'

const topics = [
  { id: 'all',     label: 'All Topics',       icon: '⚡', color: '#f97316', desc: 'Mixed from everything' },
  { id: 'script',  label: 'Script',           icon: '📋', color: '#ef4444', desc: 'EN & ES script lines' },
  { id: 'objections', label: 'Objections',    icon: '🛡️', color: '#3b82f6', desc: 'Rebuttals & responses' },
  { id: 'product', label: 'Product Knowledge',icon: '📦', color: '#22c55e', desc: 'Coverage & exclusions' },
  { id: 'callflow',label: 'Call Flow',        icon: '📞', color: '#a855f7', desc: 'Transfer protocol' },
  { id: 'dosdонts',label: "Do's & Don'ts",   icon: '⚠️', color: '#f59e0b', desc: 'Rules & compliance' },
]

export default function GoQuiz() {
  const navigate = useNavigate()

  return (
    <div className="gqz-page">
      <nav className="gqz-nav">
        <div className="gqz-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gqz-nav-text">Pulse</span>
          <span className="gqz-nav-badge">GO</span>
        </div>
        <button className="gqz-nav-back" onClick={() => navigate('/go')}>← Back</button>
      </nav>

      <div className="gqz-hero">
        <h1 className="gqz-title">🧠 Choose a Topic</h1>
        <p className="gqz-sub">Select what you want to be quizzed on</p>
      </div>

      <div className="gqz-grid">
        {topics.map((t) => (
          <button
            key={t.id}
            className="gqz-card"
            style={{ '--topic-color': t.color }}
            onClick={() => navigate(`/go/quiz/play?topic=${t.id}`)}
          >
            <span className="gqz-card-icon">{t.icon}</span>
            <span className="gqz-card-label">{t.label}</span>
            <span className="gqz-card-desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}