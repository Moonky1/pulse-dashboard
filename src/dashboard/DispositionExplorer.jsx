import { useId, useState } from 'react'
import { number, groupName } from './dashboardModel.js'
import { percent } from './performanceInsights.js'
import { dispositionSummary } from './dispositionInsights.js'

const decimal = value => value === null ? '—' : value.toLocaleString('en-US', { maximumFractionDigits: 1 })
const signed = value => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}`

export function DispositionExplorer({ rows, agent = null, onOpen }) {
  const [selected, setSelected] = useState(''), [pinned, setPinned] = useState(false), [chosenGroup, setGroup] = useState('')
  const panelId = useId()
  const groups = [...new Set(rows.map(groupName))].sort()
  const group = agent ? groupName(agent) : groups.includes(chosenGroup) ? chosenGroup : groups[0]
  const cohort = rows.filter(row => groupName(row) === group)
  const codes = [...new Set((agent ? [agent] : cohort).flatMap(row => Object.keys(row.dispositions || {})))].sort()
  const active = codes.includes(selected) ? selected : ''
  const summary = active ? dispositionSummary(cohort, active, agent) : null
  const close = () => { setSelected(''); setPinned(false) }
  const show = code => { if (!pinned) setSelected(code) }
  return <section className="dash-dispo-explorer" aria-label={agent ? 'Agent disposition comparison' : 'Team disposition breakdown'} onKeyDown={e => { if (e.key === 'Escape' && active) { e.preventDefault(); e.stopPropagation(); close() } }}>
    {!agent && groups.length > 1 && <label>Team<select aria-label="Disposition team" value={group} onChange={e => { setGroup(e.target.value); close() }}>{groups.map(name => <option key={name}>{name}</option>)}</select></label>}
    <div className="dash-dispo-buttons">{codes.map(code => <button type="button" key={code} aria-label={`${code} details`} aria-expanded={active === code} aria-controls={panelId} onMouseEnter={() => show(code)} onFocus={() => show(code)} onClick={() => { setSelected(code); setPinned(true) }}><span>{code}</span><strong>{number(agent ? agent.dispositions[code] : dispositionSummary(cohort, code).total)}</strong></button>)}</div>
    {!codes.length && <p>No disposition data.</p>}
    {summary && <section id={panelId} className="dash-dispo-detail" aria-label={`${active} comparison`}>
      <header><div><h4>{active} · {group}</h4><small>{summary.available} / {summary.agents} agents reported</small></div><button type="button" aria-label="Close disposition comparison" onClick={close}>×</button></header>
      <dl className="dash-dispo-stats">
        {agent && <div><dt>This agent</dt><dd>{number(summary.ownCount)}</dd><small>{percent(summary.ownRate)} of calls</small></div>}
        <div><dt>Team average / agent</dt><dd>{decimal(summary.average)}</dd><small>{percent(summary.rate)} of team calls</small></div>
        <div><dt>{agent ? 'Share of team ' + active : 'Team total'}</dt><dd>{agent ? percent(summary.share) : number(summary.total)}</dd></div>
        {agent && <div><dt>Vs rest of team</dt><dd>{signed(summary.points)} pp</dd><small>{signed(summary.aboveAverage)}% vs average count · {decimal(summary.peerAverage)}</small></div>}
      </dl>
      {summary.available < summary.agents && <p>Team totals unavailable: some agents have no {active} value.</p>}
      {!agent && <><h4>Top 10 · {active}</h4><div className="dash-history-scroll"><table className="dash-table"><thead><tr><th>Agent</th><th>Count</th><th>% calls</th><th>Team share</th></tr></thead><tbody>{summary.top.map(item => <tr key={item.row.agent_code}><td>{onOpen ? <button type="button" onClick={() => onOpen(item.row.agent_code)}>{item.row.vici_user_name}</button> : item.row.vici_user_name}<small>{item.row.agent_code}</small></td><td>{number(item.count)}</td><td>{percent(item.rate)}</td><td>{percent(item.share)}</td></tr>)}</tbody></table></div>{!summary.top.length && <p>No recorded uses.</p>}</>}
    </section>}
  </section>
}
