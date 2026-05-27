import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizPlay.css'

const QUESTION_COUNT = 10
const TIME_PER_QUESTION = 30

const OPTION_META = [
  { letter: 'A', shape: '▲', color: '#ef4444' },
  { letter: 'B', shape: '◆', color: '#3b82f6' },
  { letter: 'C', shape: '●', color: '#f59e0b' },
  { letter: 'D', shape: '■', color: '#22c55e' },
]

function shuffle(array) {
  const copy = [...array]

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
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

  return 'all'
}

function normalizeLang(value) {
  const clean = String(value || 'mixed').toLowerCase()

  if (clean === 'en' || clean === 'english') return 'en'
  if (clean === 'es' || clean === 'spanish') return 'es'
  return 'mixed'
}

function buildQuestionSet(topic, lang) {
  const wantedTopic = normalizeTopic(topic)
  const wantedLang = normalizeLang(lang)

  let pool = quizQuestions.filter((q) => {
    const topicOk = wantedTopic === 'all' || normalizeTopic(q.topic) === wantedTopic

    if (wantedLang === 'mixed') return topicOk

    return topicOk && String(q.language || 'en') === wantedLang
  })

  // Important:
  // English mode = English only.
  // Spanish mode = Spanish only.
  // Never refill Spanish mode with English questions or English mode with Spanish questions.
  if (pool.length === 0 && wantedLang !== 'mixed' && wantedTopic !== 'all') {
    pool = quizQuestions.filter((q) => String(q.language || 'en') === wantedLang)
  }

  if (pool.length === 0) {
    pool = quizQuestions.filter((q) => {
      if (wantedLang === 'mixed') return true
      return String(q.language || 'en') === wantedLang
    })
  }

  if (pool.length > 0 && pool.length < QUESTION_COUNT) {
    const expanded = []
    let round = 0

    while (expanded.length < QUESTION_COUNT) {
      expanded.push(...shuffle(pool))
      round += 1
      if (round > 20) break
    }

    pool = expanded
  }

  return shuffle(pool)
    .slice(0, QUESTION_COUNT)
    .map((q) => {
      const mapped = q.options.map((text, originalIndex) => ({
        text,
        originalIndex,
      }))

      const shuffledOptions = shuffle(mapped)
      const correctIndex = shuffledOptions.findIndex((item) => item.originalIndex === q.correct)

      return {
        ...q,
        options: shuffledOptions.map((item) => item.text),
        correctIndex,
      }
    })
}

function useQuizSound() {
  const ctxRef = useRef(null)

  const playTone = (freq, duration, type = 'sine', volume = 0.12, delay = 0) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      if (!ctxRef.current) ctxRef.current = new AudioContext()

      const ctx = ctxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + delay

      osc.type = type
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + duration + 0.02)
    } catch {
      // Browser may block sound until interaction.
    }
  }

  return {
    correct: () => {
      playTone(620, 0.1, 'sine', 0.12)
      playTone(920, 0.16, 'sine', 0.14, 0.1)
    },
    wrong: () => {
      playTone(190, 0.26, 'sawtooth', 0.08)
    },
    tick: () => {
      playTone(440, 0.035, 'square', 0.025)
    },
    timeout: () => {
      playTone(220, 0.28, 'triangle', 0.08)
    },
    finish: () => {
      playTone(420, 0.1, 'sine', 0.1)
      playTone(560, 0.1, 'sine', 0.11, 0.12)
      playTone(720, 0.18, 'sine', 0.12, 0.25)
    },
    epic: () => {
      playTone(392, 0.11, 'sine', 0.12)
      playTone(523, 0.12, 'sine', 0.13, 0.13)
      playTone(659, 0.14, 'sine', 0.14, 0.27)
      playTone(784, 0.24, 'sine', 0.15, 0.43)
      playTone(1046, 0.34, 'triangle', 0.08, 0.58)
    },
  }
}

export default function GoQuizPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const topic = params.get('topic') || 'all'
  const lang = params.get('lang') || 'mixed'

  const sounds = useQuizSound()

  const questions = useMemo(() => buildQuestionSet(topic, lang), [topic, lang])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)

  const timerRef = useRef(null)
  const deadlineRef = useRef(null)
  const lastTickRef = useRef(null)
  const finishSoundRef = useRef(false)

  const currentQuestion = questions[currentIndex]
  const total = questions.length
  const correctCount = results.filter((item) => item.correct).length
  const missedCount = total - correctCount
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const saveResult = ({ selected, timedOut = false }) => {
    if (!currentQuestion) return

    const correct = selected === currentQuestion.correctIndex

    setResults((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        topic: currentQuestion.topic,
        language: currentQuestion.language,
        question: currentQuestion.question,
        options: currentQuestion.options,
        selectedIndex: selected,
        correctIndex: currentQuestion.correctIndex,
        explanation: currentQuestion.explanation,
        correct,
        timedOut,
      },
    ])
  }

  const handleTimeout = () => {
    if (answered || finished) return

    sounds.timeout()
    setSelectedIndex(null)
    setAnswered(true)
    saveResult({ selected: null, timedOut: true })
  }

  useEffect(() => {
    if (finished || answered || !currentQuestion) return

    clearInterval(timerRef.current)

    setTimeLeft(TIME_PER_QUESTION)
    lastTickRef.current = null
    deadlineRef.current = Date.now() + TIME_PER_QUESTION * 1000

    timerRef.current = setInterval(() => {
      const remainingMs = deadlineRef.current - Date.now()
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000))

      setTimeLeft(remainingSeconds)

      if (
        remainingSeconds <= 5 &&
        remainingSeconds > 0 &&
        remainingSeconds !== lastTickRef.current
      ) {
        lastTickRef.current = remainingSeconds
        sounds.tick()
      }

      if (remainingMs <= 0) {
        clearInterval(timerRef.current)
        handleTimeout()
      }
    }, 120)

    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, answered, finished, currentQuestion])

  useEffect(() => {
    if (!finished || finishSoundRef.current) return

    finishSoundRef.current = true

    if (percent >= 80) sounds.epic()
    else sounds.finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, percent])

  const handleAnswer = (index) => {
    if (answered || !currentQuestion) return

    clearInterval(timerRef.current)

    const correct = index === currentQuestion.correctIndex

    setSelectedIndex(index)
    setAnswered(true)
    saveResult({ selected: index })

    if (correct) sounds.correct()
    else sounds.wrong()
  }

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setFinished(true)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedIndex(null)
    setAnswered(false)
  }

  const tryAgain = () => {
    window.location.href = `/go/quiz/play?topic=${topic}&lang=${lang}`
  }

  const changeTopic = () => {
    navigate('/go/quiz?mode=solo')
  }

  const grade =
    percent >= 80
      ? { label: 'Excellent!', emoji: '🏆', color: '#b9d6ff' }
      : percent >= 60
      ? { label: 'Good Job', emoji: '👍', color: '#f8f9fd' }
      : { label: 'Keep Studying', emoji: '📚', color: '#ef4444' }

  const timerPercent = Math.max(0, Math.min(100, (timeLeft / TIME_PER_QUESTION) * 100))
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#b9d6ff'

  if (finished && reviewMode) {
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <button className="gqp-brand" onClick={() => navigate('/go')}>
            <span>Pulse</span>
            <b>GO</b>
          </button>

          <div className="gqp-nav-center">
            <span>📚 Review</span>
            <span>{correctCount}/{total}</span>
          </div>

          <button className="gqp-exit-btn" onClick={() => setReviewMode(false)}>
            ← Results
          </button>
        </nav>

        <main className="gqp-review-wrap">
          <header className="gqp-review-header">
            <h1>Review Answers</h1>
            <p>Check what you chose and what the correct answer was.</p>
          </header>

          <section className="gqp-review-list">
            {results.map((item, index) => (
              <article key={`${item.id}-${index}`} className="gqp-review-card">
                <div className="gqp-review-top">
                  <span className="gqp-topic-badge">{item.topic}</span>
                  <span className={`gqp-review-status ${item.correct ? 'ok' : 'no'}`}>
                    {item.correct ? 'Correct' : item.timedOut ? 'Timed out' : 'Missed'}
                  </span>
                </div>

                <h2>{index + 1}. {item.question}</h2>

                <div className="gqp-review-options">
                  {item.options.map((option, optIndex) => {
                    const isCorrect = optIndex === item.correctIndex
                    const isPicked = optIndex === item.selectedIndex

                    return (
                      <div
                        key={`${item.id}-${optIndex}`}
                        className={`gqp-review-option ${
                          isCorrect ? 'correct' : isPicked ? 'picked' : ''
                        }`}
                      >
                        <span>{OPTION_META[optIndex]?.letter || optIndex + 1}</span>
                        <p>{option}</p>
                        {isCorrect && <b>Correct</b>}
                        {isPicked && !isCorrect && <b>Your answer</b>}
                      </div>
                    )
                  })}
                </div>

                {item.selectedIndex === null && (
                  <div className="gqp-no-answer">You did not select an answer.</div>
                )}

                {item.explanation && (
                  <div className="gqp-explanation ok">
                    <strong>Explanation</strong>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </article>
            ))}
          </section>

          <div className="gqp-results-actions">
            <button className="gqp-primary-btn" onClick={tryAgain}>🔄 Try Again</button>
            <button className="gqp-secondary-btn" onClick={changeTopic}>Change Topic</button>
            <button className="gqp-secondary-btn" onClick={() => setReviewMode(false)}>
              Back to Results
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <button className="gqp-brand" onClick={() => navigate('/go')}>
            <span>Pulse</span>
            <b>GO</b>
          </button>

          <div className="gqp-nav-center">
            <span>🧠 Classic Quiz</span>
          </div>

          <button className="gqp-exit-btn" onClick={() => navigate('/go')}>
            Home
          </button>
        </nav>

        <main className="gqp-results-card">
          <span className="gqp-results-mode">🧠 Classic Quiz</span>

          <h1 style={{ color: grade.color }}>{percent}%</h1>
          <h2 style={{ color: grade.color }}>{grade.emoji} {grade.label}</h2>

          <div className="gqp-results-stats">
            <div>
              <strong className="ok">{correctCount}</strong>
              <span>Correct</span>
            </div>

            <div>
              <strong className="no">{missedCount}</strong>
              <span>Missed</span>
            </div>

            <div>
              <strong>{total}</strong>
              <span>Total</span>
            </div>
          </div>

          <div className="gqp-results-actions">
            <button className="gqp-primary-btn" onClick={tryAgain}>🔄 Try Again</button>
            <button className="gqp-secondary-btn" onClick={changeTopic}>Change Topic</button>
            <button className="gqp-secondary-btn" onClick={() => setReviewMode(true)}>
              📚 Review
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="gqp-page">
        <main className="gqp-results-card">
          <h2>No questions found</h2>
          <button className="gqp-primary-btn" onClick={() => navigate('/go/quiz?mode=solo')}>
            Back
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="gqp-page">
      <nav className="gqp-nav">
        <button className="gqp-brand" onClick={() => navigate('/go')}>
          <span>Pulse</span>
          <b>GO</b>
        </button>

        <div className="gqp-nav-center">
          <span>🧠 Classic Quiz</span>
          <span>{currentIndex + 1} / {total}</span>
          <span style={{ color: timerColor }}>{timeLeft}s</span>
        </div>

        <button className="gqp-exit-btn" onClick={() => navigate('/go/quiz?mode=solo')}>
          ✕ Exit
        </button>
      </nav>

      <div className="gqp-timer-line">
        <div style={{ width: `${timerPercent}%`, background: timerColor }} />
      </div>

      <div className="gqp-progress-dots">
        {questions.map((_, index) => (
          <span
            key={index}
            className={`${index < currentIndex ? 'done' : ''} ${
              index === currentIndex ? 'active' : ''
            }`}
          />
        ))}
      </div>

      <main className="gqp-card">
        <span className="gqp-topic-badge">{currentQuestion.topic}</span>

        <h1>{currentQuestion.question}</h1>

        <div className="gqp-options">
          {currentQuestion.options.map((option, index) => {
            const meta = OPTION_META[index] || OPTION_META[0]
            const isCorrect = index === currentQuestion.correctIndex
            const isSelected = index === selectedIndex

            let state = ''

            if (answered) {
              if (isCorrect) state = 'correct'
              else if (isSelected) state = 'wrong'
              else state = 'dim'
            }

            return (
              <button
                key={index}
                className={`gqp-option ${state}`}
                style={{ '--option-color': meta.color }}
                onClick={() => handleAnswer(index)}
                disabled={answered}
              >
                <span className="gqp-shape">{meta.shape}</span>
                <span className="gqp-letter">{meta.letter}</span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`gqp-explanation ${selectedIndex === currentQuestion.correctIndex ? 'ok' : 'no'}`}>
            <strong>
              {selectedIndex === currentQuestion.correctIndex ? '✅ Correct' : '❌ Review this'}
            </strong>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        {answered && (
          <button className="gqp-next-btn" onClick={handleNext}>
            {currentIndex + 1 >= total ? 'See Results →' : 'Next →'}
          </button>
        )}
      </main>
    </div>
  )
} 