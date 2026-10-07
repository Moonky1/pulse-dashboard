import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AcademyHeader } from '../go/AcademyHeader.jsx'
import { useStudioAccess } from '../studio/hooks/useStudioAccess.js'
import { StudioAccessState } from '../studio/StudioShell.jsx'
import { ViciDialer } from './ViciDialer.jsx'
import { VICI_CASES, newViciPreview, previewViciCommand } from './viciModel.js'
import './simulations.css'

export function ViciPreview() {
  const { scenario = 'callback' } = useParams(), access = useStudioAccess()
  if (access.state !== 'allowed') return <StudioAccessState access={access} />
  if (!VICI_CASES[scenario]) return <p role="alert">Reference workflow unavailable.</p>
  return <ReferencePreview key={scenario} scenario={scenario} />
}
function ReferencePreview({ scenario }) {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState(() => newViciPreview(scenario))
  const [run, setRun] = useState(0)
  function restart() { setSnapshot(newViciPreview(scenario)); setRun(value => value + 1) }
  return <div className="sim-shell pulse-product-surface"><AcademyHeader /><main className="sim-main sim-main--player">
    <div className="sim-toolbar"><Link to="/academy">← Academy</Link><h1>Vici Simulator</h1><label>Practice<select value={scenario} onChange={e => navigate('/academy/simulations/preview/'+e.target.value)}>{Object.entries(VICI_CASES).map(([key,item]) => <option key={key} value={key}>{item.title}</option>)}</select></label><button onClick={restart}>Restart</button><Link className="sim-manage" to="/studio/simulations/create">Manage practices</Link></div>
    {snapshot.feedback && <p className={'sim-feedback'+(snapshot.correct === false ? ' sim-feedback--retry' : '')} role="status">{snapshot.feedback}</p>}
    <ViciDialer key={run} dialer={snapshot.dialer} onCommand={(command,value) => setSnapshot(s => previewViciCommand(s,command,value))} />
  </main></div>
}
