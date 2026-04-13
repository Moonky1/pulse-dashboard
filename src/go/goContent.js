import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizPlay.css'

const QUESTION_COUNT = 10
const TIME_PER_Q = 20

const TOPIC_TAGS = {
  all: null,
  script:     [1, 2, 13, 15],
  objections: [5, 9, 11, 12],
  product:    [3, 6, 7, 11, 14],
  callflow:   [2, 8, 10, 12],
  'dosdонts': [4, 7, 8, 13, 15],
}

const OPTION_STYLES = [
  { color: '#ef4444', shape: '▲' },
  { color: '#3b82f6', shape: '◆' },
  { color: '#f59e0b', shape: '●' },
  { color: '#22c55e', shape: '■' },
]

const LETTERS = ['A', 'B', 'C', 'D']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Web Audio sounds ──
function useSound() {
  const ctx = useRef(null)
  const getCtx = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }
  const beep = (freq, dur, type = 'sine', vol = 0.3) => {
    try {
      const ac = getCtx()
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.connect(g); g.connect(ac.destination)
      o.frequency.value = freq
      o.type = type
      g.gain.setValueAtTime(vol, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
      o.start(); o.stop(ac.currentTime + dur)
    } catch {}
  }
  return {
    correct: () => { beep(600, 0.1); setTimeout(() => beep(900, 0.15), 100) },
    wrong:   () => beep(180, 0.4, 'sawtooth', 0.2),
    tick:    () => beep(440, 0.05, 'square', 0.15),
    timeout: () => beep(220, 0.5, 'triangle', 0.2),
    start:   () => { beep(400, 0.08); setTimeout(() => beep(500, 0.08), 100); setTimeout(() => beep(700, 0.15), 200) },
  }
}

export default function GoQuizPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const topicId = params.get('topic') || 'all'
  const sound = useSound()

  const [questions] = useState(() => {
    const ids = TOPIC_TAGS[topicId]
    const pool = ids
      ? quizQuestions.filter(q => ids.includes(q.id))
      : quizQuestions
    const base = pool.length >= QUESTION_COUNT ? pool : quizQuestions
    return shuffle(base).slice(0, QUESTION_COUNT)
  })

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const timerRef = useRef(null)
  const started = useRef(false)

  const q = questions[idx]
  const score = results.filter(r => r.correct).length

  useEffect(() => {
    if (!started.current) { sound.start(); started.current = true }
  }, [])

  const doTimeout = useCallback(() => {
    if (answered) return
    sound.timeout()
    setAnswered(true)
    setShowExplanation(true)
    setResults(p => [...p, { correct: false, timedOut: true }])
  }, [answered])

  useEffect(() => {
    if (done || answered) { clearInterval(timerRef.current); return }
    setTimeLeft(TIME_PER_Q)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 6 && t > 1) sound.tick()
        if (t <= 1) { clearInterval(timerRef.current); doTimeout(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [idx, done, answered, doTimeout])

  const handleSelect = (i) => {
    if (answered) return
    clearInterval(timerRef.current)
    setSelected(i)
    setAnswered(true)
    setShowExplanation(true)
    const correct = i === q.correct
    if (correct) sound.correct(); else sound.wrong()
    setResults(p => [...p, { correct }])
  }

  const handleNext = () => {
    if (idx + 1 >= QUESTION_COUNT) { setDone(true); return }
    setIdx(i => i + 1)
    setSelected(null)
    setAnswered(false)
    setShowExplanation(false)
  }

  const timerPct = (timeLeft / TIME_PER_Q) * 100
  const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316'

  // ── RESULTS ──
  if (done) {
    const pct = Math.round((score / QUESTION_COUNT) * 100)
    const grade = pct >= 80 ? { label: '🎉 Excellent!', color: '#22c55e' }
                : pct >= 60 ? { label: '👍 Good Job',   color: '#f97316' }
                :             { label: '📚 Keep Studying', color: '#ef4444' }
    return (
      <div className="gqp-page">
        <nav className="gqp-nav">
          <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
            <span className="gqp-nav-text">Pulse</span>
            <span className="gqp-nav-badge">GO</span>
          </div>
        </nav>
        <div className="gqp-results">
          <div className="gqp-results-score" style={{ color: grade.color }}>{pct}%</div>
          <div className="gqp-results-grade" style={{ color: grade.color }}>{grade.label}</div>
          <div className="gqp-results-row">
            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#22c55e' }}>{score}</span>
              <span className="gqp-results-lbl">Correct</span>
            </div>
            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#ef4444' }}>{QUESTION_COUNT - score}</span>
              <span className="gqp-results-lbl">Missed</span>
            </div>
            <div className="gqp-results-stat">
              <span className="gqp-results-num" style={{ color: '#6b7280' }}>{QUESTION_COUNT}</span>
              <span className="gqp-results-lbl">Total</span>
            </div>
          </div>
          <div className="gqp-results-actions">
            <button className="gqp-btn-primary" onClick={() => window.location.reload()}>🔄 Try Again</button>
            <button className="gqp-btn-outline" onClick={() => navigate('/go/quiz')}>Change Topic</button>
            <button className="gqp-btn-outline" onClick={() => navigate('/go/learn')}>📚 Review</button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZ ──
  return (
    <div className="gqp-page">
      <nav className="gqp-nav">
        <div className="gqp-nav-brand" onClick={() => navigate('/go')} style={{ cursor: 'pointer' }}>
          <span className="gqp-nav-text">Pulse</span>
          <span className="gqp-nav-badge">GO</span>
        </div>
        <div className="gqp-nav-meta">
          <span className="gqp-nav-counter">{idx + 1} / {QUESTION_COUNT}</span>
          <span className="gqp-nav-timer" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>
        <button className="gqp-nav-exit" onClick={() => navigate('/go/quiz')}>✕ Exit</button>
      </nav>

      {/* Timer bar */}
      <div className="gqp-timer-bar">
        <div className="gqp-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      {/* Progress dots */}
      <div className="gqp-dots">
        {questions.map((_, i) => (
          <div key={i} className={`gqp-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`} />
        ))}
      </div>

      {/* Question */}
      <div className="gqp-question-wrap">
        <div className="gqp-question">{q.question}</div>
      </div>

      {/* Options — Kahoot 2x2 grid */}
      <div className="gqp-options">
        {q.options.map((opt, i) => {
          const st = OPTION_STYLES[i]
          let state = ''
          if (answered) {
            if (i === q.correct) state = 'correct'
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
              <span className="gqp-opt-shape">{st.shape}</span>
              <span className="gqp-opt-letter">{LETTERS[i]}</span>
              <span className="gqp-opt-text">{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="gqp-explanation">
          <span className="gqp-exp-icon">{selected === q.correct ? '✅' : '❌'}</span>
          <span>{q.explanation}</span>
        </div>
      )}

      {answered && (
        <div className="gqp-next-row">
          <button className="gqp-btn-primary" onClick={handleNext}>
            {idx + 1 >= QUESTION_COUNT ? 'See Results →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}