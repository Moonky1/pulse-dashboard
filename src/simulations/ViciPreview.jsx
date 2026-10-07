import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AcademyHeader } from '../go/AcademyHeader.jsx'
import { useStudioAccess } from '../studio/hooks/useStudioAccess.js'
import { StudioAccessState } from '../studio/StudioShell.jsx'
import { ViciDialer } from './ViciDialer.jsx'
import { VICI_CASES, newViciPreview, previewViciCommand } from './viciModel.js'
import './simulations.css'

export function ViciPreview() {
  const { scenario } = useParams(), access = useStudioAccess()
  if (access.state !== 'allowed') return <StudioAccessState access={access} />
  if (!VICI_CASES[scenario]) return <p role="alert">Reference workflow unavailable.</p>
  return <ReferencePreview key={scenario} scenario={scenario} />
}
function ReferencePreview({ scenario }) {
  const [snapshot, setSnapshot] = useState(() => newViciPreview(scenario))
  const [run, setRun] = useState(0)
  function restart() { setSnapshot(newViciPreview(scenario)); setRun(value => value + 1) }
  return <div className="sim-shell pulse-product-surface"><AcademyHeader /><main className="sim-main sim-main--player">
    <Link className="sim-back" to="/academy/simulations">← VICI Simulator</Link>
    <p className="sim-safety">Staff reference preview · Not recorded · No live calls</p>
    <div className="sim-player-title"><div><p className="sim-eyebrow">{VICI_CASES[scenario].region} · Manual challenge</p><h1>{snapshot.challenge.goal}</h1></div></div>
    <div className="sim-player-metrics"><span>Use the dialer manually. Instructions are optional hints.</span><button disabled={snapshot.status === 'completed'} onClick={() => setSnapshot(s => previewViciCommand(s,'hint'))}>Show hint</button><button onClick={restart}>Restart preview</button></div>
    {snapshot.hint && <p className="sim-hint" role="note">Hint: {snapshot.hint}</p>}
    {snapshot.feedback && <p className={'sim-feedback'+(snapshot.correct === false ? ' sim-feedback--retry' : '')} role="status">{snapshot.feedback}</p>}
    {snapshot.status === 'completed' ? <section className="sim-empty"><h2>Reference workflow completed.</h2><p>No attempt or result was saved. This is Staff review, not an Opener account.</p><button onClick={restart}>Try again</button></section> : <ViciDialer key={run} dialer={snapshot.dialer} onCommand={(command,value) => setSnapshot(s => previewViciCommand(s,command,value))} />}
    <p className="sim-caption">Reconstructed from your references with fictitious data. The Asia Presets panel is approximate pending an exact screenshot. Official Opener attempts are validated on the server.</p>
  </main></div>
}
