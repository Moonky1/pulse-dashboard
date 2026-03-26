import { useEffect, useState, useRef } from 'react'
import { APP_CONFIG } from '../config'
import './dashboard.css'

const SHEET_ID         = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const USERS_SHEET_ID   = '1d6j3FEPnFzE-fAl0K6O43apdbNvB0NzbLSJLEJF-TxI'
const HISTORY_SHEET_ID = '1u_5CLPEonZGarvaXU3Uwwx-nczElf5td3iKLRfQOVYU'

// totalIdx = 0-based row index in CSV = Sheets row number - 1
// 23/03: C65 → idx 64 | 20/03: C64 → idx 63 | 19/03: C67 → idx 66
// 18/03: C65 → idx 64 | 17/03: C67 → idx 66 | 16/03: C73 → idx 72
const HISTORY_DATES = [
  { isoDate:'2026-03-14', tab:'14032026', slackLabel:'14/03/2026', totalIdx: null }, // auto
  { isoDate:'2026-03-16', tab:'16032026', slackLabel:'16/03/2026', totalIdx: 72   }, // row 73
  { isoDate:'2026-03-17', tab:'17032026', slackLabel:'17/03/2026', totalIdx: 66   }, // row 67
  { isoDate:'2026-03-18', tab:'18032026', slackLabel:'18/03/2026', totalIdx: 64   }, // row 65
  { isoDate:'2026-03-19', tab:'19032026', slackLabel:'19/03/2026', totalIdx: 66   }, // row 67
  { isoDate:'2026-03-20', tab:'20032026', slackLabel:'20/03/2026', totalIdx: 63   }, // row 64
  { isoDate:'2026-03-21', tab:'21032026', slackLabel:'21/03/2026', totalIdx: null }, // auto
  { isoDate:'2026-03-23', tab:'23032026', slackLabel:'23/03/2026', totalIdx: 64   }, // row 65
]
const HISTORY_ISO_SET = new Set(HISTORY_DATES.map(d => d.isoDate))

const csvUrl = (sheetId, sheet) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

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

async function fetchSheet(sheetId, name) {
  const res  = await fetch(csvUrl(sheetId, name))
  const text = await res.text()
  return parseCSV(text)
}

const safeInt = (val) => parseInt((val||'').toString().replace(/,/g,'')) || 0

const countPhones = (cell) => {
  if (!cell) return 0
  return cell.split('/').filter(p => p.trim().length > 0).length || 1
}

const extractPhones = (cell) => {
  if (!cell) return []
  return cell.split('/').map(p => p.trim().replace(/^tel:/i,'')).filter(p => p.length > 0)
}

const TEAMS_ORDER = ['PHILIPPINES','VENEZUELA','COLOMBIA','MEXICO BAJA','CENTRAL AMERICA','ASIA']

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
const Img = ({ src, size=18 }) => (
  <img src={src} width={size} height={size} style={{display:'inline-block',verticalAlign:'middle',objectFit:'contain'}} />
)
const MEDALS = [E.medal1, E.medal2, E.medal3]

const getTeamRankBadge = (rank) => {
  if (rank===0) return <Img src={E.goal1} size={26}/>
  if (rank===1) return <Img src={E.goal3} size={26}/>
  if (rank===2) return <Img src={E.goal4} size={26}/>
  return <span style={{color:'#6b7280',fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:14}}>#{rank+1}</span>
}

const todayKey = () => new Date().toISOString().slice(0,10)

const saveSnapshot = (generalData, asiaData) => {
  const key = `pulse_snap_${todayKey()}`
  try { localStorage.setItem(key, JSON.stringify({generalData,asiaData,savedAt:new Date().toISOString()})) } catch(e) {}
}

const loadAllSnapshots = () => {
  const snaps = []
  for (let i=0; i<localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('pulse_snap_')) {
      try {
        const date = k.replace('pulse_snap_','')
        const data = JSON.parse(localStorage.getItem(k))
        snaps.push({date,...data})
      } catch(e) {}
    }
  }
  return snaps.sort((a,b) => b.date.localeCompare(a.date))
}

const formatDateLabel = (dateStr) => {
  const today = todayKey()
  const yest = new Date(); yest.setDate(yest.getDate()-1)
  const yKey = yest.toISOString().slice(0,10)
  if (dateStr===today) return 'Today'
  if (dateStr===yKey)  return 'Yesterday'
  const [y,m,d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// Parse history sheet using exact 0-based row index for totals
function parseHistorySheet(rows, totalIdx) {
  const agents = []
  let totals = {spanish:0,english:0,total:0,activeAgents:0}

  // If exact index given, read that row directly
  if (totalIdx !== null && totalIdx !== undefined && rows[totalIdx]) {
    const tRow = rows[totalIdx]
    const sp = safeInt(tRow[2])  // col C
    const en = safeInt(tRow[3])  // col D
    totals = { spanish: sp, english: en, total: sp + en, activeAgents: 0 }

    // Parse agents from rows above totalIdx
    for (let i = 0; i < totalIdx; i++) {
      const row    = rows[i]
      const name   = (row[0]||'').trim()
      const nameUp = name.toUpperCase()
      if (nameUp.includes('MANAGEMENT')||nameUp.includes('CALLS')||nameUp.includes('TRANSFERS')||nameUp.includes('LEXNER')||name.length<=1) continue
      const ext = safeInt(row[1])
      if (ext < 1000 || ext > 9999) continue
      const sp2 = safeInt(row[2]), en2 = safeInt(row[3])
      agents.push({name, ext:String(ext), spanish:sp2, english:en2, total:sp2+en2})
    }
    totals.activeAgents = agents.length
  } else {
    // Auto-detect: find "AGENT LOGGED" row
    for (const row of rows) {
      const name   = (row[0]||'').trim()
      const nameUp = name.toUpperCase()
      if (nameUp.includes('AGENT') && nameUp.includes('LOGGED')) {
        const sp = safeInt(row[2]), en = safeInt(row[3])
        totals = {activeAgents: agents.length, spanish:sp, english:en, total:sp+en}
        break
      }
      if (nameUp.includes('MANAGEMENT')||nameUp.includes('CALLS')||nameUp.includes('TRANSFERS')||nameUp.includes('LEXNER')||name.length<=1) continue
      const ext = safeInt(row[1])
      if (ext < 1000 || ext > 9999) continue
      const sp = safeInt(row[2]), en = safeInt(row[3])
      agents.push({name, ext:String(ext), spanish:sp, english:en, total:sp+en})
    }
  }

  return {agents, totals}
}

function BarChart({agents, metric}) {
  const [tooltip, setTooltip] = useState(null)
  const buckets = RANGES.map(r => ({
    ...r,
    agentsInRange: agents.filter(a => a[metric]>=r.min && a[metric]<=r.max),
    count: agents.filter(a => a[metric]>=r.min && a[metric]<=r.max).length,
  }))
  const maxCount = Math.max(...buckets.map(b=>b.count),1)
  return (
    <div className="chart-wrap">
      <div className="chart-bars">
        {buckets.map((b,i)=>(
          <div key={i} className={`chart-col ${b.count>0?'chart-col-hoverable':''}`}
            onMouseEnter={(e)=>{
              if(!b.count)return
              const r=e.currentTarget.getBoundingClientRect()
              setTooltip({bucket:b,x:r.left+r.width/2,y:r.top,side:r.left>window.innerWidth/2?'left':'right'})
            }}
            onMouseLeave={()=>setTooltip(null)}>
            <div className="bar-count">{b.count}</div>
            <div className="bar-outer"><div className="bar-inner" style={{height:`${(b.count/maxCount)*100}%`,background:b.color}}/></div>
            <div className="bar-label">{b.label}</div>
          </div>
        ))}
      </div>
      {tooltip && (
        <div className="bar-tooltip" style={{
          left: tooltip.side==='left' ? tooltip.x - 20 : tooltip.x + 20,
          top: tooltip.y,
          transform: tooltip.side==='left'
            ? 'translate(-100%, calc(-100% - 12px))'
            : 'translate(0%, calc(-100% - 12px))',
        }}>
          <div className="bar-tooltip-header" style={{color:tooltip.bucket.color}}>
            <span>{tooltip.bucket.label} xfers</span>
            <span className="bar-tooltip-count">{tooltip.bucket.count} agent{tooltip.bucket.count!==1?'s':''}</span>
          </div>
          <div className="bar-tooltip-agents-list">
            {tooltip.bucket.agentsInRange.sort((a,b)=>b[metric]-a[metric]).map((a,i)=>(
              <div key={i} className="bar-tooltip-agent-row">
                <span className="bar-tooltip-name">{a.name}</span>
                <span className="bar-tooltip-val" style={{color:tooltip.bucket.color}}>{a[metric]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="chart-legend">
        {RANGES.map((r,i)=>(
          <div key={i} className="legend-item">
            <div className="legend-dot" style={{background:r.color}}/>
            <span>{r.label} xfers</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const canvasRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('pulse_user')||'null')
  const team = APP_CONFIG.teams.find(t => t.id===user?.team)
  const roleLabel = user?.role==='supervisor'?'Supervisor':user?.role==='qa'?'QA':user?.role==='leader'?'Team Leader':'Member'

  const [liveGeneral, setLiveGeneral]     = useState([])
  const [liveAsia, setLiveAsia]           = useState([])
  const [slacksData, setSlacksData]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [lastUpdate, setLastUpdate]       = useState(null)
  const [activeTab, setActiveTab]         = useState('general')
  const [asiaView, setAsiaView]           = useState('stats')
  const [chartMetric, setChartMetric]     = useState('english')
  const [snapshots, setSnapshots]         = useState([])
  const [selectedDate, setSelectedDate]   = useState(todayKey())
  const [editingAgent, setEditingAgent]   = useState(null)
  const [editForm, setEditForm]           = useState({})
  const [overridesTick, setOverridesTick] = useState(0)
  const [histCache, setHistCache]         = useState({})
  const [histLoading, setHistLoading]     = useState(false)
  const [expandedAgent, setExpandedAgent] = useState(null)

  const isToday    = selectedDate === todayKey()
  const isHistDate = HISTORY_ISO_SET.has(selectedDate)
  const histMeta   = HISTORY_DATES.find(d => d.isoDate===selectedDate)
  const activeSnap = (!isToday && !isHistDate) ? snapshots.find(s => s.date===selectedDate) : null

  const asiaDataRaw    = isToday ? liveAsia    : (activeSnap?.asiaData    || [])
  const generalDataRaw = isToday ? liveGeneral : (activeSnap?.generalData || [])
  const histParsed     = isHistDate ? (histCache[selectedDate] || null) : null

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const particles = []
    const onMove = (e) => {
      for (let i=0;i<3;i++) particles.push({
        x:e.clientX+(Math.random()-.5)*20, y:e.clientY+(Math.random()-.5)*20,
        size:Math.random()*3+1, life:1, vx:(Math.random()-.5)*1.5, vy:(Math.random()-.5)*1.5-.5,
      })
    }
    window.addEventListener('mousemove',onMove)
    let raf
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      for (let i=particles.length-1;i>=0;i--) {
        const p=particles[i]; p.life-=.03; p.x+=p.vx; p.y+=p.vy
        if(p.life<=0){particles.splice(i,1);continue}
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2)
        ctx.fillStyle=`rgba(249,115,22,${p.life*.5})`; ctx.fill()
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    const onResize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight}
    window.addEventListener('resize',onResize)
    return ()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('resize',onResize);cancelAnimationFrame(raf)}
  },[])

  const loadData = async () => {
    try {
      const [general, asia, slacks] = await Promise.all([
        fetchSheet(SHEET_ID,"WELL'S REPORT"),
        fetchSheet(SHEET_ID,'AW GARRET ASIA LEXNER'),
        fetchSheet(USERS_SHEET_ID,'Slacks'),
      ])
      setLiveGeneral(general); setLiveAsia(asia); setLastUpdate(new Date())
      saveSnapshot(general,asia); setSnapshots(loadAllSnapshots())
      setSlacksData(slacks.slice(1).filter(r=>r[0]&&r[1]))
    } catch(e){console.error(e)}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    setSnapshots(loadAllSnapshots()); loadData()
    const iv=setInterval(loadData,60000)
    return ()=>clearInterval(iv)
  },[])

  // Load history via gviz — same endpoint that works
  useEffect(()=>{
    if (!isHistDate||!histMeta||histCache[selectedDate]) return
    setHistLoading(true)
    fetchSheet(HISTORY_SHEET_ID, histMeta.tab)
      .then(rows => {
        const parsed = parseHistorySheet(rows, histMeta.totalIdx)
        setHistCache(c=>({...c,[selectedDate]:parsed}))
      })
      .catch(console.error)
      .finally(()=>setHistLoading(false))
  },[selectedDate])

  const logout = () => { localStorage.removeItem('pulse_user'); window.location.href='/' }

  // ── Well's Report ──
  const teamRows = (() => {
    const found = []
    for (const row of generalDataRaw) {
      const name = row[0]?.toUpperCase().trim()
      if (TEAMS_ORDER.some(t=>name===t)) {
        if (!found.find(f=>f.name.toUpperCase()===name)) {
          const rawSpanish = row[4]?.trim()
          found.push({
            name:row[0]?.trim()||'', agents:safeInt(row[2]),
            english:safeInt(row[3]), spanish:safeInt(rawSpanish),
            total:safeInt(row[5]), noSpanish:rawSpanish==='-'||rawSpanish===''||!rawSpanish,
          })
        }
      }
      if (found.length===6) break
    }
    return found
  })()
  const teamsSorted = [...teamRows].sort((a,b)=>b.english-a.english)

  // ── Asia agents ──
  const {asiaAgents, asiaTotals} = (() => {
    if (isHistDate && histParsed) {
      return {asiaAgents:histParsed.agents, asiaTotals:histParsed.totals}
    }
    const agents = []
    let totals = {spanish:0,english:0,total:0,activeAgents:0}
    for (const row of asiaDataRaw) {
      const name=(row[0]||'').trim(), nameUp=name.toUpperCase()
      if (nameUp.includes('AGENT LOGGED')||nameUp.includes('LOGGED IN')) {
        const sp=safeInt(row[2]), en=safeInt(row[3])
        totals={activeAgents:agents.length,spanish:sp,english:en,total:sp+en}
        break
      }
      if (nameUp.includes('REMOVED')||nameUp.includes('REMOVE')) break
      const ext=safeInt(row[1])
      if (isNaN(ext)||ext<1000||ext>9999) continue
      if (name.length<=1) continue
      const sp=safeInt(row[2]), en=safeInt(row[3])
      agents.push({name,ext:String(ext),spanish:sp,english:en,total:sp+en})
    }
    return {asiaAgents:agents,asiaTotals:totals}
  })()

  const asiaAgentsFinal = (() => {
    if (isToday||isHistDate) return asiaAgents
    void overridesTick
    const overrides=JSON.parse(localStorage.getItem(`pulse_overrides_${selectedDate}`)||'{}')
    return asiaAgents.map(a=>overrides[a.ext]?{...a,...overrides[a.ext]}:a)
  })()

  const saveAgentEdit = () => {
    const overrides=JSON.parse(localStorage.getItem(`pulse_overrides_${selectedDate}`)||'{}')
    const en=parseInt(editForm.english)||0, sp=parseInt(editForm.spanish)||0
    overrides[editingAgent.ext]={name:editingAgent.name,spanish:sp,english:en,total:en+sp}
    localStorage.setItem(`pulse_overrides_${selectedDate}`,JSON.stringify(overrides))
    setEditingAgent(null); setSnapshots(loadAllSnapshots()); setOverridesTick(t=>t+1)
  }

  const goal = APP_CONFIG.dailyGoal

  const totalSpanish = isToday ? asiaTotals.spanish : (isHistDate ? asiaTotals.spanish : asiaAgentsFinal.reduce((s,a)=>s+a.spanish,0))
  const totalEnglish = isToday ? asiaTotals.english : (isHistDate ? asiaTotals.english : asiaAgentsFinal.reduce((s,a)=>s+a.english,0))
  const totalXfers   = totalSpanish + totalEnglish

  const hitGoal     = asiaAgentsFinal.filter(a=>a.english>=goal)
  const atZero      = asiaAgentsFinal.filter(a=>a.total===0)
  const top3English = [...asiaAgentsFinal].sort((a,b)=>b.english-a.english).slice(0,3)
  const top3Spanish = [...asiaAgentsFinal].sort((a,b)=>b.spanish-a.spanish).slice(0,3)

  // ── Slacks ──
  const slackLabelForDate = (iso) => {
    const hd=HISTORY_DATES.find(d=>d.isoDate===iso)
    if (hd) return hd.slackLabel
    const [y,m,d]=iso.split('-')
    return `${d}/${m}/${y}`
  }
  const currentSlackLabel  = slackLabelForDate(selectedDate)
  const slackRowsForDate   = slacksData.filter(r => r[0]?.trim() === currentSlackLabel)

  const buildSlackAgents = (rows) => {
    const map = {}
    for (const row of rows) {
      const agent=(row[1]||'').trim(), opener=(row[2]||'').trim(), call=(row[3]||'').trim()
      if (!agent) continue
      if (!map[agent]) map[agent]={agent,opener,reports:0,phones:[]}
      map[agent].reports+=1
      extractPhones(call).forEach(p=>{ if(p && !map[agent].phones.includes(p)) map[agent].phones.push(p) })
    }
    return Object.values(map).sort((a,b)=>b.reports-a.reports)
  }
  const slackAgentsForDate  = buildSlackAgents(slackRowsForDate)
  const topAgent            = slackAgentsForDate[0] || null
  const totalReportsForDate = slackRowsForDate.length

  const getFlag = (name) => {
    const n=name.toUpperCase()
    if(n.includes('PHIL'))return'ph'; if(n.includes('VENE'))return've'
    if(n.includes('COLOM'))return'co'; if(n.includes('MEXICO'))return'mx'
    if(n.includes('CENTRAL'))return'hn'; if(n.includes('ASIA'))return'cn'
    return'un'
  }
  const isMyTeam = (name) => {
    const n=name.toUpperCase()
    return (team?.id==='asia'&&n.includes('ASIA'))||(team?.id==='philippines'&&n.includes('PHIL'))||
           (team?.id==='venezuela'&&n.includes('VENE'))||(team?.id==='colombia'&&n.includes('COLOM'))||
           (team?.id==='mexico'&&n.includes('MEXICO'))||(team?.id==='central'&&n.includes('CENTRAL'))
  }

  const dateTabs = (() => {
    const dates = new Set()
    dates.add(todayKey())
    snapshots.forEach(s=>dates.add(s.date))
    HISTORY_DATES.forEach(d=>dates.add(d.isoDate))
    return [...dates].sort((a,b)=>b.localeCompare(a))
  })()

  const showEditBtn = !isToday && !isHistDate

  return (
    <div className="dash-root">
      <canvas ref={canvasRef} className="dash-trail-canvas"/>
      <nav className="dash-nav">
        <div className="dash-nav-left">
          <div className="nav-logo-wrap">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="#f97316"/>
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
        <button className={`dash-tab ${activeTab==='asia'?'active':''}`}    onClick={()=>setActiveTab('asia')}>🌏 Asia</button>
      </div>

      <div className="date-tabs-bar">
        <span className="date-tabs-label">📅</span>
        <div className="date-tabs">
          {dateTabs.map(date=>(
            <button
              key={date}
              className={`date-tab ${selectedDate===date?'active':''} ${date===todayKey()?'today':''} ${HISTORY_ISO_SET.has(date)?'history-tab':''}`}
              onClick={()=>setSelectedDate(date)}
            >
              {formatDateLabel(date)}
              {date===todayKey() && <span className="date-tab-live">LIVE</span>}
              {HISTORY_ISO_SET.has(date) && <span className="date-tab-hist">H</span>}
            </button>
          ))}
        </div>
        {!isToday && !isHistDate && activeSnap?.savedAt && (
          <span className="date-snap-info">Snapshot at {new Date(activeSnap.savedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
        )}
        {isHistDate && <span className="date-snap-info">Historical record</span>}
      </div>

      <div className="dash-content">
        {loading ? (
          <div className="dash-loading"><div className="dash-spinner"/><p>Loading live data...</p></div>
        ) : activeTab==='general' ? (
          <div className="fade-in">
            <h2 className="section-title">
              Auto Warranty Garrett — Teams Overview
              {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{formatDateLabel(selectedDate)}</span>}
            </h2>
            {teamsSorted.length===0?<p style={{color:'#6b7280'}}>No data for this date.</p>:(
              <div className="teams-grid">
                {teamsSorted.map((row,rank)=>(
                  <div key={rank} className={`team-card-dash ${isMyTeam(row.name)?'highlight':''}`}>
                    <div className="tc-header">
                      <div className="tc-rank-badge">{getTeamRankBadge(rank)}</div>
                      <img src={`https://flagcdn.com/w40/${getFlag(row.name)}.png`} alt="" className="tc-flag"/>
                      <div>
                        <div className="tc-name">{row.name}</div>
                        <div className="tc-agents">{row.agents} agents active</div>
                      </div>
                    </div>
                    <div className="tc-stats">
                      <div className="tc-stat"><span className="tc-val english">{row.english.toLocaleString()}</span><span className="tc-label">English</span></div>
                      <div className="tc-stat"><span className="tc-val spanish">{row.noSpanish?'—':row.spanish.toLocaleString()}</span><span className="tc-label">Spanish</span></div>
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
                {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{formatDateLabel(selectedDate)}</span>}
              </h2>
              <div className="asia-view-tabs">
                <button className={`view-tab ${asiaView==='stats'?'active':''}`}  onClick={()=>setAsiaView('stats')}>📊 Stats</button>
                <button className={`view-tab ${asiaView==='charts'?'active':''}`} onClick={()=>setAsiaView('charts')}>📈 Charts</button>
                <button className={`view-tab ${asiaView==='slacks'?'active':''}`} onClick={()=>setAsiaView('slacks')}>💬 Slacks</button>
              </div>
            </div>

            {asiaView!=='slacks' && (
              histLoading
                ? <div style={{color:'#6b7280',padding:'2rem',textAlign:'center'}}>Loading historical data...</div>
                : (
                  <div className="summary-grid">
                    <div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal (≥{goal} EN)</div></div>
                    <div className="sum-card orange"><div className="sum-val">{asiaAgentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>
                    <div className="sum-card teal"><div className="sum-val">{totalSpanish.toLocaleString()}</div><div className="sum-label">Spanish Xfers</div></div>
                    <div className="sum-card blue"><div className="sum-val">{totalEnglish.toLocaleString()}</div><div className="sum-label">English Xfers</div></div>
                    <div className="sum-card indigo"><div className="sum-val">{totalXfers.toLocaleString()}</div><div className="sum-label">Total Xfers</div></div>
                  </div>
                )
            )}

            {asiaView==='stats' && !histLoading && (
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
                      ?<p className="top-empty"><Img src={E.firework} size={16}/> Everyone has transfers!</p>
                      :atZero.slice(0,3).map((a,i)=>(<div key={i} className="top-item"><span className="top-name">{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score red">0</span></div>))
                    }
                  </div>
                </div>
                <div className="agent-table-wrap">
                  <table className="agent-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Agent</th><th>Ext</th>
                        <th>English</th><th>Spanish</th><th>Total</th><th>Goal</th>
                        {showEditBtn&&<th className="th-edit"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[...asiaAgentsFinal].sort((a,b)=>b.english-a.english).map((a,i)=>{
                        const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'}
                        return(
                          <tr key={i} className={a.total===0?'row-zero':a.english>=goal?'row-goal':''}>
                            <td style={rs}>#{i+1}</td>
                            <td className="agent-name">{a.name}</td>
                            <td className="agent-ext">{a.ext}</td>
                            <td className="val-english">{a.english}</td>
                            <td className="val-spanish">{a.spanish}</td>
                            <td className="val-total">{a.english+a.spanish}</td>
                            <td>{a.english>=goal?<span className="badge-goal">✓ Goal</span>:<span className="badge-pending">{goal-a.english} left</span>}</td>
                            {showEditBtn&&(
                              <td className="td-edit">
                                <button className="edit-agent-btn" title="Edit" onClick={e=>{e.stopPropagation();setEditForm({spanish:a.spanish,english:a.english});setEditingAgent(a)}}>✏️</button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {asiaView==='charts' && !histLoading && (
              <div className="charts-section">
                <div className="chart-controls">
                  <span className="chart-label">Distribution by transfers:</span>
                  <div className="metric-tabs">
                    <button className={`metric-tab ${chartMetric==='english'?'active':''}`} onClick={()=>setChartMetric('english')}>English</button>
                    <button className={`metric-tab ${chartMetric==='spanish'?'active':''}`} onClick={()=>setChartMetric('spanish')}>Spanish</button>
                    <button className={`metric-tab ${chartMetric==='total'?'active':''}`}   onClick={()=>setChartMetric('total')}>Total</button>
                  </div>
                </div>
                <BarChart agents={asiaAgentsFinal} metric={chartMetric}/>
                <div className="chart-goal-row">
                  <div className="goal-stat green-stat"><div className="goal-stat-val">{hitGoal.length}</div><div className="goal-stat-label"><Img src={E.goal} size={14}/> Reached goal (20+ EN)</div></div>
                  <div className="goal-stat yellow-stat"><div className="goal-stat-val">{asiaAgentsFinal.filter(a=>a.english>=15&&a.english<20).length}</div><div className="goal-stat-label">Almost there (15–19 EN)</div></div>
                  <div className="goal-stat red-stat"><div className="goal-stat-val">{atZero.length}</div><div className="goal-stat-label"><Img src={E.zero} size={14}/> At zero</div></div>
                </div>
              </div>
            )}

            {asiaView==='slacks' && (
              <div className="slacks-section">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:'1.5rem'}}>
                  <div className="sum-card blue"><div className="sum-val">{slackAgentsForDate.length}</div><div className="sum-label">Agents</div></div>
                  <div className="sum-card gold"><div className="sum-val">{totalReportsForDate}</div><div className="sum-label">Total Reports</div></div>
                  <div className="sum-card green">
                    {topAgent
                      ?<><div className="sum-val" style={{fontSize:15,paddingTop:6,lineHeight:1.3}}>{topAgent.agent}</div><div className="sum-label">Top Agent ({topAgent.reports} reports)</div></>
                      :<><div className="sum-val">—</div><div className="sum-label">Top Agent</div></>
                    }
                  </div>
                </div>
                {slackRowsForDate.length===0?(
                  <div style={{background:'#181b23',border:'0.5px solid #2a2d38',borderRadius:12,padding:'3rem',textAlign:'center',color:'#6b7280'}}>
                    No slack reports for {formatDateLabel(selectedDate)}.
                  </div>
                ):(
                  <>
                    <h3 style={{fontFamily:"'Sora',sans-serif",fontSize:13,color:'#9ca3af',marginBottom:12}}>
                      Agent Summary — {formatDateLabel(selectedDate)}
                    </h3>
                    <div className="agent-table-wrap">
                      <table className="agent-table">
                        <thead>
                          <tr><th>#</th><th>Agent</th><th>ID Opener</th><th style={{textAlign:'center'}}>Reports</th><th>Calls</th></tr>
                        </thead>
                        <tbody>
                          {slackAgentsForDate.map((a,i)=>{
                            const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'}
                            const isExpanded=expandedAgent===a.agent
                            return(
                              <tr key={i}>
                                <td style={rs}>#{i+1}</td>
                                <td className="agent-name">{a.agent}</td>
                                <td className="agent-ext">{a.opener}</td>
                                <td style={{textAlign:'center',color:'#f97316',fontWeight:700,fontSize:15}}>{a.reports}</td>
                                <td>
                                  <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                                    {(isExpanded?a.phones:a.phones.slice(0,3)).map((p,j)=>(
                                      <span key={j} className="phone-chip">{p}</span>
                                    ))}
                                    {a.phones.length>3&&(
                                      <button onClick={()=>setExpandedAgent(isExpanded?null:a.agent)} className="phone-more-btn">
                                        {isExpanded?'▲ less':`+${a.phones.length-3} more`}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {editingAgent&&(
        <div className="edit-modal-overlay" style={{zIndex:1001}} onClick={()=>setEditingAgent(null)}>
          <div className="edit-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="edit-modal-title">
              Edit — {editingAgent.name}
              <span style={{color:'#6b7280',fontSize:12,fontWeight:400}}>#{editingAgent.ext}</span>
            </h3>
            <div className="edit-modal-fields">
              <label>English<input type="number" value={editForm.english} onChange={e=>setEditForm(f=>({...f,english:e.target.value}))}/></label>
              <label>Spanish<input type="number" value={editForm.spanish} onChange={e=>setEditForm(f=>({...f,spanish:e.target.value}))}/></label>
            </div>
            <div className="edit-modal-actions">
              <button className="btn-cancel" onClick={()=>setEditingAgent(null)}>Cancel</button>
              <button className="btn-save"   onClick={saveAgentEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}