import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './dashboard.css'

const SHEET_ID         = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const USERS_SHEET_ID   = '1d6j3FEPnFzE-fAl0K6O43apdbNvB0NzbLSJLEJF-TxI'
const HISTORY_SHEET_ID = '1u_5CLPEonZGarvaXU3Uwwx-nczElf5td3iKLRfQOVYU'
const SCRIPT_URL       = 'https://script.google.com/macros/s/AKfycbwmiLdRPyx6IU65p8nW7A3lEncOBr74XIsP-9nsRkxZe2-GF6sqZgvfeS82EK_cTnve/exec'

const HISTORY_DATES = [
  { isoDate:'2026-03-14', tab:'14032026', slackLabel:'14/03/2026' },
  { isoDate:'2026-03-16', tab:'16032026', slackLabel:'16/03/2026' },
  { isoDate:'2026-03-17', tab:'17032026', slackLabel:'17/03/2026' },
  { isoDate:'2026-03-18', tab:'18032026', slackLabel:'18/03/2026' },
  { isoDate:'2026-03-19', tab:'19032026', slackLabel:'19/03/2026' },
  { isoDate:'2026-03-20', tab:'20032026', slackLabel:'20/03/2026' },
  { isoDate:'2026-03-21', tab:'21032026', slackLabel:'21/03/2026' },
  { isoDate:'2026-03-23', tab:'23032026', slackLabel:'23/03/2026' },
]
const HISTORY_ISO_SET = new Set(HISTORY_DATES.map(d => d.isoDate))

// ── Team config — explicit column indices ──
// colEn/colSp are 0-based index in the CSV row
// Philippines: no openers → A=name, B=ext, C=english
// Colombia/Central/Venezuela: has openers → A=name, B=ext, C=openers, D=english, E=spanish
// Mexico: has openers, no spanish → A=name, B=ext, C=openers, D=english
const TEAM_SHEETS = [
  { id:'philippines', label:'🇵🇭 Philippines', sheetName:'AW GARRET PHILIPPINES',               extStart:'1', hasSp:false, goal:10, flag:'ph', colEn:2, colSp:null },
  { id:'colombia',    label:'🇨🇴 Colombia',    sheetName:'AW GARRET COLOMBIA JUAN GARCIA',       extStart:'2', hasSp:true,  goal:10, flag:'co', colEn:3, colSp:4   },
  { id:'central',     label:'🌎 Central',      sheetName:'AW GARRET CENTRAL AMERICA - CAROLINA', extStart:'4', hasSp:true,  goal:10, flag:'hn', colEn:3, colSp:4   },
  { id:'mexico',      label:'🇲🇽 Mexico',      sheetName:'AW GARRET BAJA MX KEVIN',              extStart:'5', hasSp:false, goal:10, flag:'mx', colEn:3, colSp:null },
  { id:'venezuela',   label:'🇻🇪 Venezuela',   sheetName:'AW GARRET VENEZUELA PATRICIA',         extStart:'6', hasSp:true,  goal:10, flag:'ve', colEn:3, colSp:4   },
]

const csvUrl = (sheetId, sheet) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result=[]; let current=''; let inQuotes=false
    for(let i=0;i<row.length;i++){if(row[i]==='"'){inQuotes=!inQuotes;continue}if(row[i]===','&&!inQuotes){result.push(current.trim());current='';continue}current+=row[i]}
    result.push(current.trim()); return result
  })
}

async function fetchSheet(sheetId, name) {
  const res  = await fetch(csvUrl(sheetId, name))
  const text = await res.text()
  if (!text || text.trim().startsWith('<!') || text.trim().length < 10) {
    throw new Error(`Sheet "${name}" returned no valid CSV data`)
  }
  return parseCSV(text)
}

const safeInt = (val) => parseInt((val||'').toString().replace(/,/g,'')) || 0
const extractPhones = (cell) => {
  if (!cell) return []
  return cell.split('/').map(p => p.trim().replace(/^tel:/i,'')).filter(p => p.length >= 7)
}

// ── Generic team sheet parser — bullet-proof version ──
function parseTeamSheet(rows, config) {
  const { extStart, hasSp, colEn, colSp } = config
  if (!rows || !Array.isArray(rows) || rows.length === 0)
    return { agents: [], totals: { english:0, spanish:0, total:0, activeAgents:0 } }

  const agents = []
  let totals = { english:0, spanish:0, total:0, activeAgents:0 }
  let foundTotal = false

  for (let i = 0; i < rows.length; i++) {
    const row   = rows[i]
    if (!Array.isArray(row)) continue
    const cell0 = (row[0]||'').toString().trim()
    const cell0U = cell0.toUpperCase()

    // Detect totals row — "34 AGENTS LOGGED", "83 Agents Logged in", "AGENTS LOG IN", "TOTAL TRANSFERS"
    if (
      (cell0U.includes('AGENT') && (cell0U.includes('LOGGED') || cell0U.includes('LOG IN'))) ||
      (cell0U.includes('TOTAL') && cell0U.includes('TRANSFER'))
    ) {
      // Use colEn/colSp from config for totals row
      const en = safeInt(row[colEn])
      const sp = (hasSp && colSp != null) ? safeInt(row[colSp]) : 0
      totals = { english:en, spanish:sp, total:en+sp, activeAgents:agents.length }
      foundTotal = true
      break
    }

    // Skip known header/meta rows
    if (cell0.length <= 1) continue
    if (cell0U === 'USERS' || cell0U === 'AGENT NAME' || cell0U === 'COUNTRIES:') continue
    if (cell0U.includes('SUPERVISOR') || cell0U.includes('MANAGER') || cell0U === 'ARWIN') continue
    if (cell0U.includes('EXTENSION') || cell0U.includes('TRANSFER') || cell0U.includes('CAMPAIGN')) continue
    if (cell0U.includes('PER AGENT') || cell0U.includes('HOURLY') || cell0U.includes('HOUR GOAL')) continue
    if (cell0U.includes('BREAK') || cell0U.includes('PACIFIC') || cell0U.includes('DAILY')) continue
    if (cell0U.includes('PHILIPPINES') || cell0U.includes('COLOMBIA') || cell0U.includes('VENEZUELA')) continue
    if (cell0U.includes('CENTRAL') || cell0U.includes('MEXICO') || cell0U.includes('THIS HOUR')) continue

    // Look for extension: must be in col 1 (B) — 4-digit starting with extStart
    const rawExt = (row[1]||'').toString().replace(/,/g,'').trim()
    const extNum = parseInt(rawExt)
    if (isNaN(extNum) || extNum < 1000 || extNum > 9999) continue
    if (!rawExt.startsWith(extStart)) continue

    // Valid agent row — use explicit column config
    const en = safeInt(row[colEn])
    const sp = (hasSp && colSp != null) ? safeInt(row[colSp]) : 0
    agents.push({ name:cell0, ext:String(extNum), english:en, spanish:sp, total:en+sp })
  }

  // If no totals row found, sum from agents
  if (!foundTotal && agents.length > 0) {
    const en = agents.reduce((s,a)=>s+a.english,0)
    const sp = agents.reduce((s,a)=>s+a.spanish,0)
    totals = { english:en, spanish:sp, total:en+sp, activeAgents:agents.length }
  }

  console.log(`${config.label}: ${agents.length} agents, ${totals.english} EN`)
  return { agents, totals }
}

// ── Override keys ──
const OVERRIDE_KEY_AGENTS = (date, teamId='asia') => teamId==='asia' ? `pulse_overrides_${date}` : `pulse_overrides_${teamId}_${date}`
const OVERRIDE_KEY_TOTALS = (date, teamId='asia') => teamId==='asia' ? `pulse_totals_override_${date}` : `pulse_totals_override_${teamId}_${date}`

async function persistOverride(date, key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  try {
    const url = `${SCRIPT_URL}?action=saveOverride&date=${encodeURIComponent(date)}&key=${encodeURIComponent(key)}&value=${encodeURIComponent(JSON.stringify(value))}`
    await fetch(url, { mode:'no-cors' })
  } catch(e) {}
}

async function loadRemoteOverrides() {
  try {
    const res  = await fetch(`${SCRIPT_URL}?action=getOverrides`)
    const data = await res.json()
    if (!Array.isArray(data)) return
    data.forEach(([date, key, value]) => {
      try { if (!localStorage.getItem(key)) localStorage.setItem(key, value) } catch(e) {} 
    })
  } catch(e) {}
}

async function loadUserPhotoFromSheets(userName) {
  try {
    const url  = `${SCRIPT_URL}?action=getUserPhoto&userName=${encodeURIComponent(userName)}`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.photo) {
      localStorage.setItem('pulse_user_photo', data.photo)
      return data.photo
    }
  } catch(e) {}
  return null
}

async function saveAgentSnapshotsToSheets(date, allAgents) {
  const flag = `pulse_snap_sheets_${date}`
  if (sessionStorage.getItem(flag)) return
  sessionStorage.setItem(flag, '1')
  try {
    await fetch(`${SCRIPT_URL}?action=saveAgentSnapshots&date=${encodeURIComponent(date)}&snapshots=${encodeURIComponent(JSON.stringify(allAgents))}`, { mode:'no-cors' })
  } catch(e) {}
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
  goal:'/emojis/goal.webp', goal1:'/emojis/goal1.webp', goal3:'/emojis/goal3.webp', goal4:'/emojis/goal4.webp',
  medal1:'/emojis/medal1.webp', medal2:'/emojis/medal2.webp', medal3:'/emojis/web3.webp',
  zero:'/emojis/zero.webp', firework:'/emojis/firework.webp',
}
const Img = ({src,size=18}) => <img src={src} width={size} height={size} style={{display:'inline-block',verticalAlign:'middle',objectFit:'contain'}}/>
const MEDALS = [E.medal1, E.medal2, E.medal3]


const todayKey = () => new Date().toISOString().slice(0,10)

// Saturday goal is 10, all other days use base goal
const getGoalForDate = (dateStr, baseGoal) => {
  try {
    const day = new Date(dateStr + 'T12:00:00').getDay() // 0=Sun, 6=Sat
    return day === 6 ? 10 : baseGoal
  } catch(e) { return baseGoal }
}

const saveSnapshot = (generalData, asiaData, teamsData={}) => {
  const key = `pulse_snap_${todayKey()}`
  try { localStorage.setItem(key, JSON.stringify({ generalData:generalData||[], asiaData:asiaData||[], teams:teamsData, savedAt:new Date().toISOString() })) } catch(e) {}
}

const loadAllSnapshots = () => {
  const snaps = []
  for (let i=0; i<localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('pulse_snap_')) {
      try {
        const date = k.replace('pulse_snap_','')
        const data = JSON.parse(localStorage.getItem(k))
        snaps.push({
          date,
          generalData:     Array.isArray(data.generalData)     ? data.generalData     : [],
          asiaData:        Array.isArray(data.asiaData)        ? data.asiaData        : [],
          teams: data.teams || { philippines: Array.isArray(data.philippinesData) ? data.philippinesData : [] },
          savedAt: data.savedAt,
        })
      } catch(e) {}
    }
  }
  return snaps.sort((a,b) => b.date.localeCompare(a.date))
}

const formatDateLabel = (dateStr) => {
  const today=todayKey(), yest=new Date(); yest.setDate(yest.getDate()-1); const yKey=yest.toISOString().slice(0,10)
  if (dateStr===today) return 'Today'
  if (dateStr===yKey)  return 'Yesterday'
  const [y,m,d] = dateStr.split('-'); return `${d}/${m}/${y}`
}

function parseHistorySheet(rows) {
  const agents=[]; let totals={spanish:0,english:0,total:0,activeAgents:0}; let foundTotal=false
  for(let i=0;i<rows.length;i++){
    const row=rows[i], cell0=(row[0]||'').trim(), cell0U=cell0.toUpperCase()
    if(cell0U.includes('AGENT')&&cell0U.includes('LOGGED')){const sp=safeInt(row[2]),en=safeInt(row[3]);totals={spanish:sp,english:en,total:sp+en,activeAgents:agents.length};foundTotal=true;break}
    if(cell0U.includes('MANAGEMENT')||cell0U.includes('CALL')||cell0U.includes('TRANSFER')||cell0U.includes('LEXNER')||cell0U.includes('GENERAL')||cell0.length<=1)continue
    const ext=safeInt(row[1]); if(ext<1000||ext>9999)continue
    const sp=safeInt(row[2]),en=safeInt(row[3]); agents.push({name:cell0,ext:String(ext),spanish:sp,english:en,total:sp+en})
  }
  if(!foundTotal){const sp=agents.reduce((s,a)=>s+a.spanish,0),en=agents.reduce((s,a)=>s+a.english,0);totals={spanish:sp,english:en,total:sp+en,activeAgents:agents.length}}
  return {agents,totals}
}

function BarChart({agents,metric}) {
  const [tooltip,setTooltip]=useState(null)
  const buckets=RANGES.map(r=>({...r,agentsInRange:agents.filter(a=>a[metric]>=r.min&&a[metric]<=r.max),count:agents.filter(a=>a[metric]>=r.min&&a[metric]<=r.max).length}))
  const maxCount=Math.max(...buckets.map(b=>b.count),1)
  return(
    <div className="chart-wrap">
      <div className="chart-bars">
        {buckets.map((b,i)=>(
          <div key={i} className={`chart-col ${b.count>0?'chart-col-hoverable':''}`}
            onMouseEnter={(e)=>{if(!b.count)return;const r=e.currentTarget.getBoundingClientRect();setTooltip({bucket:b,rect:r})}}
            onMouseLeave={()=>setTooltip(null)}>
            <div className="bar-count">{b.count}</div>
            <div className="bar-outer"><div className="bar-inner" style={{height:`${(b.count/maxCount)*100}%`,background:b.color}}/></div>
            <div className="bar-label">{b.label}</div>
          </div>
        ))}
      </div>
      {tooltip&&(
        <div className="bar-tooltip-h" style={{top:tooltip.rect.top-12,left:'50%',transform:'translate(-50%,calc(-100% - 12px))'}}>
          <div className="bar-tooltip-h-header" style={{color:tooltip.bucket.color}}>
            <span>{tooltip.bucket.label} xfers</span>
            <span className="bar-tooltip-count">{tooltip.bucket.count} agent{tooltip.bucket.count!==1?'s':''}</span>
          </div>
          <div className="bar-tooltip-h-grid">
            {tooltip.bucket.agentsInRange.sort((a,b)=>b[metric]-a[metric]).map((a,i)=>(
              <div key={i} className="bar-tooltip-h-item">
                <span className="bar-tooltip-h-name">{a.name}</span>
                <span className="bar-tooltip-h-val" style={{color:tooltip.bucket.color}}>{a[metric]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="chart-legend">
        {RANGES.map((r,i)=>(<div key={i} className="legend-item"><div className="legend-dot" style={{background:r.color}}/><span>{r.label} xfers</span></div>))}
      </div>
    </div>
  )
}

function DatePicker({dateTabs,selectedDate,onSelect}) {
  const [open,setOpen]=useState(false); const ref=useRef(null)
  const today=todayKey(); const yest=new Date(); yest.setDate(yest.getDate()-1); const yKey=yest.toISOString().slice(0,10)
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])
  const groups={}
  dateTabs.forEach(date=>{const[y,m]=date.split('-');const mk=`${y}-${m}`;const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const label=`${mn[parseInt(m)-1]} ${y}`;if(!groups[mk])groups[mk]={label,dates:[]};groups[mk].dates.push(date)})
  const formatFull=(d)=>{if(d===today)return'Today — LIVE';if(d===yKey)return'Yesterday';const[y,m,dd]=d.split('-');const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return`${days[new Date(d).getDay()]} ${dd}/${m}/${y}`}
  return(
    <div className="datepicker-wrap" ref={ref}>
      <button className="datepicker-btn" onClick={()=>setOpen(o=>!o)}>
        <span>📅</span>
        <span className="datepicker-label">{selectedDate===today?<><span className="dp-live-dot"/>Today — LIVE</>:formatFull(selectedDate)}</span>
        {HISTORY_ISO_SET.has(selectedDate)&&<span className="dp-hist-badge">H</span>}
        <span className="datepicker-arrow">{open?'▲':'▼'}</span>
      </button>
      {open&&(
        <div className="datepicker-dropdown" onClick={e=>e.stopPropagation()}>
          {Object.entries(groups).map(([mk,group])=>(
            <div key={mk} className="dp-group">
              <div className="dp-group-label">{group.label}</div>
              <div className="dp-group-dates">
                {group.dates.map(date=>{
                  const isT=date===today,isY=date===yKey,isH=HISTORY_ISO_SET.has(date),isSel=date===selectedDate
                  const[y,m,d]=date.split('-'); const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; const dn=days[new Date(date).getDay()]
                  return(<button key={date} className={`dp-date-btn ${isSel?'dp-selected':''} ${isT?'dp-today':''} ${isH?'dp-hist':''}`} onClick={()=>{onSelect(date);setOpen(false)}}>
                    <span className="dp-dayname">{isT?'Today':isY?'Yest.':dn}</span>
                    <span className="dp-daynum">{d}/{m}</span>
                    {isT&&<span className="dp-live-pill">LIVE</span>}
                    {isH&&!isT&&<span className="dp-h-pill">H</span>}
                  </button>)
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const getFlag=(name)=>{const n=name.toUpperCase();if(n.includes('PHIL'))return'ph';if(n.includes('VENE'))return've';if(n.includes('COLOM'))return'co';if(n.includes('MEXICO'))return'mx';if(n.includes('CENTRAL'))return'hn';if(n.includes('ASIA'))return'cn';return'un'}
const TEAM_ACCENT={PHILIPPINES:'#3b82f6',VENEZUELA:'#ef4444',COLOMBIA:'#f59e0b','MEXICO BAJA':'#10b981','CENTRAL AMERICA':'#8b5cf6',ASIA:'#f97316'}

function TeamCard({row,rank,isMyTeam,isFirst}) {
  const [hovered,setHovered]=useState(false)
  const accent=TEAM_ACCENT[row.name.toUpperCase()]||'#f97316'
  const rankEmojis=[E.goal1,E.goal3,E.goal4]
  return(
    <div className={`vteam-card ${isFirst?'vteam-first':''} ${isMyTeam?'vteam-mine':''} ${hovered?'vteam-hovered':''}`}
      style={{'--accent':accent}} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      <div className="vteam-glow" style={{background:`radial-gradient(ellipse at 50% 0%, ${accent}40 0%, transparent 70%)`}}/>
      <div className="vteam-top">
        <div className="vteam-rank">{rank<3?<Img src={rankEmojis[rank]} size={28}/>:<span className="vteam-rank-num">#{rank+1}</span>}</div>
        <img src={`https://flagcdn.com/w40/${getFlag(row.name)}.png`} alt="" className="vteam-flag"/>
        <div className="vteam-name-wrap"><div className="vteam-name">{row.name}</div><div className="vteam-agents">{row.agents} agents</div></div>
      </div>
      <div className="vteam-divider" style={{background:`linear-gradient(90deg,transparent,${accent}80,transparent)`}}/>
      <div className="vteam-stats">
        <div className="vteam-stat"><span className="vteam-val" style={{color:'#60a5fa'}}>{row.english.toLocaleString()}</span><span className="vteam-lbl">English</span></div>
        {!row.noSpanish&&<div className="vteam-stat"><span className="vteam-val" style={{color:'#34d399'}}>{row.spanish.toLocaleString()}</span><span className="vteam-lbl">Spanish</span></div>}
        <div className="vteam-stat"><span className="vteam-val" style={{color:accent}}>{row.total.toLocaleString()}</span><span className="vteam-lbl">Total</span></div>
      </div>
      <div className="vteam-bar" style={{background:`linear-gradient(90deg,transparent,${accent},transparent)`,opacity:hovered||isFirst?1:0}}/>
    </div>
  )
}

// ── Generic Team Detail ──
function TeamDetail({config,agents,dateLabel,isToday,canEdit,selectedDate,onOverrideTick,navigate}) {
  const [view,setView]=useState('stats')
  const [menuOpen,setMenuOpen]=useState(false)
  const [bulkMode,setBulkMode]=useState(false)
  const [bulkEdits,setBulkEdits]=useState({})
  const [bulkTotals,setBulkTotals]=useState(null)
  const [editAgent,setEditAgent]=useState(null)
  const [editForm,setEditForm]=useState({})
  const [saving,setSaving]=useState(false)
  const [tick,setTick]=useState(0)

  const OA=(d)=>OVERRIDE_KEY_AGENTS(d,config.id)
  const OT=(d)=>OVERRIDE_KEY_TOTALS(d,config.id)

  useEffect(()=>{setBulkMode(false);setBulkEdits({});setBulkTotals(null);setMenuOpen(false)},[selectedDate])
  const hasOvr = !!(localStorage.getItem(OA(selectedDate))||localStorage.getItem(OT(selectedDate)))

  const agentsFinal = (() => {
    void tick
    const ovr=JSON.parse(localStorage.getItem(OA(selectedDate))||'{}')
    let ags=agents.map(a=>ovr[a.ext]?{...a,...ovr[a.ext]}:a)
    if(bulkMode&&Object.keys(bulkEdits).length>0){
      ags=ags.map(a=>{
        if(!bulkEdits[a.ext])return a
        const en=parseInt(bulkEdits[a.ext].english),sp=parseInt(bulkEdits[a.ext].spanish||'0')
        return{...a,english:isNaN(en)?a.english:en,spanish:isNaN(sp)?a.spanish:sp,total:(isNaN(en)?a.english:en)+(isNaN(sp)?a.spanish:sp)}
      })
    }
    return ags
  })()

  const totOvr=(()=>{void tick;try{return JSON.parse(localStorage.getItem(OT(selectedDate))||'null')}catch(e){return null}})()
  const totalEn=totOvr?.english??agentsFinal.reduce((s,a)=>s+a.english,0)
  const totalSp=totOvr?.spanish??agentsFinal.reduce((s,a)=>s+a.spanish,0)
  const totalXf=totalEn+totalSp
  const goal=getGoalForDate(selectedDate, config.goal)
  const hitGoal=agentsFinal.filter(a=>a.english>=goal)
  const atZero=agentsFinal.filter(a=>a.total===0)
  const top3En=[...agentsFinal].sort((a,b)=>b.english-a.english).slice(0,3)
  const top3Sp=config.hasSp?[...agentsFinal].sort((a,b)=>b.spanish-a.spanish).slice(0,3):[]

  const saveBulk=async()=>{
    setSaving(true)
    const ovr=JSON.parse(localStorage.getItem(OA(selectedDate))||'{}')
    Object.entries(bulkEdits).forEach(([ext,vals])=>{
      const ag=agents.find(a=>a.ext===ext);if(!ag)return
      const en=parseInt(vals.english),sp=parseInt(vals.spanish||'0')
      ovr[ext]={name:ag.name,english:isNaN(en)?ag.english:en,spanish:isNaN(sp)?ag.spanish:sp,total:(isNaN(en)?ag.english:en)+(isNaN(sp)?ag.spanish:sp)}
    })
    await persistOverride(selectedDate,OA(selectedDate),ovr)
    if(bulkTotals)await persistOverride(selectedDate,OT(selectedDate),{english:parseInt(bulkTotals.english)||0,spanish:parseInt(bulkTotals.spanish||0)||0})
    setBulkMode(false);setBulkEdits({});setBulkTotals(null);setTick(t=>t+1);onOverrideTick?.();setSaving(false)
  }

  const saveQuick=async()=>{
    setSaving(true)
    const ovr=JSON.parse(localStorage.getItem(OA(selectedDate))||'{}')
    const en=parseInt(editForm.english)||0,sp=parseInt(editForm.spanish||'0')||0
    ovr[editAgent.ext]={name:editAgent.name,english:en,spanish:sp,total:en+sp}
    await persistOverride(selectedDate,OA(selectedDate),ovr)
    setEditAgent(null);setTick(t=>t+1);onOverrideTick?.();setSaving(false)
  }

  const resetOvr=async()=>{
    localStorage.removeItem(OA(selectedDate));localStorage.removeItem(OT(selectedDate))
    setBulkEdits({});setBulkTotals(null);setBulkMode(false);setTick(t=>t+1);onOverrideTick?.();setMenuOpen(false)
  }

  const showEditBtn=!isToday&&canEdit
  const colCount=config.hasSp?7:6

  return(
    <div className="fade-in" onClick={()=>setMenuOpen(false)}>
      <div className="asia-header-row">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2 className="section-title" style={{marginBottom:0}}>
            <img src={`https://flagcdn.com/w20/${config.flag}.png`} alt="" style={{borderRadius:2,verticalAlign:'middle',marginRight:6}}/>
            {config.label.replace(/^[^\s]+ /,'')} — Agent Detail
            {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{dateLabel}</span>}
            {bulkMode&&<span style={{fontSize:11,background:'#f97316',color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:600}}>EDIT MODE</span>}
            {hasOvr&&!bulkMode&&<span style={{fontSize:11,background:'#1e2230',color:'#9ca3af',padding:'2px 8px',borderRadius:4,border:'0.5px solid #2a2d38'}}>✏️ edited</span>}
          </h2>
          {!isToday&&canEdit&&(
            <div style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
              <button className="asia-menu-btn" onClick={()=>setMenuOpen(o=>!o)}>···</button>
              {menuOpen&&(
                <div className="asia-menu-dropdown">
                  {!bulkMode
                    ?<button className="asia-menu-item" onClick={()=>{setBulkMode(true);setMenuOpen(false);setView('stats')}}>✏️ Edit this day's data</button>
                    :<><button className="asia-menu-item green-item" onClick={()=>{saveBulk();setMenuOpen(false)}}>{saving?'⏳ Saving...':'✅ Save all changes'}</button>
                       <button className="asia-menu-item red-item" onClick={()=>{setBulkMode(false);setBulkEdits({});setBulkTotals(null);setMenuOpen(false)}}>✖ Cancel edit</button></>}
                  {hasOvr&&<button className="asia-menu-item" style={{borderTop:'0.5px solid #2a2d38',marginTop:4,paddingTop:10,color:'#f87171'}} onClick={resetOvr}>🗑 Reset to original data</button>}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="asia-view-tabs">
          <button className={`view-tab ${view==='stats'?'active':''}`}  onClick={()=>setView('stats')}>📊 Stats</button>
          <button className={`view-tab ${view==='charts'?'active':''}`} onClick={()=>setView('charts')}>📈 Charts</button>
        </div>
      </div>

      {/* Summary */}
      {bulkMode?(
        <div className="summary-grid" style={{gridTemplateColumns:`repeat(${config.hasSp?5:4},1fr)`,marginBottom:'1.5rem'}}>
          <div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal (≥{goal} EN)</div></div>
          <div className="sum-card orange"><div className="sum-val">{agentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>
          {config.hasSp&&<div className="sum-card teal"><input type="number" className="sum-edit-input" style={{color:'#2dd4bf'}} value={bulkTotals?.spanish??totalSp} onChange={e=>setBulkTotals(t=>({spanish:e.target.value,english:t?.english??totalEn}))}/><div className="sum-label">Spanish Xfers ✏️</div></div>}
          <div className="sum-card blue"><input type="number" className="sum-edit-input" style={{color:'#60a5fa'}} value={bulkTotals?.english??totalEn} onChange={e=>setBulkTotals(t=>({english:e.target.value,spanish:t?.spanish??totalSp}))}/><div className="sum-label">English Xfers ✏️</div></div>
          <div className="sum-card indigo"><div className="sum-val">{((parseInt(bulkTotals?.spanish)||totalSp)+(parseInt(bulkTotals?.english)||totalEn)).toLocaleString()}</div><div className="sum-label">Total Xfers</div></div>
        </div>
      ):(
        <div className="summary-grid" style={{gridTemplateColumns:`repeat(${config.hasSp?5:4},1fr)`}}>
          <div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal (≥{goal} EN)</div></div>
          <div className="sum-card orange"><div className="sum-val">{agentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>
          {config.hasSp&&<div className="sum-card teal"><div className="sum-val">{totalSp.toLocaleString()}</div><div className="sum-label">Spanish Xfers</div></div>}
          <div className="sum-card blue"><div className="sum-val">{totalEn.toLocaleString()}</div><div className="sum-label">English Xfers</div></div>
          <div className="sum-card indigo"><div className="sum-val">{totalXf.toLocaleString()}</div><div className="sum-label">Total Xfers</div></div>
        </div>
      )}

      {agentsFinal.length===0&&<div style={{background:'#181b23',border:'0.5px solid #2a2d38',borderRadius:12,padding:'3rem',textAlign:'center',color:'#6b7280',marginTop:'0.5rem'}}>No data available for this date.</div>}

      {view==='stats'&&agentsFinal.length>0&&(
        <>
          {!bulkMode&&(
            <div className="tops-row" style={{gridTemplateColumns:config.hasSp?'1fr 1fr 1fr':'1fr 1fr'}}>
              <div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top English</h3>{top3En.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score english">{a.english}</span></div>))}</div>
              {config.hasSp&&<div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top Spanish</h3>{top3Sp.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score spanish">{a.spanish}</span></div>))}</div>}
              <div className="top-block red-block"><h3 className="top-title"><Img src={E.zero} size={16}/> At Zero</h3>{atZero.length===0?<p className="top-empty"><Img src={E.firework} size={16}/> Everyone has transfers!</p>:atZero.slice(0,3).map((a,i)=>(<div key={i} className="top-item"><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score red">0</span></div>))}</div>
            </div>
          )}
          {bulkMode&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 16px',background:'#1a1310',border:'0.5px solid #f97316',borderRadius:8}}><span style={{fontSize:13,color:'#f97316',fontWeight:600}}>✏️ Edit mode activo</span><span style={{fontSize:12,color:'#9ca3af'}}>— modifica y usa "Save all changes" en ···</span></div>}
          <div className="agent-table-wrap">
            <table className="agent-table">
              <thead><tr><th>#</th><th>Agent</th><th>Ext</th><th>English</th>{config.hasSp&&<th>Spanish</th>}<th>Total</th><th>Goal</th>{showEditBtn&&<th className="th-edit"></th>}</tr></thead>
              <tbody>
                {[...agentsFinal].sort((a,b)=>b.english-a.english).map((a,i)=>{
                  const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'}
                  const beEn=bulkEdits[a.ext]?.english??'',beSp=bulkEdits[a.ext]?.spanish??''
                  const dEn=bulkMode&&beEn!==''?parseInt(beEn)||0:a.english
                  const dSp=bulkMode&&beSp!==''?parseInt(beSp)||0:a.spanish
                  return(<tr key={i} className={a.total===0?'row-zero':a.english>=goal?'row-goal':''}>
                    <td style={rs}>#{i+1}</td>
                    <td className="agent-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</td>
                    <td className="agent-ext">{a.ext}</td>
                    <td className="val-english">{bulkMode?<input type="number" className="bulk-edit-input" value={beEn!==''?beEn:a.english} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],english:e.target.value}}))}/>:a.english}</td>
                    {config.hasSp&&<td className="val-spanish">{bulkMode?<input type="number" className="bulk-edit-input" value={beSp!==''?beSp:a.spanish} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],spanish:e.target.value}}))}/>:a.spanish}</td>}
                    <td className="val-total">{config.hasSp?dEn+dSp:dEn}</td>
                    <td>{dEn>=goal?<span className="badge-goal">✓ Goal</span>:<span className="badge-pending">{goal-dEn} left</span>}</td>
                    {showEditBtn&&<td className="td-edit">{!bulkMode&&<button className="edit-agent-btn" onClick={e=>{e.stopPropagation();setEditForm({english:a.english,spanish:a.spanish||0});setEditAgent(a)}}>✏️</button>}</td>}
                  </tr>)
                })}
              </tbody>
            </table>
          </div>
          {bulkMode&&<div style={{display:'flex',gap:10,marginTop:12,justifyContent:'flex-end'}}><button className="btn-cancel" onClick={()=>{setBulkMode(false);setBulkEdits({});setBulkTotals(null)}}>Cancel</button><button className="btn-save" onClick={saveBulk}>{saving?'⏳ Saving...':'✅ Save all changes'}</button></div>}
        </>
      )}

      {view==='charts'&&agentsFinal.length>0&&(
        <div className="charts-section">
          <BarChart agents={agentsFinal} metric="english"/>
          <div className="chart-goal-row">
            <div className="goal-stat green-stat"><div className="goal-stat-val">{hitGoal.length}</div><div className="goal-stat-label"><Img src={E.goal} size={14}/> Reached goal ({goal}+ EN)</div></div>
            <div className="goal-stat yellow-stat"><div className="goal-stat-val">{agentsFinal.filter(a=>a.english>=(goal-3)&&a.english<goal).length}</div><div className="goal-stat-label">Almost there ({goal-3}–{goal-1} EN)</div></div>
            <div className="goal-stat red-stat"><div className="goal-stat-val">{atZero.length}</div><div className="goal-stat-label"><Img src={E.zero} size={14}/> At zero</div></div>
          </div>
        </div>
      )}

      {editAgent&&(
        <div className="edit-modal-overlay" onClick={()=>setEditAgent(null)}>
          <div className="edit-modal" onClick={e=>e.stopPropagation()}>
            <h3 className="edit-modal-title">Edit — {editAgent.name} <span style={{color:'#6b7280',fontSize:12}}>#{editAgent.ext}</span></h3>
            <div className="edit-modal-fields">
              <label>English<input type="number" value={editForm.english} onChange={e=>setEditForm(f=>({...f,english:e.target.value}))}/></label>
              {config.hasSp&&<label>Spanish<input type="number" value={editForm.spanish} onChange={e=>setEditForm(f=>({...f,spanish:e.target.value}))}/></label>}
            </div>
            <div className="edit-modal-actions">
              <button className="btn-cancel" onClick={()=>setEditAgent(null)}>Cancel</button>
              <button className="btn-save" onClick={saveQuick}>{saving?'⏳ Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ──
export default function Dashboard() {
  const canvasRef = useRef(null)
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('pulse_user')||'null')
  const [userPhoto, setUserPhoto] = useState(localStorage.getItem('pulse_user_photo')||'')
  const team      = APP_CONFIG.teams.find(t => t.id===user?.team)
  const roleLabel = user?.role==='supervisor'?'Supervisor':user?.role==='qa'?'QA':user?.role==='leader'?'Team Leader':'Member'
  const canEdit   = ['supervisor','qa','leader'].includes(user?.role)

  const [liveGeneral,setLiveGeneral] = useState([])
  const [liveAsia,setLiveAsia]       = useState([])
  const [liveTeams,setLiveTeams]     = useState({})
  const [slacksData,setSlacksData]   = useState([])
  const [loading,setLoading]         = useState(true)
  const [lastUpdate,setLastUpdate]   = useState(null)

  const [activeTab,setActiveTab]     = useState('general')
  const [asiaView,setAsiaView]       = useState('stats')
  const [chartMetric,setChartMetric] = useState('english')
  const [snapshots,setSnapshots]     = useState([])
  const [selectedDate,setSelectedDate] = useState(todayKey())
  const [overridesTick,setOverridesTick] = useState(0)
  const [savingOverride,setSavingOverride] = useState(false)

  const [editingAgent,setEditingAgent]     = useState(null)
  const [editForm,setEditForm]             = useState({})
  const [editMenuOpen,setEditMenuOpen]     = useState(false)
  const [bulkEditMode,setBulkEditMode]     = useState(false)
  const [bulkEdits,setBulkEdits]           = useState({})
  const [bulkTotalsEdit,setBulkTotalsEdit] = useState(null)
  const [histCache,setHistCache]           = useState({})
  const [histLoading,setHistLoading]       = useState(false)
  const [expandedAgent,setExpandedAgent]   = useState(null)

  const isToday    = selectedDate === todayKey()
  const isHistDate = HISTORY_ISO_SET.has(selectedDate)
  const histMeta   = HISTORY_DATES.find(d => d.isoDate===selectedDate)
  const activeSnap = (!isToday&&!isHistDate) ? snapshots.find(s=>s.date===selectedDate) : null
  const asiaDataRaw    = isToday ? liveAsia    : (activeSnap?.asiaData    || [])
  const generalDataRaw = isToday ? liveGeneral : (activeSnap?.generalData || [])
  const histParsed     = isHistDate ? (histCache[selectedDate]||null) : null

  const getTeamData = (teamId) => isToday ? (liveTeams[teamId]||[]) : (activeSnap?.teams?.[teamId]||[])

  // Canvas
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ctx=canvas.getContext('2d');canvas.width=window.innerWidth;canvas.height=window.innerHeight
    const particles=[]
    const onMove=(e)=>{for(let i=0;i<3;i++)particles.push({x:e.clientX+(Math.random()-.5)*20,y:e.clientY+(Math.random()-.5)*20,size:Math.random()*3+1,life:1,vx:(Math.random()-.5)*1.5,vy:(Math.random()-.5)*1.5-.5})}
    window.addEventListener('mousemove',onMove)
    let raf
    const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=.03;p.x+=p.vx;p.y+=p.vy;if(p.life<=0){particles.splice(i,1);continue}ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fillStyle=`rgba(249,115,22,${p.life*.5})`;ctx.fill()};raf=requestAnimationFrame(draw)}
    draw()
    const onResize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight}
    window.addEventListener('resize',onResize)
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('resize',onResize);cancelAnimationFrame(raf)}
  },[])

  const loadData = async () => {
    try {
      const [general,asia,slacks] = await Promise.all([
        fetchSheet(SHEET_ID,"WELL'S REPORT"),
        fetchSheet(SHEET_ID,'AW GARRET ASIA LEXNER'),
        fetchSheet(USERS_SHEET_ID,'Slacks'),
      ])
      setLiveGeneral(general);setLiveAsia(asia);setLastUpdate(new Date())
      setSlacksData(slacks.slice(1).filter(r=>r[0]&&r[1]))

      const results = await Promise.allSettled(TEAM_SHEETS.map(t => fetchSheet(SHEET_ID, t.sheetName)))
      const newTeams = {}
      const allAgents = []
      TEAM_SHEETS.forEach((t,i)=>{
        if(results[i].status==='fulfilled'){
          newTeams[t.id]=results[i].value
          // Debug: log first 6 rows of Philippines
          if(t.id==='philippines'){
            console.log('PH raw rows 0-6:', results[i].value.slice(0,6).map(r=>JSON.stringify(r)).join('\n'))
          }
          const {agents}=parseTeamSheet(results[i].value, t)
          agents.forEach(a=>allAgents.push({ext:a.ext,name:a.name,english:a.english,spanish:a.spanish||0,total:a.total,team:t.id}))
          console.log(`✓ ${t.label}: ${agents.length} agents`)
        } else {
          console.warn(`✗ ${t.label} failed:`, results[i].reason?.message)
        }
      })
      setLiveTeams(newTeams)

      // Asia agents for snapshots
      for(const row of asia){
        const name=(row[0]||'').trim(),nameUp=name.toUpperCase()
        if(nameUp.includes('AGENT LOGGED')||nameUp.includes('LOGGED IN'))break
        if(nameUp.includes('REMOVED'))break
        const ext=safeInt(row[1]);if(isNaN(ext)||ext<1000||ext>9999||name.length<=1)continue
        allAgents.push({ext:String(ext),name,english:safeInt(row[3]),spanish:safeInt(row[2]),total:safeInt(row[2])+safeInt(row[3]),team:'asia'})
      }

      saveSnapshot(general,asia,newTeams)
      setSnapshots(loadAllSnapshots())
      saveAgentSnapshotsToSheets(todayKey(),allAgents)
    } catch(e){console.error('loadData error:',e)}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    loadRemoteOverrides().then(()=>setOverridesTick(t=>t+1))
    // Sync profile photo from Sheets on every load
    if (user?.name) loadUserPhotoFromSheets(user.name).then(() => {
      const p = localStorage.getItem('pulse_user_photo')
      if (p) setUserPhoto(p)
    })
    setSnapshots(loadAllSnapshots());loadData()
    const iv=setInterval(loadData,60000);return()=>clearInterval(iv)
  },[])

  useEffect(()=>{
    if(!isHistDate||!histMeta||histCache[selectedDate])return
    setHistLoading(true)
    fetchSheet(HISTORY_SHEET_ID,histMeta.tab).then(rows=>setHistCache(c=>({...c,[selectedDate]:parseHistorySheet(rows)}))).catch(console.error).finally(()=>setHistLoading(false))
  },[selectedDate])

  useEffect(()=>{setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null);setEditMenuOpen(false)},[selectedDate])

  const logout=()=>{localStorage.removeItem('pulse_user');window.location.href='/'}

  const teamRows=(()=>{
    const found=[]
    for(const row of generalDataRaw){
      const name=row[0]?.toUpperCase().trim()
      if(TEAMS_ORDER.some(t=>name===t)){if(!found.find(f=>f.name.toUpperCase()===name)){const rawSpanish=row[4]?.trim();found.push({name:row[0]?.trim()||'',agents:safeInt(row[2]),english:safeInt(row[3]),spanish:safeInt(rawSpanish),total:safeInt(row[5]),noSpanish:rawSpanish==='-'||rawSpanish===''||!rawSpanish})}}
      if(found.length===6)break
    }
    return found
  })()
  const teamsSorted=[...teamRows].sort((a,b)=>b.english-a.english)

  const {asiaAgents,asiaTotals}=(()=>{
    if(isHistDate&&histParsed)return{asiaAgents:histParsed.agents,asiaTotals:histParsed.totals}
    const agents=[];let totals={spanish:0,english:0,total:0,activeAgents:0}
    for(const row of asiaDataRaw){
      const name=(row[0]||'').trim(),nameUp=name.toUpperCase()
      if(nameUp.includes('AGENT LOGGED')||nameUp.includes('LOGGED IN')){const sp=safeInt(row[2]),en=safeInt(row[3]);totals={activeAgents:agents.length,spanish:sp,english:en,total:sp+en};break}
      if(nameUp.includes('REMOVED'))break
      const ext=safeInt(row[1]);if(isNaN(ext)||ext<1000||ext>9999||name.length<=1)continue
      agents.push({name,ext:String(ext),spanish:safeInt(row[2]),english:safeInt(row[3]),total:safeInt(row[2])+safeInt(row[3])})
    }
    return{asiaAgents:agents,asiaTotals:totals}
  })()

  const asiaAgentsFinal=(()=>{
    void overridesTick
    const ovr=JSON.parse(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||'{}')
    let agents=asiaAgents.map(a=>ovr[a.ext]?{...a,...ovr[a.ext]}:a)
    if(bulkEditMode&&Object.keys(bulkEdits).length>0){agents=agents.map(a=>{if(!bulkEdits[a.ext])return a;const en=parseInt(bulkEdits[a.ext].english),sp=parseInt(bulkEdits[a.ext].spanish);return{...a,english:isNaN(en)?a.english:en,spanish:isNaN(sp)?a.spanish:sp,total:(isNaN(en)?a.english:en)+(isNaN(sp)?a.spanish:sp)}})}
    return agents
  })()

  const asiaOvrTotals=(()=>{void overridesTick;try{return JSON.parse(localStorage.getItem(OVERRIDE_KEY_TOTALS(selectedDate,'asia'))||'null')}catch(e){return null}})()
  const totalSpanish=asiaOvrTotals?.spanish??(isToday?asiaTotals.spanish:(isHistDate?asiaTotals.spanish:asiaAgentsFinal.reduce((s,a)=>s+a.spanish,0)))
  const totalEnglish=asiaOvrTotals?.english??(isToday?asiaTotals.english:(isHistDate?asiaTotals.english:asiaAgentsFinal.reduce((s,a)=>s+a.english,0)))
  const totalXfers=totalSpanish+totalEnglish
  const goal=getGoalForDate(selectedDate, APP_CONFIG.dailyGoal)
  const hitGoal=asiaAgentsFinal.filter(a=>a.english>=goal)
  const atZero=asiaAgentsFinal.filter(a=>a.total===0)
  const top3English=[...asiaAgentsFinal].sort((a,b)=>b.english-a.english).slice(0,3)
  const top3Spanish=[...asiaAgentsFinal].sort((a,b)=>b.spanish-a.spanish).slice(0,3)
  void overridesTick
  const hasAsiaOverrides=!!(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||localStorage.getItem(OVERRIDE_KEY_TOTALS(selectedDate,'asia')))

  const saveAsiaAgentEdit=async()=>{setSavingOverride(true);const ovr=JSON.parse(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||'{}');const en=parseInt(editForm.english)||0,sp=parseInt(editForm.spanish)||0;ovr[editingAgent.ext]={name:editingAgent.name,spanish:sp,english:en,total:en+sp};await persistOverride(selectedDate,OVERRIDE_KEY_AGENTS(selectedDate,'asia'),ovr);setEditingAgent(null);setOverridesTick(t=>t+1);setSavingOverride(false)}
  const saveAsiaBulk=async()=>{setSavingOverride(true);const ovr=JSON.parse(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||'{}');Object.entries(bulkEdits).forEach(([ext,vals])=>{const ag=asiaAgents.find(a=>a.ext===ext);if(!ag)return;const en=parseInt(vals.english),sp=parseInt(vals.spanish);ovr[ext]={name:ag.name,spanish:isNaN(sp)?ag.spanish:sp,english:isNaN(en)?ag.english:en,total:(isNaN(en)?ag.english:en)+(isNaN(sp)?ag.spanish:sp)}});await persistOverride(selectedDate,OVERRIDE_KEY_AGENTS(selectedDate,'asia'),ovr);if(bulkTotalsEdit)await persistOverride(selectedDate,OVERRIDE_KEY_TOTALS(selectedDate,'asia'),{spanish:parseInt(bulkTotalsEdit.spanish)||0,english:parseInt(bulkTotalsEdit.english)||0});setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null);setOverridesTick(t=>t+1);setSavingOverride(false)}
  const resetAsiaOverrides=async()=>{localStorage.removeItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'));localStorage.removeItem(OVERRIDE_KEY_TOTALS(selectedDate,'asia'));setBulkEdits({});setBulkTotalsEdit(null);setBulkEditMode(false);setOverridesTick(t=>t+1);setEditMenuOpen(false)}

  const slackLabelForDate=(iso)=>{const hd=HISTORY_DATES.find(d=>d.isoDate===iso);if(hd)return hd.slackLabel;const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`}
  const slackRowsForDate=slacksData.filter(r=>r[0]?.trim()===slackLabelForDate(selectedDate))
  const buildSlackAgents=(rows)=>{const map={};for(const row of rows){const agent=(row[1]||'').trim(),opener=(row[2]||'').trim(),call=(row[3]||'').trim();if(!agent)continue;if(!map[agent])map[agent]={agent,opener,reports:0,phones:[]};const phones=extractPhones(call);if(phones.length>0){map[agent].reports+=phones.length;phones.forEach(p=>{if(!map[agent].phones.includes(p))map[agent].phones.push(p)})}else if(call.trim()){map[agent].reports+=1;if(!map[agent].phones.includes(call.trim()))map[agent].phones.push(call.trim())}};return Object.values(map).sort((a,b)=>b.reports-a.reports)}
  const slackAgentsForDate=buildSlackAgents(slackRowsForDate)
  const topAgent=slackAgentsForDate[0]||null
  const totalReportsForDate=slackAgentsForDate.reduce((s,a)=>s+a.reports,0)

  const isMyTeam=(name)=>{const n=name.toUpperCase();return(team?.id==='asia'&&n.includes('ASIA'))||(team?.id==='philippines'&&n.includes('PHIL'))||(team?.id==='venezuela'&&n.includes('VENE'))||(team?.id==='colombia'&&n.includes('COLOM'))||(team?.id==='mexico'&&n.includes('MEXICO'))||(team?.id==='central'&&n.includes('CENTRAL'))}

  const dateTabs=(()=>{const dates=new Set();dates.add(todayKey());snapshots.forEach(s=>dates.add(s.date));HISTORY_DATES.forEach(d=>dates.add(d.isoDate));return[...dates].sort((a,b)=>b.localeCompare(a))})()
  const showAsiaEditBtn=!isToday&&canEdit
  const currentTeamConfig=TEAM_SHEETS.find(t=>t.id===activeTab)

  return(
    <div className="dash-root" onClick={()=>setEditMenuOpen(false)}>
      <canvas ref={canvasRef} className="dash-trail-canvas"/>

      <nav className="dash-nav">
        <div className="dash-nav-left">
          <div className="nav-logo-wrap"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#f97316"/><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <span className="nav-appname">Pulse</span>
        </div>
        <div className="dash-nav-right">
          <div className="nav-user" style={{cursor:'pointer'}} onClick={()=>navigate('/settings')}>
            <div className="nav-avatar">{userPhoto?<img src={userPhoto} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>:user?.name?.[0]?.toUpperCase()}</div>
            <div className="nav-info"><span className="nav-name">{user?.name}</span><span className="nav-role">{team?.name} · {roleLabel}</span></div>
          </div>
          {user?.agentExt&&<button className="nav-profile-btn" onClick={()=>navigate(`/profile/${user.agentExt}`)}>👤 #{user.agentExt}</button>}
          {lastUpdate&&<span className="nav-update">Updated {lastUpdate.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          <button className="nav-logout" onClick={logout}>Log out</button>
        </div>
      </nav>

      <div className="dash-topbar">
        <div className="dash-tabs-scroll">
          <button className={`dash-tab ${activeTab==='general'?'active':''}`}  onClick={()=>setActiveTab('general')}>All Teams</button>
          <button className={`dash-tab ${activeTab==='asia'?'active':''}`}      onClick={()=>setActiveTab('asia')}>🌏 Asia</button>
          {TEAM_SHEETS.map(t=><button key={t.id} className={`dash-tab ${activeTab===t.id?'active':''}`} onClick={()=>setActiveTab(t.id)}>{t.label}</button>)}
        </div>
        <div className="dash-topbar-right">
          {!isToday&&activeSnap?.savedAt&&<span className="date-snap-info">Snapshot {new Date(activeSnap.savedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
          {isHistDate&&<span className="date-snap-info">Historical</span>}
          <DatePicker dateTabs={dateTabs} selectedDate={selectedDate} onSelect={setSelectedDate}/>
        </div>
      </div>

      <div className="dash-content">
        {loading?(
          <div className="dash-loading"><div className="dash-spinner"/><p>Loading live data...</p></div>

        ):activeTab==='general'?(
          <div className="fade-in">
            <div className="vteams-header">
              <h2 className="section-title" style={{marginBottom:0}}>Auto Warranty Garrett {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{formatDateLabel(selectedDate)}</span>}</h2>
              <span className="vteams-sub">{teamsSorted.length} teams · ranked by English xfers</span>
            </div>
            {teamsSorted.length===0?<p style={{color:'#6b7280'}}>No data.</p>:(
              <div className="vteams-grid">
                {teamsSorted.map((row,rank)=><TeamCard key={rank} row={row} rank={rank} isMyTeam={isMyTeam(row.name)} isFirst={rank===0}/>)}
              </div>
            )}
          </div>

        ):activeTab==='asia'?(
          <div className="fade-in">
            <div className="asia-header-row">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <h2 className="section-title" style={{marginBottom:0}}>
                  🌏 Asia — Agent Detail
                  {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{formatDateLabel(selectedDate)}</span>}
                  {bulkEditMode&&<span style={{fontSize:11,background:'#f97316',color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:600}}>EDIT MODE</span>}
                  {hasAsiaOverrides&&!bulkEditMode&&<span style={{fontSize:11,background:'#1e2230',color:'#9ca3af',padding:'2px 8px',borderRadius:4,border:'0.5px solid #2a2d38'}}>✏️ edited</span>}
                </h2>
                {!isToday&&canEdit&&(
                  <div style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
                    <button className="asia-menu-btn" onClick={()=>setEditMenuOpen(o=>!o)}>···</button>
                    {editMenuOpen&&(
                      <div className="asia-menu-dropdown">
                        {!bulkEditMode?<button className="asia-menu-item" onClick={()=>{setBulkEditMode(true);setEditMenuOpen(false);setAsiaView('stats')}}>✏️ Edit this day's data</button>
                          :<><button className="asia-menu-item green-item" onClick={()=>{saveAsiaBulk();setEditMenuOpen(false)}}>{savingOverride?'⏳ Saving...':'✅ Save all changes'}</button>
                             <button className="asia-menu-item red-item" onClick={()=>{setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null);setEditMenuOpen(false)}}>✖ Cancel edit</button></>}
                        {hasAsiaOverrides&&<button className="asia-menu-item" style={{borderTop:'0.5px solid #2a2d38',marginTop:4,paddingTop:10,color:'#f87171'}} onClick={resetAsiaOverrides}>🗑 Reset to original data</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="asia-view-tabs">
                <button className={`view-tab ${asiaView==='stats'?'active':''}`}  onClick={()=>setAsiaView('stats')}>📊 Stats</button>
                <button className={`view-tab ${asiaView==='charts'?'active':''}`} onClick={()=>setAsiaView('charts')}>📈 Charts</button>
                <button className={`view-tab ${asiaView==='slacks'?'active':''}`} onClick={()=>setAsiaView('slacks')}>💬 Slacks</button>
              </div>
            </div>

            {asiaView!=='slacks'&&(
              histLoading?<div style={{color:'#6b7280',padding:'2rem',textAlign:'center'}}>Loading...</div>
              :bulkEditMode?(
                <div className="summary-grid" style={{marginBottom:'1.5rem'}}>
                  <div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal (≥{goal} EN)</div></div>
                  <div className="sum-card orange"><div className="sum-val">{asiaAgentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>
                  <div className="sum-card teal"><input type="number" className="sum-edit-input" style={{color:'#2dd4bf'}} value={bulkTotalsEdit?.spanish??totalSpanish} onChange={e=>setBulkTotalsEdit(t=>({spanish:e.target.value,english:t?.english??totalEnglish}))}/><div className="sum-label">Spanish Xfers ✏️</div></div>
                  <div className="sum-card blue"><input type="number" className="sum-edit-input" style={{color:'#60a5fa'}} value={bulkTotalsEdit?.english??totalEnglish} onChange={e=>setBulkTotalsEdit(t=>({english:e.target.value,spanish:t?.spanish??totalSpanish}))}/><div className="sum-label">English Xfers ✏️</div></div>
                  <div className="sum-card indigo"><div className="sum-val">{((parseInt(bulkTotalsEdit?.spanish)||totalSpanish)+(parseInt(bulkTotalsEdit?.english)||totalEnglish)).toLocaleString()}</div><div className="sum-label">Total Xfers</div></div>
                </div>
              ):(
                <div className="summary-grid">
                  <div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal (≥{goal} EN)</div></div>
                  <div className="sum-card orange"><div className="sum-val">{asiaAgentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>
                  <div className="sum-card teal"><div className="sum-val">{totalSpanish.toLocaleString()}</div><div className="sum-label">Spanish Xfers</div></div>
                  <div className="sum-card blue"><div className="sum-val">{totalEnglish.toLocaleString()}</div><div className="sum-label">English Xfers</div></div>
                  <div className="sum-card indigo"><div className="sum-val">{totalXfers.toLocaleString()}</div><div className="sum-label">Total Xfers</div></div>
                </div>
              )
            )}

            {asiaView==='stats'&&!histLoading&&(
              <>
                {!bulkEditMode&&(
                  <div className="tops-row">
                    <div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top English</h3>{top3English.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score english">{a.english}</span></div>))}</div>
                    <div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top Spanish</h3>{top3Spanish.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score spanish">{a.spanish}</span></div>))}</div>
                    <div className="top-block red-block"><h3 className="top-title"><Img src={E.zero} size={16}/> At Zero</h3>{atZero.length===0?<p className="top-empty"><Img src={E.firework} size={16}/> Everyone has transfers!</p>:atZero.slice(0,3).map((a,i)=>(<div key={i} className="top-item"><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score red">0</span></div>))}</div>
                  </div>
                )}
                {bulkEditMode&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 16px',background:'#1a1310',border:'0.5px solid #f97316',borderRadius:8}}><span style={{fontSize:13,color:'#f97316',fontWeight:600}}>✏️ Edit mode activo</span><span style={{fontSize:12,color:'#9ca3af'}}>— modifica y usa "Save all changes" en ···</span></div>}
                <div className="agent-table-wrap">
                  <table className="agent-table">
                    <thead><tr><th>#</th><th>Agent</th><th>Ext</th><th>English</th><th>Spanish</th><th>Total</th><th>Goal</th>{showAsiaEditBtn&&<th className="th-edit"></th>}</tr></thead>
                    <tbody>
                      {[...asiaAgentsFinal].sort((a,b)=>b.english-a.english).map((a,i)=>{
                        const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'}
                        const beEn=bulkEdits[a.ext]?.english??'',beSp=bulkEdits[a.ext]?.spanish??''
                        const dEn=bulkEditMode&&beEn!==''?parseInt(beEn)||0:a.english
                        const dSp=bulkEditMode&&beSp!==''?parseInt(beSp)||0:a.spanish
                        return(<tr key={i} className={a.total===0?'row-zero':a.english>=goal?'row-goal':''}>
                          <td style={rs}>#{i+1}</td>
                          <td className="agent-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</td>
                          <td className="agent-ext">{a.ext}</td>
                          <td className="val-english">{bulkEditMode?<input type="number" className="bulk-edit-input" value={beEn!==''?beEn:a.english} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],english:e.target.value}}))}/>:a.english}</td>
                          <td className="val-spanish">{bulkEditMode?<input type="number" className="bulk-edit-input" value={beSp!==''?beSp:a.spanish} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],spanish:e.target.value}}))}/>:a.spanish}</td>
                          <td className="val-total">{dEn+dSp}</td>
                          <td>{dEn>=goal?<span className="badge-goal">✓ Goal</span>:<span className="badge-pending">{goal-dEn} left</span>}</td>
                          {showAsiaEditBtn&&<td className="td-edit">{!bulkEditMode&&<button className="edit-agent-btn" onClick={e=>{e.stopPropagation();setEditForm({spanish:a.spanish,english:a.english});setEditingAgent(a)}}>✏️</button>}</td>}
                        </tr>)
                      })}
                    </tbody>
                  </table>
                </div>
                {bulkEditMode&&<div style={{display:'flex',gap:10,marginTop:12,justifyContent:'flex-end'}}><button className="btn-cancel" onClick={()=>{setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null)}}>Cancel</button><button className="btn-save" onClick={saveAsiaBulk}>{savingOverride?'⏳ Saving...':'✅ Save all changes'}</button></div>}
              </>
            )}

            {asiaView==='charts'&&!histLoading&&(
              <div className="charts-section">
                <div className="chart-controls"><span className="chart-label">Distribution by transfers:</span>
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

            {asiaView==='slacks'&&(
              <div className="slacks-section">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:'1.5rem'}}>
                  <div className="sum-card blue"><div className="sum-val">{slackAgentsForDate.length}</div><div className="sum-label">Agents</div></div>
                  <div className="sum-card gold"><div className="sum-val">{totalReportsForDate}</div><div className="sum-label">Total Reports</div></div>
                  <div className="sum-card green">{topAgent?<><div className="sum-val" style={{fontSize:15,paddingTop:6,lineHeight:1.3}}>{topAgent.agent}</div><div className="sum-label">Top Agent ({topAgent.reports} reports)</div></>:<><div className="sum-val">—</div><div className="sum-label">Top Agent</div></>}</div>
                </div>
                {slackRowsForDate.length===0
                  ?<div style={{background:'#181b23',border:'0.5px solid #2a2d38',borderRadius:12,padding:'3rem',textAlign:'center',color:'#6b7280'}}>No slack reports for {formatDateLabel(selectedDate)}.</div>
                  :<><h3 style={{fontFamily:"'Sora',sans-serif",fontSize:13,color:'#9ca3af',marginBottom:12}}>Agent Summary — {formatDateLabel(selectedDate)}</h3>
                    <div className="agent-table-wrap"><table className="agent-table">
                      <thead><tr><th>#</th><th>Agent</th><th>ID Opener</th><th style={{textAlign:'center'}}>Reports</th><th>Calls</th></tr></thead>
                      <tbody>{slackAgentsForDate.map((a,i)=>{const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'};const isExp=expandedAgent===a.agent;return(<tr key={i}><td style={rs}>#{i+1}</td><td className="agent-name">{a.agent}</td><td className="agent-ext">{a.opener}</td><td style={{textAlign:'center',color:'#f97316',fontWeight:700,fontSize:15}}>{a.reports}</td><td><div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>{(isExp?a.phones:a.phones.slice(0,3)).map((p,j)=>(<span key={j} className="phone-chip">{p}</span>))}{a.phones.length>3&&<button onClick={()=>setExpandedAgent(isExp?null:a.agent)} className="phone-more-btn">{isExp?'▲ less':`+${a.phones.length-3} more`}</button>}</div></td></tr>)})}</tbody>
                    </table></div></>
                }
              </div>
            )}

            {editingAgent&&(
              <div className="edit-modal-overlay" onClick={()=>setEditingAgent(null)}>
                <div className="edit-modal" onClick={e=>e.stopPropagation()}>
                  <h3 className="edit-modal-title">Edit — {editingAgent.name} <span style={{color:'#6b7280',fontSize:12}}>#{editingAgent.ext}</span></h3>
                  <div className="edit-modal-fields">
                    <label>English<input type="number" value={editForm.english} onChange={e=>setEditForm(f=>({...f,english:e.target.value}))}/></label>
                    <label>Spanish<input type="number" value={editForm.spanish} onChange={e=>setEditForm(f=>({...f,spanish:e.target.value}))}/></label>
                  </div>
                  <div className="edit-modal-actions">
                    <button className="btn-cancel" onClick={()=>setEditingAgent(null)}>Cancel</button>
                    <button className="btn-save" onClick={saveAsiaAgentEdit}>{savingOverride?'⏳ Saving...':'Save'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>

        ):currentTeamConfig?(
          <TeamDetail
            key={activeTab}
            config={currentTeamConfig}
            agents={parseTeamSheet(getTeamData(activeTab), currentTeamConfig).agents}
            dateLabel={formatDateLabel(selectedDate)}
            isToday={isToday}
            canEdit={canEdit}
            selectedDate={selectedDate}
            onOverrideTick={()=>setOverridesTick(t=>t+1)}
            navigate={navigate}
          />
        ):null}
      </div>
    </div>
  )
}