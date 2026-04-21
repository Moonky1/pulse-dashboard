import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './profile.css'

const HISTORY_SHEET_ID = '1u_5CLPEonZGarvaXU3Uwwx-nczElf5td3iKLRfQOVYU'
const SCRIPT_URL       = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const USERS_SHEET_ID_PROFILE = '1d6j3FEPnFzE-fAl0K6O43apdbNvB0NzbLSJLEJF-TxI'

const HISTORY_DATES = [
  { isoDate:'2026-03-14', tab:'14032026' },
  { isoDate:'2026-03-16', tab:'16032026' },
  { isoDate:'2026-03-17', tab:'17032026' },
  { isoDate:'2026-03-18', tab:'18032026' },
  { isoDate:'2026-03-19', tab:'19032026' },
  { isoDate:'2026-03-20', tab:'20032026' },
  { isoDate:'2026-03-21', tab:'21032026' },
  { isoDate:'2026-03-23', tab:'23032026' },
]

// ── PATCHED: All 3 sheet IDs updated to native Google Sheets ──
const WEEKLY_SHEETS_PROFILE = {
  asia:        { id:'1AF-1K2Ir2po7FPeISMLCgG-Dphn4F6sXkkyfne5G_1c', type:'eng_spa',    startDate:'2026-03-23' },
  philippines: { id:'1ihKH07WKnmaD_-2lm4Ivq-s7lRIB2VbTi3zI1FE_G40', type:'total_only', startDate:'2026-03-23' },
  colombia:    { id:'1eFCPK-i4fAtMfeAUKpZ45md0CPiFp2h16MrlLWYl7M0', type:'eng_spa',    startDate:'2026-03-23' },
  central:     { id:'1f6dFWRTe4vmXi0q-qw6fLKNo45RnSWFUMOQ8FyHYnZY', type:'eng_spa',    startDate:'2026-03-23' },
  mexico:      { id:'1YHNJIFlTjtVwbWi1W6aCWbt89HEF12JXMwPgbR6qqcg', type:'total_only', startDate:'2026-03-23' },
  venezuela:   { id:'1Rz7V3JIbQutCtSSosE1C7mq9pxQKlBsATMzxqvKQqMw', type:'eng_spa',    startDate:'2026-03-23' },
}

const FLAG_LOCAL = {
  ph: '/flags/philippines.png',
  co: '/flags/colombia.png',
  mx: '/flags/mexico.png',
  ve: '/flags/venezuela.png',
  cn: '/flags/asia.png',
  hn: null,
}

const MONTH_MAP = {JANUARY:1,FEBRUARY:2,MARCH:3,APRIL:4,MAY:5,JUNE:6,JULY:7,AUGUST:8,SEPTEMBER:9,OCTOBER:10,NOVEMBER:11,DECEMBER:12}

const E = {
  medal1:'/emojis/medal1.webp', medal2:'/emojis/medal2.webp', medal3:'/emojis/web3.webp',
  goal:'/emojis/goal.webp', goal1:'/emojis/goal1.webp',
  zero:'/emojis/zero.webp', firework:'/emojis/firework.webp',
}

const Img = ({src, size=20}) => <img src={src} width={size} height={size} style={{display:'inline-block',verticalAlign:'middle',objectFit:'contain'}}/>
const MedalImg = ({rank}) => {
  if(rank===1) return <Img src={E.medal1} size={22}/>
  if(rank===2) return <Img src={E.medal2} size={22}/>
  if(rank===3) return <Img src={E.medal3} size={22}/>
  return <span style={{color:'#6b7280',fontSize:12}}>#{rank}</span>
}

function TeamFlag({ flag, size = 16 }) {
  const src = FLAG_LOCAL[flag]
  if (!src) return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>🌎</span>
  return <img src={src} alt="" width={size} height={Math.round(size * 0.7)} style={{ borderRadius: 2, objectFit: 'cover', verticalAlign: 'middle' }}/>
}

const csvUrl = (sheetId, sheet) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&t=${Date.now()}`

async function fetchWithTimeout(url, options = {}, timeout = 12000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result=[]; let current=''; let inQuotes=false
    for(let i=0;i<row.length;i++){
      if(row[i]==='"'){inQuotes=!inQuotes;continue}
      if(row[i]===','&&!inQuotes){result.push(current.trim());current='';continue}
      current+=row[i]
    }
    result.push(current.trim())
    return result
  })
}

async function fetchSheet(sheetId, name) {
  const res  = await fetchWithTimeout(csvUrl(sheetId, name), {}, 12000)
  const text = await res.text()
  return parseCSV(text)
}

const safeInt = (val) => parseInt((val||'').toString().replace(/,/g,'')) || 0

const normalizeDate = (raw) => {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const isValidIsoDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))

async function loadUserPhotoFromSheets(userName) {
  try {
    const url  = `${SCRIPT_URL}?action=getUserPhoto&userName=${encodeURIComponent(userName)}`
    const res  = await fetchWithTimeout(url, {}, 6000)
    const data = await res.json()
    if (data.photo && data.photo.length > 10) {
      localStorage.setItem('pulse_user_photo', data.photo)
      return data.photo
    }
  } catch(e) {}
  return localStorage.getItem('pulse_user_photo') || null
}

async function loadDailyTotals() {
  try {
    const url  = `${SCRIPT_URL}?action=getDailyTotals&t=${Date.now()}`
    const res  = await fetchWithTimeout(url, {}, 10000)
    const apiData = await res.json()
    if (!Array.isArray(apiData)) return {}
    const map = {}
    apiData.forEach(entry => {
      const date = normalizeDate(entry.date)
      if (!date || !Array.isArray(entry.teams)) return
      map[date] = {}
      entry.teams.forEach(t => {
        if (t.id) map[date][t.id] = t.english || 0
      })
    })
    return map
  } catch(e) { return {} }
}

const getTeamFromExt = (ext) => {
  const e = String(ext)
  if (e.startsWith('1')) return { id:'philippines', name:'Philippines',     flag:'ph', hasSp:false, goal:10 }
  if (e.startsWith('2')) return { id:'colombia',    name:'Colombia',        flag:'co', hasSp:true,  goal:10 }
  if (e.startsWith('3')) return { id:'asia',        name:'Asia',            flag:'cn', hasSp:true,  goal:20 }
  if (e.startsWith('4')) return { id:'central',     name:'Central America', flag:'hn', hasSp:true,  goal:10 }
  if (e.startsWith('5')) return { id:'mexico',      name:'Mexico Baja',     flag:'mx', hasSp:false, goal:10 }
  if (e.startsWith('6')) return { id:'venezuela',   name:'Venezuela',       flag:'ve', hasSp:true,  goal:10 }
  return { id:'unknown', name:'Unknown', flag:'hn', hasSp:false, goal:10 }
}

function formatDate(iso) {
  const d = normalizeDate(iso)
  if (!d) return '—'
  const [y,m,dd] = d.split('-')
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const dayName = days[new Date(`${d}T12:00:00`).getDay()]
  return `${dayName} ${dd}/${m}`
}

function getShareColor(pct) {
  if (pct >= 20) return '#f87171'
  if (pct >= 12) return '#fb923c'
  if (pct >= 6) return '#a78bfa'
  return '#6b7280'
}

function getShareLabel(pct) {
  if (pct >= 20) return '🔥 Franchise'
  if (pct >= 12) return '⭐ Key Player'
  if (pct >= 6)  return 'Contributor'
  return 'Support'
}

function parseWeekTabDate(tabName) {
  const s = tabName.trim().toUpperCase()
  const m = s.match(/^([A-Z]+)\s+(\d+)\s*[-\u2013]\s*[A-Z]+\s+\d+\s+(\d{4})/)
  if (!m) return null
  const month = MONTH_MAP[m[1]], day = parseInt(m[2], 10), year = parseInt(m[3], 10)
  if (!month) return null
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function genWeekTabs(weeksBack=14) {
  const MONS=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
  const tabs=[], now=new Date()
  const d=now.getDay()
  const mon=new Date(now); mon.setDate(now.getDate()-(d===0?6:d-1))
  for(let w=0;w<weeksBack;w++){
    const s=new Date(mon); s.setDate(mon.getDate()-w*7)
    const e=new Date(s); e.setDate(s.getDate()+5)
    const sm=MONS[s.getMonth()],sd1=String(s.getDate()).padStart(2,'0'),sd2=String(s.getDate())
    const em=MONS[e.getMonth()],ed1=String(e.getDate()).padStart(2,'0'),ed2=String(e.getDate())
    const yr=s.getFullYear()
    tabs.push(`${sm} ${sd1} - ${em} ${ed1} ${yr}`)
    tabs.push(`${sm} ${sd1} - ${em} ${ed2} ${yr}`)
    tabs.push(`${sm} ${sd2} - ${em} ${ed1} ${yr}`)
    tabs.push(`${sm} ${sd2} - ${em} ${ed2} ${yr}`)
  }
  return [...new Set(tabs)]
}

async function fetchWeeklySheetAgents(teamId) {
  const cfg = WEEKLY_SHEETS_PROFILE[teamId]
  if (!cfg) return []
  const results = []
  const tabs = genWeekTabs(14)

  for (const tab of tabs) {
    const startDate = parseWeekTabDate(tab)
    if (!startDate) continue
    if (cfg.startDate && startDate < cfg.startDate) continue

    const weekDates = Array.from({length:6},(_,i)=>{
      const d=new Date(startDate+'T12:00:00')
      d.setDate(d.getDate()+i)
      return d.toISOString().slice(0,10)
    })

    try {
      const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}&t=${Date.now()}`
      const res = await fetchWithTimeout(url, {}, 12000)
      const text = await res.text()
      if (!text || text.trim().startsWith('<!') || text.trim().length < 20) continue

      const rows = parseCSV(text)
      if (rows.length < 4) continue

      const titleRow = (rows[0]?.[0] || rows[1]?.[0] || '').toUpperCase()
      const expectedMonth = new Date(startDate+'T12:00:00').toLocaleString('en-US',{month:'long'}).toUpperCase()
      const expectedYear  = startDate.slice(0,4)
      if (!titleRow.includes(expectedMonth) && !titleRow.includes(expectedYear)) continue

      let hRow = []
      let dataStartRow = 3
      for (let ri = 0; ri <= Math.min(4, rows.length - 1); ri++) {
        const row = rows[ri] || []
        if (row.some(h => (h||'').toUpperCase().trim() === 'ENG' || (h||'').toUpperCase().includes('TOTAL XFER'))) {
          hRow = row
          dataStartRow = ri + 1
          break
        }
      }
      if (!hRow.length) hRow = rows[2] || []

      if (cfg.type === 'total_only') {
        const totalCols = []
        hRow.forEach((h,i) => { if ((h||'').toUpperCase().includes('TOTAL XFER')) totalCols.push(i) })
        const dayColStart = totalCols.length >= 1 ? totalCols[0] : 3

        for (let di = 0; di < 6; di++) {
          const date = weekDates[di]
          const dayRows = []
          for (let ri = dataStartRow; ri < rows.length; ri++) {
            const row = rows[ri]
            const name = String(row[0]||'').trim()
            const ext  = String(row[1]||'').replace(/,/g,'').trim()
            if (!name || !ext || isNaN(parseInt(ext,10))) continue
            if (name.toUpperCase().includes('TOTAL')) continue
            const english = parseInt(String(row[dayColStart + di]||'').replace(/,/g,''),10) || 0
            dayRows.push({ date, ext, name, english, spanish:0, total:english, team:teamId })
          }
          const ranked = dayRows.filter(r => r.english > 0).sort((a,b) => b.english - a.english)
          ranked.forEach((r, i) => results.push({ ...r, rank: i + 1 }))
        }
      } else {
        const engIdx = hRow.findIndex(h => (h||'').toUpperCase().trim() === 'ENG')
        const dayColStart = engIdx >= 0 ? engIdx : 2

        for (let di = 0; di < 6; di++) {
          const date = weekDates[di]
          const dayRows = []
          for (let ri = dataStartRow; ri < rows.length; ri++) {
            const row = rows[ri]
            const name = String(row[0]||'').trim()
            const ext  = String(row[1]||'').replace(/,/g,'').trim()
            if (!name || !ext || isNaN(parseInt(ext,10))) continue
            if (name.toUpperCase().includes('TOTAL')) continue
            const english = parseInt(String(row[dayColStart + di*3]||'').replace(/,/g,''),10) || 0
            const spanish = parseInt(String(row[dayColStart + di*3 + 1]||'').replace(/,/g,''),10) || 0
            dayRows.push({ date, ext, name, english, spanish, total:english+spanish, team:teamId })
          }
          const ranked = dayRows.filter(r => r.english > 0).sort((a,b) => b.english - a.english)
          ranked.forEach((r, i) => results.push({ ...r, rank: i + 1 }))
        }
      }
    } catch(e) {}
  }
  return results
}

async function loadAgentSnapshotsRemoteForTeam(teamId) {
  const VALID_TEAMS = new Set(['asia','philippines','colombia','central','mexico','venezuela'])
  let sheetNames = ['AGENT_SNAPSHOTS']

  try {
    const namesRes = await fetchWithTimeout(`${SCRIPT_URL}?action=getAgentSnapshotSheetNames&t=${Date.now()}`, {}, 8000)
    const namesData = await namesRes.json()
    if (namesData?.ok && Array.isArray(namesData.sheets) && namesData.sheets.length > 0) {
      sheetNames = namesData.sheets
    }
  } catch(e) {}

  const merged = {}
  for (const shName of sheetNames) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${USERS_SHEET_ID_PROFILE}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(shName)}&t=${Date.now()}`
      const res = await fetchWithTimeout(url, {}, 15000)
      const text = await res.text()
      if (!text || text.trim().startsWith('<!') || text.trim().length < 20) continue
      const rows = parseCSV(text).slice(1)
      rows.forEach(r => {
        if (!r[0] || !r[1]) return
        const date = normalizeDate(r[0])
        if (!date || !isValidIsoDate(date)) return
        const ext = String(r[1]).trim()
        const rawTeam = String(r[6] || '').trim()
        const team = VALID_TEAMS.has(rawTeam)
          ? rawTeam
          : (ext.startsWith('1') ? 'philippines' : ext.startsWith('2') ? 'colombia' : ext.startsWith('3') ? 'asia' : ext.startsWith('4') ? 'central' : ext.startsWith('5') ? 'mexico' : ext.startsWith('6') ? 'venezuela' : 'asia')
        if (team !== teamId) return
        const english = Number(r[3]) || 0
        const spanish = Number(r[4]) || 0
        const total = Number(r[5]) || (english + spanish)
        const key = `${date}|${ext}`
        if (!merged[key] || total > merged[key].total || english > merged[key].english) {
          merged[key] = { date, ext, name: r[2] || '', english, spanish, total, team, rank: null }
        }
      })
    } catch(e) {}
  }
  return Object.values(merged)
}

function findAgentInHistoryRows(rows, ext) {
  const agents = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cell0 = String(row[0] || '').trim()
    const cell0U = cell0.toUpperCase()
    if (cell0U.includes('AGENT') && cell0U.includes('LOGGED')) break
    if (cell0U.includes('MANAGEMENT') || cell0U.includes('LEXNER') || cell0U.includes('GENERAL') || cell0.length <= 1) continue
    const extNum = safeInt(row[1])
    if (extNum < 1000 || extNum > 9999) continue
    agents.push({ ext:String(extNum), english:safeInt(row[3]) })
  }
  agents.sort((a,b)=>b.english-a.english)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cell0 = String(row[0] || '').trim()
    const cell0U = cell0.toUpperCase()
    if (cell0U.includes('AGENT') && cell0U.includes('LOGGED')) break
    if (safeInt(row[1]) !== parseInt(ext, 10)) continue
    if (cell0.length <= 1) continue
    const rankIdx = agents.findIndex(a => a.ext === String(ext))
    const spanish = safeInt(row[2])
    const english = safeInt(row[3])
    return { name:cell0, ext:String(ext), english, spanish, total:english+spanish, rank:rankIdx >= 0 ? rankIdx + 1 : null }
  }
  return null
}

async function loadLegacyAsiaHistory(ext, existingDates) {
  const jobs = HISTORY_DATES.map(async hd => {
    if (existingDates.has(hd.isoDate)) return null
    try {
      const rows = await fetchSheet(HISTORY_SHEET_ID, hd.tab)
      const agent = findAgentInHistoryRows(rows, ext)
      return agent ? { date: hd.isoDate, ...agent, team:'asia' } : null
    } catch(e) { return null }
  })
  const results = await Promise.allSettled(jobs)
  return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value)
}

function mergeRecordsWithRanks(records) {
  const dedup = {}
  records.forEach(r => {
    const date = normalizeDate(r.date)
    if (!date || !r.ext) return
    const key = `${date}|${String(r.ext).trim()}`
    const total = Number(r.total) || ((Number(r.english) || 0) + (Number(r.spanish) || 0))
    if (!dedup[key] || total > (dedup[key].total || 0) || (Number(r.english) || 0) > (dedup[key].english || 0)) {
      dedup[key] = {
        date,
        ext: String(r.ext).trim(),
        name: r.name || `Agent #${r.ext}`,
        english: Number(r.english) || 0,
        spanish: Number(r.spanish) || 0,
        total,
        team: r.team,
        rank: r.rank ?? null,
      }
    }
  })

  const byDate = {}
  Object.values(dedup).forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = []
    byDate[r.date].push(r)
  })

  Object.values(byDate).forEach(list => {
    const sorted = [...list].sort((a, b) => b.english - a.english)
    sorted.forEach((r, i) => {
      const key = `${r.date}|${r.ext}`
      dedup[key].rank = i + 1
    })
  })

  return Object.values(dedup).sort((a,b) => a.date.localeCompare(b.date))
}

async function loadAgentData(ext) {
  const teamInfo = getTeamFromExt(ext)
  const [remoteRecords, weeklyRecords] = await Promise.all([
    loadAgentSnapshotsRemoteForTeam(teamInfo.id),
    fetchWeeklySheetAgents(teamInfo.id),
  ])

  const mergedTeam = mergeRecordsWithRanks([...(remoteRecords || []), ...(weeklyRecords || [])])
  const agentRecords = mergedTeam.filter(r => String(r.ext) === String(ext))
  const existingDates = new Set(agentRecords.map(r => r.date))

  if (teamInfo.id === 'asia') {
    const legacy = await loadLegacyAsiaHistory(ext, existingDates)
    return mergeRecordsWithRanks([...mergedTeam, ...legacy]).filter(r => String(r.ext) === String(ext))
  }

  return agentRecords
}

export default function Profile() {
  const { ext }  = useParams()
  const navigate = useNavigate()
  const canvasRef= useRef(null)
  const user     = useMemo(()=>JSON.parse(localStorage.getItem('pulse_user')||'null'),[])
  const isOwnProfile = String(user?.agentExt) === String(ext)
  const teamInfo = getTeamFromExt(ext)

  const [records,    setRecords]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [agentName,  setAgentName]  = useState(`Agent #${ext}`)
  const [userPhoto,  setUserPhoto]  = useState(localStorage.getItem('pulse_user_photo')||'')
  const [teamTotals, setTeamTotals] = useState({})

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

  useEffect(()=>{
    if(!user)return
    let cancelled=false
    setLoading(true)

    loadUserPhotoFromSheets(user.name).then(p=>{if(!cancelled&&p)setUserPhoto(p)})
    loadAgentData(ext).then(recs=>{
      if(cancelled)return
      const finalRecs = Array.isArray(recs) ? recs.filter(r => r.date && isValidIsoDate(r.date)).sort((a,b)=>a.date.localeCompare(b.date)) : []
      setRecords(finalRecs)
      const named = finalRecs.filter(r => r.name && r.name.length > 1)
      if(named.length > 0) setAgentName(named[named.length - 1].name)
      setLoading(false)
    }).catch(()=>{ if(!cancelled){ setRecords([]); setLoading(false) } })

    loadDailyTotals().then(totalsMap=>{
      if(cancelled)return
      const teamMap={}
      Object.entries(totalsMap||{}).forEach(([date,teams])=>{
        const normalized=normalizeDate(date)
        if(!normalized)return
        if(teams?.[teamInfo.id]!==undefined) teamMap[normalized]=teams[teamInfo.id]
      })
      setTeamTotals(teamMap)
    }).catch(()=>{})

    return()=>{cancelled=true}
  },[ext,user,teamInfo.id])

  const cleanRecords = useMemo(()=>{
    return records
      .map(r=>({...r,date:normalizeDate(r.date)}))
      .filter(r=>r.date&&isValidIsoDate(r.date))
      .filter((r,i,arr)=>arr.findIndex(x=>x.date===r.date)===i)
      .sort((a,b)=>a.date.localeCompare(b.date))
  },[records])

  if (!user) {
    return (
      <div className="profile-root">
        <canvas ref={canvasRef} className="profile-trail-canvas"/>
        <Navbar />
        <div className="profile-gate">
          <div className="profile-gate-card">
            <div style={{fontSize:52,marginBottom:16}}>🔒</div>
            <h2 className="profile-gate-title">Sign in to view profiles</h2>
            <p className="profile-gate-sub">You need a Pulse account to view agent profiles.<br/>Profiles are only visible to Kampaign Kings members.</p>
            <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:24}}>
              <button className="profile-gate-btn primary" onClick={()=>navigate('/signin')}>Sign In</button>
              <button className="profile-gate-btn ghost"   onClick={()=>navigate('/register')}>Register</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = (() => {
    if(cleanRecords.length===0)return null
    const withData=cleanRecords.filter(r=>r.total>0)
    if(withData.length===0)return null
    const totalEn=cleanRecords.reduce((s,r)=>s+r.english,0)
    const totalSp=cleanRecords.reduce((s,r)=>s+r.spanish,0)
    const avgEn=Math.round(totalEn/cleanRecords.length)
    const bestDay=[...withData].sort((a,b)=>b.english-a.english)[0]
    const worstDay=[...withData].sort((a,b)=>a.english-b.english)[0]
    const top3Days=cleanRecords.filter(r=>r.rank&&r.rank<=3)
    const top1Days=cleanRecords.filter(r=>r.rank===1)
    const withShare=withData.filter(r=>teamTotals[r.date]>0)
    const bestShareDay=withShare.length>0?[...withShare].sort((a,b)=>(b.english/(teamTotals[b.date]||1))-(a.english/(teamTotals[a.date]||1)))[0]:null
    const bestSharePct=bestShareDay?((bestShareDay.english/teamTotals[bestShareDay.date])*100).toFixed(1):null
    const avgShare=withShare.length>0?(withShare.reduce((s,r)=>s+(r.english/(teamTotals[r.date]||1)),0)/withShare.length*100).toFixed(1):null
    return{totalEn,totalSp,avgEn,bestDay,worstDay,activeDays:withData.length,zeroDays:cleanRecords.length-withData.length,daysTracked:cleanRecords.length,top3Days:top3Days.length,top1Days:top1Days.length,bestShareDay,bestSharePct,avgShare}
  })()

  const maxEnglish = Math.max(...cleanRecords.map(r=>r.english),1)
  const timelineMinWidth = Math.max(cleanRecords.length * 84, 1100)

  return (
    <div className="profile-root">
      <canvas ref={canvasRef} className="profile-trail-canvas"/>
      <Navbar />

      {loading ? (
        <div className="profile-loading"><div className="profile-spinner"/><p>Loading agent history...</p></div>
      ) : (
        <div className="profile-body">
          <div className="profile-hero">
            <div className="profile-hero-inner">
              <div className="profile-avatar-ring">
                {isOwnProfile && userPhoto
                  ? <img src={userPhoto} alt="" className="profile-avatar-photo"/>
                  : <div className="profile-avatar-letter">{agentName?.[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="profile-hero-info">
                <h1 className="profile-hero-name">{agentName}</h1>
                <div className="profile-hero-meta">
                  <TeamFlag flag={teamInfo.flag} size={18}/>
                  <span style={{fontSize:13,color:'#9ca3af'}}>{teamInfo.name}</span>
                  <span className="profile-ext-tag">#{ext}</span>
                  {isOwnProfile && <span className="profile-own-tag">✓ You</span>}
                </div>
                {cleanRecords.length === 0 && <p style={{color:'#6b7280',marginTop:8,fontSize:12}}>No data yet.</p>}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12,flexWrap:'wrap',gap:10}}>
              <div className="profile-share">
                <div className="profile-share-url">pulse-kk.com/profile/{ext}</div>
                <button className="profile-share-btn" onClick={()=>{navigator.clipboard.writeText(`https://pulse-kk.com/profile/${ext}`);alert('Link copied!')}}>Copy Link</button>
              </div>
              {isOwnProfile && (
                <button style={{padding:'6px 14px',background:'#f97316',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:700}} onClick={()=>navigate('/settings')}>✏️ Edit Profile</button>
              )}
            </div>
          </div>

          {stats && (
            <>
              <div className="profile-stats-row">
                <div className="pstat blue"><div className="pstat-val">{stats.totalEn.toLocaleString()}</div><div className="pstat-lbl">Total English Xfers</div></div>
                {stats.totalSp > 0 && <div className="pstat green"><div className="pstat-val">{stats.totalSp.toLocaleString()}</div><div className="pstat-lbl">Total Spanish Xfers</div></div>}
                <div className="pstat orange"><div className="pstat-val">{stats.avgEn}</div><div className="pstat-lbl">Avg English / Day</div></div>
                <div className="pstat purple"><div className="pstat-val">{stats.activeDays}</div><div className="pstat-lbl">Active Days</div></div>
                <div className="pstat gold"><div className="pstat-val" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Img src={E.goal1} size={26}/>{stats.top3Days}</div><div className="pstat-lbl">Top 3 Appearances</div></div>
                <div className="pstat teal"><div className="pstat-val" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Img src={E.medal1} size={24}/>{stats.top1Days}</div><div className="pstat-lbl">#1 Days</div></div>
              </div>

              {stats.avgShare && (
                <div className="profile-section" style={{marginTop:16}}>
                  <h2 className="profile-section-title">🎯 Share of Success</h2>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                    <div style={{background:'#181b23',borderRadius:12,padding:'18px 20px',border:'0.5px solid #2a2d38',textAlign:'center'}}>
                      <div style={{fontSize:28,fontWeight:800,color:getShareColor(parseFloat(stats.avgShare))}}>{stats.avgShare}%</div>
                      <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>Avg Team Contribution</div>
                      <div style={{fontSize:11,color:getShareColor(parseFloat(stats.avgShare)),marginTop:6,fontWeight:600}}>{getShareLabel(parseFloat(stats.avgShare))}</div>
                    </div>
                    {stats.bestShareDay && (
                      <div style={{background:'#181b23',borderRadius:12,padding:'18px 20px',border:'0.5px solid #2a2d38',textAlign:'center'}}>
                        <div style={{fontSize:28,fontWeight:800,color:'#a78bfa'}}>{stats.bestSharePct}%</div>
                        <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>Best Share Day</div>
                        <div style={{fontSize:11,color:'#6b7280',marginTop:6}}>{formatDate(stats.bestShareDay.date)} · {stats.bestShareDay.english} EN</div>
                      </div>
                    )}
                    <div style={{background:'#181b23',borderRadius:12,padding:'18px 20px',border:'0.5px solid #2a2d38',textAlign:'center',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                      <div style={{fontSize:12,color:'#9ca3af',marginBottom:8}}>Risk Level</div>
                      {parseFloat(stats.avgShare) >= 20
                        ? <div style={{color:'#f87171',fontWeight:700,fontSize:14}}>⚠️ High Dependency<br/><span style={{fontSize:11,fontWeight:400,color:'#6b7280'}}>Team relies heavily on this agent</span></div>
                        : parseFloat(stats.avgShare) >= 12
                        ? <div style={{color:'#fb923c',fontWeight:700,fontSize:14}}>⚡ Notable Contributor<br/><span style={{fontSize:11,fontWeight:400,color:'#6b7280'}}>Significant impact on team output</span></div>
                        : <div style={{color:'#34d399',fontWeight:700,fontSize:14}}>✅ Balanced<br/><span style={{fontSize:11,fontWeight:400,color:'#6b7280'}}>Healthy contribution level</span></div>
                      }
                    </div>
                  </div>
                </div>
              )}

              <div className="profile-highlights">
                <div className="phighlight"><div className="phighlight-left"><Img src={E.goal} size={26}/><div><div className="phighlight-title">Best Day</div><div className="phighlight-date">{formatDate(stats.bestDay.date)}</div></div></div><div className="phighlight-val" style={{color:'#34d399'}}>{stats.bestDay.english} EN</div></div>
                <div className="phighlight"><div className="phighlight-left"><Img src={E.zero} size={26}/><div><div className="phighlight-title">Lowest Active Day</div><div className="phighlight-date">{formatDate(stats.worstDay.date)}</div></div></div><div className="phighlight-val" style={{color:'#f87171'}}>{stats.worstDay.english} EN</div></div>
                <div className="phighlight"><div className="phighlight-left"><span style={{fontSize:24}}>📅</span><div><div className="phighlight-title">Days Tracked</div><div className="phighlight-date">{stats.zeroDays} zero days</div></div></div><div className="phighlight-val" style={{color:'#60a5fa'}}>{stats.daysTracked}</div></div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section-title">📈 Performance Timeline</h2>
                <div style={{overflowX:'auto',overflowY:'hidden',paddingBottom:18,marginTop:8}}>
                  <div className="profile-chart" style={{minWidth:`${timelineMinWidth}px`,display:'grid',gridAutoFlow:'column',gridAutoColumns:'72px',gap:'14px',alignItems:'end'}}>
                    {cleanRecords.map((r,i)=>{
                      const teamTotal=teamTotals[r.date]||0
                      const sharePct=teamTotal>0?((r.english/teamTotal)*100).toFixed(1):null
                      const tooltipText=`${formatDate(r.date)}: ${r.english} EN${r.rank?` · Rank #${r.rank}`:''}${sharePct?` · ${sharePct}% share`:''}`
                      return(
                        <div key={i} className="ptl-col" title={tooltipText} style={{minWidth:72,cursor:'pointer'}}>
                          <div className="ptl-bar-outer" style={{height:190}}>
                            <div className="ptl-bar" style={{height:`${(r.english/maxEnglish)*100}%`,background:r.rank===1?'#fbbf24':r.rank===2?'#9ca3af':r.rank===3?'#cd7f32':r.english>=teamInfo.goal?'#34d399':r.english>0?'#60a5fa':'#2a2d38'}}/>
                          </div>
                          <div className="ptl-rank">{r.rank&&r.rank<=3?<MedalImg rank={r.rank}/>:null}</div>
                          <div className="ptl-val" style={{color:r.english===stats.bestDay.english?'#34d399':r.english===0?'#4b5563':'#9ca3af'}}>{r.english>0?r.english:'—'}</div>
                          <div className="ptl-date">{formatDate(r.date)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="ptl-legend">
                  <span><Img src={E.medal1} size={13}/> #1 day</span>
                  <span><span style={{color:'#34d399'}}>■</span> Hit goal</span>
                  <span><span style={{color:'#60a5fa'}}>■</span> Active</span>
                  <span><span style={{color:'#374151'}}>■</span> Zero</span>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section-title">📋 Daily Records</h2>
                <div className="profile-table-wrap">
                  <table className="profile-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>English</th>{teamInfo.hasSp&&<th>Spanish</th>}<th>Total</th><th>Rank</th><th style={{color:'#a78bfa'}}>Share%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...cleanRecords].reverse().map((r,i)=>{
                        const teamTotal=teamTotals[r.date]||0
                        const sharePct=teamTotal>0?((r.english/teamTotal)*100):null
                        return(
                          <tr key={i} className={r.rank===1?'ptr-gold':r.rank===2?'ptr-silver':r.rank===3?'ptr-bronze':r.total===0?'ptr-zero':''}>
                            <td style={{color:'#9ca3af'}}>{formatDate(r.date)}</td>
                            <td style={{color:'#60a5fa',fontWeight:600}}>{r.english}</td>
                            {teamInfo.hasSp&&<td style={{color:'#34d399',fontWeight:600}}>{r.spanish}</td>}
                            <td style={{color:'#f97316',fontWeight:600}}>{r.total}</td>
                            <td>{r.rank?<MedalImg rank={r.rank}/>:<span style={{color:'#4b5563'}}>—</span>}</td>
                            <td style={{color:sharePct!==null?getShareColor(sharePct):'#4b5563',fontWeight:600,fontSize:13}}>
                              {sharePct!==null?`${sharePct.toFixed(1)}%`:'—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {cleanRecords.length === 0 && (
            <div className="profile-empty">
              <Img src={E.zero} size={54}/>
              <p style={{fontSize:18,fontWeight:700,color:'#e5e7eb',marginTop:16}}>No data found for #{ext}</p>
              <p style={{color:'#6b7280',fontSize:13,marginTop:8}}>Data appears as days are recorded.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}