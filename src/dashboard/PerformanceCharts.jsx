import { useState } from 'react'
import { duration, number } from './dashboardModel.js'
import { rankAgents, percent } from './performanceInsights.js'
import { transferLabel } from './reportingPolicy.js'
import { AgentIdentity } from './AgentIdentity.jsx'

export function PerformanceCharts({rows,scope,onOpen}) {
  const [metric,setMetric] = useState('xfer')
  const ranked = rankAgents(rows,metric,false,scope).slice(0,10)
  const maximum = Math.max(1,...ranked.map(row=>row.value))
  const times = [['talk_seconds','Talk'],['wait_seconds','Wait'],['dispo_seconds','Dispo'],['dead_seconds','Dead'],['pause_seconds','Pause']].map(([key,label])=>({label,value:rows.length && rows.every(row=>Number.isFinite(row[key]))?rows.reduce((n,row)=>n+row[key],0):null}))
  const maxTime = Math.max(1,...times.map(t=>t.value||0))
  return <section className="dash-chart-grid" aria-label="Performance charts">
    <article className="dash-panel dash-chart"><header><h2>Top 10 agents</h2><label>Compare<select aria-label="Chart metric" value={metric} onChange={e=>setMetric(e.target.value)}>{[['xfer',transferLabel(scope)],['spanish','Spanish XFER'],['calls','Calls'],['conversion',transferLabel(scope)+' conversion %']].map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label></header>
      <ol key={metric} className="dash-chart-bars">{ranked.map(row=><li key={row.agent_code}><div><AgentIdentity row={row} scope={scope} onOpen={onOpen}/><strong>{metric==='conversion'?percent(row.value):number(row.value)}</strong></div><div className="dash-chart-track" aria-hidden="true"><i style={{width:`${row.value/maximum*100}%`}}/></div></li>)}</ol>
      {!ranked.length && <p>No values available for this chart.</p>}
    </article>
    <article className="dash-panel dash-chart"><header><h2>Time by category</h2></header><p className="dash-caption">Report totals · categories may overlap.</p><ol className="dash-chart-bars">{times.map(({label,value})=><li key={label}><div><span>{label}</span><strong>{duration(value)}</strong></div><div className="dash-chart-track" aria-hidden="true"><i style={{width:`${(value||0)/maxTime*100}%`}}/></div></li>)}</ol></article>
  </section>
}
