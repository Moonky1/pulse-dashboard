import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AcademyHeader } from '../go/AcademyHeader.jsx'
import { useGoIdentity } from '../go-product/useGoIdentity.js'
import { simulationRequest, simulationScreenUrl } from './simulationApi.js'
import { SimulationStage } from './SimulationStage.jsx'
import { ViciDialer } from './ViciDialer.jsx'
import './simulations.css'

export function SimulationPlayer() {
  const { contentId } = useParams(), { kind } = useGoIdentity(), [search, setSearch] = useSearchParams()
  const attemptId = search.get('attempt')
  const [savedSnapshot, setSnapshot] = useState(null), [error, setError] = useState(null), [feedback, setFeedback] = useState(null)
  const snapshot = savedSnapshot?.content_id === contentId && (!attemptId || savedSnapshot.attempt_id === attemptId) ? savedSnapshot : null
  const [busy, setBusy] = useState(false), [screen, setScreen] = useState({ url: null, error: null }), [reload, setReload] = useState(0)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const lock = useRef(false), heading = useRef(null)
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setError(null)
      const result = await simulationRequest(kind, attemptId ? 'Attempt' : 'Start', attemptId ? { attemptId } : { contentId, restart: false })
      if (!active) return
      if (result.error) { setError(result.error); return }
      if (result.data.content_id !== contentId) { setError({ message: 'This attempt belongs to another simulation.' }); return }
      // A slower resume read must not replace a newer server-confirmed action.
      setSnapshot(current => current?.attempt_id === result.data.attempt_id && current.state_version > result.data.state_version ? current : result.data)
      if (!attemptId) setSearch({ attempt: result.data.attempt_id }, { replace: true })
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [kind, contentId, attemptId, setSearch, reload])
  const mediaId = snapshot?.step?.screen_media_id
  useEffect(() => {
    let active = true
    async function load() {
      setScreen({ url: null, error: null })
      if (!mediaId) return
      try {
        const url = await simulationScreenUrl(kind, contentId, mediaId, attemptId)
        if (active) setScreen({ url, error: null })
      } catch (e) { if (active) setScreen({ url: null, error: e.message }) }
    }
    const timer = setTimeout(load, 0), refresh = setInterval(load, 90_000)
    return () => { active = false; clearTimeout(timer); clearInterval(refresh) }
  }, [kind, contentId, mediaId, attemptId, reload])
  useEffect(() => { heading.current?.focus() }, [snapshot?.position, snapshot?.status])
  async function act(action, value = null) {
    if (lock.current || !snapshot?.step) return
    lock.current = true; setBusy(true); setError(null)
    try {
      const result = await simulationRequest(kind, 'Action', { attemptId: snapshot.attempt_id, stepId: snapshot.step.id,
        version: snapshot.state_version, requestId: crypto.randomUUID(), kind: action, value })
      if (result.error) { setError(result.error); return }
      setSnapshot(result.data); setFeedback({ text: result.data.feedback || (result.data.correct ? 'Correct. Keep going.' : 'Your action was saved.'), correct: result.data.correct })
    } finally { lock.current = false; setBusy(false) }
  }
  async function restart() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(null); setConfirmRestart(false)
    try {
      const result = await simulationRequest(kind, 'Start', { contentId, restart: true })
      if (result.error) { setError(result.error); return }
      setFeedback(null); setSnapshot(result.data); setSearch({ attempt: result.data.attempt_id }, { replace: true })
    } finally { lock.current = false; setBusy(false) }
  }
  async function command(name, value = null) {
    if (lock.current || !snapshot?.challenge || snapshot.status !== 'started') return
    lock.current = true; setBusy(true); setError(null)
    try {
      const result = await simulationRequest(kind,'Command',{attemptId:snapshot.attempt_id,version:snapshot.state_version,requestId:crypto.randomUUID(),command:name,value})
      if (result.error) { setError(result.error); return }
      setSnapshot(result.data); setFeedback({text:result.data.feedback,correct:result.data.correct})
    } finally { lock.current = false; setBusy(false) }
  }
  return <div className="sim-shell pulse-product-surface"><AcademyHeader /><main className="sim-main sim-main--player">
    <div className="sim-topline"><Link to="/academy/simulations">← Simulations · progress is saved</Link><span className="sim-safety">Simulation only · No live calls</span></div>
    {!snapshot && !error && <p role="status">Opening your saved practice…</p>}
    {error && <div className="sim-error" role="alert"><p>{error.message}</p><button onClick={() => { setFeedback(null); setReload(v => v + 1) }} disabled={busy}>Reload saved progress</button></div>}
    {snapshot && (snapshot.status === 'completed' ? <section className="sim-result"><p className="sim-eyebrow">Practice complete</p><h1 ref={heading} tabIndex={-1}>You completed the workflow.</h1><div className="sim-result-score">{snapshot.result?.score_percent}<small>/ 100</small></div><p>A training result, not a personnel evaluation. Nothing was dialed.</p><div className="sim-result-stats"><div><strong>{snapshot.completed_steps}</strong><span>Steps completed</span></div><div><strong>{snapshot.mistakes}</strong><span>Mistakes</span></div><div><strong>{snapshot.hints}</strong><span>Hints used</span></div><div><strong>{snapshot.duration_seconds}s</strong><span>Practice time</span></div></div><p className="sim-score-note">100 − 5 per mistake − 10 per hint. Time does not lower your score.</p><div className="sim-result-actions"><button className="sim-primary" disabled={busy} onClick={() => void restart()}>Practice again →</button><Link to="/academy/simulations">View history</Link></div></section> : snapshot.challenge ? <>
      <div className="sim-player-title"><div><p className="sim-eyebrow">{snapshot.title} · {snapshot.challenge.selection_mode === 'assigned' ? 'Pulse challenge' : 'Your practice'}</p><h1 ref={heading} tabIndex={-1}>{snapshot.challenge.goal}</h1></div></div>
      <div className="sim-player-metrics"><span>{snapshot.mistakes} mistakes · {snapshot.hints} hints · Saved progress</span><button disabled={busy} onClick={() => void command('hint')}>Show hint</button><button disabled={busy} onClick={() => setConfirmRestart(true)}>Restart</button></div>
      {feedback?.text && <p className={'sim-feedback'+(feedback.correct === false ? ' sim-feedback--retry' : '')} role="status">{feedback.text}</p>}
      {snapshot.hint && <p className="sim-hint" role="note">Hint: {snapshot.hint}</p>}
      <ViciDialer key={snapshot.attempt_id} dialer={snapshot.dialer} busy={busy} onCommand={(name,value) => void command(name,value)} />
      <p className="sim-caption">Use the actual controls to complete the challenge. Synthetic data only; no live calls. Asia Presets is reconstructed pending an exact reference screenshot.</p>
    </> : snapshot.step ? <>
      <div className="sim-player-title"><div><p className="sim-eyebrow">{snapshot.title} · Version {snapshot.version_number}</p><h1 ref={heading} tabIndex={-1}>{snapshot.step.prompt}</h1></div><span>Step {snapshot.position} / {snapshot.step_count}</span></div>
      <progress value={snapshot.completed_steps} max={snapshot.step_count} aria-label="Completed steps" />
      <div className="sim-player-metrics"><span>{snapshot.mistakes} mistakes · {snapshot.hints} hints</span><button disabled={busy} onClick={() => void act('hint')}>Show hint</button><button disabled={busy} onClick={() => setConfirmRestart(true)}>Restart</button></div>
      {feedback && <p className={'sim-feedback' + (feedback.correct === false ? ' sim-feedback--retry' : '')} role="status">{feedback.text}</p>}
      {snapshot.step.hint && <p className="sim-hint" role="note">Hint: {snapshot.step.hint}</p>}
      {screen.error ? <div className="sim-error" role="alert">{screen.error}<button onClick={() => setReload(v => v + 1)}>Reload screen</button></div> : <SimulationStage key={snapshot.step.id} step={snapshot.step} url={screen.url} busy={busy} onAnswer={value => void act('answer', value)} />}
      <p className="sim-caption">Reconstructed from training references with fictitious data. On a small screen, scroll the dialer horizontally; all controls are also keyboard-accessible.</p>
    </> : <section className="sim-empty"><h1>That attempt was restarted.</h1><p>Its history is kept. Open the current attempt from Simulations.</p><Link to="/academy/simulations">Back to simulations</Link></section>)}
    {confirmRestart && <RestartConfirmation onCancel={() => setConfirmRestart(false)} onConfirm={() => void restart()} />}
  </main></div>
}

function RestartConfirmation({ onCancel, onConfirm }) {
  const ref = useRef(null)
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus() }, [])
  return <dialog ref={ref} className="sim-confirm" onCancel={onCancel} aria-label="Restart simulation"><h2>Start a fresh attempt?</h2><p>This unfinished attempt stays in your history. Restart from step one?</p><div><button onClick={onCancel} autoFocus>Cancel</button><button className="sim-primary" onClick={onConfirm}>Restart practice</button></div></dialog>
}
