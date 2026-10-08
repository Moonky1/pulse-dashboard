import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AcademyHeader } from '../go/AcademyHeader.jsx'
import { useStudioAccess } from '../studio/hooks/useStudioAccess.js'
import { StudioAccessState } from '../studio/StudioShell.jsx'
import { ViciDialer } from './ViciDialer.jsx'
import { ViciActivity } from './ViciActivity.jsx'
import { appendViciActivity } from './viciActivity.js'
import { VICI_PRACTICES, VICI_MENU, newViciPractice, practiceViciCommand } from './viciPractice.js'
import { ViciRandomReference } from './ViciRandomReference.jsx'
import './simulations.css'

export function ViciPreview() {
  const { scenario = 'callback' } = useParams(), access = useStudioAccess()
  if (access.state !== 'allowed') return <StudioAccessState access={access} />
  if(scenario==='random') return <ViciRandomReference />
  if (!VICI_PRACTICES[scenario]) return <p role="alert">Reference workflow unavailable.</p>
  return <ReferencePreview key={scenario} scenario={scenario} />
}
function ReferencePreview({ scenario }) {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState(() => newViciPractice(scenario))
  const [run, setRun] = useState(0)
  const [entries,setEntries] = useState([])
  function restart() { setSnapshot(newViciPractice(scenario,snapshot.dialer.customer.index)); setEntries([]); setRun(value => value + 1) }
  function command(name,value) {
    const next = practiceViciCommand(snapshot,name,value)
    setSnapshot(next); setEntries(current => appendViciActivity(current,name,value,next))
  }
  return <div className="sim-shell pulse-product-surface"><AcademyHeader /><main className="sim-main sim-main--player">
    <div className="sim-toolbar"><Link to="/academy">← Academy</Link><h1>Vici Simulator</h1><label>Practice<select value={scenario} onChange={e => navigate('/academy/simulations/preview/'+e.target.value)}>{Object.entries(VICI_MENU).map(([key,item]) => <option key={key} value={key}>{item.title}</option>)}</select></label><button disabled={snapshot.position!==0} onClick={()=>command('newCustomer')}>New customer</button><button onClick={restart}>Restart</button><Link className="sim-manage" to="/studio/simulations/create">Manage practices</Link></div>
    <p className="sim-situation">{snapshot.situation}</p>
    {snapshot.feedback && <p className={'sim-feedback'+(snapshot.correct === false ? ' sim-feedback--retry' : '')} role="status">{snapshot.feedback}</p>}
    <ViciDialer key={run} dialer={snapshot.dialer} onCommand={command} onLocalAction={name => setEntries(current => appendViciActivity(current,name))} />
    <ViciActivity entries={entries} />
  </main></div>
}
