import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizPlay.css'

const QUESTION_COUNT = 10
const TIME_PER_Q = 30
const TIMER_INTERVAL_MS = 120

const OPTION_STYLES = [
  { color: '#ef4444', shape: '▲' },
  { color: '#3b82f6', shape: '◆' },
  { color: '#f59e0b', shape: '●' },
  { color: '#22c55e', shape: '■' },
]

const LETTERS = ['A', 'B', 'C', 'D']

function shuffle(arr) {
  const a = [...arr]

  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

function normalizeTopic(raw) {
  const value = String(raw || 'all').toLowerCase()

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
  const value = String(raw || 'mixed').toLowerCase()

  if (value === 'english') return 'en'
  if (value === 'spanish') return 'es'
  if (value === 'en') return 'en'
  if (value === 'es') return 'es'

  return 'mixed'
}

function buildPool(topicId, languageMode) {
  const normalizedTopic = normalizeTopic(topicId)
  const normalizedLanguage = normalizeLanguage(languageMode)

  const topicPool =
    normalizedTopic === 'all'
      ? quizQuestions
      : quizQuestions.filter((q) => normalizeTopic(q.topic) === normalizedTopic)

  if (normalizedLanguage === 'mixed') return topicPool

  const exactLanguage = topicPool.filter((q) => q.language === normalizedLanguage)

  if (exactLanguage.length >= QUESTION_COUNT) return exactLanguage

  const sameTopicFill = topicPool.filter(
    (q) => !exactLanguage.some((picked) => picked.id === q.id)
  )

  return [...exactLanguage, ...sameTopicFill]
}

function buildQuestionSet(topicId, languageMode) {
  const pool = buildPool(topicId, languageMode)
  let finalPool = [...pool]

  if (finalPool.length < QUESTION_COUNT) {
    const remaining = quizQuestions.filter(
      (q) => !finalPool.some((picked) => picked.id === q.id)
    )

    finalPool = [...finalPool, ...shuffle(remaining)]
  }

  return shuffle(finalPool)
    .slice(0, QUESTION_COUNT)
    .map((question) => {
      const mappedOptions = question.options.map((text, originalIndex) => ({
        text,
        originalIndex,
      }))

      const shuffledOptions = shuffle(mappedOptions)
      const correctIndex = shuffledOptions.findIndex(
        (opt) => opt.originalIndex === question.correct
      )

      return {
        ...question,
        options: shuffledOptions.map((opt) => opt.text),
        correctIndex,
      }
    })
}

function useSound() {
  const ctx = useRef(null)

  const getCtx = () => {
    if (!ctx.current) {
      ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    return ctx.current
  }

  const beep = (freq, dur, type = 'sine', vol = 0.22, delay = 0) => {
    try {
      const ac = getCtx()

      if (ac.state === 'suspended') ac.resume()

      const o = ac.createOscillator()
      const g = ac.createGain()
      const startAt = ac.currentTime + delay

      o.connect(g)
      g.connect(ac.destination)

      o.frequency.value = freq
      o.type = type

      g.gain.setValueAtTime(0.0001, startAt)
      g.gain.exponentialRampToValueAtTime(vol, startAt + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)

      o.start(startAt)
      o.stop(startAt + dur + 0.02)
    } catch {
      // ignore blocked audio
    }
  }

  return {
    correct: () => {
      beep(600, 0.1)
      beep(900, 0.16, 'sine', 0.22, 0.1)
    },
    wrong: () => beep(180, 0.35, 'sawtooth', 0.14),
    tick: () => beep(440, 0.04, 'square', 0.04),
    timeout: () => beep(220, 0.45, 'triangle', 0.14),
    start: () => {
      beep(400, 0.08)
      beep(560, 0.08, 'sine', 0.18, 0.11)
      beep(740, 0.13, 'sine', 0.2, 0.23)
    },
    finish: () => {
      beep(420, 0.11)
      beep(560, 0.11, 'sine', 0.16, 0.13)
      beep(700, 0.18, 'sine', 0.18, 0.26)
    },
    epic: () => {
      beep(392, 0.12, 'sine', 0.18, 0)
      beep(523, 0.12, 'sine', 0.2, 0.13)
      beep(659, 0.14, 'sine', 0.22, 0.27)
      beep(784, 0.28, 'sine', 0.24, 0.43)
      beep(1046, 0.35, 'triangle', 0.12, 0.55)
    },
  }
}

export default function GoQuizPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const topicId = params.get('topic') || 'all'
  const languageMode = params.get('lang') || 'mixed'
  const sound = useSound()

  const [questions] = useState(() => buildQuestionSet(topicId, languageMode))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const timerRef = useRef(null)
  const deadlineRef = useRef(0)
  const lastTickSecond = useRef(null)
  const started = useRef(false)
  const finishSoundPlayed = useRef(false)

  const q = questions[idx]
  const totalQuestions = questions.length || QUESTION_COUNT
  const score = results.filter((r) => r.correct).length
  const pct = Math.round((score / totalQuestions) * 100)

  useEffect(() => {
    if (!started.current) {
      sound.start()
      started.current = true
    }
  }, [sound])

  useEffect(() => {
    if (!done || finishSoundPlayed.current) return

    finishSoundPlayed.current = true

    if (pct >= 80) sound.epic()
    else sound.finish()
  }, [done, pct, sound])

  const recordResult = useCallback((payload) => {
    setResults((prev) => [...prev, payload])
  }, [])

  const buildReviewPayload = useCallback(
    ({ selectedIndex = null, correct = false, timedOut = false }) => ({
      id: q?.id,
      topic: q?.topic || 'general',
      language: q?.language || 'en',
      question: q?.question || '',
      options: q?.options || [],
      selectedIndex,
      correctIndex: q?.correctIndex ?? q?.correct ?? 0,
      explanation: q?.explanation || '',
      correct,
      timedOut,
    }),
    [q]
  )

  const doTimeout = useCallback(() => {
    if (answered) return

    sound.timeout()
    setAnswered(true)
    setShowExplanation(true)

    recordResult(
      buildReviewPayload({
        selectedIndex: null,
        correct: false,
        timedOut: true,
      })
    )
  }, [answered, buildReviewPayload, recordResult, sound])

  useEffect(() => {
    clearInterval(timerRef.current)

    if (done || answered) return

    setTimeLeft(TIME_PER_Q)
    lastTickSecond.current = null
    deadlineRef.current = Date.now() + TIME_PER_Q * 1000

    timerRef.current = setInterval(() => {
      const remainingMs = deadlineRef.current - Date.now()
      const remaining = Math.max(0, remainingMs / 1000)
      const display = Math.ceil(remaining)

      setTimeLeft(display)

      if (
        display <= 5 &&
        display > 0 &&
        display !== lastTickSecond.current
      ) {
        lastTickSecond.current = display
        sound.tick()
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        doTimeout()
      }
    }, TIMER_INTERVAL_MS)

    return () => clearInterval(timerRef.current)
  }, [idx, done, answered, doTimeout, sound])

  const handleSelect = (i) => {
    if (answered || !q) return

    clearInterval(timerRef.current)

    setSelected(i)
    setAnswered(true)
    setShowExplanation(true)

    const correct = i === q.correctIndex

    if (correct) sound.correct()
    else sound.wrong()

    recordResult(
      buildReviewPayload({
        selectedIndex: i,
        correct,
        timedOut: false,
      })
    )
  }

  const handleNext = () => {
    if (idx + 1 >= totalQuestions) {
      setDone(true)
      return
    }

    setIdx((prev) => prev + 1)
    setSelected(null)
    setAnswered(false)
    setShowExplanation(false)
  }

  const tryAgain = () => {
    window.location.href = `/go/quiz/play?topic=${topicId}&lang=${languageMode}`
  }

  const changeTopic = () => {
    navigate('/go/quiz?mode=solo')
  }

  const timerPct = Math.max(0, Math.min(100, (timeLeft / TIME_PER_Q) * 100))
  const timerColor =
    timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#b9d6ff'

  const grade =
    pct >= 80
      ? { label: '🏆 Excellent!', color: '#b9d6ff' }
      : pct >= 60
      ? { label: '👍 Good Job', color: '#f8f9fd' }
      : { label: '📚 Keep Studying', color: '#ef4444' }

  if (done && reviewMode) {
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div
            className="gqp-nav-brand"
            onClick={() => navigate('/go')}
            style={{ cursor: 'pointer' }}
          >
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>

          <div className="gqp-nav-meta">
            <span className="gqp-nav-mode">📚 Review</span>
            <span className="gqp-nav-counter">
              {score}/{totalQuestions}
            </span>
          </div>

          <button className="gqp-nav-exit" onClick={() => setReviewMode(false)}>
            ← Results
          </button>
        </nav>

        <main className="gqp-review-page">
          <div className="gqp-review-head">
            <h1>Review Answers</h1>
            <p>Check what you chose, what was correct, and what to study next.</p>
          </div>

          <div className="gqp-review-list">
            {results.map((item, qIndex) => (
              <article key={`${item.id}-${qIndex}`} className="gqp-review-card">
                <div className="gqp-review-top">
                  <span className="gqp-topic-badge">{item.topic}</span>
                  <span className={`gqp-review-status ${item.correct ? 'ok' : 'no'}`}>
                    {item.correct ? 'Correct' : item.timedOut ? 'Timed out' : 'Missed'}
                  </span>
                </div>

                <h2>
                  {qIndex + 1}. {item.question}
                </h2>

                <div className="gqp-review-options">
                  {item.options.map((option, optionIndex) => {
                    const isPicked = item.selectedIndex === optionIndex
                    const isCorrect = item.correctIndex === optionIndex

                    return (
                      <div
                        key={`${item.id}-${optionIndex}`}
                        className={`gqp-review-option ${
                          isCorrect ? 'correct' : isPicked ? 'picked' : ''
                        }`}
                      >
                        <span className="gqp-review-letter">{LETTERS[optionIndex]}</span>
                        <span>{option}</span>
                        {isCorrect && <b>Correct</b>}
                        {isPicked && !isCorrect && <b>Your answer</b>}
                      </div>
                    )
                  })}
                </div>

                {item.selectedIndex === null && (
                  <div className="gqp-review-empty">You did not select an answer.</div>
                )}

                {item.explanation && (
                  <div className="gqp-explanation ok">
                    <strong>Explanation</strong>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="gqp-results-actions">
            <button className="gqp-btn-primary" onClick={tryAgain}>
              🔄 Try Again
            </button>

            <button className="gqp-btn-outline" onClick={changeTopic}>
              Change Topic
            </button>

            <button className="gqp-btn-outline" onClick={() => setReviewMode(false)}>
              Back to Results
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (done) {
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div
            className="gqp-nav-brand"
            onClick={() => navigate('/go')}
            style={{ cursor: 'pointer' }}
          >
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>

          <div className="gqp-nav-meta">
            <span className="gqp-nav-mode">🧠 Classic Quiz</span>
          </div>

          <button className="gqp-nav-exit" onClick={() => navigate('/go')}>
            Home
          </button>
        </nav>

        <div className="gqp-results">
          <div className="gqp-results-mode">🧠 Classic Quiz</div>

          <div className="gqp-results-score" style={{ color: grade.color }}>
            {pct}%
          </div>

          <div className="gqp-results-grade" style={{ color: grade.color }}>
            {grade.label}
          </div>

          <div className="gqp-results-row">
            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#22c55e' }}>
                {score}
              </span>
              <span className="gqp-results-lbl">Correct</span>
            </div>

            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#ef4444' }}>
                {totalQuestions - score}
              </span>
              <span className="gqp-results-lbl">Missed</span>
            </div>

            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#9aa7bb' }}>
                {totalQuestions}
              </span>
              <span className="gqp-results-lbl">Total</span>
            </div>
          </div>

          <div className="gqp-results-actions">
            <button className="gqp-btn-primary" onClick={tryAgain}>
              🔄 Try Again
            </button>

            <button className="gqp-btn-outline" onClick={changeTopic}>
              Change Topic
            </button>

            <button className="gqp-btn-outline" onClick={() => setReviewMode(true)}>
              📚 Review
            </button>
          </div>
        </div>
      </div>
    )
  }

  const answerWasCorrect = selected === q?.correctIndex

  return (
    <div className="gqp-page">
      <nav className="gqp-nav">
        <div
          className="gqp-nav-brand"
          onClick={() => navigate('/go')}
          style={{ cursor: 'pointer' }}
        >
          <span className="gqp-nav-text">Pulse</span>
          <span className="gqp-nav-badge">GO</span>
        </div>

        <div className="gqp-nav-meta">
          <span className="gqp-nav-mode">🧠 Classic Quiz</span>
          <span className="gqp-nav-counter">
            {idx + 1} / {totalQuestions}
          </span>
          <span className="gqp-nav-timer" style={{ color: timerColor }}>
            {timeLeft}s
          </span>
        </div>

        <button className="gqp-nav-exit" onClick={() => navigate('/go/quiz?mode=solo')}>
          ✕ Exit
        </button>
      </nav>

      <div className="gqp-timer-bar">
        <div
          className="gqp-timer-fill"
          style={{ width: `${timerPct}%`, background: timerColor }}
        />
      </div>

      <div className="gqp-dots">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`gqp-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="gqp-card">
        <span className="gqp-topic-badge">{q?.topic || 'Quiz'}</span>

        <h1 className="gqp-question">{q?.question}</h1>

        <div className="gqp-options">
          {q?.options.map((opt, i) => {
            const st = OPTION_STYLES[i] || OPTION_STYLES[0]
            let state = ''

            if (answered) {
              if (i === q.correctIndex) state = 'correct'
              else if (i === selected) state = 'wrong'
              else state = 'dim'
            }

            return (
              <button
                key={i}
                className={`gqp-option ${state}`}
                style={{ '--opt-color': st.color }}
                onClick={() => handleSelect(i)}
                disabled={answered}
              >
                <span className="gqp-option-shape">{st.shape}</span>
                <span className="gqp-option-letter">{LETTERS[i]}</span>
                <span className="gqp-option-text">{opt}</span>
              </button>
            )
          })}
        </div>

        {showExplanation && (
          <div className={`gqp-explanation ${answerWasCorrect ? 'ok' : 'no'}`}>
            <strong>{answerWasCorrect ? '✅ Correct' : '❌ Review this'}</strong>
            <p>{q?.explanation}</p>
          </div>
        )}

        {answered && (
          <button className="gqp-next" onClick={handleNext}>
            {idx + 1 >= totalQuestions ? 'See Results →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  )
}