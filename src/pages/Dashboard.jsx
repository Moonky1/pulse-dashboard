import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import Navbar from '../components/Navbar'
import './dashboard.css'

const SHEET_ID         = '1M-LxHggUFQlmZVDbOPwU866ee0_Dp4AnDchBHXaq-fs'
const USERS_SHEET_ID   = '1d6j3FEPnFzE-fAl0K6O43apdbNvB0NzbLSJLEJF-TxI'
const HISTORY_SHEET_ID = '1u_5CLPEonZGarvaXU3Uwwx-nczElf5td3iKLRfQOVYU'
const SCRIPT_URL       = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'

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

// Local flag images
const FLAG_LOCAL = {
  philippines: '/flags/philippines.png',
  colombia:    '/flags/colombia.png',
  mexico:      '/flags/mexico.png',
  venezuela:   '/flags/venezuela.png',
  asia:        '/flags/asia.png',
  central:     null,
}

const TEAM_SHEETS = [
  { id:'philippines', label:'Philippines', sheetName:'AW GARRET PHILIPPINES ',               extStart:'1', hasSp:false, goal:10, colEn:2, colSp:null, protected:true  },
  { id:'colombia',    label:'Colombia',    sheetName:'AW GARRET COLOMBIA JUAN GARCIA',       extStart:'2', hasSp:true,  goal:10, colEn:3, colSp:4,    protected:false },
  { id:'central',     label:'Central',     sheetName:'AW GARRET CENTRAL AMERICA - CAROLINA', extStart:'4', hasSp:true,  goal:10, colEn:3, colSp:4,    protected:false },
  { id:'mexico',      label:'Mexico',      sheetName:'AW GARRET BAJA MX KEVIN',              extStart:'5', hasSp:false, goal:10, colEn:3, colSp:null, protected:false },
  { id:'venezuela',   label:'Venezuela',   sheetName:'AW GARRET VENEZUELA PATRICIA ',        extStart:'6', hasSp:true,  goal:10, colEn:3, colSp:4,    protected:true  },
]

const TEAM_DISPLAY_NAMES = {
  philippines:'Philippines', colombia:'Colombia', central:'Central America',
  mexico:'Mexico Baja', venezuela:'Venezuela',
}
const DISPLAY_NAME_TO_ID = {
  'Philippines':'philippines', 'Colombia':'colombia', 'Central America':'central',
  'Mexico Baja':'mexico', 'Venezuela':'venezuela', 'Asia':'asia',
}

function TabFlag({ teamId }) {
  const src = FLAG_LOCAL[teamId]
  if (!src) return <span style={{ fontSize:14, lineHeight:1 }}>🌎</span>
  return <img src={src} alt="" width="16" height="12" style={{ borderRadius:2, objectFit:'cover', verticalAlign:'middle' }}/>
}

function normalizeDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  try {
    const d = new Date(s); if (isNaN(d.getTime())) return null
    const y = d.getUTCFullYear(), m = String(d.getUTCMonth()+1).padStart(2,'0'), day = String(d.getUTCDate()).padStart(2,'0')
    return `${y}-${m}-${day}`
  } catch(e) { return null }
}

const csvUrl = (sheetId, sheet) => `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&t=${Date.now()}`
function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result=[]; let current=''; let inQuotes=false
    for(let i=0;i<row.length;i++){if(row[i]==='"'){inQuotes=!inQuotes;continue}if(row[i]===','&&!inQuotes){result.push(current.trim());current='';continue}current+=row[i]}
    result.push(current.trim()); return result
  })
}
async function fetchSheet(sheetId, name) {
  const res = await fetch(csvUrl(sheetId, name)); const text = await res.text()
  if (!text || text.trim().startsWith('<!') || text.trim().length < 10) throw new Error(`Sheet "${name}" no data`)
  return parseCSV(text)
}
async function fetchSheetViaScript(sheetId, sheetName) {
  const url = `${SCRIPT_URL}?action=getSheet&sheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(sheetName)}&t=${Date.now()}`
  const res = await fetch(url); const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`getSheet error`)
  return data.map(row => row.map(cell => String(cell===null||cell===undefined?'':cell)))
}
async function scriptCall(params) {
  try { const url=`${SCRIPT_URL}?${new URLSearchParams(params)}&t=${Date.now()}`; const res=await fetch(url); return await res.json() } catch(e) { return{ok:false,error:String(e)} }
}

const safeInt = (val) => parseInt((val||'').toString().replace(/,/g,'')) || 0
const extractPhones = (cell) => { if(!cell)return[]; return cell.split('/').map(p=>p.trim().replace(/^tel:/i,'')).filter(p=>p.length>=7) }
const OVERRIDE_KEY_AGENTS = (date,teamId='asia') => teamId==='asia'?`pulse_overrides_${date}`:`pulse_overrides_${teamId}_${date}`
const OVERRIDE_KEY_TOTALS = (date,teamId='asia') => teamId==='asia'?`pulse_totals_override_${date}`:`pulse_totals_override_${teamId}_${date}`

async function persistOverride(date, key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  try { const url=`${SCRIPT_URL}?action=saveOverride&date=${encodeURIComponent(date)}&key=${encodeURIComponent(key)}&value=${encodeURIComponent(JSON.stringify(value))}`; await fetch(url,{mode:'no-cors'}) } catch(e) {}
}
async function loadRemoteOverrides() {
  try { const res=await fetch(`${SCRIPT_URL}?action=getOverrides`); const data=await res.json(); if(!Array.isArray(data))return; data.forEach(([date,key,value])=>{try{if(!localStorage.getItem(key))localStorage.setItem(key,value)}catch(e){}}) } catch(e) {}
}
async function loadUserPhotoFromSheets(userName) {
  try { const res=await fetch(`${SCRIPT_URL}?action=getUserPhoto&userName=${encodeURIComponent(userName)}`); const data=await res.json(); if(data.photo){localStorage.setItem('pulse_user_photo',data.photo);return data.photo} } catch(e) {}
  return null
}
async function saveAgentSnapshotsToSheets(date, allAgents) {
  const payload=JSON.stringify(allAgents||[]); const cacheKey=`pulse_snap_sheets_${date}`
  if(sessionStorage.getItem(cacheKey)===payload)return; sessionStorage.setItem(cacheKey,payload)
  try { const body=new URLSearchParams({action:'saveAgentSnapshots',date,snapshots:payload}); await fetch(SCRIPT_URL,{method:'POST',body,mode:'no-cors'}) } catch(e) {}
}
async function saveDailyTotalsToSheets(date, teamRows) {
  const teams=teamRows.map(t=>({id:t.id||t.name.toLowerCase().replace(/\s+/g,'_'),name:t.name,english:t.english,spanish:t.spanish,total:t.total,agents:t.agents,noSpanish:t.noSpanish||false}))
  const payload=JSON.stringify(teams); const cacheKey=`pulse_totals_saved_${date}`; const lastSaved=sessionStorage.getItem(cacheKey)
  if(lastSaved&&(Date.now()-parseInt(lastSaved))<3*60*1000)return; sessionStorage.setItem(cacheKey,String(Date.now()))
  try { const body=new URLSearchParams({action:'saveDailyTotals',date,teams:payload}); await fetch(SCRIPT_URL,{method:'POST',body,mode:'no-cors'}) } catch(e) {}
}
async function saveTeamSnapshotToSheets(date, teamId, agents) {
  const payload=JSON.stringify(agents||[]); const cacheKey=`pulse_team_snap_${date}_${teamId}`; const lastSaved=sessionStorage.getItem(cacheKey)
  if(lastSaved&&(Date.now()-parseInt(lastSaved))<3*60*1000)return; sessionStorage.setItem(cacheKey,String(Date.now()))
  try { const body=new URLSearchParams({action:'saveTeamSnapshot',date,teamId,agents:payload}); await fetch(SCRIPT_URL,{method:'POST',body,mode:'no-cors'}) } catch(e) {}
}
// ── One-time backfill: push all local snapshots to Sheets ──────────────────
// Runs once per device. Makes all agent history visible cross-device.
async function backfillHistoricalDataToSheets() {
  const DONE_KEY = 'pulse_backfill_v9'
  if (localStorage.getItem(DONE_KEY)) return
  const snaps = loadAllSnapshots()
  if (snaps.length === 0) { localStorage.setItem(DONE_KEY, '1'); return }

  const BATCH = 40  // 40 agents per request keeps payload ~4KB

  for (const snap of snaps) {
    try {
      const allAgents = [], tt = []

      for (const t of TEAM_SHEETS) {
        const raw = snap.teams?.[t.id]; if (!raw?.length) continue
        const { agents, totals } = parseTeamSheet(raw, t)
        agents.forEach(a => allAgents.push({
          ext: a.ext, name: a.name,
          english: a.english, spanish: a.spanish||0, total: a.total, team: t.id
        }))
        if (totals.total > 0) tt.push({
          id: t.id, name: TEAM_DISPLAY_NAMES[t.id]||t.id,
          english: totals.english, spanish: totals.spanish,
          total: totals.total, agents: agents.length, noSpanish: !t.hasSp
        })
      }
      if (snap.asiaData?.length) {
        const { agents, totals } = parseAsiaSheet(snap.asiaData)
        agents.forEach(a => allAgents.push({
          ext: a.ext, name: a.name,
          english: a.english, spanish: a.spanish||0, total: a.total, team: 'asia'
        }))
        if (totals.total > 0) tt.push({
          id: 'asia', name: 'Asia',
          english: totals.english, spanish: totals.spanish,
          total: totals.total, agents: agents.length, noSpanish: false
        })
      }
      if (!allAgents.length) continue

      // ── Append in batches — NO clear step (deleteRow is too slow in Apps Script) ──
      // getAgentSnapshotsFromSheet deduplicates by date so duplicates are harmless
      for (let b = 0; b < allAgents.length; b += BATCH) {
        const batch = allAgents.slice(b, b + BATCH)
        await fetch(SCRIPT_URL, {
          method: 'POST', mode: 'no-cors',
          body: new URLSearchParams({
            action: 'appendAgentSnapshots',
            date:   snap.date,
            snapshots: JSON.stringify(batch)
          })
        })
        await new Promise(r => setTimeout(r, 400))
      }

      // ── Save daily totals (for Share% in profiles) ──
      if (tt.length > 0) {
        await fetch(SCRIPT_URL, {
          method: 'POST', mode: 'no-cors',
          body: new URLSearchParams({
            action: 'saveDailyTotals',
            date: snap.date,
            teams: JSON.stringify(tt)
          })
        })
        await new Promise(r => setTimeout(r, 400))
      }

    } catch(e) {}
  }

  localStorage.setItem(DONE_KEY, '1')
}



const E = {goal:'/emojis/goal.webp',goal1:'/emojis/goal1.webp',goal3:'/emojis/goal3.webp',goal4:'/emojis/goal4.webp',medal1:'/emojis/medal1.webp',medal2:'/emojis/medal2.webp',medal3:'/emojis/web3.webp',zero:'/emojis/zero.webp',firework:'/emojis/firework.webp'}
const Img = ({src,size=18}) => <img src={src} width={size} height={size} style={{display:'inline-block',verticalAlign:'middle',objectFit:'contain'}}/>
const MEDALS = [E.medal1, E.medal2, E.medal3]

const todayKey     = () => new Date().toISOString().slice(0,10)
const colombiaHour = () => (new Date().getUTCHours()-5+24)%24
const includeOT    = () => colombiaHour() >= 18
const cellUpper    = (v) => (v||'').toString().toUpperCase().trim()

function parseTeamSheet(rows, config) {
  const { extStart, hasSp, colEn, colSp } = config
  if (!rows||!Array.isArray(rows)||rows.length===0) return{agents:[],totals:{english:0,spanish:0,total:0,activeAgents:0}}
  const agentMap={}; let inOT=false,afterMainEnd=false,otColEn=-1,otColSp=-1
  const isOTRow=(row)=>{
    for(let c=0;c<Math.min(row.length,6);c++){
      const v=cellUpper(row[c]); if(!v||v.length>28)continue
      if(v==='OT TAKERS')return true
      // "{TEAM} OT" — "COLOMBIA OT", "MEXICO OT", "VENEZUELA OT", etc.
      // uses includes to handle any spacing variant
      if(v.includes(' OT')&&v.length<=24)return true
      if(v.startsWith('OT ')&&v.length<=15)return true
    }
    return false
  }
  const isEndRow=(row)=>{for(let c=0;c<Math.min(row.length,3);c++){const v=cellUpper(row[c]);if(v.length<3)continue;if(v.includes('AGENT')&&(v.includes('LOGGED')||v.includes('LOG IN')))return true;if(v.includes('TOTAL')&&v.includes('TRANSFER'))return true}return false}
  const isSkipRow=(u)=>(u.includes('TOTAL')&&u.includes('TRANSFER'))||u.includes('THIS HOUR')||u.includes('THIS OUR')||u.includes('HOURLY')||u.includes('ON SITE')||u.includes('WEEKLY')
  const SKIP=new Set(['USERS','USER','AGENT NAME','ARWIN','LEXNER','SUPERVISOR','MANAGER','EXTENSION','TRANSFER','TRANSFERS','CAMPAIGN','PER AGENT','ENGLISH','SPANISH','TOTAL','GENERAL MANAGER','OPENERS','NEW AGENT','AGENTS','NEW AGENTS'])
  for(let i=0;i<rows.length;i++){
    const row=rows[i];if(!Array.isArray(row))continue
    const cell0=(row[0]||'').toString().trim(),cell0U=cell0.toUpperCase().trim()
    if(!inOT&&isOTRow(row)){if(!includeOT())break;inOT=true;afterMainEnd=false;otColEn=-1;otColSp=-1;continue}
    if(!inOT&&isEndRow(row)){if(!includeOT())break;afterMainEnd=true;continue}
    if(afterMainEnd&&!inOT)continue
    if(inOT&&otColEn<0){const hdrs=row.map(c=>(c||'').toString().toUpperCase().trim());if(hasSp){const ei=hdrs.findIndex(h=>h==='ENGLISH'),si=hdrs.findIndex(h=>h==='SPANISH');if(ei>=0||si>=0){otColEn=ei>=0?ei:colEn;otColSp=si>=0?si:(colSp!=null?colSp:-1);continue}}else{const ei=hdrs.findIndex(h=>h==='ENGLISH'||h==='TRANSFER'||h==='TRANSFERS'||h==='TOTAL XFERS'||h==='XFERS'||h==='XFER');if(ei>=0){otColEn=ei;otColSp=-1;continue}}const ck=parseInt((row[1]||'').toString().replace(/,/g,''));if(ck>=1000&&ck<=9999&&String(ck).startsWith(extStart)){otColEn=colEn;otColSp=colSp!=null?colSp:-1}else continue}
    if(inOT&&isEndRow(row)){const otAC=Object.values(agentMap).filter(a=>a._fromOT).length;if(otColEn>=0&&otAC===0){const en=safeInt(row[otColEn]),sp=otColSp>=0?safeInt(row[otColSp]):0;if(en>0||sp>0)agentMap['__OT__']={name:'__OT__',ext:'__OT__',english:en,spanish:sp,total:en+sp,_fromOT:true}};break}
    if(isSkipRow(cell0U)||cell0.length<2||SKIP.has(cell0U))continue
    const rawExt=(row[1]||'').toString().replace(/,/g,'').trim(),extNum=parseInt(rawExt)
    if(isNaN(extNum)||extNum<1000||extNum>9999)continue;if(!rawExt.startsWith(extStart))continue
    const ec=inOT?otColEn:colEn,sc=inOT?otColSp:(colSp!=null?colSp:-1);if(ec<0)continue
    const en=safeInt(row[ec]),sp=sc>=0?safeInt(row[sc]):0
    if(agentMap[extNum]){agentMap[extNum].english+=en;agentMap[extNum].spanish+=sp;agentMap[extNum].total=agentMap[extNum].english+agentMap[extNum].spanish;if(inOT)agentMap[extNum]._fromOT=true}
    else agentMap[extNum]={name:cell0,ext:String(extNum),english:en,spanish:sp,total:en+sp,_fromOT:inOT}
  }
  const allEntries=Object.values(agentMap)
  const agents=allEntries.filter(a=>a.ext!=='__OT__'&&a.ext!=='__MAIN_TOTAL__').map(a=>{const{_fromOT,...rest}=a;return rest})
  // Individual agent sum (includes OT agents via +=)
  const agentEn=agents.reduce((s,a)=>s+a.english,0)
  const agentSp=agents.reduce((s,a)=>s+a.spanish,0)
  // OT synthetic entry (when OT header had total but no individual rows)
  const otEntry=agentMap['__OT__']
  const en=agentEn+(otEntry?.english||0)
  const sp=agentSp+(otEntry?.spanish||0)
  return{agents,totals:{english:en,spanish:sp,total:en+sp,activeAgents:agents.length}}
}

function parseAsiaSheet(rows) {
  if(!rows||!Array.isArray(rows)||rows.length===0)return{agents:[],totals:{spanish:0,english:0,total:0,activeAgents:0}}
  const agentMap={}; let afterMainEnd=false,inOT=false,otDetected=false
  const COL_EXT=1,COL_SP=2,COL_EN=3
  const SKIP_NAMES=new Set(['ASIA','MANAGEMENT','LEXNER','GENERAL MANAGER','USER','USERS','SUPERVISOR','AGENT NAME','ARWIN','ENGLISH','SPANISH','TOTAL','TRANSFER','TRANSFERS','AGENTS'])
  const isEndMarker=(row)=>{for(let c=0;c<Math.min(row.length,4);c++){const v=cellUpper(row[c]);if(v.includes('AGENT')&&(v.includes('LOGGED')||v.includes('LOG IN')))return true;if(v.includes('TOTAL')&&v.includes('TRANSFER'))return true}return false}
  const isOTHeader=(row)=>{for(let c=0;c<Math.min(row.length,4);c++){const v=cellUpper(row[c]);if(v==='OT TAKERS'||v.startsWith('OT ')||v.endsWith(' OT')||v.includes(' OT '))return true}return false}
  for(let i=0;i<rows.length;i++){const row=rows[i];if(!Array.isArray(row))continue;const cell0=(row[0]||'').toString().trim(),cell0U=cellUpper(cell0);if(!inOT&&isOTHeader(row)){if(!includeOT())break;inOT=true;otDetected=true;afterMainEnd=false;continue};if(!inOT&&isEndMarker(row)){if(!includeOT())break;afterMainEnd=true;continue};if(afterMainEnd&&!inOT)continue;if(inOT&&!otDetected){otDetected=true;continue};if(inOT&&isEndMarker(row))break;if(SKIP_NAMES.has(cell0U)||cell0.length<2)continue;const extRaw=(row[COL_EXT]||'').toString().replace(/,/g,'').trim(),ext=parseInt(extRaw);if(isNaN(ext)||ext<1000||ext>9999)continue;const en=safeInt(row[COL_EN]),sp=safeInt(row[COL_SP]);if(agentMap[ext]){agentMap[ext].english+=en;agentMap[ext].spanish+=sp;agentMap[ext].total=agentMap[ext].english+agentMap[ext].spanish}else agentMap[ext]={name:cell0,ext:String(ext),spanish:sp,english:en,total:sp+en}}
  const agents=Object.values(agentMap),en=agents.reduce((s,a)=>s+a.english,0),sp=agents.reduce((s,a)=>s+a.spanish,0)
  return{agents,totals:{spanish:sp,english:en,total:sp+en,activeAgents:agents.length}}
}

const TEAMS_ORDER=['PHILIPPINES','VENEZUELA','COLOMBIA','MEXICO BAJA','CENTRAL AMERICA','ASIA']
const RANGES=[{label:'0',min:0,max:0,color:'#f87171'},{label:'1-4',min:1,max:4,color:'#fb923c'},{label:'5-9',min:5,max:9,color:'#fbbf24'},{label:'10-14',min:10,max:14,color:'#a3e635'},{label:'15-19',min:15,max:19,color:'#34d399'},{label:'20+',min:20,max:9999,color:'#22c55e'}]
const SAT_GOALS={colombia:5,central:5,venezuela:5,philippines:10,mexico:5,asia:10}
const getGoalForDate=(dateStr,baseGoal,teamId='asia')=>{try{const day=new Date(dateStr+'T12:00:00').getDay();if(day!==6)return baseGoal;return SAT_GOALS[teamId]??10}catch(e){return baseGoal}}
const saveLocalSnapshot=(generalData,asiaData,teamsData={})=>{
  const key=`pulse_snap_${todayKey()}`
  try{
    // Count total xfers in new data to avoid overwriting with cleaned sheet data
    let newTotal=0
    if(Array.isArray(generalData)){for(const row of generalData){const v=safeInt(row[5]);if(v>0)newTotal+=v}}
    const existing=localStorage.getItem(key)
    if(existing){
      const prev=JSON.parse(existing)
      let prevTotal=0
      if(Array.isArray(prev.generalData)){for(const row of prev.generalData){const v=safeInt(row[5]);if(v>0)prevTotal+=v}}
      // Keep existing if new data has significantly fewer xfers (supervisor cleaned sheet)
      if(prevTotal>0&&newTotal<prevTotal*0.6){return}
    }
    localStorage.setItem(key,JSON.stringify({generalData:generalData||[],asiaData:asiaData||[],teams:teamsData,savedAt:new Date().toISOString()}))
  }catch(e){}
}
const loadAllSnapshots=()=>{const snaps=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('pulse_snap_')){try{const date=k.replace('pulse_snap_','');const data=JSON.parse(localStorage.getItem(k));snaps.push({date,generalData:Array.isArray(data.generalData)?data.generalData:[],asiaData:Array.isArray(data.asiaData)?data.asiaData:[],teams:data.teams||{},savedAt:data.savedAt})}catch(e){}}}return snaps.sort((a,b)=>b.date.localeCompare(a.date))}
const formatDateLabel=(dateStr)=>{const today=todayKey(),yest=new Date();yest.setDate(yest.getDate()-1);const yKey=yest.toISOString().slice(0,10);if(dateStr===today)return'Today';if(dateStr===yKey)return'Yesterday';const[y,m,d]=dateStr.split('-');return`${d}/${m}/${y}`}

function parseHistorySheet(rows) {
  const agents=[]; let totals={spanish:0,english:0,total:0,activeAgents:0}
  for(let i=0;i<rows.length;i++){const row=rows[i],cell0=(row[0]||'').trim(),cell0U=cellUpper(cell0);if(cell0U.includes('AGENT')&&cell0U.includes('LOGGED')){const sp=safeInt(row[2]),en=safeInt(row[3]);totals={spanish:sp,english:en,total:sp+en,activeAgents:agents.length};break};if(cell0U.includes('MANAGEMENT')||cell0U.includes('CALL')||cell0U.includes('TRANSFER')||cell0U.includes('LEXNER')||cell0U.includes('GENERAL')||cell0.length<=1)continue;const ext=safeInt(row[1]);if(ext<1000||ext>9999)continue;const sp=safeInt(row[2]),en=safeInt(row[3]);agents.push({name:cell0,ext:String(ext),spanish:sp,english:en,total:sp+en})}
  if(!totals.total){const sp=agents.reduce((s,a)=>s+a.spanish,0),en=agents.reduce((s,a)=>s+a.english,0);totals={spanish:sp,english:en,total:sp+en,activeAgents:agents.length}}
  return{agents,totals}
}

const isSunday = (dateStr) => { try { return new Date(dateStr+'T12:00:00').getDay()===0 } catch { return false } }

function BarChart({agents, metric}) {
  const [tooltip,setTooltip] = useState(null)
  const buckets=RANGES.map(r=>({...r,agentsInRange:agents.filter(a=>a[metric]>=r.min&&a[metric]<=r.max),count:agents.filter(a=>a[metric]>=r.min&&a[metric]<=r.max).length}))
  const maxCount=Math.max(...buckets.map(b=>b.count),1)
  return(
    <div className="chart-wrap">
      <div className="chart-bars">
        {buckets.map((b,i)=>(
          <div key={i} className={`chart-col ${b.count>0?'chart-col-hoverable':''}`} onMouseEnter={(e)=>{if(!b.count)return;const r=e.currentTarget.getBoundingClientRect();setTooltip({bucket:b,rect:r})}} onMouseLeave={()=>setTooltip(null)}>
            <div className="bar-count">{b.count}</div>
            <div className="bar-outer"><div className="bar-inner" style={{height:`${(b.count/maxCount)*100}%`,background:b.color}}/></div>
            <div className="bar-label">{b.label}</div>
          </div>
        ))}
      </div>
      {tooltip&&(<div className="bar-tooltip-h" style={{top:tooltip.rect.top-12,left:'50%',transform:'translate(-50%,calc(-100% - 12px))'}}>
        <div className="bar-tooltip-h-header" style={{color:tooltip.bucket.color}}><span>{tooltip.bucket.label} xfers</span><span className="bar-tooltip-count">{tooltip.bucket.count} agent{tooltip.bucket.count!==1?'s':''}</span></div>
        <div className="bar-tooltip-h-grid">{tooltip.bucket.agentsInRange.sort((a,b)=>b[metric]-a[metric]).map((a,i)=>(<div key={i} className="bar-tooltip-h-item"><span className="bar-tooltip-h-name">{a.name}</span><span className="bar-tooltip-h-val" style={{color:tooltip.bucket.color}}>{a[metric]}</span></div>))}</div>
      </div>)}
      <div className="chart-legend">{RANGES.map((r,i)=>(<div key={i} className="legend-item"><div className="legend-dot" style={{background:r.color}}/><span>{r.label} xfers</span></div>))}</div>
    </div>
  )
}

function DatePicker({dateTabs, selectedDate, onSelect}) {
  const [open,setOpen] = useState(false); const ref=useRef(null)
  const today=todayKey(); const yest=new Date(); yest.setDate(yest.getDate()-1); const yKey=yest.toISOString().slice(0,10)
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[])
  const workingTabs=dateTabs.filter(date=>!isSunday(date))
  const groups={}
  workingTabs.forEach(date=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;const[y,m]=date.split('-');const mk=`${y}-${m}`;const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const label=`${mn[parseInt(m)-1]} ${y}`;if(!groups[mk])groups[mk]={label,dates:[]};groups[mk].dates.push(date)})
  const formatFull=(d)=>{if(d===today)return'Today - LIVE';if(d===yKey)return'Yesterday';const[y,m,dd]=d.split('-');const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return`${days[new Date(d+'T12:00:00').getDay()]} ${dd}/${m}/${y}`}
  return(
    <div className="datepicker-wrap" ref={ref}>
      <button className="datepicker-btn" onClick={()=>setOpen(o=>!o)}>
        <span>📅</span>
        <span className="datepicker-label">{selectedDate===today?<><span className="dp-live-dot"/>Today - LIVE</>:formatFull(selectedDate)}</span>
        {HISTORY_ISO_SET.has(selectedDate)&&<span className="dp-hist-badge">H</span>}
        <span className="datepicker-arrow">{open?'▲':'▼'}</span>
      </button>
      {open&&(<div className="datepicker-dropdown" onClick={e=>e.stopPropagation()}>
        {Object.entries(groups).map(([mk,group])=>(
          <div key={mk} className="dp-group">
            <div className="dp-group-label">{group.label}</div>
            <div className="dp-group-dates">
              {group.dates.map(date=>{const isT=date===today,isY=date===yKey,isH=HISTORY_ISO_SET.has(date),isSel=date===selectedDate;const[y,m,d]=date.split('-');const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const dn=days[new Date(date+'T12:00:00').getDay()];return(<button key={date} className={`dp-date-btn ${isSel?'dp-selected':''} ${isT?'dp-today':''} ${isH?'dp-hist':''}`} onClick={()=>{onSelect(date);setOpen(false)}}><span className="dp-dayname">{isT?'Today':isY?'Yest.':dn}</span><span className="dp-daynum">{d}/{m}</span>{isT&&<span className="dp-live-pill">LIVE</span>}{isH&&!isT&&<span className="dp-h-pill">H</span>}</button>)})}
            </div>
          </div>
        ))}
      </div>)}
    </div>
  )
}

const TEAM_ACCENT={PHILIPPINES:'#3b82f6',VENEZUELA:'#ef4444',COLOMBIA:'#f59e0b','MEXICO BAJA':'#10b981','CENTRAL AMERICA':'#8b5cf6',ASIA:'#f97316'}

function getTeamFlagElement(name, size=32) {
  const n=name.toUpperCase()
  let teamId=null
  if(n.includes('PHIL'))teamId='philippines'
  else if(n.includes('VENE'))teamId='venezuela'
  else if(n.includes('COLOM'))teamId='colombia'
  else if(n.includes('MEXICO'))teamId='mexico'
  else if(n.includes('CENTRAL'))teamId='central'
  else if(n.includes('ASIA'))teamId='asia'
  if(teamId&&FLAG_LOCAL[teamId])return<img src={FLAG_LOCAL[teamId]} alt="" width={size} height={Math.round(size*0.7)} style={{borderRadius:4,objectFit:'cover',boxShadow:'0 2px 8px rgba(0,0,0,0.4)'}}/>
  return<span style={{fontSize:size*0.8,lineHeight:1}}>🌎</span>
}

function TeamCard({row, rank, isMyTeam, isFirst, onSelect}) {
  const [hovered,setHovered]=useState(false)
  const accent=TEAM_ACCENT[row.name.toUpperCase()]||'#f97316'
  const rankEmojis=[E.goal1,E.goal3,E.goal4]
  const teamId=DISPLAY_NAME_TO_ID[row.name]||null
  return(
    <div className={`vteam-card ${isFirst?'vteam-first':''} ${isMyTeam?'vteam-mine':''} ${hovered?'vteam-hovered':''} ${teamId?'vteam-clickable':''}`} style={{'--accent':accent}} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={()=>{if(teamId&&onSelect)onSelect(teamId)}} title={teamId?`View ${row.name} details`:undefined}>
      <div className="vteam-glow" style={{background:`radial-gradient(ellipse at 50% 0%, ${accent}40 0%, transparent 70%)`}}/>
      <div className="vteam-top">
        <div className="vteam-rank">{rank<3?<Img src={rankEmojis[rank]} size={28}/>:<span className="vteam-rank-num">#{rank+1}</span>}</div>
        <div className="vteam-flag-wrap">{getTeamFlagElement(row.name,36)}</div>
        <div className="vteam-name-wrap"><div className="vteam-name">{row.name}</div><div className="vteam-agents">{row.agents} agents</div></div>
        {teamId&&<div className="vteam-goto-hint">View →</div>}
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

function TeamDetail({config,agents,dateLabel,isToday,canEdit,selectedDate,onOverrideTick,navigate,loadingRemote}) {
  const [view,setView]=useState('stats'),[menuOpen,setMenuOpen]=useState(false),[bulkMode,setBulkMode]=useState(false),[bulkEdits,setBulkEdits]=useState({}),[bulkTotals,setBulkTotals]=useState(null),[editAgent,setEditAgent]=useState(null),[editForm,setEditForm]=useState({}),[saving,setSaving]=useState(false),[tick,setTick]=useState(0)
  const OA=(d)=>OVERRIDE_KEY_AGENTS(d,config.id),OT=(d)=>OVERRIDE_KEY_TOTALS(d,config.id)
  useEffect(()=>{setBulkMode(false);setBulkEdits({});setBulkTotals(null);setMenuOpen(false)},[selectedDate])
  const hasOvr=!!(localStorage.getItem(OA(selectedDate))||localStorage.getItem(OT(selectedDate)))
  const agentsFinal=(()=>{void tick;const ovr=JSON.parse(localStorage.getItem(OA(selectedDate))||'{}');let ags=agents.map(a=>ovr[a.ext]?{...a,...ovr[a.ext]}:a);if(bulkMode&&Object.keys(bulkEdits).length>0){ags=ags.map(a=>{if(!bulkEdits[a.ext])return a;const en=parseInt(bulkEdits[a.ext].english),sp=parseInt(bulkEdits[a.ext].spanish||'0');return{...a,english:isNaN(en)?a.english:en,spanish:isNaN(sp)?a.spanish:sp,total:(isNaN(en)?a.english:en)+(isNaN(sp)?a.spanish:sp)}})}return ags})()
  const totOvr=(()=>{void tick;try{return JSON.parse(localStorage.getItem(OT(selectedDate))||'null')}catch(e){return null}})()
  const totalEn=totOvr?.english??agentsFinal.reduce((s,a)=>s+a.english,0),totalSp=totOvr?.spanish??agentsFinal.reduce((s,a)=>s+a.spanish,0),totalXf=totalEn+totalSp
  const goal=getGoalForDate(selectedDate,config.goal,config.id),hitGoal=agentsFinal.filter(a=>a.english>=goal),atZero=agentsFinal.filter(a=>a.total===0)
  const top3En=[...agentsFinal].sort((a,b)=>b.english-a.english).slice(0,3),top3Sp=config.hasSp?[...agentsFinal].sort((a,b)=>b.spanish-a.spanish).slice(0,3):[]
  const saveBulk=async()=>{setSaving(true);const ovr=JSON.parse(localStorage.getItem(OA(selectedDate))||'{}');Object.entries(bulkEdits).forEach(([ext,vals])=>{const ag=agents.find(a=>a.ext===ext);if(!ag)return;const en=parseInt(vals.english),sp=parseInt(vals.spanish||'0');ovr[ext]={name:ag.name,english:isNaN(en)?ag.english:en,spanish:isNaN(sp)?ag.spanish:sp,total:(isNaN(en)?ag.english:en)+(isNaN(sp)?ag.spanish:sp)}});await persistOverride(selectedDate,OA(selectedDate),ovr);if(bulkTotals)await persistOverride(selectedDate,OT(selectedDate),{english:parseInt(bulkTotals.english)||0,spanish:parseInt(bulkTotals.spanish||0)||0});setBulkMode(false);setBulkEdits({});setBulkTotals(null);setTick(t=>t+1);onOverrideTick?.();setSaving(false)}
  const saveQuick=async()=>{setSaving(true);const ovr=JSON.parse(localStorage.getItem(OA(selectedDate))||'{}');const en=parseInt(editForm.english)||0,sp=parseInt(editForm.spanish||'0')||0;ovr[editAgent.ext]={name:editAgent.name,english:en,spanish:sp,total:en+sp};await persistOverride(selectedDate,OA(selectedDate),ovr);setEditAgent(null);setTick(t=>t+1);onOverrideTick?.();setSaving(false)}
  const resetOvr=async()=>{localStorage.removeItem(OA(selectedDate));localStorage.removeItem(OT(selectedDate));setBulkEdits({});setBulkTotals(null);setBulkMode(false);setTick(t=>t+1);onOverrideTick?.();setMenuOpen(false)}
  const showEditBtn=!isToday&&canEdit
  if(loadingRemote)return(<div style={{color:'#6b7280',padding:'3rem',textAlign:'center',background:'#181b23',borderRadius:12,border:'0.5px solid #2a2d38'}}><div style={{fontSize:24,marginBottom:8}}>⏳</div>Loading historical data...</div>)
  return(
    <div className="fade-in" onClick={()=>setMenuOpen(false)}>
      <div className="asia-header-row">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2 className="section-title" style={{marginBottom:0,fontSize:22,display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
            <span style={{verticalAlign:'middle'}}>{getTeamFlagElement(config.label,22)}</span>
            {config.label}
            {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{dateLabel}</span>}
            {bulkMode&&<span style={{fontSize:11,background:'#f97316',color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:600}}>EDIT MODE</span>}
            {hasOvr&&!bulkMode&&<span style={{fontSize:11,background:'#1e2230',color:'#9ca3af',padding:'2px 8px',borderRadius:4,border:'0.5px solid #2a2d38'}}>✏️ edited</span>}
          </h2>
          {!isToday&&canEdit&&(<div style={{position:'relative'}} onClick={e=>e.stopPropagation()}><button className="asia-menu-btn" onClick={()=>setMenuOpen(o=>!o)}>···</button>{menuOpen&&(<div className="asia-menu-dropdown">{!bulkMode?<button className="asia-menu-item" onClick={()=>{setBulkMode(true);setMenuOpen(false);setView('stats')}}>✏️ Edit this day's data</button>:<><button className="asia-menu-item green-item" onClick={()=>{saveBulk();setMenuOpen(false)}}>{saving?'Saving...':'Save all changes'}</button><button className="asia-menu-item red-item" onClick={()=>{setBulkMode(false);setBulkEdits({});setBulkTotals(null);setMenuOpen(false)}}>Cancel edit</button></>}{hasOvr&&<button className="asia-menu-item" style={{borderTop:'0.5px solid #2a2d38',marginTop:4,paddingTop:10,color:'#f87171'}} onClick={resetOvr}>Reset to original data</button>}</div>)}</div>)}
        </div>
        <div className="asia-view-tabs"><button className={`view-tab ${view==='stats'?'active':''}`} onClick={()=>setView('stats')}>📊 Stats</button><button className={`view-tab ${view==='charts'?'active':''}`} onClick={()=>setView('charts')}>📈 Charts</button></div>
      </div>
      {bulkMode?(<div className="summary-grid" style={{gridTemplateColumns:`repeat(${config.hasSp?5:4},1fr)`,marginBottom:'1.5rem'}}><div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal ({goal}+ EN)</div></div><div className="sum-card orange"><div className="sum-val">{agentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>{config.hasSp&&<div className="sum-card teal"><input type="number" className="sum-edit-input" style={{color:'#2dd4bf'}} value={bulkTotals?.spanish??totalSp} onChange={e=>setBulkTotals(t=>({spanish:e.target.value,english:t?.english??totalEn}))}/><div className="sum-label">Spanish Xfers</div></div>}<div className="sum-card blue"><input type="number" className="sum-edit-input" style={{color:'#60a5fa'}} value={bulkTotals?.english??totalEn} onChange={e=>setBulkTotals(t=>({english:e.target.value,spanish:t?.spanish??totalSp}))}/><div className="sum-label">English Xfers</div></div><div className="sum-card indigo"><div className="sum-val">{((parseInt(bulkTotals?.spanish)||totalSp)+(parseInt(bulkTotals?.english)||totalEn)).toLocaleString()}</div><div className="sum-label">Total Xfers</div></div></div>):(<div className="summary-grid" style={{gridTemplateColumns:`repeat(${config.hasSp?5:4},1fr)`}}><div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal ({goal}+ EN)</div></div><div className="sum-card orange"><div className="sum-val">{agentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div>{config.hasSp&&<div className="sum-card teal"><div className="sum-val">{totalSp.toLocaleString()}</div><div className="sum-label">Spanish Xfers</div></div>}<div className="sum-card blue"><div className="sum-val">{totalEn.toLocaleString()}</div><div className="sum-label">English Xfers</div></div><div className="sum-card indigo"><div className="sum-val">{totalXf.toLocaleString()}</div><div className="sum-label">Total Xfers</div></div></div>)}
      {agentsFinal.length===0&&<div style={{background:'#181b23',border:'0.5px solid #2a2d38',borderRadius:12,padding:'3rem',textAlign:'center',color:'#6b7280',marginTop:'0.5rem'}}>No data available for this date.</div>}
      {view==='stats'&&agentsFinal.length>0&&(<>
        {!bulkMode&&(<div className="tops-row" style={{gridTemplateColumns:config.hasSp?'1fr 1fr 1fr':'1fr 1fr'}}><div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top English</h3>{top3En.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score english">{a.english}</span></div>))}</div>{config.hasSp&&<div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top Spanish</h3>{top3Sp.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score spanish">{a.spanish}</span></div>))}</div>}<div className="top-block red-block"><h3 className="top-title"><Img src={E.zero} size={16}/> At Zero</h3>{atZero.length===0?<p className="top-empty"><Img src={E.firework} size={16}/> Everyone has transfers!</p>:atZero.slice(0,3).map((a,i)=>(<div key={i} className="top-item"><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score red">0</span></div>))}</div></div>)}
        {bulkMode&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 16px',background:'#1a1310',border:'0.5px solid #f97316',borderRadius:8}}><span style={{fontSize:13,color:'#f97316',fontWeight:600}}>Edit mode active</span><span style={{fontSize:12,color:'#9ca3af'}}> - modify then use Save all changes in ···</span></div>}
        <div className="agent-table-wrap"><table className="agent-table"><thead><tr><th>#</th><th>Agent</th><th>Ext</th><th>English</th>{config.hasSp&&<th>Spanish</th>}<th>Total</th><th>Goal</th><th style={{color:'#a78bfa',fontSize:11,position:'relative',whiteSpace:'nowrap'}}><span className="share-th-wrap">Share% <span className="share-tip-icon">ⓘ<span className="share-tip-box">Each agent's English xfers as a % of the team's total English transfers for the day</span></span></span></th>{showEditBtn&&<th className="th-edit"></th>}</tr></thead><tbody>{[...agentsFinal].sort((a,b)=>b.english-a.english).map((a,i)=>{const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'};const beEn=bulkEdits[a.ext]?.english??'',beSp=bulkEdits[a.ext]?.spanish??'';const dEn=bulkMode&&beEn!==''?parseInt(beEn)||0:a.english,dSp=bulkMode&&beSp!==''?parseInt(beSp)||0:a.spanish;return(<tr key={i} className={a.total===0?'row-zero':a.english>=goal?'row-goal':''}><td style={rs}>#{i+1}</td><td className="agent-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</td><td className="agent-ext">{a.ext}</td><td className="val-english">{bulkMode?<input type="number" className="bulk-edit-input" value={beEn!==''?beEn:a.english} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],english:e.target.value}}))}/>:a.english}</td>{config.hasSp&&<td className="val-spanish">{bulkMode?<input type="number" className="bulk-edit-input" value={beSp!==''?beSp:a.spanish} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],spanish:e.target.value}}))}/>:a.spanish}</td>}<td className="val-total">{config.hasSp?dEn+dSp:dEn}</td><td>{dEn>=goal?<span className="badge-goal">Goal</span>:<span className="badge-pending">{goal-dEn} left</span>}</td><td style={{color:'#a78bfa',fontSize:12,textAlign:'center',fontWeight:600}}>{totalEn>0?(((dEn/totalEn)*100).toFixed(1)+'%'):'—'}</td>{showEditBtn&&<td className="td-edit">{!bulkMode&&<button className="edit-agent-btn" onClick={e=>{e.stopPropagation();setEditForm({english:a.english,spanish:a.spanish||0});setEditAgent(a)}}>✏️</button>}</td>}</tr>)})}</tbody></table></div>
        {bulkMode&&<div style={{display:'flex',gap:10,marginTop:12,justifyContent:'flex-end'}}><button className="btn-cancel" onClick={()=>{setBulkMode(false);setBulkEdits({});setBulkTotals(null)}}>Cancel</button><button className="btn-save" onClick={saveBulk}>{saving?'Saving...':'Save all changes'}</button></div>}
      </>)}
      {view==='charts'&&agentsFinal.length>0&&(<div className="charts-section"><BarChart agents={agentsFinal} metric="english"/><div className="chart-goal-row"><div className="goal-stat green-stat"><div className="goal-stat-val">{hitGoal.length}</div><div className="goal-stat-label"><Img src={E.goal} size={14}/> Reached goal ({goal}+ EN)</div></div><div className="goal-stat yellow-stat"><div className="goal-stat-val">{agentsFinal.filter(a=>a.english>=(goal-3)&&a.english<goal).length}</div><div className="goal-stat-label">Almost ({goal-3}-{goal-1} EN)</div></div><div className="goal-stat red-stat"><div className="goal-stat-val">{atZero.length}</div><div className="goal-stat-label"><Img src={E.zero} size={14}/> At zero</div></div></div></div>)}
      {editAgent&&(<div className="edit-modal-overlay" onClick={()=>setEditAgent(null)}><div className="edit-modal" onClick={e=>e.stopPropagation()}><h3 className="edit-modal-title">Edit - {editAgent.name} <span style={{color:'#6b7280',fontSize:12}}>#{editAgent.ext}</span></h3><div className="edit-modal-fields"><label>English<input type="number" value={editForm.english} onChange={e=>setEditForm(f=>({...f,english:e.target.value}))}/></label>{config.hasSp&&<label>Spanish<input type="number" value={editForm.spanish} onChange={e=>setEditForm(f=>({...f,spanish:e.target.value}))}/></label>}</div><div className="edit-modal-actions"><button className="btn-cancel" onClick={()=>setEditAgent(null)}>Cancel</button><button className="btn-save" onClick={saveQuick}>{saving?'Saving...':'Save'}</button></div></div></div>)}
    </div>
  )
}

// ── MVP Section ──────────────────────────────────────────────────────────────
function MVPSection({ snapshots, navigate }) {
  const data = useMemo(() => {
    // { ext -> { name, team, top1, top3, totalEn, appearances } }
    const map = {}

    const processAgents = (agents, teamId) => {
      if (!agents || agents.length === 0) return
      const sorted = [...agents].sort((a, b) => b.english - a.english)
      sorted.forEach((a, i) => {
        if (a.english === 0) return
        if (!map[a.ext]) map[a.ext] = { name: a.name, team: teamId, ext: a.ext, top1: 0, top3: 0, totalEn: 0, days: 0 }
        map[a.ext].totalEn += a.english
        map[a.ext].days += 1
        if (i === 0) { map[a.ext].top1 += 1; map[a.ext].top3 += 1 }
        else if (i <= 2) { map[a.ext].top3 += 1 }
      })
    }

    snapshots.forEach(snap => {
      // Asia
      if (snap.asiaData?.length) {
        const { agents } = parseAsiaSheet(snap.asiaData)
        processAgents(agents, 'asia')
      }
      // Teams
      TEAM_SHEETS.forEach(t => {
        const raw = snap.teams?.[t.id]
        if (!raw?.length) return
        const { agents } = parseTeamSheet(raw, t)
        processAgents(agents, t.id)
      })
    })

    const all = Object.values(map).filter(a => a.top3 > 0 || a.totalEn > 100)
    all.sort((a, b) => b.top3 - a.top3 || b.totalEn - a.totalEn)
    const top10 = all.slice(0, 10)
    const goat  = all.sort((a, b) => b.totalEn - a.totalEn)[0] || null
    return { top10, goat }
  }, [snapshots])

  if (!data.top10.length) return null

  const teamColors = { asia:'#f97316', philippines:'#3b82f6', colombia:'#f59e0b', central:'#8b5cf6', mexico:'#10b981', venezuela:'#ef4444' }
  const teamLabels = { ...TEAM_DISPLAY_NAMES, asia:'Asia' }

  return (
    <div style={{ marginTop:'2.5rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.2rem' }}>
        <h2 className="section-title" style={{ marginBottom:0 }}>🏆 Operation MVPs</h2>
        <span style={{ fontSize:12, color:'#6b7280' }}>Ranked by Top 3 appearances · All-time</span>
      </div>

      {/* GOAT card */}
      {data.goat && (
        <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(251,191,36,0.06))', border:'1px solid rgba(249,115,22,0.3)', borderRadius:16, padding:'1rem 1.5rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:16, boxShadow:'0 0 30px rgba(249,115,22,0.1)' }}>
          <div style={{ fontSize:28 }}>🐐</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'#f97316', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:2 }}>All-Time Top English</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#f5f5f5', fontFamily:"'Sora',sans-serif", cursor:'pointer' }}
              onClick={() => navigate(`/profile/${data.goat.ext}`)}>
              {data.goat.name}
            </div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{teamLabels[data.goat.team] || data.goat.team} · #{data.goat.ext}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:32, fontWeight:800, color:'#f97316', fontFamily:"'Sora',sans-serif", lineHeight:1 }}>{data.goat.totalEn.toLocaleString()}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>Total English</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:24, fontWeight:800, color:'#fbbf24', fontFamily:"'Sora',sans-serif", lineHeight:1 }}>{data.goat.top1}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>#1 Days</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:24, fontWeight:800, color:'#34d399', fontFamily:"'Sora',sans-serif", lineHeight:1 }}>{data.goat.top3}</div>
            <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>Top 3</div>
          </div>
        </div>
      )}

      {/* Top 10 table */}
      <div style={{ background:'rgba(18,22,31,0.85)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'rgba(0,0,0,0.3)' }}>
              {['#','Agent','Team','Top 3','#1 Days','Total EN','Avg EN/day'].map((h,i) => (
                <th key={i} style={{ padding:'10px 14px', textAlign:i>2?'center':'left', fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid rgba(255,255,255,0.05)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.top10.map((a, i) => {
              const accent = teamColors[a.team] || '#f97316'
              const rankStyle = i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#4b5563'}
              const avg = a.days > 0 ? (a.totalEn / a.days).toFixed(1) : '—'
              return (
                <tr key={a.ext} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 14px', ...rankStyle }}>#{i+1}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ fontWeight:600, color:'#f1f5f9', cursor:'pointer' }} onClick={() => navigate(`/profile/${a.ext}`)}>{a.name}</span>
                    <span style={{ color:'#4b5563', fontSize:11, marginLeft:6 }}>#{a.ext}</span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ fontSize:11, background:`${accent}18`, border:`1px solid ${accent}40`, color:accent, padding:'2px 8px', borderRadius:5, fontWeight:600 }}>{teamLabels[a.team]||a.team}</span>
                  </td>
                  <td style={{ padding:'11px 14px', textAlign:'center', color:'#34d399', fontWeight:700 }}>{a.top3}</td>
                  <td style={{ padding:'11px 14px', textAlign:'center', color:'#fbbf24', fontWeight:700 }}>{a.top1}</td>
                  <td style={{ padding:'11px 14px', textAlign:'center', color:'#60a5fa', fontWeight:700 }}>{a.totalEn.toLocaleString()}</td>
                  <td style={{ padding:'11px 14px', textAlign:'center', color:'#9ca3af' }}>{avg}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


export default function Dashboard() {
  const canvasRef=useRef(null),introHideRef=useRef(null),introClearRef=useRef(null)
  const navigate=useNavigate()
  const user=JSON.parse(localStorage.getItem('pulse_user')||'null')
  const canEdit=['supervisor','qa','leader'].includes(user?.role)

  const [liveGeneral,setLiveGeneral]=useState([]),[liveAsia,setLiveAsia]=useState([]),[liveTeams,setLiveTeams]=useState({}),[slacksData,setSlacksData]=useState([]),[loading,setLoading]=useState(true),[lastUpdate,setLastUpdate]=useState(null)
  const [activeTab,setActiveTab]=useState('general'),[asiaView,setAsiaView]=useState('stats'),[chartMetric,setChartMetric]=useState('english'),[snapshots,setSnapshots]=useState([]),[selectedDate,setSelectedDate]=useState(todayKey()),[overridesTick,setOverridesTick]=useState(0),[savingOverride,setSavingOverride]=useState(false),[remoteDailyTotals,setRemoteDailyTotals]=useState([]),[remoteTeamAgents,setRemoteTeamAgents]=useState({}),[loadingRemoteTeam,setLoadingRemoteTeam]=useState(false),[editingAgent,setEditingAgent]=useState(null),[editForm,setEditForm]=useState({}),[editMenuOpen,setEditMenuOpen]=useState(false),[bulkEditMode,setBulkEditMode]=useState(false),[bulkEdits,setBulkEdits]=useState({}),[bulkTotalsEdit,setBulkTotalsEdit]=useState(null),[histCache,setHistCache]=useState({}),[histLoading,setHistLoading]=useState(false),[introData,setIntroData]=useState(null),[introLeaving,setIntroLeaving]=useState(false)

  const isToday=selectedDate===todayKey(),isHistDate=HISTORY_ISO_SET.has(selectedDate),histMeta=HISTORY_DATES.find(d=>d.isoDate===selectedDate),activeSnap=(!isToday&&!isHistDate)?snapshots.find(s=>s.date===selectedDate):null
  const asiaDataRaw=isToday?liveAsia:(activeSnap?.asiaData||[]),generalDataRaw=isToday?liveGeneral:(activeSnap?.generalData||[]),histParsed=isHistDate?(histCache[selectedDate]||null):null

  const getTeamAgents=useCallback((teamId)=>{if(isToday){const raw=liveTeams[teamId]||[];const config=TEAM_SHEETS.find(t=>t.id===teamId);if(!config||raw.length===0)return[];return parseTeamSheet(raw,config).agents};if(activeSnap?.teams?.[teamId]?.length>0){const config=TEAM_SHEETS.find(t=>t.id===teamId);if(!config)return[];return parseTeamSheet(activeSnap.teams[teamId],config).agents};return remoteTeamAgents[`${selectedDate}_${teamId}`]||[]},[isToday,liveTeams,activeSnap,remoteTeamAgents,selectedDate])

  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext('2d');canvas.width=window.innerWidth;canvas.height=window.innerHeight;const particles=[];const onMove=(e)=>{for(let i=0;i<3;i++)particles.push({x:e.clientX+(Math.random()-.5)*20,y:e.clientY+(Math.random()-.5)*20,size:Math.random()*3+1,life:1,vx:(Math.random()-.5)*1.5,vy:(Math.random()-.5)*1.5-.5})};window.addEventListener('mousemove',onMove);let raf;const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=.03;p.x+=p.vx;p.y+=p.vy;if(p.life<=0){particles.splice(i,1);continue}ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fillStyle=`rgba(249,115,22,${p.life*.5})`;ctx.fill()};raf=requestAnimationFrame(draw)};draw();const onResize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight};window.addEventListener('resize',onResize);return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('resize',onResize);cancelAnimationFrame(raf)}},[])

  const loadDailyTotals=async()=>{try{const data=await scriptCall({action:'getDailyTotals'});if(Array.isArray(data)){const normalized=data.map(entry=>({...entry,date:normalizeDate(entry.date)})).filter(entry=>entry.date);setRemoteDailyTotals(normalized)}}catch(e){}}
  const loadRemoteTeamAgents=useCallback(async(date,teamId)=>{const key=`${date}_${teamId}`;if(remoteTeamAgents[key]!==undefined)return;setLoadingRemoteTeam(true);try{const data=await scriptCall({action:'getTeamSnapshot',date,teamId});setRemoteTeamAgents(prev=>({...prev,[key]:data?.ok&&Array.isArray(data.agents)?data.agents:[]}))}catch(e){setRemoteTeamAgents(prev=>({...prev,[`${date}_${teamId}`]:[]}))};setLoadingRemoteTeam(false)},[remoteTeamAgents])
  useEffect(()=>{if(isToday||isHistDate)return;const teamId=TEAM_SHEETS.find(t=>t.id===activeTab)?.id;if(!teamId||activeSnap?.teams?.[teamId]?.length>0)return;const key=`${selectedDate}_${teamId}`;if(remoteTeamAgents[key]!==undefined)return;loadRemoteTeamAgents(selectedDate,teamId)},[activeTab,selectedDate,isToday,isHistDate,activeSnap])

  const loadData=async()=>{try{const[general,asia,slacks]=await Promise.all([fetchSheet(SHEET_ID,"WELL'S REPORT"),fetchSheet(SHEET_ID,'AW GARRET ASIA LEXNER'),fetchSheet(USERS_SHEET_ID,'Slacks')]);setLiveGeneral(general);setLiveAsia(asia);setLastUpdate(new Date());setSlacksData(slacks.slice(1).filter(r=>r[0]&&r[1]));const results=await Promise.allSettled(TEAM_SHEETS.map(t=>t.protected?fetchSheetViaScript(SHEET_ID,t.sheetName):fetchSheet(SHEET_ID,t.sheetName)));const newTeams={},allAgents=[];TEAM_SHEETS.forEach((t,i)=>{if(results[i].status==='fulfilled'){newTeams[t.id]=results[i].value;const{agents}=parseTeamSheet(results[i].value,t);agents.forEach(a=>allAgents.push({ext:a.ext,name:a.name,english:a.english,spanish:a.spanish||0,total:a.total,team:t.id}));saveTeamSnapshotToSheets(todayKey(),t.id,agents)}});setLiveTeams(newTeams);const{agents:asiaAgentsLive}=parseAsiaSheet(asia);asiaAgentsLive.forEach(a=>allAgents.push({ext:a.ext,name:a.name,english:a.english,spanish:a.spanish||0,total:a.total,team:'asia'}));saveLocalSnapshot(general,asia,newTeams);setSnapshots(loadAllSnapshots());saveAgentSnapshotsToSheets(todayKey(),allAgents)}catch(e){}finally{setLoading(false)}}
  const loadTeamsOnly=async()=>{try{const[asiaResult,...teamResults]=await Promise.allSettled([fetchSheet(SHEET_ID,'AW GARRET ASIA LEXNER'),...TEAM_SHEETS.map(t=>t.protected?fetchSheetViaScript(SHEET_ID,t.sheetName):fetchSheet(SHEET_ID,t.sheetName))]);if(asiaResult.status==='fulfilled')setLiveAsia(asiaResult.value);const newTeams={};TEAM_SHEETS.forEach((t,i)=>{newTeams[t.id]=teamResults[i].status==='fulfilled'?teamResults[i].value:(liveTeams[t.id]||[])});setLiveTeams(newTeams);setLastUpdate(new Date())}catch(e){}}

  useEffect(()=>{loadRemoteOverrides().then(()=>setOverridesTick(t=>t+1));if(user?.name)loadUserPhotoFromSheets(user.name).then(()=>{});setSnapshots(loadAllSnapshots());loadDailyTotals();loadData().then(()=>backfillHistoricalDataToSheets());const fullIv=setInterval(loadData,60_000),fastIv=setInterval(loadTeamsOnly,5_000);return()=>{clearInterval(fullIv);clearInterval(fastIv)}},[])
  useEffect(()=>{if(!isHistDate||!histMeta||histCache[selectedDate])return;setHistLoading(true);fetchSheet(HISTORY_SHEET_ID,histMeta.tab).then(rows=>setHistCache(c=>({...c,[selectedDate]:parseHistorySheet(rows)}))).catch(()=>{}).finally(()=>setHistLoading(false))},[selectedDate])
  useEffect(()=>{setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null);setEditMenuOpen(false)},[selectedDate])

  const playIntroChime=useCallback(()=>{try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;const ctx=new AudioCtx();const makeTone=(freq,start,duration,gainValue)=>{const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(0.0001,start);gain.gain.exponentialRampToValueAtTime(gainValue,start+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+duration+0.02)};const now=ctx.currentTime;makeTone(392,now,0.22,0.07);makeTone(523.25,now+0.11,0.28,0.06);makeTone(659.25,now+0.24,0.38,0.05);setTimeout(()=>{try{ctx.close()}catch{}},1200)}catch{}},[])
  useEffect(()=>{try{const raw=localStorage.getItem('pulse_intro');if(!raw)return;const parsed=JSON.parse(raw);if(!parsed?.name||!parsed?.mode){localStorage.removeItem('pulse_intro');return};const age=Date.now()-(parsed.at||0);if(age>15000){localStorage.removeItem('pulse_intro');return};setIntroData({name:parsed.name,mode:parsed.mode});setIntroLeaving(false);localStorage.removeItem('pulse_intro');playIntroChime();introHideRef.current=setTimeout(()=>setIntroLeaving(true),1900);introClearRef.current=setTimeout(()=>{setIntroData(null);setIntroLeaving(false)},2700)}catch{localStorage.removeItem('pulse_intro')};return()=>{if(introHideRef.current)clearTimeout(introHideRef.current);if(introClearRef.current)clearTimeout(introClearRef.current)}},[playIntroChime])

  // ── Sound when agent hits English goal ────────────────────────────────────
  const playGoalSound  = useCallback(() => {
    try {
      const ACtx = window.AudioContext || window.webkitAudioContext
      if (!ACtx) return
      const ctx = new ACtx()
      const now = ctx.currentTime
      const tone = (freq, start, dur, vol) => {
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = 'sine'; o.frequency.value = freq
        g.gain.setValueAtTime(0.001, start)
        g.gain.exponentialRampToValueAtTime(vol, start + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, start + dur)
        o.connect(g); g.connect(ctx.destination)
        o.start(start); o.stop(start + dur + 0.05)
      }
      tone(523, now,      0.12, 0.06)
      tone(659, now+0.10, 0.14, 0.07)
      tone(784, now+0.21, 0.22, 0.08)
      setTimeout(() => { try { ctx.close() } catch {} }, 800)
    } catch {}
  }, [])



  const {asiaAgents,asiaTotals}=(()=>{if(isHistDate&&histParsed)return{asiaAgents:histParsed.agents,asiaTotals:histParsed.totals};const{agents,totals}=parseAsiaSheet(asiaDataRaw);return{asiaAgents:agents,asiaTotals:totals}})()
  const asiaAgentsFinal=(()=>{void overridesTick;const ovr=JSON.parse(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||'{}');let agents=asiaAgents.map(a=>ovr[a.ext]?{...a,...ovr[a.ext]}:a);if(bulkEditMode&&Object.keys(bulkEdits).length>0)agents=agents.map(a=>{if(!bulkEdits[a.ext])return a;const en=parseInt(bulkEdits[a.ext].english),sp=parseInt(bulkEdits[a.ext].spanish);return{...a,english:isNaN(en)?a.english:en,spanish:isNaN(sp)?a.spanish:sp,total:(isNaN(en)?a.english:en)+(isNaN(sp)?a.spanish:sp)}});return agents})()
  const asiaOvrTotals=(()=>{void overridesTick;try{return JSON.parse(localStorage.getItem(OVERRIDE_KEY_TOTALS(selectedDate,'asia'))||'null')}catch(e){return null}})()
  const totalSpanish=asiaOvrTotals?.spanish??(isToday?asiaTotals.spanish:(isHistDate?asiaTotals.spanish:asiaAgentsFinal.reduce((s,a)=>s+a.spanish,0)))
  const totalEnglish=asiaOvrTotals?.english??(isToday?asiaTotals.english:(isHistDate?asiaTotals.english:asiaAgentsFinal.reduce((s,a)=>s+a.english,0)))
  const totalXfers=totalSpanish+totalEnglish
  const goal=getGoalForDate(selectedDate,APP_CONFIG.dailyGoal,'asia'),hitGoal=asiaAgentsFinal.filter(a=>a.english>=goal),atZero=asiaAgentsFinal.filter(a=>a.total===0)
  const top3English=[...asiaAgentsFinal].sort((a,b)=>b.english-a.english).slice(0,3),top3Spanish=[...asiaAgentsFinal].sort((a,b)=>b.spanish-a.spanish).slice(0,3)
  void overridesTick
  const hasAsiaOverrides=!!(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||localStorage.getItem(OVERRIDE_KEY_TOTALS(selectedDate,'asia')))

  const saveAsiaAgentEdit=async()=>{setSavingOverride(true);const ovr=JSON.parse(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||'{}');const en=parseInt(editForm.english)||0,sp=parseInt(editForm.spanish)||0;ovr[editingAgent.ext]={name:editingAgent.name,spanish:sp,english:en,total:en+sp};await persistOverride(selectedDate,OVERRIDE_KEY_AGENTS(selectedDate,'asia'),ovr);setEditingAgent(null);setOverridesTick(t=>t+1);setSavingOverride(false)}
  const saveAsiaBulk=async()=>{setSavingOverride(true);const ovr=JSON.parse(localStorage.getItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'))||'{}');Object.entries(bulkEdits).forEach(([ext,vals])=>{const ag=asiaAgents.find(a=>a.ext===ext);if(!ag)return;const en=parseInt(vals.english),sp=parseInt(vals.spanish);ovr[ext]={name:ag.name,spanish:isNaN(sp)?ag.spanish:sp,english:isNaN(en)?ag.english:en,total:(isNaN(en)?ag.english:en)+(isNaN(sp)?ag.spanish:sp)}});await persistOverride(selectedDate,OVERRIDE_KEY_AGENTS(selectedDate,'asia'),ovr);if(bulkTotalsEdit)await persistOverride(selectedDate,OVERRIDE_KEY_TOTALS(selectedDate,'asia'),{spanish:parseInt(bulkTotalsEdit.spanish)||0,english:parseInt(bulkTotalsEdit.english)||0});setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null);setOverridesTick(t=>t+1);setSavingOverride(false)}
  const resetAsiaOverrides=async()=>{localStorage.removeItem(OVERRIDE_KEY_AGENTS(selectedDate,'asia'));localStorage.removeItem(OVERRIDE_KEY_TOTALS(selectedDate,'asia'));setBulkEdits({});setBulkTotalsEdit(null);setBulkEditMode(false);setOverridesTick(t=>t+1);setEditMenuOpen(false)}

  const slackLabelForDate=(iso)=>{const hd=HISTORY_DATES.find(d=>d.isoDate===iso);if(hd)return hd.slackLabel;const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`}
  const slackRowsForDate=slacksData.filter(r=>r[0]?.trim()===slackLabelForDate(selectedDate))
  const buildSlackAgents=(rows)=>{const map={};for(const row of rows){const agent=(row[1]||'').trim(),opener=(row[2]||'').trim(),call=(row[3]||'').trim();if(!agent)continue;if(!map[agent])map[agent]={agent,opener,reports:0,phones:[]};const phones=extractPhones(call);if(phones.length>0){map[agent].reports+=phones.length;phones.forEach(p=>{if(!map[agent].phones.includes(p))map[agent].phones.push(p)})}else if(call.trim()){map[agent].reports+=1;if(!map[agent].phones.includes(call.trim()))map[agent].phones.push(call.trim())}};return Object.values(map).sort((a,b)=>b.reports-a.reports)}
  const slackAgentsForDate=buildSlackAgents(slackRowsForDate),topAgent=slackAgentsForDate[0]||null,totalReportsForDate=slackAgentsForDate.reduce((s,a)=>s+a.reports,0)

  const team=APP_CONFIG.teams.find(t=>t.id===user?.team)
  const isMyTeam=(name)=>{const n=name.toUpperCase();return(team?.id==='asia'&&n.includes('ASIA'))||(team?.id==='philippines'&&n.includes('PHIL'))||(team?.id==='venezuela'&&n.includes('VENE'))||(team?.id==='colombia'&&n.includes('COLOM'))||(team?.id==='mexico'&&n.includes('MEXICO'))||(team?.id==='central'&&n.includes('CENTRAL'))}

  const dateTabs=useMemo(()=>{const dates=new Set();dates.add(todayKey());snapshots.forEach(s=>{if(/^\d{4}-\d{2}-\d{2}$/.test(s.date))dates.add(s.date)});remoteDailyTotals.forEach(r=>{if(r.date&&/^\d{4}-\d{2}-\d{2}$/.test(r.date))dates.add(r.date)});HISTORY_DATES.forEach(d=>dates.add(d.isoDate));return[...dates].sort((a,b)=>b.localeCompare(a))},[snapshots,remoteDailyTotals])

  const teamRows=useMemo(()=>{
    if(isToday){const rows=TEAM_SHEETS.map(t=>{const rawRows=liveTeams[t.id];if(!rawRows||rawRows.length===0)return null;const{agents,totals}=parseTeamSheet(rawRows,t);return{name:TEAM_DISPLAY_NAMES[t.id]||t.id,agents:agents.length,english:totals.english,spanish:totals.spanish,total:totals.total,noSpanish:!t.hasSp}}).filter(Boolean);rows.push({name:'Asia',agents:asiaAgents.length,english:totalEnglish,spanish:totalSpanish,total:totalXfers,noSpanish:false});return rows}
    if(activeSnap?.generalData?.length>0){const found=[];for(const row of activeSnap.generalData){const name=row[0]?.toUpperCase().trim();if(TEAMS_ORDER.some(t=>name===t)){if(!found.find(f=>f.name.toUpperCase()===name)){const rawSp=row[4]?.trim();found.push({name:row[0]?.trim()||'',agents:safeInt(row[2]),english:safeInt(row[3]),spanish:safeInt(rawSp),total:safeInt(row[5]),noSpanish:rawSp==='-'||rawSp===''||!rawSp})}};if(found.length===6)break};if(found.length>0)return found}
    const remote=remoteDailyTotals.find(r=>r.date===selectedDate);if(remote?.teams?.length>0)return remote.teams.map(t=>({name:t.name,agents:t.agents||0,english:t.english||0,spanish:t.spanish||0,total:t.total||0,noSpanish:t.noSpanish||false}));return[]
  },[isToday,liveTeams,activeSnap,remoteDailyTotals,selectedDate,asiaAgents,asiaTotals,totalEnglish,totalSpanish,totalXfers])

  const teamsSorted=[...teamRows].sort((a,b)=>b.english-a.english)
  useEffect(()=>{if(!isToday||teamsSorted.length===0)return;const teamsWithId=teamsSorted.map(t=>({...t,id:TEAM_SHEETS.find(ts=>TEAM_DISPLAY_NAMES[ts.id]===t.name)?.id||t.name.toLowerCase().replace(/\s+/g,'_')}));saveDailyTotalsToSheets(todayKey(),teamsWithId)},[teamsSorted,isToday])

  const showAsiaEditBtn=!isToday&&canEdit,currentTeamConfig=TEAM_SHEETS.find(t=>t.id===activeTab),needsRemoteLoad=!isToday&&!isHistDate&&currentTeamConfig&&!(activeSnap?.teams?.[currentTeamConfig?.id]?.length>0)&&remoteTeamAgents[`${selectedDate}_${currentTeamConfig?.id}`]===undefined
  const handleTeamCardSelect=useCallback((teamId)=>{setActiveTab(teamId);window.scrollTo({top:0,behavior:'smooth'})},[])

  // Trigger goal sound when Asia agent crosses threshold (live data only)
  const prevAgentGoals = useRef({})
  useEffect(() => {
    if (!isToday || !asiaAgentsFinal.length) return
    const prev = prevAgentGoals.current
    let anyNew = false
    asiaAgentsFinal.forEach(a => { if (!(prev[a.ext] >= goal) && a.english >= goal) anyNew = true })
    if (anyNew) playGoalSound()
    const next = {}; asiaAgentsFinal.forEach(a => { next[a.ext] = a.english }); prevAgentGoals.current = next
  }, [asiaAgentsFinal])


  return(
    <div className="dash-root" onClick={()=>setEditMenuOpen(false)}>
      <canvas ref={canvasRef} className="dash-trail-canvas"/>

      {introData&&(<div className={`dash-intro-overlay ${introLeaving?'is-leaving':''}`}><div className="dash-intro-backdrop"/><div className="dash-intro-content"><div className="dash-intro-chip">{introData.mode==='register'?'New access granted':'Returning access'}</div><h1 className="dash-intro-title">{introData.mode==='register'?'Bienvenido':'Bienvenido de nuevo'}</h1><div className="dash-intro-name">{introData.name}</div><p className="dash-intro-sub">{introData.mode==='register'?'Tu acceso a Pulse está listo.':'Preparando tu dashboard.'}</p></div></div>)}

      {/* Shared Navbar */}
      <Navbar lastUpdate={lastUpdate}/>

      {/* Team tabs + date picker */}
      <div className="dash-topbar">
        <div className="dash-tabs-scroll">
          <button className={`dash-tab ${activeTab==='general'?'active':''}`} onClick={()=>setActiveTab('general')}>All Teams</button>
          <button className={`dash-tab ${activeTab==='asia'?'active':''}`} onClick={()=>setActiveTab('asia')}><TabFlag teamId="asia"/> Asia</button>
          {TEAM_SHEETS.map(t=>(<button key={t.id} className={`dash-tab ${activeTab===t.id?'active':''}`} onClick={()=>setActiveTab(t.id)}><TabFlag teamId={t.id}/> {t.label}</button>))}
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
            <div className="vteams-header"><h2 className="section-title" style={{marginBottom:0}}>Auto Warranty Garrett {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{formatDateLabel(selectedDate)}</span>}</h2><span className="vteams-sub">{teamsSorted.length} teams · ranked by English xfers</span></div>
            {teamsSorted.length===0?<div style={{background:'#181b23',border:'0.5px solid #2a2d38',borderRadius:12,padding:'3rem',textAlign:'center',color:'#6b7280'}}>No data for {formatDateLabel(selectedDate)}.</div>:<div className="vteams-grid">{teamsSorted.map((row,rank)=><TeamCard key={rank} row={row} rank={rank} isMyTeam={isMyTeam(row.name)} isFirst={rank===0} onSelect={handleTeamCardSelect}/>)}</div>}
            <MVPSection snapshots={snapshots} navigate={navigate}/>
          </div>
        ):activeTab==='asia'?(
          <div className="fade-in">
            <div className="asia-header-row">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <h2 className="section-title" style={{marginBottom:0}}>
                  <span style={{marginRight:6,verticalAlign:'middle'}}>{getTeamFlagElement('Asia',18)}</span>
                  Asia — Agent Detail
                  {isToday?<span className="live-badge">LIVE</span>:<span className="date-badge">{formatDateLabel(selectedDate)}</span>}
                  {bulkEditMode&&<span style={{fontSize:11,background:'#f97316',color:'#fff',padding:'2px 8px',borderRadius:4,fontWeight:600}}>EDIT MODE</span>}
                  {hasAsiaOverrides&&!bulkEditMode&&<span style={{fontSize:11,background:'#1e2230',color:'#9ca3af',padding:'2px 8px',borderRadius:4,border:'0.5px solid #2a2d38'}}>✏️ edited</span>}
                </h2>
                {!isToday&&canEdit&&(<div style={{position:'relative'}} onClick={e=>e.stopPropagation()}><button className="asia-menu-btn" onClick={()=>setEditMenuOpen(o=>!o)}>···</button>{editMenuOpen&&(<div className="asia-menu-dropdown">{!bulkEditMode?<button className="asia-menu-item" onClick={()=>{setBulkEditMode(true);setEditMenuOpen(false);setAsiaView('stats')}}>✏️ Edit this day's data</button>:<><button className="asia-menu-item green-item" onClick={()=>{saveAsiaBulk();setEditMenuOpen(false)}}>{savingOverride?'Saving...':'Save all changes'}</button><button className="asia-menu-item red-item" onClick={()=>{setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null);setEditMenuOpen(false)}}>Cancel edit</button></>}{hasAsiaOverrides&&<button className="asia-menu-item" style={{borderTop:'0.5px solid #2a2d38',marginTop:4,paddingTop:10,color:'#f87171'}} onClick={resetAsiaOverrides}>Reset to original data</button>}</div>)}</div>)}
              </div>
              <div className="asia-view-tabs"><button className={`view-tab ${asiaView==='stats'?'active':''}`} onClick={()=>setAsiaView('stats')}>📊 Stats</button><button className={`view-tab ${asiaView==='charts'?'active':''}`} onClick={()=>setAsiaView('charts')}>📈 Charts</button><button className={`view-tab ${asiaView==='slacks'?'active':''}`} onClick={()=>setAsiaView('slacks')}>💬 Slacks</button></div>
            </div>
            {asiaView!=='slacks'&&(histLoading?<div style={{color:'#6b7280',padding:'2rem',textAlign:'center'}}>Loading...</div>:bulkEditMode?(
              <div className="summary-grid" style={{marginBottom:'1.5rem'}}><div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal ({goal}+ EN)</div></div><div className="sum-card orange"><div className="sum-val">{asiaAgentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div><div className="sum-card teal"><input type="number" className="sum-edit-input" style={{color:'#2dd4bf'}} value={bulkTotalsEdit?.spanish??totalSpanish} onChange={e=>setBulkTotalsEdit(t=>({spanish:e.target.value,english:t?.english??totalEnglish}))}/><div className="sum-label">Spanish Xfers</div></div><div className="sum-card blue"><input type="number" className="sum-edit-input" style={{color:'#60a5fa'}} value={bulkTotalsEdit?.english??totalEnglish} onChange={e=>setBulkTotalsEdit(t=>({english:e.target.value,spanish:t?.spanish??totalSpanish}))}/><div className="sum-label">English Xfers</div></div><div className="sum-card indigo"><div className="sum-val">{((parseInt(bulkTotalsEdit?.spanish)||totalSpanish)+(parseInt(bulkTotalsEdit?.english)||totalEnglish)).toLocaleString()}</div><div className="sum-label">Total Xfers</div></div></div>
            ):(
              <div className="summary-grid"><div className="sum-card green"><div className="sum-val">{hitGoal.length}</div><div className="sum-label">Hit Goal ({goal}+ EN)</div></div><div className="sum-card orange"><div className="sum-val">{asiaAgentsFinal.length-hitGoal.length-atZero.length}</div><div className="sum-label">In Progress</div></div><div className="sum-card teal"><div className="sum-val">{totalSpanish.toLocaleString()}</div><div className="sum-label">Spanish Xfers</div></div><div className="sum-card blue"><div className="sum-val">{totalEnglish.toLocaleString()}</div><div className="sum-label">English Xfers</div></div><div className="sum-card indigo"><div className="sum-val">{totalXfers.toLocaleString()}</div><div className="sum-label">Total Xfers</div></div></div>
            ))}
            {asiaView==='stats'&&!histLoading&&(<>
              {!bulkEditMode&&(<div className="tops-row"><div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top English</h3>{top3English.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score english">{a.english}</span></div>))}</div><div className="top-block"><h3 className="top-title"><Img src={E.goal} size={16}/> Top Spanish</h3>{top3Spanish.map((a,i)=>(<div key={i} className="top-item"><span className="top-medal"><Img src={MEDALS[i]} size={18}/></span><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score spanish">{a.spanish}</span></div>))}</div><div className="top-block red-block"><h3 className="top-title"><Img src={E.zero} size={16}/> At Zero</h3>{atZero.length===0?<p className="top-empty"><Img src={E.firework} size={16}/> Everyone has transfers!</p>:atZero.slice(0,3).map((a,i)=>(<div key={i} className="top-item"><span className="top-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</span><span className="top-ext">#{a.ext}</span><span className="top-score red">0</span></div>))}</div></div>)}
              {bulkEditMode&&<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 16px',background:'#1a1310',border:'0.5px solid #f97316',borderRadius:8}}><span style={{fontSize:13,color:'#f97316',fontWeight:600}}>Edit mode active</span><span style={{fontSize:12,color:'#9ca3af'}}> - modify then Save all changes in ···</span></div>}
              <div className="agent-table-wrap"><table className="agent-table"><thead><tr><th>#</th><th>Agent</th><th>Ext</th><th>English</th><th>Spanish</th><th>Total</th><th>Goal</th><th style={{color:'#a78bfa',fontSize:11,position:'relative',whiteSpace:'nowrap'}}><span className="share-th-wrap">Share% <span className="share-tip-icon">ⓘ<span className="share-tip-box">Each agent's English xfers as a % of the team's total English transfers for the day</span></span></span></th>{showAsiaEditBtn&&<th className="th-edit"></th>}</tr></thead><tbody>{[...asiaAgentsFinal].sort((a,b)=>b.english-a.english).map((a,i)=>{const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'};const beEn=bulkEdits[a.ext]?.english??'',beSp=bulkEdits[a.ext]?.spanish??'';const dEn=bulkEditMode&&beEn!==''?parseInt(beEn)||0:a.english,dSp=bulkEditMode&&beSp!==''?parseInt(beSp)||0:a.spanish;return(<tr key={i} className={a.total===0?'row-zero':a.english>=goal?'row-goal':''}><td style={rs}>#{i+1}</td><td className="agent-name agent-link" onClick={()=>navigate(`/profile/${a.ext}`)}>{a.name}</td><td className="agent-ext">{a.ext}</td><td className="val-english">{bulkEditMode?<input type="number" className="bulk-edit-input" value={beEn!==''?beEn:a.english} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],english:e.target.value}}))}/>:a.english}</td><td className="val-spanish">{bulkEditMode?<input type="number" className="bulk-edit-input" value={beSp!==''?beSp:a.spanish} onChange={e=>setBulkEdits(b=>({...b,[a.ext]:{...b[a.ext],spanish:e.target.value}}))}/>:a.spanish}</td><td className="val-total">{dEn+dSp}</td><td>{dEn>=goal?<span className="badge-goal">Goal</span>:<span className="badge-pending">{goal-dEn} left</span>}</td><td style={{color:'#a78bfa',fontSize:12,textAlign:'center',fontWeight:600}}>{totalEnglish>0?(((dEn/totalEnglish)*100).toFixed(1)+'%'):'—'}</td>{showAsiaEditBtn&&<td className="td-edit">{!bulkEditMode&&<button className="edit-agent-btn" onClick={e=>{e.stopPropagation();setEditForm({spanish:a.spanish,english:a.english});setEditingAgent(a)}}>✏️</button>}</td>}</tr>)})}</tbody></table></div>
              {bulkEditMode&&<div style={{display:'flex',gap:10,marginTop:12,justifyContent:'flex-end'}}><button className="btn-cancel" onClick={()=>{setBulkEditMode(false);setBulkEdits({});setBulkTotalsEdit(null)}}>Cancel</button><button className="btn-save" onClick={saveAsiaBulk}>{savingOverride?'Saving...':'Save all changes'}</button></div>}
            </>)}
            {asiaView==='charts'&&!histLoading&&(<div className="charts-section"><div className="chart-controls"><span className="chart-label">Distribution by transfers:</span><div className="metric-tabs"><button className={`metric-tab ${chartMetric==='english'?'active':''}`} onClick={()=>setChartMetric('english')}>English</button><button className={`metric-tab ${chartMetric==='spanish'?'active':''}`} onClick={()=>setChartMetric('spanish')}>Spanish</button><button className={`metric-tab ${chartMetric==='total'?'active':''}`} onClick={()=>setChartMetric('total')}>Total</button></div></div><BarChart agents={asiaAgentsFinal} metric={chartMetric}/><div className="chart-goal-row"><div className="goal-stat green-stat"><div className="goal-stat-val">{hitGoal.length}</div><div className="goal-stat-label"><Img src={E.goal} size={14}/> Reached goal (20+ EN)</div></div><div className="goal-stat yellow-stat"><div className="goal-stat-val">{asiaAgentsFinal.filter(a=>a.english>=15&&a.english<20).length}</div><div className="goal-stat-label">Almost there (15-19 EN)</div></div><div className="goal-stat red-stat"><div className="goal-stat-val">{atZero.length}</div><div className="goal-stat-label"><Img src={E.zero} size={14}/> At zero</div></div></div></div>)}
            {asiaView==='slacks'&&(<div className="slacks-section"><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:'1.5rem'}}><div className="sum-card blue"><div className="sum-val">{slackAgentsForDate.length}</div><div className="sum-label">Agents</div></div><div className="sum-card gold"><div className="sum-val">{totalReportsForDate}</div><div className="sum-label">Total Reports</div></div><div className="sum-card green">{topAgent?<><div className="sum-val" style={{fontSize:15,paddingTop:6,lineHeight:1.3}}>{topAgent.agent}</div><div className="sum-label">Top Agent ({topAgent.reports} reports)</div></>:<><div className="sum-val">-</div><div className="sum-label">Top Agent</div></>}</div></div>{slackRowsForDate.length===0?<div style={{background:'#181b23',border:'0.5px solid #2a2d38',borderRadius:12,padding:'3rem',textAlign:'center',color:'#6b7280'}}>No slack reports for {formatDateLabel(selectedDate)}.</div>:<><h3 style={{fontFamily:"'Sora',sans-serif",fontSize:13,color:'#9ca3af',marginBottom:12}}>Agent Summary - {formatDateLabel(selectedDate)}</h3><div className="agent-table-wrap"><table className="agent-table"><thead><tr><th>#</th><th>Agent</th><th>ID Opener</th><th style={{textAlign:'center'}}>Reports</th></tr></thead><tbody>{slackAgentsForDate.map((a,i)=>{const rs=i===0?{color:'#FFD700',fontWeight:700}:i===1?{color:'#C0C0C0',fontWeight:700}:i===2?{color:'#CD7F32',fontWeight:700}:{color:'#6b7280'};return(<tr key={i}><td style={rs}>#{i+1}</td><td className="agent-name">{a.agent}</td><td className="agent-ext">{a.opener}</td><td style={{textAlign:'center',color:'#f97316',fontWeight:700,fontSize:15}}>{a.reports}</td></tr>)})}</tbody></table></div></>}</div>)}
            {editingAgent&&(<div className="edit-modal-overlay" onClick={()=>setEditingAgent(null)}><div className="edit-modal" onClick={e=>e.stopPropagation()}><h3 className="edit-modal-title">Edit - {editingAgent.name} <span style={{color:'#6b7280',fontSize:12}}>#{editingAgent.ext}</span></h3><div className="edit-modal-fields"><label>English<input type="number" value={editForm.english} onChange={e=>setEditForm(f=>({...f,english:e.target.value}))}/></label><label>Spanish<input type="number" value={editForm.spanish} onChange={e=>setEditForm(f=>({...f,spanish:e.target.value}))}/></label></div><div className="edit-modal-actions"><button className="btn-cancel" onClick={()=>setEditingAgent(null)}>Cancel</button><button className="btn-save" onClick={saveAsiaAgentEdit}>{savingOverride?'Saving...':'Save'}</button></div></div></div>)}
          </div>
        ):currentTeamConfig?(
          <TeamDetail key={`${activeTab}_${selectedDate}`} config={currentTeamConfig} agents={getTeamAgents(currentTeamConfig.id)} dateLabel={formatDateLabel(selectedDate)} isToday={isToday} canEdit={canEdit} selectedDate={selectedDate} onOverrideTick={()=>setOverridesTick(t=>t+1)} navigate={navigate} loadingRemote={!isToday&&needsRemoteLoad&&loadingRemoteTeam}/>
        ):null}
      </div>
    </div>
  )
}