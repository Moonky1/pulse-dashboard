import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameModes, quizQuestions } from './goContent'
import './GoQuiz.css'

const API = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

const QUESTION_COUNT = 10

const TOPICS = [
  { id: 'all', label: 'All Topics', icon: '⚡', color: '#f97316', desc: 'Mixed from everything' },
  { id: 'script', label: 'Script', icon: '📋', color: '#ef4444', desc: 'Opening lines & script control' },
  { id: 'objections', label: 'Objections', icon: '🛡️', color: '#3b82f6', desc: 'Rebuttals & responses' },
  { id: 'product', label: 'Product Knowledge', icon: '📦', color: '#22c55e', desc: 'Coverage & exclusions' },
  { id: 'callflow', label: 'Call Flow', icon: '📞', color: '#a855f7', desc: 'Transfer protocol' },
  { id: 'dosdonts', label: "Do's & Don'ts", icon: '⚠️', color: '#f59e0b', desc: 'Rules & compliance' },
]

const LANGUAGE_OPTIONS = [
  {
    id: 'en',
    label: 'English Focus',
    icon: '🇺🇸',
    color: '#38bdf8',
    desc: 'English script, objections, product and transfer rules',
  },
  {
    id: 'es',
    label: 'Spanish Focus',
    icon: '🇪🇸',
    color: '#f97316',
    desc: 'Spanish script, Spanish transfers and SPANIS/SPXFER rules',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    icon: '🔀',
    color: '#a855f7',
    desc: 'English + Spanish focus in the same game',
  },
]

const CLASSIC_MODE = {
  id: 'classic',
  label: 'Classic Quiz',
  icon: '🧠',
  color: '#f97316',
  desc: 'Solo practice or live Kahoot-style room',
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalizeTopic(raw) {
  const value = (raw || 'all').toLowerCase()

  if (value === 'all') return 'all'
  if (value === 'script') return 'script'
  if (value === 'objections') return 'objections'
  if (value === 'product') return 'product'
  if (value === 'product-knowledge') return 'product'
  if (value === 'callflow') return 'callflow'
  if (value === 'call-flow') return 'callflow'
  if (value === 'dosdonts') return 'dosdonts'
  if (value === 'dos-donts') return 'dosdonts'
  if (value === 'dosdонts') return 'dosdonts'

  return 'all'
}

function normalizeLanguage(raw) {
  const value = (raw || 'mixed').toLowerCase()
  if (value === 'english') return 'en'
  if (value === 'spanish') return 'es'
  if (value === 'en') return 'en'
  if (value === 'es') return 'es'
  return 'mixed'
}

function getQuestionPool(topicId, languageMode) {
  const topic = normalizeTopic(topicId)
  const language = normalizeLanguage(languageMode)

  const byTopic = topic === 'all'
    ? quizQuestions
    : quizQuestions.filter((q) => q.topic === topic)

  if (language === 'mixed') return byTopic

  const exact = byTopic.filter((q) => q.language === language)

  if (exact.length >= QUESTION_COUNT) return exact

  const sameTopicFill = byTopic.filter((q) => !exact.some((picked) => picked.id === q.id))
  return [...exact, ...sameTopicFill]
}

function getQuestionIds(topicId, languageMode, count = QUESTION_COUNT) {
  const pool = getQuestionPool(topicId, languageMode)
  const base = pool.length >= count ? pool : quizQuestions
  return shuffle(base).slice(0, count).map((q) => q.id)
}

export default function GoQuiz() {
  const nav = useNavigate()
  const [experience, setExperience] = useState(null)
  const [classicType, setClassicType] = useState(null) // solo | host
  const [language, setLanguage] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const modeCards = useMemo(() => {
    const nonClassic = gameModes.filter((mode) => mode.id !== 'classic')
    return [CLASSIC_MODE, ...nonClassic]
  }, [])

  const resetToHome = () => {
    setExperience(null)
    setClassicType(null)
    setLanguage(null)
    setError('')
  }

  const handleExperience = (item) => {
    setExperience(item)
    setClassicType(null)
    setLanguage(null)
    setError('')
  }

  const startSoloGame = (modeId, lang) => {
    const params = new URLSearchParams({
      mode: modeId,
      lang: lang || 'mixed',
    })

    nav(`/go/quiz/play?${params.toString()}`)
  }

  const handleSoloTopic = (topicId) => {
    const params = new URLSearchParams({
      mode: 'classic',
      topic: topicId,
      lang: language || 'mixed',
    })

    nav(`/go/quiz/play?${params.toString()}`)
  }

  const handleHostTopic = async (topicId) => {
    setCreating(true)
    setError('')

    try {
      const questionIds = getQuestionIds(topicId, language || 'mixed', QUESTION_COUNT)

      const createRoom = async (roomCode) => {
        const res = await fetch(
          API + '?' + new URLSearchParams({
            action: 'quizCreate',
            code: roomCode,
            topic: topicId,
            language: language || 'mixed',
            questionIds: JSON.stringify(questionIds),
          })
        )

        return res.json()
      }

      const code = 'KK' + Math.floor(1000 + Math.random() * 9000)
      const data = await createRoom(code)

      if (data.success) {
        nav(`/go/quiz/${code}?host=true`)
        return
      }

      const code2 = 'KK' + Math.floor(1000 + Math.random() * 9000)
      const data2 = await createRoom(code2)

      if (data2.success) {
        nav(`/go/quiz/${code2}?host=true`)
      } else {
        setError('Could not create room. Try again.')
      }
    } catch {
      setError('Connection error. Check your internet.')
    } finally {
      setCreating(false)
    }
  }

  const backLabel = language ? (experience?.id === 'classic' ? 'Topics' : 'Language') : classicType ? 'Game Type' : experience ? 'Games' : 'Home'

  const handleBack = () => {
    if (language) {
      setLanguage(null)
      return
    }

    if (classicType) {
      setClassicType(null)
      return
    }

    if (experience) {
      resetToHome()
      return
    }

    nav('/go')
  }

  return (
    <div className="gqz-page">
      <nav className="gqz-nav">
        <div className="gqz-nav-brand" onClick={() => nav('/go')} style={{ cursor: 'pointer' }}>
          <span className="gqz-nav-text">Pulse</span>
          <span className="gqz-nav-badge">GO</span>
        </div>

        <button className="gqz-nav-back" onClick={handleBack}>
          ← {backLabel}
        </button>
      </nav>

      {!experience && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">🎮 Choose a Game</h1>
            <p className="gqz-sub">Quiz, practice, battle objections, certify agents, or simulate customer calls</p>
          </div>

          <div className="gqz-grid gqz-game-grid">
            {modeCards.map((item) => (
              <button
                key={item.id}
                className="gqz-card"
                style={{ '--topic-color': item.color }}
                onClick={() => handleExperience(item)}
              >
                <span className="gqz-card-icon">{item.icon}</span>
                <span className="gqz-card-label">{item.label}</span>
                <span className="gqz-card-desc">{item.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {experience?.id === 'classic' && !classicType && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">🧠 Classic Quiz</h1>
            <p className="gqz-sub">Practice solo or create a live room for your team</p>
          </div>

          <div className="gqz-mode-grid">
            <button className="gqz-mode-card solo" onClick={() => setClassicType('solo')}>
              <span className="gqz-mode-icon">👤</span>
              <span className="gqz-mode-title">Solo Practice</span>
              <span className="gqz-mode-desc">10 questions, 30 seconds each. Practice at your own pace.</span>
              <span className="gqz-mode-cta">Start →</span>
            </button>

            <button className="gqz-mode-card host" onClick={() => setClassicType('host')}>
              <span className="gqz-mode-icon">🎮</span>
              <span className="gqz-mode-title">Host a Game</span>
              <span className="gqz-mode-desc">Create a live room. Share the code. Up to 40 players compete together.</span>
              <span className="gqz-mode-cta">Create Room →</span>
            </button>
          </div>
        </>
      )}

      {experience && experience.id !== 'classic' && !language && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">{experience.icon} {experience.label}</h1>
            <p className="gqz-sub">Pick the focus before starting. Questions remain in English, but content can focus on Spanish workflow.</p>
          </div>

          <div className="gqz-grid">
            {LANGUAGE_OPTIONS.map((item) => (
              <button
                key={item.id}
                className="gqz-card"
                style={{ '--topic-color': item.color }}
                onClick={() => startSoloGame(experience.id, item.id)}
              >
                <span className="gqz-card-icon">{item.icon}</span>
                <span className="gqz-card-label">{item.label}</span>
                <span className="gqz-card-desc">{item.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {experience?.id === 'classic' && classicType && !language && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">🌎 Choose Language Mix</h1>
            <p className="gqz-sub">Questions are written in English. Pick the content focus before choosing a topic.</p>
          </div>

          <div className="gqz-grid">
            {LANGUAGE_OPTIONS.map((item) => (
              <button
                key={item.id}
                className="gqz-card"
                style={{ '--topic-color': item.color }}
                onClick={() => setLanguage(item.id)}
              >
                <span className="gqz-card-icon">{item.icon}</span>
                <span className="gqz-card-label">{item.label}</span>
                <span className="gqz-card-desc">{item.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {experience?.id === 'classic' && classicType && language && (
        <>
          <div className="gqz-hero">
            <h1 className="gqz-title">{classicType === 'solo' ? '📚 Choose a Topic' : '🎮 Choose a Topic to Host'}</h1>
            <p className="gqz-sub">
              {classicType === 'solo'
                ? 'Select what you want to be quizzed on'
                : 'All players will be quizzed on this topic'}
            </p>
          </div>

          {error && <div className="gqz-error">⚠️ {error}</div>}
          {creating && <div className="gqz-loading">Creating room... ⏳</div>}

          <div className="gqz-grid">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                className="gqz-card"
                style={{ '--topic-color': t.color }}
                onClick={() => (classicType === 'solo' ? handleSoloTopic(t.id) : handleHostTopic(t.id))}
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
