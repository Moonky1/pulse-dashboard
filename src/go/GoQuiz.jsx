import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuiz.css'

const API = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

const TOPICS = [
  {
    id: 'all',
    label: 'All Topics',
    icon: '⚡',
    color: '#f97316',
    desc: 'Mixed from everything',
  },
  {
    id: 'script',
    label: 'Script',
    icon: '📋',
    color: '#ef4444',
    desc: 'Opening lines & script control',
  },
  {
    id: 'objections',
    label: 'Objections',
    icon: '🛡️',
    color: '#3b82f6',
    desc: 'Rebuttals & responses',
  },
  {
    id: 'product',
    label: 'Product Knowledge',
    icon: '📦',
    color: '#22c55e',
    desc: 'Coverage & exclusions',
  },
  {
    id: 'callflow',
    label: 'Call Flow',
    icon: '📞',
    color: '#a855f7',
    desc: 'Transfer protocol',
  },
  {
    id: 'dosdonts',
    label: "Do's & Don'ts",
    icon: '⚠️',
    color: '#f59e0b',
    desc: 'Rules & compliance',
  },
]

const LANGUAGE_OPTIONS = [
  {
    id: 'en',
    icon: 'US',
    title: 'English Questions',
    desc: 'Questions and answers displayed in English',
    color: '#38bdf8',
  },
  {
    id: 'es',
    icon: 'ES',
    title: 'Spanish Questions',
    desc: 'Preguntas y respuestas mostradas en español',
    color: '#f97316',
  },
  {
    id: 'mixed',
    icon: '🔀',
    title: 'Mixed',
    desc: 'A mix of English and Spanish questions',
    color: '#a855f7',
  },
]

function shuffle(arr) {
  const a = [...arr]

  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

function normalizeMode(value) {
  const clean = String(value || '').toLowerCase()

  if (clean === 'host') return 'host'
  if (clean === 'solo') return 'solo'

  return null
}

function normalizeTopic(value) {
  const clean = String(value || 'all').toLowerCase()

  if (clean === 'all') return 'all'
  if (clean === 'script') return 'script'
  if (clean === 'objections') return 'objections'
  if (clean === 'product') return 'product'
  if (clean === 'product-knowledge') return 'product'
  if (clean === 'callflow') return 'callflow'
  if (clean === 'call-flow') return 'callflow'
  if (clean === 'dosdonts') return 'dosdonts'
  if (clean === 'dos-donts') return 'dosdonts'
  if (clean === 'dosdонts') return 'dosdonts'

  return 'all'
}

function getQuestionLanguage(question) {
  return String(
    question?.language ||
    question?.lang ||
    question?.locale ||
    question?.questionLang ||
    'en'
  ).toLowerCase()
}

function matchesLanguage(question, lang) {
  if (!lang || lang === 'mixed') return true
  return getQuestionLanguage(question) === lang
}

function matchesTopic(question, topic) {
  const normalizedTopic = normalizeTopic(topic)

  if (normalizedTopic === 'all') return true

  const qTopic = normalizeTopic(question?.topic)
  return qTopic === normalizedTopic
}

function getQuestionIds(topicId, lang, count = 10) {
  const normalizedTopic = normalizeTopic(topicId)

  let pool = quizQuestions.filter(
    (q) => matchesTopic(q, normalizedTopic) && matchesLanguage(q, lang)
  )

  if (pool.length < count && lang !== 'mixed') {
    const extraSameTopic = quizQuestions.filter(
      (q) =>
        matchesTopic(q, normalizedTopic) &&
        !pool.some((picked) => picked.id === q.id)
    )

    pool = [...pool, ...shuffle(extraSameTopic)]
  }

  if (pool.length < count) {
    const extraAny = quizQuestions.filter(
      (q) => !pool.some((picked) => picked.id === q.id)
    )

    pool = [...pool, ...shuffle(extraAny)]
  }

  return shuffle(pool).slice(0, count).map((q) => q.id)
}

function makeRoomCode() {
  return 'KK' + Math.floor(1000 + Math.random() * 9000)
}

export default function GoQuiz() {
  const nav = useNavigate()
  const [params] = useSearchParams()

  const initialMode = useMemo(() => normalizeMode(params.get('mode')), [params])

  const [mode, setMode] = useState(initialMode)
  const [language, setLanguage] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const resetToMode = () => {
    setLanguage(null)
    setError('')
    setMode(null)
  }

  const goBack = () => {
    if (language) {
      setLanguage(null)
      return
    }

    if (mode) {
      setMode(null)
      return
    }

    nav('/go')
  }

  const handleSoloTopic = (topicId) => {
    const lang = language || 'mixed'
    nav(`/go/quiz/play?topic=${topicId}&lang=${lang}`)
  }

  const createRoom = async (topicId, code) => {
    const lang = language || 'mixed'
    const questionIds = getQuestionIds(topicId, lang, 10)

    const res = await fetch(
      API +
        '?' +
        new URLSearchParams({
          action: 'quizCreate',
          code,
          topic: topicId,
          language: lang,
          questionIds: JSON.stringify(questionIds),
        })
    )

    return res.json()
  }

  const handleHostTopic = async (topicId) => {
    setCreating(true)
    setError('')

    try {
      const code = makeRoomCode()
      const data = await createRoom(topicId, code)

      if (data.success) {
        nav(`/go/quiz/${code}?host=true`)
        return
      }

      const code2 = makeRoomCode()
      const data2 = await createRoom(topicId, code2)

      if (data2.success) {
        nav(`/go/quiz/${code2}?host=true`)
        return
      }

      setError('Could not create room. Try again.')
    } catch {
      setError('Connection error. Check your internet.')
    } finally {
      setCreating(false)
    }
  }

  const handleTopic = (topicId) => {
    if (mode === 'host') {
      handleHostTopic(topicId)
      return
    }

    handleSoloTopic(topicId)
  }

  return (
    <div className="gqz-page">
      <nav className="gqz-nav">
        <div
          className="gqz-nav-brand"
          onClick={() => nav('/go')}
          style={{ cursor: 'pointer' }}
        >
          <span className="gqz-nav-text">Pulse</span>
          <span className="gqz-nav-badge">GO</span>
        </div>

        <button className="gqz-nav-back" onClick={goBack}>
          ← {language ? 'Language' : mode ? 'Mode' : 'Home'}
        </button>
      </nav>

      {!mode && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">🧠 Training Mode</h1>
            <p className="gqz-sub">
              Choose if you want to practice alone or host a live game.
            </p>
          </div>

          <div className="gqz-mode-grid">
            <button className="gqz-mode-card host" onClick={() => setMode('host')}>
              <span className="gqz-mode-icon">🎮</span>
              <span className="gqz-mode-title">Host a Game</span>
              <span className="gqz-mode-desc">
                Create a live room, share the code, and compete with your team.
              </span>
              <span className="gqz-mode-cta">Create Room →</span>
            </button>

            <button className="gqz-mode-card solo" onClick={() => setMode('solo')}>
              <span className="gqz-mode-icon">👤</span>
              <span className="gqz-mode-title">Practice</span>
              <span className="gqz-mode-desc">
                Train at your own pace with instant feedback after every question.
              </span>
              <span className="gqz-mode-cta">Start →</span>
            </button>
          </div>
        </>
      )}

      {mode && !language && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">🌎 Choose Language Mix</h1>
            <p className="gqz-sub">
              Pick if the questions should appear in English, Spanish, or mixed before choosing a topic.
            </p>
          </div>

          <div className="gqz-grid gqz-game-grid">
            {LANGUAGE_OPTIONS.map((item) => (
              <button
                key={item.id}
                className="gqz-card"
                style={{ '--topic-color': item.color }}
                onClick={() => setLanguage(item.id)}
              >
                <span className="gqz-card-icon">{item.icon}</span>
                <span className="gqz-card-label">{item.title}</span>
                <span className="gqz-card-desc">{item.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {mode && language && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">
              {mode === 'host' ? '🎮 Host a Topic' : '📚 Choose a Topic'}
            </h1>
            <p className="gqz-sub">
              {mode === 'host'
                ? 'All players will be quizzed on this topic.'
                : 'Select what you want to practice.'}
            </p>
          </div>

          {error && <div className="gqz-error">⚠️ {error}</div>}

          {creating && (
            <div className="gqz-loading">
              Creating room... ⏳
            </div>
          )}

          <div className="gqz-grid">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                className="gqz-card"
                style={{ '--topic-color': topic.color }}
                onClick={() => handleTopic(topic.id)}
                disabled={creating}
              >
                <span className="gqz-card-icon">{topic.icon}</span>
                <span className="gqz-card-label">{topic.label}</span>
                <span className="gqz-card-desc">{topic.desc}</span>
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', paddingBottom: 40 }}>
            <button className="gqz-nav-back" onClick={resetToMode}>
              Change Mode
            </button>
          </div>
        </>
      )}
    </div>
  )
}