import { useMemo, useState } from 'react'
import { isSaturday } from './shiftTargets.js'
import { coachingAgents, dispositionComparisons, timeComparisons } from './dispositionInsights.js'
import { duration, number } from './dashboardModel.js'
import { percent, dailyGoal, dailyCommission } from './performanceInsights.js'
import { AgentIdentity } from './AgentIdentity.jsx'
import { transferLabel } from './reportingPolicy.js'

const tabs = [['attention','Needs review'],['talk','Low Talk avg'],['dead','High Dead avg'],['callback','Callback time'],['callbk','CALLBK calls']]
const pageSize = 5
function EnglishCount({row,data}) {
  const day = {status:'observed',row,date:data.date}
  const goal = dailyGoal(day,data.scope), commission = dailyCommission(day,data.scope)
  const tone = !goal ? '' : goal.reached ? 'good' : commission.reached ? 'warn' : 'bad'
  return <strong className={tone ? 'dash-value--'+tone : undefined} title={!goal ? undefined : goal.reached ? 'Production goal met' : commission.reached ? 'Commission met · below production goal' : 'Below commission threshold'}>{number(row.xfer_count)}</strong>
}
export function CoachingPanel({data,readError,onOpen}) {
  const [search,setSearch] = useState(''), [view,setView] = useState('attention'), [page,setPage] = useState(0)
  const agents = useMemo(()=>readError ? [] : coachingAgents(data),[data,readError])
  const comparison = useMemo(()=>!data?.snapshot || readError ? [] : view==='callbk'
    ? dispositionComparisons(data.performance,'CALLBK').filter(item=>item.points>0).sort((a,b)=>b.points-a.points || a.row.agent_code.localeCompare(b.row.agent_code)).slice(0,10)
    : timeComparisons(data,view),[data,readError,view])
  if (!data?.snapshot || readError) return null
  const query = search.trim().toLowerCase()
  const visible = (view==='attention'?agents:comparison).filter(({row})=>`${row.vici_user_name} ${row.agent_code} ${row.current_user_group}`.toLowerCase().includes(query))
  const pages = Math.max(1,Math.ceil(visible.length/pageSize)), current = Math.min(page,pages-1)
  const slice = visible.slice(current*pageSize,(current+1)*pageSize), rate = ['callbk','callback'].includes(view)
  const ownLabel = view==='callbk'?'Marked CALLBK':view==='callback'?'Callback duration':view==='talk'?'Talk / call':'Dead / call'
  return <details className="dash-panel dash-coaching"><summary>Coaching &amp; support <span>{agents.length} to review</span></summary><div className="dash-coaching-body">
    <div className="dash-coaching-toolbar"><div className="dash-coaching-limits"><span>Break <b>{isSaturday(data.date)?'None':'25 min'}</b></span><span>Lunch <b>{isSaturday(data.date)?'None':'60 min'}</b></span><span>RR <b>20 min</b></span></div><label className="dash-search"><span className="dash-sr">Search coaching agents</span><input type="search" aria-label="Search coaching agents" placeholder="Name or Agent ID" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/></label></div>
    <nav className="dash-coaching-tabs" aria-label="Coaching comparisons">{tabs.map(([key,label])=><button type="button" key={key} aria-pressed={view===key} onClick={()=>{setView(key);setPage(0);setSearch('')}}>{label}</button>)}</nav>
    <div key={view} className="dash-coaching-results" tabIndex={0} aria-label="Coaching results">
    {view==='attention'?<>
      {!data.pause.length && <p className="dash-caption">No pause report for these checks.</p>}
      <div className="dash-coaching-cards">{slice.map(({row,reasons})=><article className="dash-coaching-agent" key={row.agent_code}>
        <header><AgentIdentity row={row} scope={data.scope} onOpen={onOpen}/><span className="dash-review-label">Review · {reasons.length}</span></header>
        <ul>{reasons.map(reason=><li key={reason.code} className={reason.kind==='pause'?'dash-over-limit':''}><strong>{reason.code}</strong>{reason.kind==='pause'?<span><b className="dash-value--bad">{duration(reason.value)}</b> / {duration(reason.limit)} <b className="dash-value--bad">+{duration(reason.over)} over</b></span>:<span><b>{number(reason.ownCount)} calls</b> · <b className="dash-value--bad">{percent(reason.ownRate)}</b> vs {percent(reason.peerRate)} team <b className="dash-value--bad">+{reason.points.toFixed(1)} percentage points</b></span>}</li>)}</ul>
      </article>)}</div>
    </>:<>
      <p className="dash-caption">{view==='callbk'?'CALLBK = calls marked callback, not time spent or completed callbacks.':view==='callback'?'Callback duration and % of logged time.':'Seconds per call · compared with the rest of the same team.'}</p>
      <div className="dash-coaching-scroll" tabIndex={0} aria-label="Coaching comparison table"><table className="dash-table"><thead><tr><th>Agent / team</th><th>Total calls</th><th>{transferLabel(data.scope)}</th><th>{ownLabel}</th><th>{rate?'Team rate':'Team average'}</th><th>Difference</th></tr></thead><tbody>{slice.map(item=>{
        const row = view==='callbk'?item.row:{...item.row,calls:item.calls,xfer_count:item.xfer}
        return <tr key={row.agent_code}><td><AgentIdentity row={row} scope={data.scope} onOpen={onOpen}/></td><td>{number(row.calls)}</td><td><EnglishCount row={row} data={data}/></td><td className="dash-value--warn">{view==='callbk'?<><strong>{number(item.ownCount)} calls</strong><small>{percent(item.ownRate)} of calls</small></>:view==='callback'?<><strong>{duration(item.value)}</strong><small>{percent(item.ownRate)} logged</small></>:<strong>{item.value}s</strong>}</td><td>{rate?percent(item.peerRate):`${item.average.toFixed(1)}s`}</td><td className="dash-value--warn"><strong>{(view==='callbk'?item.points:item.difference)>0?'+':''}{(view==='callbk'?item.points:item.difference).toFixed(1)}</strong><small>{rate?'percentage points':'seconds'} · review</small></td></tr>
      })}</tbody></table></div>
    </>}
    {!visible.length && <p role="status">{query?'No matching agents.':view==='attention'?'No review signals in the available data.':'No comparable differences in this report.'}</p>}
    </div>
    <footer className="dash-coaching-footer"><span>{visible.length?`${current*pageSize+1}–${Math.min((current+1)*pageSize,visible.length)} of ${visible.length}`:'0 agents'}{view!=='attention' && ' · Top 10'}</span><div><button type="button" aria-label="Previous coaching page" disabled={current===0} onClick={()=>setPage(current-1)}>←</button><span>{current+1} / {pages}</span><button type="button" aria-label="Next coaching page" disabled={current+1===pages} onClick={()=>setPage(current+1)}>→</button></div></footer>
  </div></details>
}
