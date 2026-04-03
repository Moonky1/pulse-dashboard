import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuiz.css'

const API = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

const TOPIC_TAGS = {
  all: null,
  script:      [1, 2, 13, 15],
  objections:  [5, 9, 11, 12],
  product:     [3, 6, 7, 11, 14],
  callflow:    [2, 8, 10, 12],
  'dosdонts':  [4, 7, 8, 13, 15],
}

const TOPICS = [
  { id: 'all',      label: 'All Topics',        icon: '⚡', color: '#f97316', desc: 'Mixed from everything' },
  { id: 'script',   label: 'Script',            icon: '📋', color: '#ef4444', desc: 'EN & ES script lines' },
  { id: 'objections', label: 'Objections',      icon: '🛡️', color: '#3b82f6', desc: 'Rebuttals & responses' },
  { id: 'product',  label: 'Product Knowledge', icon: '📦', color: '#22c55e', desc: 'Coverage & exclusions' },
  { id: 'callflow', label: 'Call Flow',         icon: '📞', color: '#a855f7', desc: 'Transfer protocol' },
  { id: 'dosdонts', label: "Do's & Don'ts",     icon: '⚠️', color: '#f59e0b', desc: 'Rules & compliance' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getQuestionIds(topicId, count = 10) {
  const ids = TOPIC_TAGS[topicId]
  const pool = ids
    ? quizQuestions.filter(q => ids.includes(q.id))
    : quizQuestions
  const base = pool.length >= count ? pool : quizQuestions
  return shuffle(base).slice(0, count).map(q => q.id)
}

export default function GoQuiz() {
  const nav = useNavigate()
  const [mode, setMode] = useState(null) // null | 'solo' | 'host'
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSoloTopic = (topicId) => {
    nav(`/go/quiz/play?topic=${topicId}`)
  }

  const handleHostTopic = async (topicId) => {
    setCreating(true)
    setError('')
    try {
      const code = 'KK' + Math.floor(1000 + Math.random() * 9000)
      const questionIds = getQuestionIds(topicId, 10)
      const res = await fetch(
        API + '?' + new URLSearchParams({
          action: 'quizCreate',
          code,
          topic: topicId,
          questionIds: JSON.stringify(questionIds),
        })
      )
      const data = await res.json()
      if (data.success) {
        nav(`/go/quiz/${code}?host=true`)
      } else {
        // Try again with new code if collision
        const code2 = 'KK' + Math.floor(1000 + Math.random() * 9000)
        const res2 = await fetch(
          API + '?' + new URLSearchParams({
            action: 'quizCreate',
            code: code2,
            topic: topicId,
            questionIds: JSON.stringify(questionIds),
          })
        )
        const data2 = await res2.json()
        if (data2.success) {
          nav(`/go/quiz/${code2}?host=true`)
        } else {
          setError('Could not create room. Try again.')
        }
      }
    } catch {
      setError('Connection error. Check your internet.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="gqz-page">
      <nav className="gqz-nav">
        <div className="gqz-nav-brand" onClick={() => nav('/go')} style={{ cursor: 'pointer' }}>
          <span className="gqz-nav-text">Pulse</span>
          <span className="gqz-nav-badge">GO</span>
        </div>
        <button
          className="gqz-nav-back"
          onClick={() => mode ? setMode(null) : nav('/go')}
        >
          ← {mode ? 'Back' : 'Home'}
        </button>
      </nav>

      {/* ── Main Mode Selection ── */}
      {!mode && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">🧠 Quiz</h1>
            <p className="gqz-sub">Practice solo or compete live with your team</p>
          </div>
          <div className="gqz-mode-grid">
            <button className="gqz-mode-card solo" onClick={() => setMode('solo')}>
              <span className="gqz-mode-icon">👤</span>
              <span className="gqz-mode-title">Solo Practice</span>
              <span className="gqz-mode-desc">10 questions, 20 seconds each. Practice at your own pace.</span>
              <span className="gqz-mode-cta">Start →</span>
            </button>
            <button className="gqz-mode-card host" onClick={() => setMode('host')}>
              <span className="gqz-mode-icon">🎮</span>
              <span className="gqz-mode-title">Host a Game</span>
              <span className="gqz-mode-desc">Create a live room. Share the code. Up to 40 players compete together.</span>
              <span className="gqz-mode-cta">Create Room →</span>
            </button>
          </div>
        </>
      )}

      {/* ── Topic Selection ── */}
      {mode && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">
              {mode === 'solo' ? '📚 Choose a Topic' : '🎮 Choose a Topic to Host'}
            </h1>
            <p className="gqz-sub">
              {mode === 'solo'
                ? 'Select what you want to be quizzed on'
                : 'All players will be quizzed on this topic'}
            </p>
          </div>

          {error && (
            <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: 16, fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          {creating && (
            <div style={{ textAlign: 'center', color: '#f97316', marginBottom: 24, fontSize: 16 }}>
              Creating room... ⏳
            </div>
          )}

          <div className="gqz-grid">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                className="gqz-card"
                style={{ '--topic-color': t.color }}
                onClick={() => mode === 'solo' ? handleSoloTopic(t.id) : handleHostTopic(t.id)}
                disabled={creating}
              >
                <span className="gqz-card-icon">{t.icon}</span>
                <span className="gqz-card-label">{t.label}</span>
                <span className="gqz-card-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}