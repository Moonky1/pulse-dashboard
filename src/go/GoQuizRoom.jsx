import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizRoom.css'

const API = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const POLL_INTERVAL = 2000
const Q_TIME = 20

const AVATARS = ['🦊','🐺','🦁','🐯','🐻','🦅','🐬','🦋','🐲','🦄','🐸','🐧','🦩','🐙','🐼','🦒','🐨','🐔','🦉','🐺']
const OPTS = [
  { color: '#ef4444', shape: '▲' },
  { color: '#3b82f6', shape: '◆' },
  { color: '#f59e0b', shape: '●' },
  { color: '#22c55e', shape: '■' },
]
const LETTERS = ['A','B','C','D']

async function api(params) {
  try {
    const res = await fetch(API + '?' + new URLSearchParams(params))
    return await res.json()
  } catch { return { success: false } }
}

function getQ(id) { return quizQuestions.find(q => q.id === id) }

function sortedPlayers(players) {
  return Object.entries(players || {})
    .map(([name, p]) => ({ name, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

// ─── Sound ───
function useSound() {
  const ctx = useRef(null)
  const ac = () => { if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)(); return ctx.current }
  const beep = (f, d, t='sine', v=0.3) => { try { const o=ac().createOscillator(); const g=ac().createGain(); o.connect(g); g.connect(ac().destination); o.frequency.value=f; o.type=t; g.gain.setValueAtTime(v,ac().currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac().currentTime+d); o.start(); o.stop(ac().currentTime+d) } catch {} }
  return {
    correct: () => { beep(600,0.1); setTimeout(()=>beep(900,0.15),100) },
    wrong:   () => beep(180,0.4,'sawtooth',0.2),
    tick:    () => beep(440,0.05,'square',0.1),
    start:   () => { beep(400,0.08); setTimeout(()=>beep(500,0.08),100); setTimeout(()=>beep(700,0.15),200) },
    joined:  () => beep(500,0.1),
  }
}

export default function GoQuizRoom() {
  const { code } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const isHost = params.get('host') === 'true'
  const snd = useSound()

  // Join state (player only)
  const [joinName, setJoinName] = useState('')
  const [joinAvatar, setJoinAvatar] = useState('🦊')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  // Session
  const [session, setSession] = useState(null)
  const [phase, setPhase] = useState(isHost ? 'lobby' : 'join')
  const [myName, setMyName] = useState('')
  const [myAvatar, setMyAvatar] = useState('🦊')

  // Question
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(Q_TIME)
  const [hostAction, setHostAction] = useState('') // 'scoring' | 'next'

  const pollRef = useRef(null)
  const timerRef = useRef(null)
  const phaseRef = useRef(phase)
  const prevStateRef = useRef('')
  phaseRef.current = phase

  // ── Fetch session ──
  const fetchSession = useCallback(async () => {
    const data = await api({ action: 'quizGet', code })
    if (!data.success) return
    setSession(prev => {
      const prevState = prev?.state
      const newState = data.state

      if (prevState !== newState) {
        prevStateRef.current = prevState
        // Handle state transitions for player
        if (!isHost) {
          if (newState === 'question') {
            setPhase('question')
            setSelected(null)
            setTimeLeft(Q_TIME)
            startTimer(data)
          } else if (newState === 'showAnswer') {
            setPhase('showAnswer')
            clearInterval(timerRef.current)
          } else if (newState === 'finished') {
            setPhase('finished')
            clearInterval(timerRef.current)
          }
        } else {
          // Host
          if (newState === 'showAnswer') setPhase('showAnswer')
          else if (newState === 'finished') setPhase('finished')
        }
      }
      return data
    })
  }, [code, isHost])

  const startTimer = useCallback((sess) => {
    clearInterval(timerRef.current)
    // Calculate time left based on server questionStartedAt
    const startTime = sess?.questionStartedAt ? new Date(sess.questionStartedAt).getTime() : Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0, Q_TIME - elapsed)
      setTimeLeft(Math.round(remaining))
      if (remaining <= 5 && remaining > 0) snd.tick()
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        // Auto-submit no answer if player hasn't answered
        setSelected(prev => {
          if (prev === null) setPhase('answered')
          return prev
        })
      }
    }, 500)
  }, [])

  // Start/stop polling
  useEffect(() => {
    if (phase === 'join') return
    fetchSession()
    pollRef.current = setInterval(fetchSession, POLL_INTERVAL)
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current) }
  }, [phase === 'join', fetchSession])

  // ── JOIN ──
  const handleJoin = async () => {
    if (!joinName.trim()) return
    setJoining(true)
    setJoinError('')
    const data = await api({ action: 'quizJoin', code, name: joinName.trim(), avatar: joinAvatar })
    if (data.success) {
      setMyName(joinName.trim())
      setMyAvatar(joinAvatar)
      snd.joined()
      setPhase('lobby')
    } else {
      setJoinError(data.error || 'Could not join. Check the code.')
    }
    setJoining(false)
  }

  // ── HOST CONTROLS ──
  const hostStart = async () => {
    snd.start()
    await api({ action: 'quizStart', code })
    setPhase('question')
    setSelected(null)
    setTimeLeft(Q_TIME)
    const updated = await api({ action: 'quizGet', code })
    setSession(updated.success ? updated : session)
    startTimer(updated.success ? updated : {})
  }

  const hostShowAnswer = async () => {
    clearInterval(timerRef.current)
    const q = session && session.questionIds ? getQ(session.questionIds[session.currentQ]) : null
    if (!q) return
    setHostAction('scoring')
    await api({ action: 'quizScore', code, correctAnswer: q.correct })
    await api({ action: 'quizShowAnswer', code })
    setHostAction('')
    setPhase('showAnswer')
    const updated = await api({ action: 'quizGet', code })
    if (updated.success) setSession(updated)
  }

  const hostNext = async () => {
    setHostAction('next')
    const data = await api({ action: 'quizNext', code })
    if (data.state === 'finished') {
      setPhase('finished')
    } else {
      setPhase('question')
      setSelected(null)
      setTimeLeft(Q_TIME)
      const updated = await api({ action: 'quizGet', code })
      if (updated.success) {
        setSession(updated)
        startTimer(updated)
      }
    }
    setHostAction('')
  }

  // ── PLAYER ANSWER ──
  const handleAnswer = async (idx) => {
    if (selected !== null || phase !== 'question') return
    setSelected(idx)
    setPhase('answered')
    clearInterval(timerRef.current)
    if (myName) {
      await api({ action: 'quizAnswer', code, name: myName, answer: idx, timeLeft })
    }
  }

  // ── GET CURRENT QUESTION ──
  const currentQ = session?.questionIds?.[session.currentQ]
    ? getQ(session.questionIds[session.currentQ])
    : null

  const players = session?.players || {}
  const playerList = sortedPlayers(players)
  const myData = players[myName] || {}
  const answeredCount = Object.values(players).filter(p => p.answered).length
  const totalPlayers = playerList.length

  // ────────────────────────────────────────
  //  VIEWS
  // ────────────────────────────────────────

  // ── Join Screen (player) ──
  if (phase === 'join') return (
    <div className="grm-page grm-join-page">
      <div className="grm-join-box">
        <div className="grm-join-code">
          <span className="grm-join-code-label">Room Code</span>
          <span className="grm-join-code-val">{code}</span>
        </div>
        <p className="grm-join-sub">Pick your avatar and enter your name</p>

        <div className="grm-avatar-grid">
          {AVATARS.map(av => (
            <button
              key={av}
              className={`grm-avatar-btn ${joinAvatar === av ? 'selected' : ''}`}
              onClick={() => setJoinAvatar(av)}
            >
              {av}
            </button>
          ))}
        </div>

        <input
          className="grm-name-input"
          type="text"
          placeholder="Your name"
          value={joinName}
          onChange={e => setJoinName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          maxLength={20}
          autoFocus
        />
        {joinError && <p className="grm-error">{joinError}</p>}
        <button
          className="grm-btn-primary"
          onClick={handleJoin}
          disabled={!joinName.trim() || joining}
        >
          {joining ? 'Joining...' : `${joinAvatar} Join Room →`}
        </button>
      </div>
    </div>
  )

  // ── Lobby ──
  if (phase === 'lobby') return (
    <div className="grm-page grm-lobby-page">
      <div className="grm-lobby-code-bar">
        <span>Join at <strong>pulse-kk.com/go</strong> — Code:</span>
        <span className="grm-lobby-code">{code}</span>
      </div>

      <div className="grm-lobby-content">
        <h1 className="grm-lobby-title">
          {isHost ? '⏳ Waiting for players...' : `${myAvatar} You're in! Waiting for host...`}
        </h1>

        <div className="grm-lobby-players">
          {playerList.length === 0 && (
            <p className="grm-lobby-empty">No players yet — share the code!</p>
          )}
          {playerList.map(p => (
            <div key={p.name} className="grm-lobby-player">
              <span className="grm-lp-avatar">{p.avatar}</span>
              <span className="grm-lp-name">{p.name}</span>
            </div>
          ))}
        </div>

        <p className="grm-lobby-count">{totalPlayers} player{totalPlayers !== 1 ? 's' : ''} ready</p>

        {isHost && (
          <button
            className="grm-btn-start"
            onClick={hostStart}
            disabled={totalPlayers === 0}
          >
            🚀 Start Game
          </button>
        )}
      </div>
    </div>
  )

  // ── Question ──
  if (phase === 'question' || phase === 'answered') {
    const pct = (timeLeft / Q_TIME) * 100
    const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316'
    return (
      <div className="grm-page grm-question-page">
        {/* Timer bar */}
        <div className="grm-timer-bar">
          <div className="grm-timer-fill" style={{ width: `${pct}%`, background: timerColor }} />
        </div>

        {/* Meta */}
        <div className="grm-q-meta">
          <span className="grm-q-counter">
            {(session?.currentQ ?? 0) + 1} / {session?.questionIds?.length ?? 10}
          </span>
          <span className="grm-q-timer" style={{ color: timerColor }}>{timeLeft}s</span>
          {isHost && (
            <span className="grm-q-answers">
              {answeredCount}/{totalPlayers} answered
            </span>
          )}
        </div>

        {/* Question */}
        <div className="grm-question-box">
          {currentQ?.question || '...'}
        </div>

        {/* Options */}
        {!isHost ? (
          <div className="grm-options">
            {currentQ?.options.map((opt, i) => {
              let state = ''
              if (phase === 'answered') {
                state = selected === i ? 'selected' : 'dim'
              }
              return (
                <button
                  key={i}
                  className={`grm-option ${state}`}
                  style={{ '--opt-color': OPTS[i].color }}
                  onClick={() => handleAnswer(i)}
                  disabled={phase === 'answered'}
                >
                  <span className="grm-opt-shape">{OPTS[i].shape}</span>
                  <span className="grm-opt-letter">{LETTERS[i]}</span>
                  <span className="grm-opt-text">{opt}</span>
                </button>
              )
            })}
            {phase === 'answered' && (
              <div className="grm-waiting">⏳ Waiting for results...</div>
            )}
          </div>
        ) : (
          /* Host: show answer count bars */
          <div className="grm-host-q-view">
            <div className="grm-answer-bars">
              {currentQ?.options.map((opt, i) => {
                const count = Object.values(players).filter(p => p.answered && p.lastAnswer === i).length
                const maxCount = Math.max(1, Object.values(players).filter(p => p.answered).length)
                return (
                  <div key={i} className="grm-answer-bar-wrap">
                    <div className="grm-answer-bar-label" style={{ color: OPTS[i].color }}>
                      {OPTS[i].shape} {LETTERS[i]}
                    </div>
                    <div className="grm-answer-bar-bg">
                      <div
                        className="grm-answer-bar-fill"
                        style={{ width: `${(count / maxCount) * 100}%`, background: OPTS[i].color }}
                      />
                    </div>
                    <span className="grm-answer-bar-count">{count}</span>
                  </div>
                )
              })}
            </div>
            <button
              className="grm-btn-primary"
              onClick={hostShowAnswer}
              disabled={!!hostAction}
              style={{ marginTop: 24 }}
            >
              {hostAction === 'scoring' ? 'Scoring...' : '📊 Show Answer'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Show Answer ──
  if (phase === 'showAnswer') {
    const isCorrect = !isHost && selected === currentQ?.correct
    return (
      <div className="grm-page grm-answer-page">
        {!isHost && (
          <div className={`grm-result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? '✅ Correct!' : '❌ Wrong'}
            {isCorrect && <span className="grm-points">+{1000 + Math.round((timeLeft / Q_TIME) * 500)} pts</span>}
          </div>
        )}

        <div className="grm-show-answer-q">{currentQ?.question}</div>

        <div className="grm-answer-options">
          {currentQ?.options.map((opt, i) => (
            <div
              key={i}
              className={`grm-answer-opt ${i === currentQ.correct ? 'correct' : ''} ${!isHost && selected === i && i !== currentQ.correct ? 'wrong' : ''}`}
              style={{ '--opt-color': OPTS[i].color }}
            >
              <span>{OPTS[i].shape}</span>
              <span>{opt}</span>
              {i === currentQ.correct && <span className="grm-checkmark">✓</span>}
            </div>
          ))}
        </div>

        {currentQ?.explanation && (
          <div className="grm-explanation">💡 {currentQ.explanation}</div>
        )}

        {/* Mini leaderboard */}
        <div className="grm-mini-lb">
          {playerList.slice(0, 5).map((p, i) => (
            <div key={p.name} className="grm-mini-lb-row">
              <span className="grm-mini-lb-rank">{i + 1}</span>
              <span className="grm-mini-lb-av">{p.avatar}</span>
              <span className="grm-mini-lb-name">{p.name}</span>
              <span className="grm-mini-lb-score">{(p.score || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            className="grm-btn-primary"
            onClick={hostNext}
            disabled={!!hostAction}
            style={{ marginTop: 16 }}
          >
            {hostAction === 'next' ? 'Loading...' :
              (session?.currentQ ?? 0) + 1 >= (session?.questionIds?.length ?? 10)
                ? '🏁 See Final Results' : '▶ Next Question'}
          </button>
        )}
      </div>
    )
  }

  // ── Finished ──
  if (phase === 'finished') {
    const podium = playerList.slice(0, 3)
    return (
      <div className="grm-page grm-finished-page">
        <h1 className="grm-finished-title">🏆 Final Results</h1>
        <p className="grm-finished-sub">{code}</p>

        <div className="grm-podium">
          {podium[1] && (
            <div className="grm-podium-spot second">
              <span className="grm-pod-av">{podium[1].avatar}</span>
              <span className="grm-pod-name">{podium[1].name}</span>
              <div className="grm-pod-block">🥈</div>
              <span className="grm-pod-score">{(podium[1].score||0).toLocaleString()}</span>
            </div>
          )}
          {podium[0] && (
            <div className="grm-podium-spot first">
              <span className="grm-pod-av big">{podium[0].avatar}</span>
              <span className="grm-pod-name">{podium[0].name}</span>
              <div className="grm-pod-block">🥇</div>
              <span className="grm-pod-score">{(podium[0].score||0).toLocaleString()}</span>
            </div>
          )}
          {podium[2] && (
            <div className="grm-podium-spot third">
              <span className="grm-pod-av">{podium[2].avatar}</span>
              <span className="grm-pod-name">{podium[2].name}</span>
              <div className="grm-pod-block">🥉</div>
              <span className="grm-pod-score">{(podium[2].score||0).toLocaleString()}</span>
            </div>
          )}
        </div>

        {playerList.length > 3 && (
          <div className="grm-full-lb">
            {playerList.slice(3).map((p, i) => (
              <div key={p.name} className="grm-lb-row">
                <span className="grm-lb-rank">{i + 4}</span>
                <span className="grm-lb-av">{p.avatar}</span>
                <span className="grm-lb-name">{p.name}</span>
                <span className="grm-lb-score">{(p.score||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {!isHost && myData && (
          <div className="grm-my-result">
            Your score: <strong>{(myData.score||0).toLocaleString()} pts</strong>
            {' — '}Rank #{playerList.findIndex(p => p.name === myName) + 1}
          </div>
        )}

        <div className="grm-finished-actions">
          <button className="grm-btn-primary" onClick={() => nav('/go/quiz')}>
            🔄 New Game
          </button>
          <button className="grm-btn-outline" onClick={() => nav('/go')}>
            Home
          </button>
        </div>
      </div>
    )
  }

  return <div className="grm-page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
    <p style={{color:'#6b7280'}}>Loading... {code}</p>
  </div>
}