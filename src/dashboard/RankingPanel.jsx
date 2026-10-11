import { useState } from 'react'
import { groupName, number } from './dashboardModel.js'
import { contribution, goalProgress, productionProgress, productionTarget, percent, rankAgents, ratio, RANK_METRICS, TARGET_REFERENCES } from './performanceInsights.js'
import { RankMedal } from './RankMedal.jsx'
import reachedGoal from '../../public/emojis/goal1.webp'
import pendingGoal from '../../public/emojis/goal.webp'
import { confirmedTargetReference, countedTransfers, isEnglishXfer, spanishTransfers, transferLabel } from './reportingPolicy.js'
import { isSaturday } from './shiftTargets.js'
import { isAllTeamsScope } from './allTeamsScope.js'

export function TargetReference({ value, onChange }) {
  return <div className="dash-goal-reference"><label>Target reference<select aria-label="Target reference" value={value} onChange={e => onChange(e.target.value)}><option value="">Not assigned</option>{Object.entries(TARGET_REFERENCES).map(([key, target]) => <option value={key} key={key}>{target.label} · {target.daily} English / day</option>)}</select></label><p>English goal: Philippines 20 · Asia 15 · Other teams 10. This comparison does not change team assignments or saved rules.</p></div>
}
export function Goal({ count, reference, automatic = false, date, group }) {
  const commission = goalProgress(count, reference, automatic ? date : undefined, group)
  const value = automatic ? productionProgress(count, reference, date) : commission
  if (!value) return <span className="dash-caption">Not assigned</span>
  return <span className="dash-targets"><span className={`dash-goal${value.reached ? ' dash-goal--reached' : ''}`} aria-label={`${count} of ${value.target} ${automatic ? 'daily English' : 'reference'} target${value.reached ? ', reached' : ''}`}><strong>{count} / {value.target}</strong><img src={value.reached ? reachedGoal : pendingGoal} width="28" height="28" alt={value.reached ? 'Goal reached' : 'Goal'} /></span>{automatic && <small className="dash-commission" aria-label={`${count} of ${commission.target} English commission threshold${commission.reached ? ', met' : ''}`}>Commission {commission.reached ? '✓' : '·'} {count} / {commission.target}</small>}</span>
}
function ShortList({ title, rows, metric, onOpen, low = false }) {
  return <article className={`dash-rank-card${low ? ' dash-rank-card--review' : ''}`}><h3>{title}</h3>{rows.length ? <ol>{rows.map(row => <li key={row.agent_code}><button onClick={() => onOpen(row.agent_code)}><span className="dash-rank-medal" aria-label={`Position ${row.rank}`}>{low ? `#${row.rank}` : <RankMedal rank={row.rank} />}</span><span><strong>{row.vici_user_name}</strong><small>{row.agent_code} · {number(row.calls)} calls · {number(row.xfer_count)} XFER</small></span><b>{metric === 'conversion' ? percent(row.value) : number(row.value)}</b></button></li>)}</ol> : <p>No evaluable agents in this selection.</p>}</article>
}
export function RankingPanel({ rows, allRows, onOpen, reference, setReference, scope, date }) {
  const [metric, setMetric] = useState('xfer'), [direction, setDirection] = useState('highest')
  const [search, setSearch] = useState(''), [activity, setActivity] = useState('all'), [page, setPage] = useState(0)
  const eligible = activity === 'active' ? rows.filter(row => row.calls > 0) : rows
  const automatic = isEnglishXfer(scope), xferLabel = transferLabel(scope)
  const target = productionTarget(date)
  const global = isAllTeamsScope(scope) && rows.length === allRows.length
  const referenceFor = row => automatic ? confirmedTargetReference(scope, row) : reference
  const progressFor = row => (automatic ? productionProgress : goalProgress)(row.xfer_count, referenceFor(row), automatic ? date : undefined, row.current_user_group)
  const assigned = eligible.filter(row => referenceFor(row))
  const unassigned = eligible.length - assigned.length
  const metricLabels = { ...RANK_METRICS, xfer: xferLabel }
  const highest = rankAgents(eligible, metric, false, scope), lowest = rankAgents(eligible, metric, true, scope)
  const ranking = direction === 'highest' ? highest : lowest
  const query = search.trim().toLocaleLowerCase()
  const filtered = ranking.filter(row => `${row.vici_user_name} ${row.agent_code} ${groupName(row)}`.toLocaleLowerCase().includes(query))
  const pages = Math.max(1, Math.ceil(filtered.length / 25)), current = Math.min(page, pages - 1)
  const nearest = assigned.filter(row => !progressFor(row).reached)
    .sort((a, b) => progressFor(a).remaining - progressFor(b).remaining || a.agent_code.localeCompare(b.agent_code)).slice(0, 3)
  const calls = eligible.reduce((sum, row) => sum + row.calls, 0), xfer = eligible.reduce((sum, row) => sum + row.xfer_count, 0)
  const update = (setter, value) => { setter(value); setPage(0) }
  return <section className="dash-rankings" aria-label="Rankings and goals">
    <header className="dash-insights-heading"><div><h2>{global ? 'Global rankings' : 'Rankings & goals'}</h2></div><img className="dash-pixel-medal" src={reachedGoal} width="40" height="40" alt="" /></header>
    {automatic ? <div className="dash-goal-reference" aria-label="Confirmed English targets"><strong>Goal · {target.daily} English / day · 3 per hour × {target.hours} hours</strong><span>{isSaturday(date) ? 'Saturday commission · Asia, Philippines & Mexico 10 · Other teams 5 English' : 'Commission · Philippines 20 · Asia 15 · Other teams 10 English'}</span></div> : <TargetReference value={reference} onChange={setReference} />}
    <dl className="dash-insight-metrics"><div><dt>Average {xferLabel} / agent</dt><dd>{eligible.length ? (xfer / eligible.length).toFixed(1) : '—'}</dd><small>{number(eligible.length)} agents</small></div><div><dt>Weighted conversion</dt><dd>{percent(ratio(xfer, calls))}</dd></div><div><dt>At zero {xferLabel} · with calls</dt><dd>{number(eligible.filter(row => row.calls > 0 && row.xfer_count === 0).length)}</dd></div><div><dt>{automatic ? `${target.daily} English goal reached` : 'Reference goal reached'}</dt><dd>{assigned.length ? number(assigned.filter(row => progressFor(row).reached).length) : '—'}</dd>{automatic && <small>{assigned.length} assigned · {unassigned} without a confirmed goal</small>}</div>{automatic && <div><dt>Commission threshold met</dt><dd>{assigned.length ? number(assigned.filter(row => goalProgress(row.xfer_count, referenceFor(row), date, row.current_user_group).reached).length) : '—'}</dd></div>}</dl>
    <div className="dash-rank-filters"><label>Rank by<select aria-label="Rank by" value={metric} onChange={e => update(setMetric, e.target.value)}>{Object.entries(metricLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Order<select aria-label="Ranking order" value={direction} onChange={e => update(setDirection, e.target.value)}><option value="highest">Highest first</option><option value="lowest">Lowest first</option></select></label><label>Activity<select aria-label="Ranking activity" value={activity} onChange={e => update(setActivity, e.target.value)}><option value="all">All reported agents</option><option value="active">Agents with calls</option></select></label><label>Find an agent<input type="search" aria-label="Search ranking" placeholder="Name or Agent ID" value={search} onChange={e => update(setSearch, e.target.value)} /></label></div>
    <div className="dash-rank-cards"><ShortList title={`🏆 Highest ${metricLabels[metric]}`} rows={highest.slice(0, 3)} metric={metric} onOpen={onOpen} /><ShortList title={`🔎 Lowest ${metricLabels[metric]} · review`} rows={lowest.slice(0, 3)} metric={metric} onOpen={onOpen} low /><article className="dash-rank-card"><h3>{automatic ? '🎯 Closest to the daily English goal' : '🎯 Closest to the reference goal'}</h3>{!assigned.length ? <p>{automatic ? 'No confirmed goals for these agents.' : 'Choose a target reference above to compare progress.'}</p> : !nearest.length ? <p>All agents with an assigned goal reached it.</p> : <ol>{nearest.map(row => <li key={row.agent_code}><button onClick={() => onOpen(row.agent_code)}><span><strong>{row.vici_user_name}</strong><small>{row.agent_code} · {number(row.xfer_count)} {xferLabel}</small><Goal count={row.xfer_count} reference={referenceFor(row)} automatic={automatic} date={date} group={row.current_user_group} /></span></button></li>)}</ol>}</article></div>
    <details className="dash-caption"><summary>Ranking details</summary><p>Positions use the selected group and activity filter, before name search. Equal values share a position; cards show the first 3 rows, with Agent ID breaking display-order ties. Calls = 0 has no conversion rank. Lowest output is an observation, not a judgment of ability; shifts and sample size may differ.{automatic && ' Current daily goals are applied to this saved report; historical target changes are not recorded here.'}</p></details>
    <div className="dash-history-scroll" tabIndex={0} aria-label="Performance ranking table"><table className="dash-table"><caption className="dash-sr">Performance ranking · {metricLabels[metric]} · {direction} first</caption><thead><tr><th>Position</th><th>Agent / group</th><th>Calls</th><th>{xferLabel}</th><th>Spanish XFER</th><th>Total XFER</th><th>Conversion EN</th><th>Group XFER share</th><th>{automatic ? 'Daily English goal' : 'Reference goal'}</th></tr></thead><tbody>{filtered.slice(current * 25, (current + 1) * 25).map(row => <tr key={row.agent_code}><td>{direction === 'highest' ? <RankMedal rank={row.rank} /> : `#${row.rank}`}</td><td><button className="dash-insight-agent" onClick={() => onOpen(row.agent_code)}>{row.vici_user_name}<small>{row.agent_code} · {groupName(row)}</small></button></td><td>{number(row.calls)}</td><td className="dash-xfer">{number(row.xfer_count)}</td><td>{number(spanishTransfers(row))}</td><td>{number(countedTransfers(scope, row))}</td><td>{percent(ratio(row.xfer_count, row.calls))}</td><td>{percent(contribution(row, allRows).xferShare)}</td><td><Goal count={row.xfer_count} reference={referenceFor(row)} automatic={automatic} date={date} group={row.current_user_group} /></td></tr>)}</tbody></table></div>
    {!filtered.length && <p role="status">No agents match this ranking. Zero-call agents are not ranked by conversion.</p>}
    <footer className="dash-table-footer"><span>{filtered.length} agents</span><div><button disabled={current === 0} onClick={() => setPage(current - 1)}>Previous ranking page</button><span>{current + 1} / {pages}</span><button disabled={current + 1 === pages} onClick={() => setPage(current + 1)}>Next ranking page</button></div></footer>
  </section>
}
