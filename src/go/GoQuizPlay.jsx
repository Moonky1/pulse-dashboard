import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  gameModes,
  quizQuestions,
  gameChallengeBank,
} from './goContent'
import './GoQuizPlay.css'

const CLASSIC_COUNT = 10
const SPEED_COUNT = 15
const CERTIFICATION_COUNT = 25
const DEFAULT_TIME = 30
const SPEED_TIME = 15

const OPTION_STYLES = [
  { color: '#ef4444', shape: '▲' },
  { color: '#3b82f6', shape: '◆' },
  { color: '#f59e0b', shape: '●' },
  { color: '#22c55e', shape: '■' },
  { color: '#a855f7', shape: '⬟' },
  { color: '#38bdf8', shape: '✦' },
]

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

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

function normalizeMode(raw) {
  const value = (raw || 'classic').toLowerCase()
  const valid = [
    'classic',
    'objection-battle',
    'script-fill',
    'transfer-protocol',
    'disposition-trainer',
    'valid-invalid',
    'speed-round',
    'certification',
    'roleplay',
  ]

  return valid.includes(value) ? value : 'classic'
}

function getModeMeta(modeId) {
  return gameModes.find((mode) => mode.id === modeId) || gameModes.find((mode) => mode.id === 'classic') || {
    id: 'classic',
    label: 'Classic Quiz',
    icon: '🧠',
  }
}

function getQuestionCount(modeId) {
  if (modeId === 'speed-round') return SPEED_COUNT
  if (modeId === 'certification') return CERTIFICATION_COUNT
  if (modeId === 'transfer-protocol') return 5
  if (modeId === 'roleplay') return 8
  return CLASSIC_COUNT
}

function getTimePerQuestion(modeId) {
  if (modeId === 'speed-round') return SPEED_TIME
  return DEFAULT_TIME
}

function filterByLanguage(pool, languageMode) {
  const language = normalizeLanguage(languageMode)
  if (language === 'mixed') return pool

  const exact = pool.filter((q) => q.language === language)
  if (exact.length > 0) return exact

  return pool
}

function filterClassicPool(topicId, languageMode) {
  const topic = normalizeTopic(topicId)
  const byTopic = topic === 'all'
    ? quizQuestions
    : quizQuestions.filter((q) => q.topic === topic)

  const language = normalizeLanguage(languageMode)
  if (language === 'mixed') return byTopic

  const exact = byTopic.filter((q) => q.language === language)
  if (exact.length >= CLASSIC_COUNT) return exact

  const fill = byTopic.filter((q) => !exact.some((picked) => picked.id === q.id))
  return [...exact, ...fill]
}

function toMultipleChoice(raw, index) {
  const mappedOptions = raw.options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }))

  const shuffledOptions = shuffle(mappedOptions)
  const correctIndex = shuffledOptions.findIndex((opt) => opt.originalIndex === raw.correct)

  return {
    ...raw,
    roundId: `${raw.id}-${index}`,
    kind: 'multiple-choice',
    options: shuffledOptions.map((opt) => opt.text),
    correctIndex,
  }
}

function toOrderQuestion(raw, index) {
  const shuffledSteps = shuffle(
    raw.steps.map((text, originalIndex) => ({
      text,
      originalIndex,
    }))
  )

  return {
    ...raw,
    roundId: `${raw.id}-${index}`,
    kind: 'order',
    shuffledSteps,
  }
}

function buildQuestions(modeId, topicId, languageMode) {
  const mode = normalizeMode(modeId)
  const count = getQuestionCount(mode)

  if (mode === 'classic') {
    const pool = filterClassicPool(topicId, languageMode)
    let finalPool = [...pool]

    if (finalPool.length < count) {
      const remaining = quizQuestions.filter((q) => !finalPool.some((picked) => picked.id === q.id))
      finalPool = [...finalPool, ...shuffle(remaining)]
    }

    return shuffle(finalPool).slice(0, count).map(toMultipleChoice)
  }

  if (mode === 'speed-round') {
    const speedPool = quizQuestions.filter((q) => [
      'script',
      'callflow',
      'dosdonts',
      'product',
    ].includes(q.topic))

    return shuffle(filterByLanguage(speedPool, languageMode))
      .slice(0, count)
      .map(toMultipleChoice)
  }

  if (mode === 'certification') {
    const certifiedPool = filterByLanguage(quizQuestions, languageMode)
    const base = certifiedPool.length >= count ? certifiedPool : quizQuestions
    return shuffle(base).slice(0, count).map(toMultipleChoice)
  }

  if (mode === 'transfer-protocol') {
    return shuffle(filterByLanguage(gameChallengeBank['transfer-protocol'] || [], languageMode))
      .slice(0, count)
      .map(toOrderQuestion)
  }

  const challengePool = filterByLanguage(gameChallengeBank[mode] || [], languageMode)
  const base = challengePool.length > 0 ? challengePool : quizQuestions

  return shuffle(base).slice(0, count).map(toMultipleChoice)
}

function getQuestionTitle(q, modeId) {
  if (modeId === 'roleplay') return q.customer || q.question
  return q.question
}

function getExplanation(q, modeId) {
  if (modeId === 'roleplay') return q.outcome || q.explanation
  return q.explanation
}

function getScoreLabel(modeId, pct) {
  if (modeId === 'certification') {
    return pct >= 80
      ? { label: '🏅 Certified!', color: '#22c55e' }
      : { label: '📚 Not Certified Yet', color: '#ef4444' }
  }

  if (pct >= 85) return { label: '🔥 Elite!', color: '#22c55e' }
  if (pct >= 70) return { label: '🎉 Strong!', color: '#38bdf8' }
  if (pct >= 60) return { label: '👍 Good Job', color: '#f97316' }
  return { label: '📚 Keep Studying', color: '#ef4444' }
}

function getWeakTopics(questions, results) {
  const missed = questions.filter((_, index) => results[index] && !results[index].correct)
  const counts = missed.reduce((acc, q) => {
    const key = q.topic || 'general'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic)
}

// ── Web Audio sounds ──
function useSound() {
  const ctx = useRef(null)

  const getCtx = () => {
    if (!ctx.current) {
      ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    return ctx.current
  }

  const beep = (freq, dur, type = 'sine', vol = 0.3) => {
    try {
      const ac = getCtx()
      const o = ac.createOscillator()
      const g = ac.createGain()

      o.connect(g)
      g.connect(ac.destination)

      o.frequency.value = freq
      o.type = type

      g.gain.setValueAtTime(vol, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)

      o.start()
      o.stop(ac.currentTime + dur)
    } catch {}
  }

  return {
    correct: () => {
      beep(600, 0.1)
      setTimeout(() => beep(900, 0.15), 100)
    },
    wrong: () => beep(180, 0.4, 'sawtooth', 0.2),
    tick: () => beep(440, 0.05, 'square', 0.15),
    timeout: () => beep(220, 0.5, 'triangle', 0.2),
    start: () => {
      beep(400, 0.08)
      setTimeout(() => beep(500, 0.08), 100)
      setTimeout(() => beep(700, 0.15), 200)
    },
  }
}

export default function GoQuizPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const modeId = normalizeMode(params.get('mode'))
  const topicId = params.get('topic') || 'all'
  const languageMode = params.get('lang') || 'mixed'
  const sound = useSound()

  const [questions] = useState(() => buildQuestions(modeId, topicId, languageMode))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [orderSelection, setOrderSelection] = useState([])
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getTimePerQuestion(modeId))
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const timerRef = useRef(null)
  const started = useRef(false)

  const q = questions[idx]
  const totalQuestions = questions.length || getQuestionCount(modeId)
  const score = results.filter((r) => r.correct).length
  const modeMeta = getModeMeta(modeId)
  const timePerQ = getTimePerQuestion(modeId)

  useEffect(() => {
    if (!started.current) {
      sound.start()
      started.current = true
    }
  }, [])

  const recordResult = useCallback((payload) => {
    setResults((prev) => [...prev, payload])
  }, [])

  const doTimeout = useCallback(() => {
    if (answered) return

    sound.timeout()
    setAnswered(true)
    setShowExplanation(true)
    recordResult({ correct: false, timedOut: true, topic: q?.topic })
  }, [answered, q?.topic, recordResult, sound])

  useEffect(() => {
    if (done || answered) {
      clearInterval(timerRef.current)
      return
    }

    setTimeLeft(timePerQ)

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 6 && t > 1) sound.tick()

        if (t <= 1) {
          clearInterval(timerRef.current)
          doTimeout()
          return 0
        }

        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [idx, done, answered, doTimeout, sound, timePerQ])

  const handleSelect = (i) => {
    if (answered || !q) return

    clearInterval(timerRef.current)
    setSelected(i)
    setAnswered(true)
    setShowExplanation(true)

    const correct = i === q.correctIndex

    if (correct) sound.correct()
    else sound.wrong()

    recordResult({ correct, topic: q.topic })
  }

  const handleOrderPick = (step) => {
    if (answered) return

    setOrderSelection((prev) => {
      if (prev.some((item) => item.originalIndex === step.originalIndex)) return prev
      return [...prev, step]
    })
  }

  const handleOrderUndo = () => {
    if (answered) return
    setOrderSelection((prev) => prev.slice(0, -1))
  }

  const handleOrderSubmit = () => {
    if (answered || !q || orderSelection.length !== q.shuffledSteps.length) return

    clearInterval(timerRef.current)
    setAnswered(true)
    setShowExplanation(true)

    const correct = orderSelection.every((step, index) => step.originalIndex === index)

    if (correct) sound.correct()
    else sound.wrong()

    recordResult({ correct, topic: q.topic })
  }

  const handleNext = () => {
    if (idx + 1 >= totalQuestions) {
      setDone(true)
      return
    }

    setIdx((prev) => prev + 1)
    setSelected(null)
    setOrderSelection([])
    setAnswered(false)
    setShowExplanation(false)
  }

  const timerPct = (timeLeft / timePerQ) * 100
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316'

  if (!q) {
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>
        </nav>
        <div className="gqp-results">
          <div className="gqp-results-grade">No questions found</div>
          <button className="gqp-btn-primary" onClick={() => navigate('/go/quiz')}>Back to Games</button>
        </div>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((score / totalQuestions) * 100)
    const grade = getScoreLabel(modeId, pct)
    const weakTopics = getWeakTopics(questions, results)

    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>
        </nav>

        <div className="gqp-results">
          <div className="gqp-results-mode">{modeMeta.icon} {modeMeta.label}</div>
          <div className="gqp-results-score" style={{ color: grade.color }}>{pct}%</div>
          <div className="gqp-results-grade" style={{ color: grade.color }}>{grade.label}</div>

          <div className="gqp-results-row">
            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#22c55e' }}>{score}</span>
              <span className="gqp-results-lbl">Correct</span>
            </div>

            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#ef4444' }}>{totalQuestions - score}</span>
              <span className="gqp-results-lbl">Missed</span>
            </div>

            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#6b7280' }}>{totalQuestions}</span>
              <span className="gqp-results-lbl">Total</span>
            </div>
          </div>

          {modeId === 'certification' && (
            <div className="gqp-cert-box">
              <strong>{pct >= 80 ? 'Passed certification' : 'Needs another review'}</strong>
              <span>Passing score: 80%</span>
            </div>
          )}

          {weakTopics.length > 0 && (
            <div className="gqp-weak-box">
              <strong>Review next:</strong>
              <span>{weakTopics.join(' • ')}</span>
            </div>
          )}

          <div className="gqp-results-actions">
            <button className="gqp-btn-primary" onClick={() => window.location.reload()}>🔄 Try Again</button>
            <button className="gqp-btn-outline" onClick={() => navigate('/go/quiz')}>Change Game</button>
            <button className="gqp-btn-outline" onClick={() => navigate('/go/learn')}>📚 Review</button>
          </div>
        </div>
      </div>
    )
  }

  const answerWasCorrect = selected === q.correctIndex
  const explanation = getExplanation(q, modeId)

  return (
    <div className="gqp-page">
      <nav className="gqp-nav">
        <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gqp-nav-text">Pulse</span>
          <span className="gqp-nav-badge">GO</span>
        </div>

        <div className="gqp-nav-meta">
          <span className="gqp-nav-mode">{modeMeta.icon} {modeMeta.label}</span>
          <span className="gqp-nav-counter">{idx + 1} / {totalQuestions}</span>
          <span className="gqp-nav-timer" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>

        <button className="gqp-nav-exit" onClick={() => navigate('/go/quiz')}>✕ Exit</button>
      </nav>

      <div className="gqp-timer-bar">
        <div className="gqp-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      <div className="gqp-dots">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`gqp-dot ${i < idx ? 'done' : ''} ${i === idx ? 'active' : ''}`}
          />
        ))}
      </div>

      <main className={`gqp-card ${q.kind === 'order' ? 'is-order' : ''}`}>
        <div className="gqp-topic-badge">{q.topic || modeId}</div>

        {modeId === 'roleplay' && q.customer && (
          <div className="gqp-customer-line">
            <span>Customer says</span>
            <strong>“{q.customer}”</strong>
          </div>
        )}

        <h1 className="gqp-question">{getQuestionTitle(q, modeId)}</h1>

        {modeId === 'roleplay' && q.customer && (
          <p className="gqp-roleplay-prompt">{q.question}</p>
        )}

        {q.kind === 'order' ? (
          <>
            <div className="gqp-order-layout">
              <section className="gqp-order-pool">
                <h3>Available steps</h3>
                {q.shuffledSteps.map((step) => {
                  const used = orderSelection.some((item) => item.originalIndex === step.originalIndex)
                  return (
                    <button
                      key={step.originalIndex}
                      className={`gqp-order-step ${used ? 'used' : ''}`}
                      onClick={() => handleOrderPick(step)}
                      disabled={used || answered}
                    >
                      {step.text}
                    </button>
                  )
                })}
              </section>

              <section className="gqp-order-answer">
                <h3>Your order</h3>
                {orderSelection.length === 0 && <p className="gqp-order-empty">Pick the steps in the correct sequence.</p>}
                {orderSelection.map((step, index) => (
                  <div key={`${step.originalIndex}-${index}`} className="gqp-order-picked">
                    <span>{index + 1}</span>
                    <p>{step.text}</p>
                  </div>
                ))}
              </section>
            </div>

            {!answered && (
              <div className="gqp-order-actions">
                <button className="gqp-btn-outline" onClick={handleOrderUndo} disabled={orderSelection.length === 0}>Undo</button>
                <button
                  className="gqp-btn-primary"
                  onClick={handleOrderSubmit}
                  disabled={orderSelection.length !== q.shuffledSteps.length}
                >
                  Submit Order
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="gqp-options">
            {q.options.map((opt, i) => {
              const style = OPTION_STYLES[i] || OPTION_STYLES[0]
              const isCorrectOption = i === q.correctIndex
              const isSelected = selected === i
              const reveal = answered
              let stateClass = ''

              if (reveal && isCorrectOption) stateClass = 'correct'
              else if (reveal && isSelected && !isCorrectOption) stateClass = 'wrong'
              else if (reveal) stateClass = 'dim'

              return (
                <button
                  key={i}
                  className={`gqp-option ${stateClass}`}
                  style={{ '--opt-color': style.color }}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                >
                  <span className="gqp-option-shape">{style.shape}</span>
                  <span className="gqp-option-letter">{LETTERS[i]}</span>
                  <span className="gqp-option-text">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {showExplanation && (
          <div className={`gqp-explanation ${(answerWasCorrect || (q.kind === 'order' && results[results.length - 1]?.correct)) ? 'ok' : 'no'}`}>
            <strong>
              {(answerWasCorrect || (q.kind === 'order' && results[results.length - 1]?.correct)) ? '✅ Correct' : '❌ Review this'}
            </strong>
            <p>{explanation || 'Review the related training section before trying again.'}</p>

            {q.kind === 'order' && (
              <div className="gqp-correct-order">
                <b>Correct order:</b>
                {q.steps.map((step, index) => (
                  <span key={step}>{index + 1}. {step}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {answered && (
          <button className="gqp-next" onClick={handleNext}>
            {idx + 1 >= totalQuestions ? 'See Results →' : 'Next →'}
          </button>
        )}
      </main>
    </div>
  )
}
