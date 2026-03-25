import { useEffect, useState, useRef } from 'react'
import { APP_CONFIG } from '../config'
import './dashboard.css'

const SHEET_ID = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'

const csvUrl = (sheet) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '"') { inQuotes = !inQuotes; continue }
      if (row[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
      current += row[i]
    }
    result.push(current.trim())
    return result
  })
}

async function fetchSheet(name) {
  const res = await fetch(csvUrl(name))
  const text = await res.text()
  return parseCSV(text)
}

function isLoggedRow(cell) {
  return /^\d/.test((cell || '').trim()) && (cell || '').toLowerCase().includes('agent')
}

const TEAM_CONFIGS = [
  { id:'philippines', name:'PHILIPPINES',    tab:'AW GARRET PHILIPPINES',                 hasSpanish:false, flag:'ph', colEng:2, colSp:null, colTotal:2 },
  { id:'venezuela',   name:'VENEZUELA',      tab:'AW GARRET VENEZUELA PATRICIA',          hasSpanish:true,  flag:'ve', colEng:2, colSp:3,    colTotal:4 },
  { id:'colombia',    name:'COLOMBIA',       tab:'AW GARRET COLOMBIA JUAN GARCIA',        hasSpanish:true,  flag:'co', colEng:3, colSp:4,    colTotal:5 },
  { id:'mexico',      name:'MEXICO BAJA',    tab:'AW GARRET BAJA MX KEVIN',               hasSpanish:false, flag:'mx', colEng:2, colSp:null, colTotal:2 },
  { id:'central',     name:'CENTRAL AMERICA',tab:'AW GARRET CENTRAL AMERICA - CAROLINA', hasSpanish:true,  flag:'hn', colEng:3, colSp:4,    colTotal:5 },
]

function parseTeamSheet(rows, config) {
  const isAfter6pm = new Date().getHours() >= 18
  const loggedRows = rows.filter(row => isLoggedRow(row[0] || ''))
  if (loggedRows.length === 0) return { agents:0, english:0, spanish:0, total:0, noSpanish:!config.hasSpanish }

  let english = 0, spanish = 0, total = 0
  for (const row of loggedRows) {
    english += parseInt(row[config.colEng])                               || 0
    spanish += config.colSp != null ? (parseInt(row[config.colSp]) || 0) : 0
    total   += parseInt(row[config.colTotal])                             || 0
  }

  const agentRow = (isAfter6pm && loggedRows.length > 1) ? loggedRows[loggedRows.length - 1] : loggedRows[0]
  const agentMatch = (agentRow[0] || '').match(/(\d+)/)
  const agents = agentMatch ? parseInt(agentMatch[1]) : 0
  return { agents, english, spanish, total, noSpanish: !config.hasSpanish }
}

const RANGES = [
  { label:'0',     min:0,  max:0,    color:'#f87171' },
  { label:'1–4',   min:1,  max:4,    color:'#fb923c' },
  { label:'5–9',   min:5,  max:9,    color:'#fbbf24' },
  { label:'10–14', min:10, max:14,   color:'#a3e635' },
  { label:'15–19', min:15, max:19,   color:'#34d399' },
  { label:'20+',   min:20, max:9999, color:'#22c55e' },
]

const E = {
  goal:'/emojis/goal.webp', goal1:'/emojis/goal1.webp',
  goal3:'/emojis/goal3.webp', goal4:'/emojis/goal4.webp',
  medal1:'/emojis/medal1.webp', medal2:'/emojis/medal2.webp',
  medal3:'/emojis/web3.webp', zero:'/emojis/zero.webp', firework:'/emojis/firework.webp',
}

const Img = ({ src, size = 18 }) => (
  <img src={src} width={size} height={size} style={{ display:'inline-block', verticalAlign:'middle', objectFit:'contain' }} />
)
const MEDALS = [E.medal1, E.medal2, E.medal3]

const getTeamRankBadge = (rank) => {
  if (rank === 0) return <Img src={E.goal1} size={26} />
  if (rank === 1) return <Img src={E.goal3} size={26} />
  if (rank === 2) return <Img src={E.goal4} size={26} />
  return <span style={{ color:'#6b7280', fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14 }}>#{rank+1}</span>
}

const todayKey = () => new Date().toISOString().slice(0, 10)

const saveSnapshot = (teamsData, asiaData, asiaOverview) => {
  const key = `pulse_snap_${todayKey()}`
  try { localStorage.setItem(key, JSON.stringify({ teamsData, asiaData, asiaOverview, savedAt: new Date().toISOString() })) } catch(e) {}
}

const loadAllSnapshots = () => {
  const snaps = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('pulse_snap_')) {
      try {
        const date = k.replace('pulse_snap_', '')
        const data = JSON.parse(localStorage.getItem(k))
        snaps.push({ date, ...data })
      } catch(e) {}
    }
  }
  return snaps.sort((a, b) => b.date.localeCompare(a.date))
}

const formatDateLabel = (dateStr) => {
  const today = todayKey()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const yKey = yesterday.toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  if (dateStr === yKey) return 'Yesterday'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function BarChart({ agents, metric }) {
  const [tooltip, setTooltip] = useState(null)
  const buckets = RANGES.map(r => ({
    ...r,
    agentsInRange: agents.filter(a => a[metric] >= r.min && a[metric] <= r.max),
    count: agents.filter(a => a[metric] >= r.min && a[metric] <= r.max).length,
  }))
  const maxCount = Math.max(...buckets.map(b => b.count), 1)
  return (
    <div className="chart-wrap">
      <div className="chart-bars">
        {buckets.map((b, i) => (
          <div key={i} className={`chart-col ${b.count > 0 ? 'chart-col-hoverable' : ''}`}
            onMouseEnter={(e) => { if (!b.count) return; const r = e.currentTarget.getBoundingClientRect(); setTooltip({ bucket:b, x:r.left+r.width/2, y:r.top }) }}
            onMouseLeave={() => setTooltip(null)}>
            <div className="bar-count">{b.count}</div>
            <div className="bar-outer"><div className="bar-inner" style={{ height:`${(b.count/maxCount)*100}%`, background:b.color }} /></div>
            <div className="bar-label">{b.label}</div>
          </div>
        ))}
      </div>
      {tooltip && (
        <div className="bar-tooltip" style={{ left:tooltip.x, top:tooltip.y }}>
          <div className="bar-tooltip-header" style={{ color:tooltip.bucket.color }}>
            {tooltip.bucket.label} xfers
            <span className="bar-tooltip-count">{tooltip.bucket.count} agent{tooltip.bucket.count !== 1 ? 's' : ''}</span>
          </div>
          <div className="bar-tooltip-agents">
            {tooltip.bucket.agentsInRange.sort((a,b) => b[metric]-a[metric]).map((a,i) => (
              <div key={i} className="bar-tooltip-agent">
                <span className="bar-tooltip-name">{a.name}</span>
                <span className="bar-tooltip-val" style={{ color:tooltip.bucket.color }}>{a[metric]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="chart-legend">
        {RANGES.map((r,i) => (
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{ background:r.color }} />
            <span>{r.label} xfers</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const canvasRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')
  const team = APP_CONFIG.teams.find(t => t.id === user?.team)
  const roleLabel = user?.role === 'supervisor' ? 'Supervisor' : user?.role === 'qa' ? 'QA' : user?.role === 'leader' ? 'Team Leader' : 'Member'

  const [liveTeams, setLiveTeams]               = useState([])
  const [liveAsia, setLiveAsia]                 = useState([])
  const [liveAsiaOverview, setLiveAsiaOverview] = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [lastUpdate, setLastUpdate]             = useState(null)
  const [activeTab, setActiveTab]               = useState('general')
  const [asiaView, setAsiaView]                 = useState('stats')
  const [chartMetric, setChartMetric]           = useState('english')
  const [snapshots, setSnapshots]               = useState([])
  const [selectedDate, setSelectedDate]         = useState(todayKey())

  const isToday      = selectedDate === todayKey()
  const activeSnap   = isToday ? null : snapshots.find(s => s.date === selectedDate)
  const teamsData    = isToday ? liveTeams        : (activeSnap?.teamsData    || [])
  const asiaData     = isToday ? liveAsia         : (activeSnap?.asiaData     || [])
  const asiaOverview = isToday ? liveAsiaOverview : (activeSnap?.asiaOverview || null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const particles = []
    const onMove = (e) => {
      for (let i = 0; i < 3; i++) particles.push({
        x: e.clientX+(Math.random()-.5)*20, y: e.clientY+(Math.random()-.5)*20,
        size: Math.random()*3+1, life:1, vx:(Math.random()-.5)*1.5, vy:(Math.random()-.5)*1.5-.5,
      })
    }
    window.addEventListener('mousemove', onMove)
    let raf
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      for (let i = particles.length-1; i>=0; i--) {
        const p = particles[i]; p.life-=.03; p.x+=p.vx; p.y+=p.vy
        if (p.life<=0) { particles.splice(i,1); continue }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2)
        ctx.fillStyle=`rgba(249,115,22,${p.life*.5})`; ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('mousemove',onMove); window.removeEventListener('resize',onResize); cancelAnimationFrame(raf) }
  }, [])

  const loadData = async () => {
    try {
      const [philRows, venezRows, colombRows, mexRows, centralRows, asiaRows] = await Promise.all([
        fetchSheet('AW GARRET PHILIPPINES'),
        fetchSheet('AW GARRET VENEZUELA PATRICIA'),
        fetchSheet('AW GARRET COLOMBIA JUAN GARCIA'),
        fetchSheet('AW GARRET BAJA MX KEVIN'),
        fetchSheet('AW GARRET CENTRAL AMERICA - CAROLINA'),
        fetchSheet('AW GARRET ASIA LEXNER'),
      ])

      const rawSheets = [philRows, venezRows, colombRows, mexRows, centralRows]
      const teams = TEAM_CONFIGS.map((tc, i) => ({ ...tc, ...parseTeamSheet(rawSheets[i], tc) }))

      const asiaLoggedRows = asiaRows.filter(row => isLoggedRow(row[0] || ''))
      let asiaEng = 0, asiaSp = 0, asiaTotal = 0, asiaAgentsCount = 0
      if (asiaLoggedRows.length > 0) {
        for (const row of asiaLoggedRows) {
          asiaSp    += parseInt(row[2]) || 0
          asiaEng   += parseInt(row[3]) || 0
          asiaTotal += parseInt(row[4]) || 0
        }
        const isAfter6pm = new Date().getHours() >= 18
        const agentRow = (isAfter6pm && asiaLoggedRows.length > 1) ? asiaLoggedRows[asiaLoggedRows.length - 1] : asiaLoggedRows[0]
        const m = (agentRow[0] || '').match(/(\d+)/)
        asiaAgentsCount = m ? parseInt(m[1]) : 0
      }

      const asiaOv = { id:'asia', name:'ASIA', flag:'cn', hasSpanish:true, noSpanish:false, agents:asiaAgentsCount, english:asiaEng, spanish:asiaSp, total:asiaTotal }
      const allTeams = [...teams, asiaOv]
      setLiveTeams(allTeams); setLiveAsia(asiaRows); setLiveAsiaOverview(asiaOv)
      setLastUpdate(new Date()); saveSnapshot(allTeams, asiaRows, asiaOv); setSnapshots(loadAllSnapshots())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    setSnapshots(loadAllSnapshots()); loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => { localStorage.removeItem('pulse_user'); window.location.href = '/' }

  const teamsSorted = [...teamsData].sort((a, b) => b.english - a.english)

  const asiaAgents = (() => {
    const agents = []
    for (const row of asiaData) {
      if (isLoggedRow(row[0] || '')) break
      const ext = parseInt(row[1])
      if (!isNaN(ext) && ext > 1000 && ext < 9999 && (row[0] || '').length > 1) {
        agents.push({ name: row[0]?.trim()||'', ext: row[1]?.trim()||'', spanish: parseInt(row[2])||0, english: parseInt(row[3])||0, total: parseInt(row[4])||0 })
      }
    }
    return agents
  })()

  const goal        = APP_CONFIG.dailyGoal
  const hitGoal     = asiaAgents.filter(a => a.english >= goal)
  const atZero      = asiaAgents.filter(a => a.total === 0)
  const top3English = [...asiaAgents].sort((a,b) => b.english-a.english).slice(0,3)
  const top3Spanish = [...asiaAgents].sort((a,b) => b.spanish-a.spanish).slice(0,3)
  const totalEnglish = asiaOverview?.english || 0
  const totalSpanish = asiaOverview?.spanish || 0
  const totalXfers   = asiaOverview?.total   || 0

  const isMyTeam = (teamId) => team?.id === teamId

  const dateTabs = (() => {
    const dates = new Set(snapshots.map(s => s.date)); dates.add(todayKey())
    return [...dates].sort((a,b) => b.localeCompare(a))
  })()

  return (
    <div className="dash-root">
      <canvas ref={canvasRef} className="dash-trail-canvas" />
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <div className="nav-logo-wrap">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="#f97316" />
              <polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="nav-appname">Pulse</span>
        </div>
        <div className="dash-nav-right">
          <div className="nav-user">
            <div className="nav-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="nav-info">
              <span className="nav-name">{user?.name}</span>
              <span className="nav-role">{team?.name} · {roleLabel}</span>
            </div>
          </div>
          {lastUpdate && <span className="nav-update">Updated {lastUpdate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          <button className="nav-logout" onClick={logout}>Log out</button>
        </div>
      </nav>

      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab==='general'?'active':''}`} onClick={()=>setActiveTab('general')}>All Teams</button>
        <button className={`dash-tab ${activeTab==='asia'?'active':''}`} onClick={()=>setActiveTab('asia')}>🌏 Asia</button>
      </div>

      <div className="date-tabs-bar">
        <span className="date-tabs-label">📅</span>
        <div className="date-tabs">
          {dateTabs.map(date => (
            <button key={date} className={`date-tab ${selectedDate===date?'active':''} ${date===todayKey()?'today':''}`} onClick={()=>setSelectedDate(date)}>
              {formatDateLabel(date)}
              {date===todayKey() && <span className="date-tab-live">LIVE</span>}
            </button>
          ))}
        </div>
        {!isToday && activeSnap?.savedAt && <span className="date-snap-info">Snapshot at {new Date(activeSnap.savedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
      </div>

      <div className="dash-content">
        {loading ? (
          <div className="dash-loading"><div className="dash-spinner"/><p>Loading live data...</p></div>
        ) : activeTab==='general' ? (
          <div className="fade-in">
            <h2 className="section-title">
              Auto Warranty Garrett — Teams Overview
              {isToday ? <span className="live-badge">LIVE</span> : <span className="date-badge">{formatDateLabel(selectedDate)}</span>}
            </h2>
            {teamsSorted.length===0 ? <p style={{color:'#6b7280'}}>No data for this date.</p> : (
              <div className="teams-grid">
                {teamsSorted.map((row, rank) => (
                  <div key={rank} className={`team-card-dash ${isMyTeam(row.id)?'highlight':''}`}>
                    <div className="tc-header">
                      <div className="tc-rank-badge">{getTeamRankBadge(rank)}</div>
                      <img src={`https://flagcdn.com/w40/${row.flag}.png`} alt="" className="tc-flag"/>
                      <div>
                        <div className="tc-name">{row.name}</div>
                        <div className="tc-agents">{row.agents} agents active</div>
                      </div>
                    </div>
                    <div className="tc-stats">
                      <div className="tc-stat"><span className="tc-val english">{row.english.toLocaleString()}</span><span className="tc-label">English</span></div>
                      <div className="tc-stat"><span className="tc-val spanish">{row.noSpanish ? '—' : row.spanish.toLocaleString()}</span><span className="tc-label">Spanish</span></div>
                      <div className="tc-stat"><span className="tc-val total">{row.total.toLocaleString()}</span><span className="tc-label">Total</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="fade-in">
            <div className="asia-header-row">
              <h2 className="section-title">
                Asia — Agent Detail
                {isToday ? <span className="live-badge">LIVE</span> : <span className="date-badge">{formatDateLabel(selectedDate)}</span>}
              </h2>
              <div className="asia-view-tabs">
                <button className={`view-tab ${asiaView==='stats'?'active':''}`} onClick={()=>setAsiaView('stats')}>📊 Stats</button>
                <button className={`view-tab ${asiaView==='charts'?'active':''}`} onClick={()=>setAsiaView('charts')}>📈 Charts</button>
              </div>
            </div>
            <div className="summary-grid">
              <div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal (≥{goal} EN)</div></div>
              <div className="sum-card orange"><div className="sum-val">{asiaAgents.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>
              <div className="sum-card red"><div className="sum-val">{atZero.length}</div><div className="sum-label">At Zero</div></div>
              <div className="sum-card blue"><div className="sum-val">{totalXfers.toLocaleString()}</div><div className="sum-label">EN: {totalEnglish} · SP: {totalSpanish} · Total: {totalXfers}</div></div>
            </div>
            {asiaView==='stats' ? (
              <>
                <div className="tops-row">
                  <div className="top-block">
                    <h3 className="top-title"><Img src={E.goal} size={16}/> Top English</h3>
                    {top3English.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name">{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score english">{a.english}</span></div>))}
                  </div>
                  <div className="top-block">
                    <h3 className="top-title"><Img src={E.goal} size={16}/> Top Spanish</h3>
                    {top3Spanish.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name">{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score spanish">{a.spanish}</span></div>))}
                  </div>
                  <div className="top-block red-block">
                    <h3 className="top-title"><Img src={E.zero} size={16}/> At Zero</h3>
                    {atZero.length===0
                      ? <p className="top-empty"><Img src={E.firework} size={16}/> Everyone has transfers!</p>
                      : atZero.slice(0,3).map((a,i)=>(<div key={i} className="top-item"><span className="top-name">{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score red">0</span></div>))
                    }
                  </div>
                </div>
                <div className="agent-table-wrap">
                  <table className="agent-table">
                    <thead><tr><th>#</th><th>Agent</th><th>Ext</th><th>English</th><th>Spanish</th><th>Total</th><th>Goal</th></tr></thead>
                    <tbody>
                      {[...asiaAgents].sort((a,b)=>b.english-a.english).map((a,i)=>{
                        const rs = i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'}
                        return (
                          <tr key={i} className={a.total===0?'row-zero':a.english>=goal?'row-goal':''}>
                            <td style={rs}>#{i+1}</td>
                            <td className="agent-name">{a.name}</td><td className="agent-ext">{a.ext}</td>
                            <td className="val-english">{a.english}</td><td className="val-spanish">{a.spanish}</td><td className="val-total">{a.total}</td>
                            <td>{a.english>=goal?<span className="badge-goal">✓ Goal</span>:<span className="badge-pending">{goal-a.english} left</span>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="charts-section">
                <div className="chart-controls">
                  <span className="chart-label">Distribution by transfers:</span>
                  <div className="metric-tabs">
                    <button className={`metric-tab ${chartMetric==='english'?'active':''}`} onClick={()=>setChartMetric('english')}>English</button>
                    <button className={`metric-tab ${chartMetric==='spanish'?'active':''}`} onClick={()=>setChartMetric('spanish')}>Spanish</button>
                    <button className={`metric-tab ${chartMetric==='total'?'active':''}`} onClick={()=>setChartMetric('total')}>Total</button>
                  </div>
                </div>
                <BarChart agents={asiaAgents} metric={chartMetric}/>
                <div className="chart-goal-row">
                  <div className="goal-stat green-stat"><div className="goal-stat-val">{hitGoal.length}</div><div className="goal-stat-label"><Img src={E.goal} size={14}/> Reached goal (20+ EN)</div></div>
                  <div className="goal-stat yellow-stat"><div className="goal-stat-val">{asiaAgents.filter(a=>a.english>=15&&a.english<20).length}</div><div className="goal-stat-label">Almost there (15–19 EN)</div></div>
                  <div className="goal-stat red-stat"><div className="goal-stat-val">{atZero.length}</div><div className="goal-stat-label"><Img src={E.zero} size={14}/> At zero</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}