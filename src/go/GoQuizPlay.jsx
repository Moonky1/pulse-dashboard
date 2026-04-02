import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './go.css'

export default function GoQuiz() {
  const nav = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [name, setName] = useState('')

  const handleJoin = () => {
    if (!joinCode.trim() || !name.trim()) return
    nav(`/go/quiz/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`)
  }

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
        <div className="go-section-header" style={{ textAlign: 'center' }}>
          <h1 className="go-section-title">🧠 Quiz</h1>
          <p className="go-section-sub">Test your knowledge on scripts, objections and product info</p>
        </div>

        {!showJoin ? (
          <div className="go-quiz-options">
            {/* Individual */}
            <div
              className="go-quiz-option-card"
              onClick={() => nav('/go/quiz/play')}
            >
              <div className="go-quiz-option-icon">👤</div>
              <div className="go-quiz-option-title">Solo</div>
              <p className="go-quiz-option-desc">
                10 random questions, 20 seconds each. Practice at your own pace.
              </p>
            </div>

            {/* Group */}
            <div
              className="go-quiz-option-card"
              onClick={() => setShowJoin(true)}
            >
              <div className="go-quiz-option-icon">👥</div>
              <div className="go-quiz-option-title">Group</div>
              <p className="go-quiz-option-desc">
                Join a live session with a code. Compete with your team in real time.
              </p>
            </div>
          </div>
        ) : (
          /* Join Group Room */
          <div
            style={{
              maxWidth: 400,
              margin: '0 auto',
              padding: '0 24px 80px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div className="go-step-card" style={{ textAlign: 'center' }}>
              <div className="go-step-label">Join a Group Session</div>
              <p style={{ fontSize: 14, color: 'var(--go-text-dim)', marginBottom: 20 }}>
                Enter your name and the room code from your team leader
              </p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--go-surface-2)',
                  border: '1px solid var(--go-border)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  color: 'var(--go-text)',
                  fontSize: 15,
                  marginBottom: 12,
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--go-orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--go-border)')}
              />
              <input
                type="text"
                placeholder="Room code (e.g. KK1234)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  background: 'var(--go-surface-2)',
                  border: '1px solid var(--go-border)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  color: 'var(--go-orange)',
                  fontSize: 18,
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textAlign: 'center',
                  marginBottom: 16,
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--go-orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--go-border)')}
              />
              <button
                className="go-btn go-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleJoin}
                disabled={!joinCode.trim() || !name.trim()}
              >
                Join Room →
              </button>
            </div>
            <button
              className="go-btn go-btn-outline"
              style={{ alignSelf: 'center' }}
              onClick={() => setShowJoin(false)}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}