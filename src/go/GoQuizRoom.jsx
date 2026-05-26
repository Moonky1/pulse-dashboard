import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizRoom.css'

const API = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const POLL_MS = 450
const TIMER_MS = 100
const Q_TIME = 30
const RESULT_SEC = 5
const AVATARS = ['🦊','🐺','🦁','🐯','🐻','🦅','🐬','🦋','🐲','🦄','🐸','🐧','🦩','🐙','🐼','🦒','🐨','🐔','🦉','🦓']
const OPTS = [{c:'#ef4444',s:'▲'},{c:'#3b82f6',s:'◆'},{c:'#f59e0b',s:'●'},{c:'#22c55e',s:'■'}]
const LTRS = ['A','B','C','D']

async function api(params) {
  try {
    const r = await fetch(API + '?' + new URLSearchParams(params))
    return await r.json()
  } catch {
    return { success: false }
  }
}

function getQ(id) {
  return quizQuestions.find((q) => q.id === id) || null
}

function rankList(pl) {
  return Object.entries(pl || {})
    .map(([name, p]) => ({ name, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

function getServerMs(payload) {
  const raw =
    payload?.serverNow ||
    payload?.serverTime ||
    payload?.now ||
    payload?.timestamp ||
    null

  if (!raw) return null

  const parsed = typeof raw === 'number' ? raw : new Date(raw).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function calcTL(startedAt, nowMs) {
  if (!startedAt) return Q_TIME

  const startMs = new Date(startedAt).getTime()

  if (!Number.isFinite(startMs)) return Q_TIME

  return Math.max(0, Q_TIME - (nowMs - startMs) / 1000)
}

function hashSeed(value) {
  let hash = 2166136261

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return hash >>> 0
}

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5

  return () => {
    t += 0x6D2B79F5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function deterministicShuffle(arr, seedText) {
  const a = [...arr]
  const random = seededRandom(hashSeed(seedText))

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

function buildDisplayQuestion(rawQuestion, roomCode, currentIndex) {
  if (!rawQuestion) return null

  const mappedOptions = rawQuestion.options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }))

  const shuffledOptions = deterministicShuffle(
    mappedOptions,
    `${roomCode}:${rawQuestion.id}:${currentIndex}`
  )

  const correct = shuffledOptions.findIndex(
    (opt) => opt.originalIndex === rawQuestion.correct
  )

  return {
    ...rawQuestion,
    options: shuffledOptions.map((opt) => opt.text),
    correct,
  }
}

function useSound() {
  const ctx = useRef(null)

  const ac = () => {
    if (!ctx.current) {
      ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    return ctx.current
  }

  const b = (f, d, t = 'sine', v = 0.16, delay = 0) => {
    try {
      const audio = ac()

      if (audio.state === 'suspended') audio.resume()

      const o = audio.createOscillator()
      const g = audio.createGain()
      const startAt = audio.currentTime + delay

      o.connect(g)
      g.connect(audio.destination)

      o.frequency.value = f
      o.type = t

      g.gain.setValueAtTime(0.0001, startAt)
      g.gain.exponentialRampToValueAtTime(v, startAt + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + d)

      o.start(startAt)
      o.stop(startAt + d + 0.03)
    } catch {
      // ignore
    }
  }

  return {
    correct: () => {
      b(600, 0.1)
      b(900, 0.15, 'sine', 0.18, 0.1)
    },
    wrong: () => b(180, 0.35, 'sawtooth', 0.12),
    tick: () => b(500, 0.04, 'square', 0.03),
    start: () => {
      b(400, 0.08)
      b(600, 0.1, 'sine', 0.16, 0.15)
      b(800, 0.15, 'sine', 0.18, 0.3)
    },
    join: () => {
      b(520, 0.09)
      b(780, 0.12, 'sine', 0.13, 0.09)
    },
    kick: () => b(170, 0.25, 'sawtooth', 0.08),
    ding: () => {
      b(800, 0.08)
      b(1000, 0.12, 'sine', 0.14, 0.08)
    },
    finish: () => {
      b(420, 0.11)
      b(560, 0.11, 'sine', 0.13, 0.13)
      b(700, 0.18, 'sine', 0.15, 0.26)
    },
    epic: () => {
      b(392, 0.12, 'sine', 0.16, 0)
      b(523, 0.12, 'sine', 0.18, 0.13)
      b(659, 0.14, 'sine', 0.2, 0.27)
      b(784, 0.28, 'sine', 0.22, 0.43)
      b(1046, 0.35, 'triangle', 0.1, 0.55)
    },
  }
}

export default function GoQuizRoom() {
  const { code } = useParams()
  const [urlP] = useSearchParams()
  const nav = useNavigate()
  const isHost = urlP.get('host') === 'true'
  const snd = useSound()

  const [jName, setJName] = useState('')
  const [jAv, setJAv] = useState('🦊')
  const [jErr, setJErr] = useState('')
  const [jBusy, setJBusy] = useState(false)

  const [sess, setSess] = useState(null)
  const [joined, setJoined] = useState(isHost)
  const [myName, setMyName] = useState('')
  const [myAv, setMyAv] = useState('🦊')

  const [picked, setPicked] = useState(null)
  const [tLeft, setTLeft] = useState(Q_TIME)
  const [rCount, setRCount] = useState(RESULT_SEC)
  const [busy, setBusy] = useState(false)
  const [kickBusy, setKickBusy] = useState('')

  const sessRef = useRef(null)
  const prevQ = useRef(-1)
  const prevState = useRef('')
  const autoFired = useRef(false)
  const tickRef = useRef(null)
  const rCountRef = useRef(null)
  const lastTickSecond = useRef(null)
  const clockOffsetRef = useRef(0)
  const prevPlayerCount = useRef(0)
  const finishedSoundPlayed = useRef(false)

  sessRef.current = sess

  const getSyncedNow = () => Date.now() - clockOffsetRef.current

  const updateClockOffset = (payload) => {
    const serverMs = getServerMs(payload)

    if (serverMs) {
      clockOffsetRef.current = Date.now() - serverMs
    }
  }

  useEffect(() => {
    if (!joined) return

    let live = true

    const poll = async () => {
      const d = await api({ action: 'quizGet', code })

      if (!live || !d.success) return

      updateClockOffset(d)
      setSess(d)
    }

    poll()

    const t = setInterval(poll, POLL_MS)

    return () => {
      live = false
      clearInterval(t)
    }
  }, [joined, code])

  useEffect(() => {
    if (!sess) return

    const count = Object.keys(sess.players || {}).length

    if (isHost && sess.state === 'lobby' && count > prevPlayerCount.current) {
      snd.join()
    }

    prevPlayerCount.current = count
  }, [sess?.players, sess?.state, isHost, snd])

  useEffect(() => {
    if (!sess || isHost || !joined || !myName) return

    const players = sess.players || {}
    const kickedPlayers = sess.kickedPlayers || {}

    if (kickedPlayers[myName] || (!players[myName] && sess.state !== 'finished')) {
      snd.kick()
      alert('You were removed from this room by the host.')
      nav('/go')
    }
  }, [sess, isHost, joined, myName, nav, snd])

  useEffect(() => {
    if (!sess || sess.state !== 'question') {
      clearInterval(tickRef.current)
      return
    }

    if (sess.currentQ !== prevQ.current) {
      prevQ.current = sess.currentQ
      autoFired.current = false
      lastTickSecond.current = null
      setPicked(null)
    }

    clearInterval(tickRef.current)

    tickRef.current = setInterval(() => {
      const tl = calcTL(sessRef.current?.questionStartedAt, getSyncedNow())
      const display = Math.ceil(tl)

      setTLeft(tl)

      if (
        display <= 5 &&
        display > 0 &&
        display !== lastTickSecond.current
      ) {
        lastTickSecond.current = display
        snd.tick()
      }

      if (tl <= 0 && isHost && !autoFired.current) {
        autoFired.current = true
        clearInterval(tickRef.current)
        triggerShowAnswer()
      }
    }, TIMER_MS)

    return () => clearInterval(tickRef.current)
  }, [sess?.state, sess?.currentQ, sess?.questionStartedAt, isHost, snd])

  useEffect(() => {
    if (!sess || sess.state !== 'question' || !isHost || autoFired.current) return

    const pl = Object.values(sess.players || {})

    if (pl.length > 0 && pl.every((p) => p.answered)) {
      autoFired.current = true
      clearInterval(tickRef.current)
      setTimeout(() => triggerShowAnswer(), 350)
    }
  }, [sess?.players, sess?.state, isHost])

  useEffect(() => {
    if (!sess || sess.state === prevState.current) return

    if (sess.state === 'question') {
      snd.start()
      setRCount(RESULT_SEC)
    }

    if (sess.state === 'showAnswer') snd.ding()

    if (sess.state === 'finished' && !finishedSoundPlayed.current) {
      finishedSoundPlayed.current = true

      const list = rankList(sess.players || {})
      const rank = list.findIndex((p) => p.name === myName) + 1
      const isTop = isHost || rank === 1 || rank === 2 || rank === 3

      if (isTop) snd.epic()
      else snd.finish()
    }

    prevState.current = sess.state
  }, [sess?.state, sess?.players, isHost, myName, snd])

  useEffect(() => {
    if (!sess || sess.state !== 'showAnswer') return

    clearInterval(rCountRef.current)
    setRCount(RESULT_SEC)

    rCountRef.current = setInterval(() => {
      setRCount((n) => {
        if (n <= 1) {
          clearInterval(rCountRef.current)

          if (isHost) triggerNext()

          return 0
        }

        return n - 1
      })
    }, 1000)

    return () => clearInterval(rCountRef.current)
  }, [sess?.state, sess?.currentQ, isHost])

  useEffect(() => () => {
    clearInterval(tickRef.current)
    clearInterval(rCountRef.current)
  }, [])

  const triggerShowAnswer = async () => {
    if (busy) return

    setBusy(true)

    const s = sessRef.current
    const rawQuestion = getQ(s?.questionIds?.[s?.currentQ])
    const displayQuestion = buildDisplayQuestion(rawQuestion, code, s?.currentQ ?? 0)

    const upd = await api({
      action: 'quizScoreAndShow',
      code,
      correctAnswer: displayQuestion ? displayQuestion.correct : -1,
    })

    updateClockOffset(upd)

    if (upd.success) setSess(upd)

    setBusy(false)
  }

  const triggerNext = async () => {
    if (busy) return

    setBusy(true)
    autoFired.current = false

    const upd = await api({ action: 'quizNext', code })

    updateClockOffset(upd)

    if (upd.success) setSess(upd)

    setBusy(false)
  }

  const hostStart = async () => {
    setBusy(true)

    const upd = await api({ action: 'quizStart', code })

    updateClockOffset(upd)

    if (upd.success) setSess(upd)

    setBusy(false)
  }

  const handleKickPlayer = async (playerName) => {
    if (!isHost || !playerName || kickBusy) return

    const ok = window.confirm(`Remove ${playerName} from this room?`)
    if (!ok) return

    setKickBusy(playerName)

    let upd = await api({
      action: 'quizKick',
      code,
      name: playerName,
    })

    if (!upd.success) {
      upd = await api({
        action: 'quizRemovePlayer',
        code,
        name: playerName,
      })
    }

    updateClockOffset(upd)

    if (upd.success) {
      snd.kick()
      setSess(upd)
    } else {
      alert('Kick failed. Add the quizKick action in Apps Script to enable this fully.')
    }

    setKickBusy('')
  }

  const handleAnswer = async (idx) => {
    if (picked !== null || sess?.state !== 'question') return

    setPicked(idx)

    const tl = Math.round(calcTL(sess?.questionStartedAt, getSyncedNow()))

    await api({
      action: 'quizAnswer',
      code,
      name: myName,
      answer: idx,
      timeLeft: tl,
    })

    if (idx === currentQ?.correct) snd.correct()
    else snd.wrong()
  }

  const handleJoin = async () => {
    if (!jName.trim()) return

    setJBusy(true)
    setJErr('')

    const d = await api({
      action: 'quizJoin',
      code,
      name: jName.trim(),
      avatar: jAv,
    })

    updateClockOffset(d)

    if (d.success) {
      snd.join()
      setMyName(jName.trim())
      setMyAv(jAv)
      setJoined(true)
    } else {
      setJErr(
        d.error === 'started'
          ? 'Game already started.'
          : d.error === 'name taken'
          ? 'Name taken — try another.'
          : d.error === 'not found'
          ? 'Room not found.'
          : 'Error. Try again.'
      )
    }

    setJBusy(false)
  }

  const rawCurrentQ = sess?.questionIds?.[sess.currentQ]
    ? getQ(sess.questionIds[sess.currentQ])
    : null

  const currentQ = buildDisplayQuestion(rawCurrentQ, code, sess?.currentQ ?? 0)
  const players = sess?.players || {}
  const list = rankList(players)
  const totalP = list.length
  const answeredN = list.filter((p) => p.answered).length
  const myData = players[myName]
  const state = sess?.state || 'lobby'
  const tDisp = Math.ceil(tLeft)
  const tColor = tDisp <= 5 ? '#ef4444' : tDisp <= 10 ? '#f59e0b' : '#b9d6ff'
  const tPct = Math.max(0, Math.min(100, (tLeft / Q_TIME) * 100))
  const isCorrect = !isHost && picked === currentQ?.correct

  if (!joined) {
    return (
      <div className="grm grm-join">
        <div className="grm-join-box">
          <div className="grm-code-display">
            <small>Room Code</small>
            <strong>{code}</strong>
          </div>

          <p className="grm-join-hint">Pick your avatar and enter your name</p>

          <div className="grm-av-grid">
            {AVATARS.map((av) => (
              <button
                key={av}
                className={`grm-av ${jAv === av ? 'on' : ''}`}
                onPointerDown={() => setJAv(av)}
              >
                {av}
              </button>
            ))}
          </div>

          <input
            className="grm-input"
            type="text"
            placeholder="Your name"
            value={jName}
            onChange={(e) => setJName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={20}
            autoFocus
          />

          {jErr && <p className="grm-err">{jErr}</p>}

          <button
            className="grm-btn-join"
            onPointerDown={handleJoin}
            disabled={!jName.trim() || jBusy}
          >
            {jBusy ? 'Joining...' : `${jAv} Join Room →`}
          </button>
        </div>
      </div>
    )
  }

  if (!sess) {
    return (
      <div className="grm grm-center">
        <div className="grm-spin">⏳ Connecting to <b>{code}</b>...</div>
      </div>
    )
  }

  if (state === 'lobby') {
    return (
      <div className="grm grm-lobby">
        <div className="grm-lobby-bar">
          Join at <b>pulse-kk.com/go</b> &nbsp;·&nbsp; Code:{' '}
          <span className="grm-lobby-code">{code}</span>
        </div>

        <div className="grm-lobby-body">
          <h1 className="grm-lobby-title">
            {isHost ? '⏳ Waiting for players...' : `${myAv} You're in!`}
          </h1>

          <div className="grm-lobby-grid">
            {list.length === 0 && (
              <p className="grm-muted">No players yet — share the code!</p>
            )}

            {list.map((p) => (
              <div key={p.name} className="grm-lobby-chip">
                <span>{p.avatar}</span>
                <span>{p.name}</span>

                {isHost && (
                  <button
                    className="grm-kick-btn"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      handleKickPlayer(p.name)
                    }}
                    disabled={kickBusy === p.name}
                    title={`Remove ${p.name}`}
                  >
                    {kickBusy === p.name ? '...' : '×'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="grm-lobby-count">
            {totalP} player{totalP !== 1 ? 's' : ''} ready
          </p>

          {isHost && (
            <button
              className="grm-btn-start"
              onPointerDown={hostStart}
              disabled={totalP === 0 || busy}
            >
              🚀 {busy ? 'Starting...' : 'Start Game'}
            </button>
          )}

          {!isHost && (
            <p className="grm-muted" style={{ marginTop: 16 }}>
              Waiting for host to start...
            </p>
          )}
        </div>
      </div>
    )
  }

  if (state === 'question') {
    return (
      <div className="grm grm-q">
        <div className="grm-tbar">
          <div className="grm-tfill" style={{ width: `${tPct}%`, background: tColor }} />
        </div>

        <div className="grm-qmeta">
          <span className="grm-qnum">{(sess.currentQ ?? 0) + 1}/{sess.questionIds?.length ?? 10}</span>
          <span className="grm-qtimer" style={{ color: tColor }}>{tDisp}s</span>
          <span
            className="grm-qans"
            style={{ color: answeredN === totalP && totalP > 0 ? '#22c55e' : '#b9d6ff' }}
          >
            {answeredN}/{totalP} ✓
          </span>
        </div>

        <div className="grm-qtext">{currentQ?.question || '...'}</div>

        {!isHost && (
          <div className="grm-opts">
            {currentQ?.options.map((opt, i) => (
              <button
                key={i}
                className={`grm-opt ${picked === i ? 'sel' : ''} ${picked !== null && picked !== i ? 'dim' : ''}`}
                style={{ '--c': OPTS[i]?.c || '#b9d6ff' }}
                onPointerDown={() => handleAnswer(i)}
                disabled={picked !== null}
              >
                <span className="grm-os">{OPTS[i]?.s || '◆'}</span>
                <span className="grm-ol">{LTRS[i]}</span>
                <span className="grm-ot">{opt}</span>
              </button>
            ))}

            {picked !== null && (
              <div className="grm-waiting">
                ⏳ Answered! Waiting for others... ({answeredN}/{totalP})
              </div>
            )}
          </div>
        )}

        {isHost && (
          <div className="grm-host-q">
            <div className="grm-auto-badge">⚡ Auto-advances when all answer or time runs out</div>

            <div className="grm-bars">
              {currentQ?.options.map((opt, i) => {
                const cnt = list.filter((p) => p.answered && p.lastAnswer === i).length

                return (
                  <div key={i} className="grm-bar-row">
                    <span className="grm-bar-lbl" style={{ color: OPTS[i]?.c || '#b9d6ff' }}>
                      {OPTS[i]?.s || '◆'} {LTRS[i]}
                    </span>

                    <div className="grm-bar-bg">
                      <div
                        className="grm-bar-fill"
                        style={{
                          width: `${answeredN > 0 ? (cnt / answeredN) * 100 : 0}%`,
                          background: OPTS[i]?.c || '#b9d6ff',
                        }}
                      />
                    </div>

                    <span className="grm-bar-n">{cnt}</span>
                  </div>
                )
              })}
            </div>

            <p className="grm-host-status">
              {answeredN === totalP && totalP > 0
                ? '✅ All answered!'
                : `${totalP - answeredN} still thinking...`}
            </p>

            <button
              className="grm-btn-skip"
              onPointerDown={() => {
                autoFired.current = true
                clearInterval(tickRef.current)
                triggerShowAnswer()
              }}
              disabled={busy}
            >
              {busy ? 'Loading...' : 'Skip →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (state === 'showAnswer') {
    return (
      <div className="grm grm-answer">
        {!isHost && (
          <div className={`grm-result-banner ${isCorrect ? 'ok' : 'no'}`}>
            {isCorrect
              ? '✅ Correct!'
              : picked === null ? "⏱️ Time's up!" : '❌ Wrong'}
          </div>
        )}

        {isHost && <h2 className="grm-answer-h">📊 Results</h2>}

        <div className="grm-ring-wrap">
          <svg viewBox="0 0 48 48" className="grm-ring-svg">
            <circle cx="24" cy="24" r="20" className="grm-ring-bg" />
            <circle
              cx="24"
              cy="24"
              r="20"
              className="grm-ring-fg"
              strokeDasharray={`${(rCount / RESULT_SEC) * 125.7} 125.7`}
            />
          </svg>

          <span className="grm-ring-n">{rCount}</span>
        </div>

        <p className="grm-ring-label">Next in...</p>

        <div className="grm-answer-opts">
          {currentQ?.options.map((opt, i) => (
            <div
              key={i}
              className={`grm-aopt ${i === currentQ.correct ? 'correct' : ''} ${!isHost && picked === i && i !== currentQ.correct ? 'wrong' : ''}`}
              style={{ '--c': OPTS[i]?.c || '#b9d6ff' }}
            >
              <span className="grm-aopt-s">{OPTS[i]?.s || '◆'}</span>
              <span className="grm-ol">{LTRS[i]}</span>
              <span className="grm-aopt-t">{opt}</span>
              {i === currentQ.correct && <span className="grm-aopt-check">✓</span>}
            </div>
          ))}
        </div>

        {currentQ?.explanation && <div className="grm-exp">💡 {currentQ.explanation}</div>}

        <div className="grm-mini-lb">
          <div className="grm-mini-lb-hd">🏆 Leaderboard</div>

          {list.slice(0, 6).map((p, i) => (
            <div key={p.name} className={`grm-mini-row ${p.name === myName ? 'me' : ''}`}>
              <span className="grm-mini-r">{i + 1}</span>
              <span className="grm-mini-a">{p.avatar}</span>
              <span className="grm-mini-n">{p.name}</span>
              <span className="grm-mini-s">{(p.score || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            className="grm-btn-skip"
            onPointerDown={() => {
              clearInterval(rCountRef.current)
              triggerNext()
            }}
            disabled={busy}
          >
            {busy
              ? 'Loading...'
              : (sess.currentQ ?? 0) + 1 >= (sess.questionIds?.length ?? 10)
              ? '🏁 Finish now'
              : '▶ Next now'}
          </button>
        )}
      </div>
    )
  }

  if (state === 'finished') {
    const top = list.slice(0, 3)

    return (
      <div className="grm grm-finished">
        <h1 className="grm-finished-h">🏆 Final Results</h1>
        <p className="grm-muted">{code} · {totalP} players</p>

        <div className="grm-podium">
          {[top[1], top[0], top[2]].map((p, i) => p ? (
            <div key={p.name} className={`grm-pod ${['second','first','third'][i]}`}>
              <span style={{ fontSize: i === 1 ? 48 : 32 }}>{p.avatar}</span>
              <span className="grm-pod-name">{p.name}</span>
              <div className="grm-pod-block">{['🥈','🥇','🥉'][i]}</div>
              <span className="grm-pod-score">{(p.score || 0).toLocaleString()}</span>
            </div>
          ) : <div key={i} />)}
        </div>

        {list.length > 3 && (
          <div className="grm-full-lb">
            {list.slice(3).map((p, i) => (
              <div key={p.name} className={`grm-lb-row ${p.name === myName ? 'me' : ''}`}>
                <span className="grm-lb-r">{i + 4}</span>
                <span className="grm-lb-a">{p.avatar}</span>
                <span className="grm-lb-n">{p.name}</span>
                <span className="grm-lb-s">{(p.score || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {!isHost && myData && (
          <p className="grm-my-result">
            Your score: <strong>{(myData.score || 0).toLocaleString()} pts</strong>
            &nbsp;·&nbsp; Rank #{list.findIndex((p) => p.name === myName) + 1} of {totalP}
          </p>
        )}

        <div className="grm-finished-btns">
          <button className="grm-btn-primary" onPointerDown={() => nav('/go/quiz?mode=host')}>
            🔄 New Game
          </button>

          <button className="grm-btn-outline" onPointerDown={() => nav('/go')}>
            Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grm grm-center">
      <p className="grm-muted">Syncing... ({state})</p>
    </div>
  )
}