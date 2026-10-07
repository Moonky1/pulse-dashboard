import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AcademyHeader } from '../go/AcademyHeader.jsx'
import { useGoIdentity } from '../go-product/useGoIdentity.js'
import { simulationRequest } from './simulationApi.js'
import './simulations.css'

export function SimulationCatalog() {
  const { kind } = useGoIdentity()
  const [state, setState] = useState({ loading: true, items: [], history: [], error: null })
  const [revision, setRevision] = useState(0), [offset, setOffset] = useState(0)
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setState(s => ({ ...s, loading: true }))
      const [catalog, history] = await Promise.all([simulationRequest(kind, 'Catalog', { limit: 50, offset }), simulationRequest(kind, 'History', { limit: 50 })])
      if (active) setState({ loading: false, items: catalog.data || [], history: history.data || [], error: catalog.error || history.error })
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [kind, revision, offset])
  return <div className="sim-shell pulse-product-surface"><AcademyHeader /><main className="sim-main">
    <Link className="sim-back" to="/academy">← Academy</Link>
    <header className="sim-heading"><div><p className="sim-eyebrow">Learn by doing</p><h1>Simulations</h1><p>A familiar dialer. A safe place to practice.</p></div><button onClick={() => setRevision(v => v + 1)}>Refresh</button></header>
    <p className="sim-safety"><span aria-hidden="true">◉</span> Training only · Synthetic customer data · No live calls</p>
    {state.loading ? <p role="status">Loading your simulations…</p> : state.error ? <p role="alert" className="sim-error">{state.error.message}</p> : <>
      {!state.items.length && <section className="sim-empty"><h2>Your next practice starts here</h2><p>No published simulations are available for your team yet. Staff can prepare them in Studio.</p>{kind === 'staff' && <Link to="/studio">Open Studio →</Link>}</section>}
      <div className="sim-catalog">{state.items.map(item => <article key={item.id}><span className="sim-mini-dialer" aria-hidden="true">▦</span><div className="sim-card-meta"><span>{item.language === 'es' ? 'Español' : 'English'}</span><span>{item.step_count} steps · v{item.version_number}</span></div><h2>{item.title}</h2><p>{item.description}</p><footer>{item.latest_attempt?.score_percent != null && <span>Last result: {item.latest_attempt.score_percent}%</span>}<Link className="sim-primary" to={'/academy/simulations/' + item.id}>{item.latest_attempt?.status === 'started' ? 'Resume' : 'Start practice'} →</Link></footer></article>)}</div>
      <div className="sim-pagination"><button disabled={!offset} onClick={() => setOffset(v => Math.max(0, v - 50))}>Previous</button><span>Page {offset / 50 + 1}</span><button disabled={state.items.length < 50} onClick={() => setOffset(v => v + 50)}>Next</button></div>
      <section className="sim-history"><h2>Your practice history</h2><p>Replaying adds a new attempt. Previous results stay here.</p>{!state.history.length ? <p>No attempts yet.</p> : <ul>{state.history.map(attempt => <li key={attempt.id}><div><strong>{attempt.title}</strong><small>Version {attempt.version_number} · Attempt {attempt.attempt_number} · {new Date(attempt.started_at).toLocaleDateString()}</small></div><span>{attempt.status === 'completed' ? `${attempt.score_percent}%` : attempt.status === 'started' ? 'In progress' : 'Restarted'}</span><small>{attempt.mistakes} mistakes · {attempt.hints} hints</small>{attempt.status === 'started' && <Link to={`/academy/simulations/${attempt.content_id}?attempt=${attempt.id}`}>Resume →</Link>}</li>)}</ul>}</section>
    </>}
  </main></div>
}
