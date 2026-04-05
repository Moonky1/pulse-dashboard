import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { quizQuestions } from './goContent'
import './GoQuizRoom.css'

// ─────────────────────────────────────
const API        = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const POLL_MS    = 800   // ⚡ was 1500 — más rápido para todos
const Q_TIME     = 20
const RESULT_SEC = 5
const AVATARS    = ['🦊','🐺','🦁','🐯','🐻','🦅','🐬','🦋','🐲','🦄','🐸','🐧','🦩','🐙','🐼','🦒','🐨','🐔','🦉','🦓']
const OPTS       = [{c:'#ef4444',s:'▲'},{c:'#3b82f6',s:'◆'},{c:'#f59e0b',s:'●'},{c:'#22c55e',s:'■'}]
const LTRS       = ['A','B','C','D']

async function api(params) {
  try { const r = await fetch(API+'?'+new URLSearchParams(params)); return await r.json() }
  catch { return {success:false} }
}
function getQ(id) { return quizQuestions.find(q => q.id === id) || null }
function rankList(pl) {
  return Object.entries(pl||{}).map(([name,p])=>({name,...p})).sort((a,b)=>(b.score||0)-(a.score||0))
}
// Server-synced time remaining
function calcTL(startedAt) {
  if (!startedAt) return Q_TIME
  return Math.max(0, Q_TIME - (Date.now() - new Date(startedAt).getTime()) / 1000)
}

// ── Sound ──
function useSound() {
  const ctx = useRef(null)
  const ac = () => { if (!ctx.current) ctx.current = new (window.AudioContext||window.webkitAudioContext)(); return ctx.current }
  const b = (f,d,t='sine',v=0.2) => { try { const o=ac().createOscillator(),g=ac().createGain(); o.connect(g); g.connect(ac().destination); o.frequency.value=f; o.type=t; g.gain.setValueAtTime(v,ac().currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac().currentTime+d); o.start(); o.stop(ac().currentTime+d) } catch {} }
  return {
    correct: () => { b(600,0.1); setTimeout(()=>b(900,0.15),100) },
    wrong:   () => b(180,0.35,'sawtooth',0.15),
    tick:    () => b(500,0.04,'square',0.06),
    start:   () => { b(400,0.08); setTimeout(()=>b(600,0.1),150); setTimeout(()=>b(800,0.15),300) },
    join:    () => b(520,0.12),
    ding:    () => { b(800,0.08); setTimeout(()=>b(1000,0.12),80) },
  }
}

export default function GoQuizRoom() {
  const {code}    = useParams()
  const [urlP]    = useSearchParams()
  const nav       = useNavigate()
  const isHost    = urlP.get('host') === 'true'
  const snd       = useSound()

  // Join form
  const [jName,  setJName]  = useState('')
  const [jAv,    setJAv]    = useState('🦊')
  const [jErr,   setJErr]   = useState('')
  const [jBusy,  setJBusy]  = useState(false)

  // Session
  const [sess,    setSess]   = useState(null)
  const [joined,  setJoined] = useState(isHost)
  const [myName,  setMyName] = useState('')
  const [myAv,    setMyAv]   = useState('🦊')

  // Question UI
  const [picked,  setPicked]  = useState(null)
  const [tLeft,   setTLeft]   = useState(Q_TIME)
  const [rCount,  setRCount]  = useState(RESULT_SEC)
  const [busy,    setBusy]    = useState(false)

  // Refs
  const sessRef    = useRef(null)
  const prevQ      = useRef(-1)
  const prevState  = useRef('')
  const autoFired  = useRef(false)
  const tickRef    = useRef(null)
  const rCountRef  = useRef(null)
  sessRef.current  = sess

  // ── POLLING ──
  useEffect(() => {
    if (!joined) return
    let live = true
    const poll = async () => { const d = await api({action:'quizGet',code}); if (live && d.success) setSess(d) }
    poll()
    const t = setInterval(poll, POLL_MS)
    return () => { live=false; clearInterval(t) }
  }, [joined, code])

  // ── TIMER ──
  useEffect(() => {
    if (!sess || sess.state !== 'question') {
      clearInterval(tickRef.current)
      return
    }
    if (sess.currentQ !== prevQ.current) {
      prevQ.current     = sess.currentQ
      autoFired.current = false
      setPicked(null)
    }
    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      const tl = calcTL(sessRef.current?.questionStartedAt)
      setTLeft(tl)
      if (tl <= 5 && tl > 0.5) snd.tick()
      if (tl <= 0 && isHost && !autoFired.current) {
        autoFired.current = true
        clearInterval(tickRef.current)
        triggerShowAnswer()
      }
    }, 200)
    return () => clearInterval(tickRef.current)
  }, [sess?.state, sess?.currentQ, sess?.questionStartedAt])

  // ── AUTO: all answered → show answer immediately ──
  useEffect(() => {
    if (!sess || sess.state !== 'question' || !isHost || autoFired.current) return
    const pl = Object.values(sess.players||{})
    if (pl.length > 0 && pl.every(p => p.answered)) {
      autoFired.current = true
      clearInterval(tickRef.current)
      setTimeout(() => triggerShowAnswer(), 600)
    }
  }, [sess?.players])

  // ── SOUNDS on state change ──
  useEffect(() => {
    if (!sess || sess.state === prevState.current) return
    if (sess.state === 'question') { snd.start(); setRCount(RESULT_SEC) }
    if (sess.state === 'showAnswer') snd.ding()
    prevState.current = sess.state
  }, [sess?.state])

  // ── RESULT COUNTDOWN ──
  useEffect(() => {
    if (!sess || sess.state !== 'showAnswer') return
    clearInterval(rCountRef.current)
    setRCount(RESULT_SEC)
    rCountRef.current = setInterval(() => {
      setRCount(n => {
        if (n <= 1) {
          clearInterval(rCountRef.current)
          if (isHost) triggerNext()
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(rCountRef.current)
  }, [sess?.state, sess?.currentQ])

  useEffect(() => () => { clearInterval(tickRef.current); clearInterval(rCountRef.current) }, [])

  // ── HOST ACTIONS ──
  // ⚡ OPTIMIZADO: era 3 llamadas (quizScore + quizShowAnswer + quizGet)
  // Ahora es 1 sola llamada que hace todo y devuelve el estado actualizado
  const triggerShowAnswer = async () => {
    if (busy) return
    setBusy(true)
    const s = sessRef.current
    const q = getQ(s?.questionIds?.[s?.currentQ])
    const upd = await api({
      action: 'quizScoreAndShow',
      code,
      correctAnswer: q ? q.correct : -1
    })
    if (upd.success) setSess(upd)
    setBusy(false)
  }

  // ⚡ OPTIMIZADO: era quizNext + quizGet (2 llamadas)
  // Ahora quizNext devuelve el estado completo directamente
  const triggerNext = async () => {
    if (busy) return
    setBusy(true)
    autoFired.current = false
    const upd = await api({action:'quizNext', code})
    if (upd.success) setSess(upd)
    setBusy(false)
  }

  const hostStart = async () => {
    setBusy(true)
    await api({action:'quizStart', code})
    setBusy(false)
  }

  // ── PLAYER ANSWER ──
  const handleAnswer = async (idx) => {
    if (picked !== null || sess?.state !== 'question') return
    setPicked(idx)
    const tl = Math.round(calcTL(sess?.questionStartedAt))
    await api({action:'quizAnswer', code, name: myName, answer: idx, timeLeft: tl})
    if (idx === currentQ?.correct) snd.correct(); else snd.wrong()
  }

  // ── JOIN ──
  const handleJoin = async () => {
    if (!jName.trim()) return
    setJBusy(true); setJErr('')
    const d = await api({action:'quizJoin', code, name: jName.trim(), avatar: jAv})
    if (d.success) { snd.join(); setMyName(jName.trim()); setMyAv(jAv); setJoined(true) }
    else setJErr(d.error === 'started' ? 'Game already started.' : d.error === 'name taken' ? 'Name taken — try another.' : d.error === 'not found' ? 'Room not found.' : 'Error. Try again.')
    setJBusy(false)
  }

  // ── DERIVED ──
  const currentQ   = sess?.questionIds?.[sess.currentQ] ? getQ(sess.questionIds[sess.currentQ]) : null
  const players    = sess?.players || {}
  const list       = rankList(players)
  const totalP     = list.length
  const answeredN  = list.filter(p => p.answered).length
  const myData     = players[myName]
  const state      = sess?.state || 'lobby'
  const tDisp      = Math.ceil(tLeft)
  const tColor     = tDisp <= 5 ? '#ef4444' : tDisp <= 10 ? '#f59e0b' : '#f97316'
  const tPct       = Math.max(0, (tLeft / Q_TIME) * 100)
  const isCorrect  = !isHost && picked === currentQ?.correct

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  // JOIN
  if (!joined) return (
    <div className="grm grm-join">
      <div className="grm-join-box">
        <div className="grm-code-display">
          <small>ROOM CODE</small>
          <strong>{code}</strong>
        </div>
        <p className="grm-join-hint">Pick your avatar and enter your name</p>
        <div className="grm-av-grid">
          {AVATARS.map(av => (
            <button key={av} className={`grm-av ${jAv===av?'on':''}`} onPointerDown={() => setJAv(av)}>{av}</button>
          ))}
        </div>
        <input
          className="grm-input"
          type="text"
          placeholder="Your name"
          value={jName}
          onChange={e => setJName(e.target.value)}
          onKeyDown={e => e.key==='Enter' && handleJoin()}
          maxLength={20}
          autoFocus
        />
        {jErr && <p className="grm-err">{jErr}</p>}
        <button className="grm-btn-join" onPointerDown={handleJoin} disabled={!jName.trim()||jBusy}>
          {jBusy ? 'Joining...' : `${jAv} Join Room →`}
        </button>
      </div>
    </div>
  )

  // LOADING
  if (!sess) return (
    <div className="grm grm-center">
      <div className="grm-spin">⏳ Connecting to <b>{code}</b>...</div>
    </div>
  )

  // LOBBY
  if (state === 'lobby') return (
    <div className="grm grm-lobby">
      <div className="grm-lobby-bar">
        Join at <b>pulse-kk.com/go</b> &nbsp;·&nbsp; Code: <span className="grm-lobby-code">{code}</span>
      </div>
      <div className="grm-lobby-body">
        <h1 className="grm-lobby-title">
          {isHost ? '⏳ Waiting for players...' : `${myAv} You're in!`}
        </h1>
        <div className="grm-lobby-grid">
          {list.length === 0 && <p className="grm-muted">No players yet — share the code!</p>}
          {list.map(p => (
            <div key={p.name} className="grm-lobby-chip">
              <span>{p.avatar}</span><span>{p.name}</span>
            </div>
          ))}
        </div>
        <p className="grm-lobby-count">{totalP} player{totalP!==1?'s':''} ready</p>
        {isHost && (
          <button className="grm-btn-start" onPointerDown={hostStart} disabled={totalP===0||busy}>
            🚀 {busy?'Starting...':'Start Game'}
          </button>
        )}
        {!isHost && <p className="grm-muted" style={{marginTop:16}}>Waiting for host to start...</p>}
      </div>
    </div>
  )

  // QUESTION
  if (state === 'question') return (
    <div className="grm grm-q">
      <div className="grm-tbar">
        <div className="grm-tfill" style={{width:`${tPct}%`, background: tColor}} />
      </div>
      <div className="grm-qmeta">
        <span className="grm-qnum">{(sess.currentQ??0)+1}/{sess.questionIds?.length??10}</span>
        <span className="grm-qtimer" style={{color:tColor}}>{tDisp}s</span>
        <span className="grm-qans" style={{color: answeredN===totalP&&totalP>0 ? '#22c55e' : '#f97316'}}>
          {answeredN}/{totalP} ✓
        </span>
      </div>
      <div className="grm-qtext">{currentQ?.question||'...'}</div>

      {!isHost && (
        <div className="grm-opts">
          {currentQ?.options.map((opt,i) => (
            <button
              key={i}
              className={`grm-opt ${picked===i?'sel':''} ${picked!==null&&picked!==i?'dim':''}`}
              style={{'--c': OPTS[i].c}}
              onPointerDown={() => handleAnswer(i)}
              disabled={picked !== null}
            >
              <span className="grm-os">{OPTS[i].s}</span>
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
            {currentQ?.options.map((opt,i) => {
              const cnt = list.filter(p => p.answered && p.lastAnswer===i).length
              return (
                <div key={i} className="grm-bar-row">
                  <span className="grm-bar-lbl" style={{color:OPTS[i].c}}>{OPTS[i].s} {LTRS[i]}</span>
                  <div className="grm-bar-bg">
                    <div className="grm-bar-fill" style={{width:`${answeredN>0?(cnt/answeredN)*100:0}%`, background:OPTS[i].c}} />
                  </div>
                  <span className="grm-bar-n">{cnt}</span>
                </div>
              )
            })}
          </div>
          <p style={{fontSize:13,color:'#6b7280',marginTop:12,textAlign:'center'}}>
            {answeredN===totalP&&totalP>0 ? '✅ All answered!' : `${totalP-answeredN} still thinking...`}
          </p>
          <button className="grm-btn-skip" onPointerDown={() => { autoFired.current=true; clearInterval(tickRef.current); triggerShowAnswer() }} disabled={busy}>
            {busy ? 'Loading...' : 'Skip →'}
          </button>
        </div>
      )}
    </div>
  )

  // SHOW ANSWER
  if (state === 'showAnswer') return (
    <div className="grm grm-answer">
      {!isHost && (
        <div className={`grm-result-banner ${isCorrect?'ok':'no'}`}>
          {isCorrect
            ? `✅ Correct! +${1000+Math.round((Math.max(0,tLeft)/Q_TIME)*500)} pts`
            : picked===null ? '⏱️ Time\'s up!' : '❌ Wrong'}
        </div>
      )}
      {isHost && <h2 className="grm-answer-h">📊 Results</h2>}

      <div className="grm-ring-wrap">
        <svg viewBox="0 0 48 48" className="grm-ring-svg">
          <circle cx="24" cy="24" r="20" className="grm-ring-bg" />
          <circle cx="24" cy="24" r="20" className="grm-ring-fg"
            strokeDasharray={`${(rCount/RESULT_SEC)*125.7} 125.7`} />
        </svg>
        <span className="grm-ring-n">{rCount}</span>
      </div>
      <p className="grm-ring-label">Next in...</p>

      <div className="grm-answer-opts">
        {currentQ?.options.map((opt,i) => (
          <div key={i}
            className={`grm-aopt ${i===currentQ.correct?'right':''} ${!isHost&&picked===i&&i!==currentQ.correct?'wrong':''}`}
            style={{'--c':OPTS[i].c}}>
            <span className="grm-aopt-s">{OPTS[i].s}</span>
            <span className="grm-aopt-t">{opt}</span>
            {i===currentQ.correct && <span className="grm-aopt-check">✓</span>}
          </div>
        ))}
      </div>

      {currentQ?.explanation && <div className="grm-exp">💡 {currentQ.explanation}</div>}

      <div className="grm-mini-lb">
        <div className="grm-mini-lb-hd">🏆 Leaderboard</div>
        {list.slice(0,6).map((p,i) => (
          <div key={p.name} className={`grm-mini-row ${p.name===myName?'me':''}`}>
            <span className="grm-mini-r">{i+1}</span>
            <span className="grm-mini-a">{p.avatar}</span>
            <span className="grm-mini-n">{p.name}</span>
            <span className="grm-mini-s">{(p.score||0).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {isHost && (
        <button className="grm-btn-skip" onPointerDown={() => { clearInterval(rCountRef.current); triggerNext() }} disabled={busy}>
          {busy?'Loading...' : (sess.currentQ??0)+1>=(sess.questionIds?.length??10) ? '🏁 Finish now' : '▶ Next now'}
        </button>
      )}
    </div>
  )

  // FINISHED
  if (state === 'finished') {
    const top = list.slice(0,3)
    return (
      <div className="grm grm-finished">
        <h1 className="grm-finished-h">🏆 Final Results</h1>
        <p className="grm-muted">{code} · {totalP} players</p>

        <div className="grm-podium">
          {[top[1],top[0],top[2]].map((p,i) => p ? (
            <div key={p.name} className={`grm-pod ${['second','first','third'][i]}`}>
              <span style={{fontSize: i===1?48:32}}>{p.avatar}</span>
              <span className="grm-pod-name">{p.name}</span>
              <div className="grm-pod-block">{['🥈','🥇','🥉'][i]}</div>
              <span className="grm-pod-score">{(p.score||0).toLocaleString()}</span>
            </div>
          ) : <div key={i}/>)}
        </div>

        {list.length > 3 && (
          <div className="grm-full-lb">
            {list.slice(3).map((p,i) => (
              <div key={p.name} className={`grm-lb-row ${p.name===myName?'me':''}`}>
                <span className="grm-lb-r">{i+4}</span>
                <span className="grm-lb-a">{p.avatar}</span>
                <span className="grm-lb-n">{p.name}</span>
                <span className="grm-lb-s">{(p.score||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {!isHost && myData && (
          <p className="grm-my-result">
            Your score: <strong>{(myData.score||0).toLocaleString()} pts</strong>
            &nbsp;·&nbsp; Rank #{list.findIndex(p=>p.name===myName)+1} of {totalP}
          </p>
        )}

        <div className="grm-finished-btns">
          <button className="grm-btn-primary" onPointerDown={() => nav('/go/quiz')}>🔄 New Game</button>
          <button className="grm-btn-outline" onPointerDown={() => nav('/go')}>Home</button>
        </div>
      </div>
    )
  } 

  return <div className="grm grm-center"><p className="grm-muted">Syncing... ({state})</p></div>
}