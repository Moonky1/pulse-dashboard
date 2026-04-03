import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizRoom.css'

const API = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const POLL_MS  = 2000
const Q_TIME   = 20
const AVATARS  = ['🦊','🐺','🦁','🐯','🐻','🦅','🐬','🦋','🐲','🦄','🐸','🐧','🦩','🐙','🐼','🦒','🐨','🐔','🦉','🦓']
const OPTS     = [{ color:'#ef4444',shape:'▲' },{ color:'#3b82f6',shape:'◆' },{ color:'#f59e0b',shape:'●' },{ color:'#22c55e',shape:'■' }]
const LETTERS  = ['A','B','C','D']

// ── utils ──
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

// ── sound ──
function useSound() {
  const ctx = useRef(null)
  const ac = () => { if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)(); return ctx.current }
  const beep = (f, d, t = 'sine', v = 0.25) => { try { const o = ac().createOscillator(), g = ac().createGain(); o.connect(g); g.connect(ac().destination); o.frequency.value = f; o.type = t; g.gain.setValueAtTime(v, ac().currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac().currentTime + d); o.start(); o.stop(ac().currentTime + d) } catch {} }
  return {
    correct: () => { beep(600, 0.1); setTimeout(() => beep(900, 0.15), 100) },
    wrong:   () => beep(180, 0.4, 'sawtooth', 0.2),
    tick:    () => beep(440, 0.05, 'square', 0.1),
    start:   () => { beep(400, 0.08); setTimeout(() => beep(600, 0.1), 150); setTimeout(() => beep(800, 0.15), 300) },
    join:    () => beep(520, 0.12),
  }
}

// ────────────────────────────────────────────
export default function GoQuizRoom() {
  const { code } = useParams()
  const [urlParams] = useSearchParams()
  const navigate = useNavigate()
  const isHost = urlParams.get('host') === 'true'
  const snd = useSound()

  // ── join form state ──
  const [joinName,   setJoinName]   = useState('')
  const [joinAvatar, setJoinAvatar] = useState('🦊')
  const [joinError,  setJoinError]  = useState('')
  const [joining,    setJoining]    = useState(false)

  // ── session state (server is source of truth) ──
  const [session,  setSession]  = useState(null)
  const [joined,   setJoined]   = useState(isHost)
  const [myName,   setMyName]   = useState('')
  const [myAvatar, setMyAvatar] = useState('🦊')

  // ── question-local state ──
  const [selected, setSelected] = useState(null)  // player's answer this question
  const [timeLeft, setTimeLeft] = useState(Q_TIME)
  const [hostBusy, setHostBusy] = useState(false)

  // ── refs ──
  const prevQRef    = useRef(-1)   // detect question change
  const timerRef    = useRef(null)
  const prevStateRef = useRef('')  // detect state change for sounds

  // ── POLLING: runs when joined ──
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

  // ── TIMER: resets when question changes ──
  useEffect(() => {
    if (!session || session.state !== 'question') return

    const q = session.currentQ
    if (q === prevQRef.current) return  // same question, don't reset
    prevQRef.current = q
    setSelected(null)
    setTimeLeft(Q_TIME)

    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 5 && t > 0) snd.tick()
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [session?.state, session?.currentQ])

  // ── SOUNDS on state change ──
  useEffect(() => {
    if (!session) return
    if (session.state !== prevStateRef.current) {
      if (session.state === 'question') snd.start()
      prevStateRef.current = session.state
    }
  }, [session?.state])

  // cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── JOIN ──
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
        data.error === 'started' ? 'This game has already started.' :
        data.error === 'name taken' ? 'That name is already taken. Choose another.' :
        data.error === 'not found' ? 'Room not found. Check the code.' :
        'Could not join. Try again.'
      )
    }
    setJoining(false)
  }

  // ── HOST CONTROLS ──
  const hostStart = async () => {
    setHostBusy(true)
    await api({ action: 'quizStart', code })
    setHostBusy(false)
  }

  const hostShowAnswer = async () => {
    setHostBusy(true)
    clearInterval(timerRef.current)
    const q = currentQ
    if (q) await api({ action: 'quizScore', code, correctAnswer: q.correct })
    await api({ action: 'quizShowAnswer', code })
    const updated = await api({ action: 'quizGet', code })
    if (updated.success) setSession(updated)
    setHostBusy(false)
  }

  const hostNext = async () => {
    setHostBusy(true)
    await api({ action: 'quizNext', code })
    const updated = await api({ action: 'quizGet', code })
    if (updated.success) setSession(updated)
    setHostBusy(false)
  }

  // ── PLAYER ANSWER ──
  const handleAnswer = async (idx) => {
    if (selected !== null) return
    setSelected(idx)
    clearInterval(timerRef.current)
    if (myName) {
      await api({ action: 'quizAnswer', code, name: myName, answer: idx, timeLeft })
    }
    if (idx === currentQ?.correct) snd.correct(); else snd.wrong()
  }

  // ── DERIVED DATA ──
  const currentQ    = session?.questionIds?.[session.currentQ] ? getQ(session.questionIds[session.currentQ]) : null
  const players     = session?.players || {}
  const playerList  = sorted(players)
  const totalP      = playerList.length
  const answeredCnt = playerList.filter(p => p.answered).length
  const myData      = players[myName] || null
  const timerPct    = (timeLeft / Q_TIME) * 100
  const timerColor  = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#f97316'
  const serverState = session?.state || 'lobby'

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  // ── JOIN SCREEN (player only) ──
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
      <div className="grm-loader">⏳ Connecting to room <strong>{code}</strong>...</div>
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
              <span>{p.avatar}</span>
              <span>{p.name}</span>
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
      <div className="grm-timer-bar">
        <div className="grm-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
      </div>

      <div className="grm-q-meta">
        <span className="grm-q-counter">{(session.currentQ ?? 0) + 1} / {session.questionIds?.length ?? 10}</span>
        <span className="grm-q-timer" style={{ color: timerColor }}>{timeLeft}s</span>
        {isHost && <span className="grm-q-anscount" style={{ color: '#f97316' }}>{answeredCnt}/{totalP} answered</span>}
      </div>

      <div className="grm-question-box">{currentQ?.question || '...'}</div>

      {/* PLAYER: colored option buttons */}
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
          {selected !== null && <div className="grm-waiting">⏳ Waiting for results...</div>}
        </div>
      )}

      {/* HOST: answer count bars + show answer button */}
      {isHost && (
        <div className="grm-host-view">
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
          <button className="grm-btn-primary" onClick={hostShowAnswer} disabled={hostBusy} style={{ marginTop: 20 }}>
            {hostBusy ? 'Scoring...' : '📊 Show Answer'}
          </button>
        </div>
      )}
    </div>
  )

  // ── SHOW ANSWER ──
  if (serverState === 'showAnswer') {
    const isCorrect = !isHost && selected === currentQ?.correct
    const myPoints = isCorrect ? 1000 + Math.round((timeLeft / Q_TIME) * 500) : 0
    return (
      <div className="grm-page grm-answer-page">
        {!isHost && (
          <div className={`grm-result-banner ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? `✅ Correct! +${myPoints} pts` : '❌ Wrong'}
          </div>
        )}

        {isHost && <h2 className="grm-answer-title">📊 Results</h2>}

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

        {currentQ?.explanation && (
          <div className="grm-explanation">💡 {currentQ.explanation}</div>
        )}

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

        {isHost && (
          <button className="grm-btn-primary" onClick={hostNext} disabled={hostBusy} style={{ marginTop: 16 }}>
            {hostBusy ? 'Loading...' :
              (session.currentQ ?? 0) + 1 >= (session.questionIds?.length ?? 10)
                ? '🏁 Final Results' : '▶ Next Question'}
          </button>
        )}
      </div>
    )
  }

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

  return <div className="grm-page grm-center"><p style={{ color: '#6b7280' }}>Syncing... ({serverState})</p></div>
}