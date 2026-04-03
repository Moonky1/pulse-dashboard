import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizRoom.css'

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const API        = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const POLL_MS    = 1500   // poll every 1.5s for snappier feel
const Q_TIME     = 20     // seconds per question
const RESULT_SEC = 5      // seconds to show results before auto-next
const AVATARS    = ['🦊','🐺','🦁','🐯','🐻','🦅','🐬','🦋','🐲','🦄','🐸','🐧','🦩','🐙','🐼','🦒','🐨','🐔','🦉','🦓']
const OPTS       = [{ color:'#ef4444',shape:'▲' },{ color:'#3b82f6',shape:'◆' },{ color:'#f59e0b',shape:'●' },{ color:'#22c55e',shape:'■' }]
const LETTERS    = ['A','B','C','D']

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
async function api(params) {
  try {
    const res = await fetch(API + '?' + new URLSearchParams(params))
    return await res.json()
  } catch { return { success: false } }
}

function getQ(id) { return quizQuestions.find(q => q.id === id) || null }

function sorted(players) {
  return Object.entries(players || {})
    .map(([name, p]) => ({ name, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

// Server-based time remaining
function calcTimeLeft(questionStartedAt) {
  if (!questionStartedAt) return Q_TIME
  const started = new Date(questionStartedAt).getTime()
  const elapsed = (Date.now() - started) / 1000
  return Math.max(0, Q_TIME - elapsed)
}

// ─────────────────────────────────────────────
//  SOUND
// ─────────────────────────────────────────────
function useSound() {
  const ctx = useRef(null)
  const ac  = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }
  const beep = (f, d, t = 'sine', v = 0.2) => {
    try {
      const o = ac().createOscillator(), g = ac().createGain()
      o.connect(g); g.connect(ac().destination)
      o.frequency.value = f; o.type = t
      g.gain.setValueAtTime(v, ac().currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac().currentTime + d)
      o.start(); o.stop(ac().currentTime + d)
    } catch {}
  }
  return {
    correct: () => { beep(600, 0.1); setTimeout(() => beep(900, 0.15), 100) },
    wrong:   () => beep(180, 0.4, 'sawtooth', 0.18),
    tick:    () => beep(440, 0.05, 'square', 0.08),
    start:   () => { beep(400, 0.08); setTimeout(() => beep(600, 0.1), 150); setTimeout(() => beep(800, 0.15), 300) },
    join:    () => beep(520, 0.12),
    ding:    () => { beep(800, 0.08); setTimeout(() => beep(1000, 0.12), 80) },
  }
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function GoQuizRoom() {
  const { code }     = useParams()
  const [urlParams]  = useSearchParams()
  const navigate     = useNavigate()
  const isHost       = urlParams.get('host') === 'true'
  const snd          = useSound()

  // ── JOIN FORM STATE ──
  const [joinName,   setJoinName]   = useState('')
  const [joinAvatar, setJoinAvatar] = useState('🦊')
  const [joinError,  setJoinError]  = useState('')
  const [joining,    setJoining]    = useState(false)

  // ── SESSION STATE (server is source of truth) ──
  const [session,  setSession]  = useState(null)
  const [joined,   setJoined]   = useState(isHost)   // host is auto-joined
  const [myName,   setMyName]   = useState('')
  const [myAvatar, setMyAvatar] = useState('🦊')

  // ── LOCAL QUESTION STATE ──
  const [selected,    setSelected]    = useState(null)   // player's answer index
  const [timeLeft,    setTimeLeft]    = useState(Q_TIME)
  const [resultTimer, setResultTimer] = useState(RESULT_SEC) // countdown after answer shown
  const [hostBusy,    setHostBusy]    = useState(false)

  // ── REFS ──
  const prevQRef       = useRef(-1)   // detect question change
  const prevStateRef   = useRef('')   // detect state change
  const autoActionRef  = useRef(false) // prevent double auto-trigger
  const resultCountRef = useRef(null)  // result countdown interval
  const tickRef        = useRef(null)  // local timer interval

  // ─────────────────────────────────────────────
  //  POLLING
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return
    let active = true

    const poll = async () => {
      const data = await api({ action: 'quizGet', code })
      if (active && data.success) setSession(data)
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
    return () => { active = false; clearInterval(interval) }
  }, [joined, code])

  // ─────────────────────────────────────────────
  //  CLIENT-SIDE TIMER (synced to server start time)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.state !== 'question') {
      clearInterval(tickRef.current)
      return
    }

    // Reset on new question
    const qIdx = session.currentQ
    if (qIdx !== prevQRef.current) {
      prevQRef.current    = qIdx
      autoActionRef.current = false
      setSelected(null)
    }

    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      const remaining = calcTimeLeft(session.questionStartedAt)
      setTimeLeft(remaining)

      if (remaining <= 5 && remaining > 0) snd.tick()

      // Time's up — auto-trigger show answer (HOST only)
      if (remaining <= 0 && isHost && !autoActionRef.current) {
        autoActionRef.current = true
        clearInterval(tickRef.current)
        doShowAnswer(session)
      }
    }, 250)

    return () => clearInterval(tickRef.current)
  }, [session?.state, session?.currentQ, session?.questionStartedAt])

  // ─────────────────────────────────────────────
  //  AUTO-TRIGGER: all players answered
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.state !== 'question' || !isHost || autoActionRef.current) return
    const players    = session.players || {}
    const playerList = Object.values(players)
    const total      = playerList.length
    const answered   = playerList.filter(p => p.answered).length

    if (total > 0 && answered >= total) {
      autoActionRef.current = true
      clearInterval(tickRef.current)
      // Small delay so last player sees their answer registered
      setTimeout(() => doShowAnswer(session), 800)
    }
  }, [session?.players, session?.state])

  // ─────────────────────────────────────────────
  //  SOUND on state change
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    if (session.state !== prevStateRef.current) {
      if (session.state === 'question') { snd.start(); setResultTimer(RESULT_SEC) }
      if (session.state === 'showAnswer') snd.ding()
      prevStateRef.current = session.state
    }
  }, [session?.state])

  // ─────────────────────────────────────────────
  //  AUTO-ADVANCE after showAnswer (HOST)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.state !== 'showAnswer' || !isHost) return

    clearInterval(resultCountRef.current)
    setResultTimer(RESULT_SEC)

    resultCountRef.current = setInterval(() => {
      setResultTimer(t => {
        if (t <= 1) {
          clearInterval(resultCountRef.current)
          doNext()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(resultCountRef.current)
  }, [session?.state, session?.currentQ])

  // cleanup
  useEffect(() => () => {
    clearInterval(tickRef.current)
    clearInterval(resultCountRef.current)
  }, [])

  // ─────────────────────────────────────────────
  //  HOST ACTIONS
  // ─────────────────────────────────────────────
  const doShowAnswer = async (sess) => {
    if (hostBusy) return
    setHostBusy(true)
    const q = getQ(sess?.questionIds?.[sess?.currentQ])
    if (q) await api({ action: 'quizScore', code, correctAnswer: q.correct })
    await api({ action: 'quizShowAnswer', code })
    const updated = await api({ action: 'quizGet', code })
    if (updated.success) setSession(updated)
    setHostBusy(false)
  }

  const doNext = async () => {
    if (hostBusy) return
    setHostBusy(true)
    autoActionRef.current = false
    await api({ action: 'quizNext', code })
    const updated = await api({ action: 'quizGet', code })
    if (updated.success) setSession(updated)
    setHostBusy(false)
  }

  const hostStart = async () => {
    setHostBusy(true)
    await api({ action: 'quizStart', code })
    setHostBusy(false)
  }

  // ─────────────────────────────────────────────
  //  PLAYER ANSWER
  // ─────────────────────────────────────────────
  const handleAnswer = async (idx) => {
    if (selected !== null || session?.state !== 'question') return
    setSelected(idx)
    clearInterval(tickRef.current)
    const tl = Math.round(calcTimeLeft(session?.questionStartedAt))
    await api({ action: 'quizAnswer', code, name: myName, answer: idx, timeLeft: tl })
    if (idx === currentQ?.correct) snd.correct(); else snd.wrong()
  }

  // ─────────────────────────────────────────────
  //  JOIN
  // ─────────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinName.trim()) return
    setJoining(true)
    setJoinError('')
    const data = await api({ action: 'quizJoin', code, name: joinName.trim(), avatar: joinAvatar })
    if (data.success) {
      snd.join()
      setMyName(joinName.trim())
      setMyAvatar(joinAvatar)
      setJoined(true)
    } else {
      setJoinError(
        data.error === 'started'    ? 'Game already started.' :
        data.error === 'name taken' ? 'Name taken — choose another.' :
        data.error === 'not found'  ? 'Room not found. Check the code.' :
        'Could not join. Try again.'
      )
    }
    setJoining(false)
  }

  // ─────────────────────────────────────────────
  //  DERIVED
  // ─────────────────────────────────────────────
  const currentQ   = session?.questionIds?.[session.currentQ] ? getQ(session.questionIds[session.currentQ]) : null
  const players    = session?.players || {}
  const playerList = sorted(players)
  const totalP     = playerList.length
  const answeredCnt = playerList.filter(p => p.answered).length
  const myData     = players[myName] || null
  const serverState = session?.state || 'lobby'
  const tLeft      = Math.ceil(timeLeft)
  const timerColor = tLeft <= 5 ? '#ef4444' : tLeft <= 10 ? '#f59e0b' : '#f97316'
  const timerPct   = Math.max(0, (timeLeft / Q_TIME) * 100)
  const isCorrect  = !isHost && selected === currentQ?.correct

  // ═════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════

  // ── JOIN SCREEN (players only) ──
  if (!joined) return (
    <div className="grm-page grm-join-page">
      <div className="grm-join-box">
        <div className="grm-join-code">
          <span className="grm-join-code-label">Room Code</span>
          <span className="grm-join-code-val">{code}</span>
        </div>
        <p className="grm-join-sub">Pick your avatar and enter your name</p>

        <div className="grm-avatar-grid">
          {AVATARS.map(av => (
            <button key={av} className={`grm-avatar-btn ${joinAvatar === av ? 'selected' : ''}`} onClick={() => setJoinAvatar(av)}>
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

        <button className="grm-btn-primary full" onClick={handleJoin} disabled={!joinName.trim() || joining}>
          {joining ? 'Joining...' : `${joinAvatar} Join Room →`}
        </button>
      </div>
    </div>
  )

  // ── LOADING ──
  if (!session) return (
    <div className="grm-page grm-center">
      <div className="grm-loader">⏳ Connecting to <strong>{code}</strong>...</div>
    </div>
  )

  // ── LOBBY ──
  if (serverState === 'lobby') return (
    <div className="grm-page grm-lobby-page">
      <div className="grm-lobby-codebar">
        <span>Join at <strong>pulse-kk.com/go</strong> — Code:</span>
        <span className="grm-lobby-code">{code}</span>
      </div>
      <div className="grm-lobby-body">
        <h1 className="grm-lobby-title">
          {isHost ? '⏳ Waiting for players...' : `${myAvatar} You're in! Waiting for host...`}
        </h1>
        <div className="grm-lobby-players">
          {playerList.length === 0 && <p className="grm-lobby-empty">No players yet — share the code!</p>}
          {playerList.map(p => (
            <div key={p.name} className="grm-lobby-player">
              <span>{p.avatar}</span><span>{p.name}</span>
            </div>
          ))}
        </div>
        <p className="grm-lobby-count">{totalP} player{totalP !== 1 ? 's' : ''} ready</p>
        {isHost && (
          <button className="grm-btn-start" onClick={hostStart} disabled={totalP === 0 || hostBusy}>
            🚀 {hostBusy ? 'Starting...' : 'Start Game'}
          </button>
        )}
      </div>
    </div>
  )

  // ── QUESTION ──
  if (serverState === 'question') return (
    <div className="grm-page grm-q-page">
      {/* Timer bar */}
      <div className="grm-timer-bar">
        <div className="grm-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      {/* Meta row */}
      <div className="grm-q-meta">
        <span className="grm-q-counter">{(session.currentQ ?? 0) + 1} / {session.questionIds?.length ?? 10}</span>
        <span className="grm-q-timer" style={{ color: timerColor }}>{tLeft}s</span>
        <span className="grm-q-anscount" style={{ color: answeredCnt === totalP ? '#22c55e' : '#f97316' }}>
          {answeredCnt}/{totalP} ✓
        </span>
      </div>

      {/* Question */}
      <div className="grm-question-box">{currentQ?.question || '...'}</div>

      {/* PLAYER: colored options */}
      {!isHost && (
        <div className="grm-options-grid">
          {currentQ?.options.map((opt, i) => (
            <button
              key={i}
              className={`grm-opt ${selected === i ? 'selected' : ''} ${selected !== null && i !== selected ? 'dim' : ''}`}
              style={{ '--c': OPTS[i].color }}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              <span className="grm-opt-shape">{OPTS[i].shape}</span>
              <span className="grm-opt-letter">{LETTERS[i]}</span>
              <span className="grm-opt-text">{opt}</span>
            </button>
          ))}
          {selected !== null && (
            <div className="grm-waiting">
              ⏳ Waiting for others... ({answeredCnt}/{totalP} answered)
            </div>
          )}
        </div>
      )}

      {/* HOST: answer bars (read-only, auto-advances) */}
      {isHost && (
        <div className="grm-host-view">
          <div className="grm-auto-note">⚡ Auto-advancing when all answer or time runs out</div>
          <div className="grm-bars">
            {currentQ?.options.map((opt, i) => {
              const cnt = playerList.filter(p => p.answered && p.lastAnswer === i).length
              const max = Math.max(1, answeredCnt)
              return (
                <div key={i} className="grm-bar-row">
                  <span className="grm-bar-label" style={{ color: OPTS[i].color }}>{OPTS[i].shape} {LETTERS[i]}</span>
                  <div className="grm-bar-bg">
                    <div className="grm-bar-fill" style={{ width: `${(cnt / max) * 100}%`, background: OPTS[i].color }} />
                  </div>
                  <span className="grm-bar-cnt">{cnt}</span>
                </div>
              )
            })}
          </div>
          <p className="grm-bar-opt-text" style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
            {answeredCnt === totalP && totalP > 0 ? '✅ All answered — showing results...' : `Waiting for ${totalP - answeredCnt} more...`}
          </p>
          {/* Manual override — skip wait */}
          <button
            className="grm-btn-skip"
            onClick={() => { autoActionRef.current = true; clearInterval(tickRef.current); doShowAnswer(session) }}
            disabled={hostBusy}
          >
            Skip wait →
          </button>
        </div>
      )}
    </div>
  )

  // ── SHOW ANSWER (auto-advances after RESULT_SEC) ──
  if (serverState === 'showAnswer') return (
    <div className="grm-page grm-answer-page">
      {/* Player result banner */}
      {!isHost && (
        <div className={`grm-result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect
            ? `✅ Correct! +${1000 + Math.round((Math.max(0, tLeft) / Q_TIME) * 500)} pts`
            : selected === null ? '⏱️ Time\'s up!' : '❌ Wrong'}
        </div>
      )}

      {isHost && <h2 className="grm-answer-title">📊 Results</h2>}

      {/* Auto-next countdown */}
      <div className="grm-auto-next">
        <div className="grm-auto-next-ring">
          <svg viewBox="0 0 44 44" className="grm-ring-svg">
            <circle cx="22" cy="22" r="18" className="grm-ring-bg" />
            <circle
              cx="22" cy="22" r="18"
              className="grm-ring-fill"
              strokeDasharray={`${(resultTimer / RESULT_SEC) * 113} 113`}
            />
          </svg>
          <span className="grm-ring-num">{resultTimer}</span>
        </div>
        <span className="grm-auto-next-label">Next question in...</span>
      </div>

      {/* Correct/wrong options */}
      <div className="grm-answer-opts">
        {currentQ?.options.map((opt, i) => (
          <div
            key={i}
            className={`grm-answer-opt ${i === currentQ.correct ? 'correct' : ''} ${!isHost && selected === i && i !== currentQ.correct ? 'wrong' : ''}`}
            style={{ '--c': OPTS[i].color }}
          >
            <span className="grm-ao-shape">{OPTS[i].shape}</span>
            <span className="grm-ao-text">{opt}</span>
            {i === currentQ.correct && <span className="grm-ao-check">✓</span>}
          </div>
        ))}
      </div>

      {/* Explanation */}
      {currentQ?.explanation && (
        <div className="grm-explanation">💡 {currentQ.explanation}</div>
      )}

      {/* Leaderboard */}
      <div className="grm-mini-lb">
        <div className="grm-mini-lb-title">🏆 Leaderboard</div>
        {playerList.slice(0, 6).map((p, i) => (
          <div key={p.name} className={`grm-mini-row ${p.name === myName ? 'me' : ''}`}>
            <span className="grm-mini-rank">{i + 1}</span>
            <span className="grm-mini-av">{p.avatar}</span>
            <span className="grm-mini-name">{p.name}</span>
            <span className="grm-mini-score">{(p.score || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Host manual override */}
      {isHost && (
        <button
          className="grm-btn-skip"
          onClick={() => { clearInterval(resultCountRef.current); doNext() }}
          disabled={hostBusy}
          style={{ marginTop: 8 }}
        >
          {hostBusy ? 'Loading...' :
            (session.currentQ ?? 0) + 1 >= (session.questionIds?.length ?? 10)
              ? '🏁 Final Results now' : '▶ Next now'}
        </button>
      )}
    </div>
  )

  // ── FINISHED ──
  if (serverState === 'finished') {
    const podium = playerList.slice(0, 3)
    return (
      <div className="grm-page grm-finished-page">
        <h1 className="grm-finished-title">🏆 Final Results</h1>
        <p className="grm-finished-sub">{code} · {totalP} players</p>

        <div className="grm-podium">
          {[podium[1], podium[0], podium[2]].map((p, i) => p ? (
            <div key={p.name} className={`grm-pod ${['second','first','third'][i]}`}>
              <span className="grm-pod-av" style={{ fontSize: i === 1 ? 48 : 32 }}>{p.avatar}</span>
              <span className="grm-pod-name">{p.name}</span>
              <div className="grm-pod-block">{['🥈','🥇','🥉'][i]}</div>
              <span className="grm-pod-score">{(p.score||0).toLocaleString()}</span>
            </div>
          ) : <div key={i} />)}
        </div>

        {playerList.length > 3 && (
          <div className="grm-full-lb">
            {playerList.slice(3).map((p, i) => (
              <div key={p.name} className={`grm-lb-row ${p.name === myName ? 'me' : ''}`}>
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
            {' '} · Rank #{playerList.findIndex(p => p.name === myName) + 1} of {totalP}
          </div>
        )}

        <div className="grm-finished-btns">
          <button className="grm-btn-primary" onClick={() => navigate('/go/quiz')}>🔄 New Game</button>
          <button className="grm-btn-outline" onClick={() => navigate('/go')}>Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="grm-page grm-center">
      <p style={{ color: '#6b7280' }}>Syncing... ({serverState})</p>
    </div>
  )
}