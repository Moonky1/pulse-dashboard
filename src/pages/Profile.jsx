import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './profile.css'

const HISTORY_SHEET_ID = '1u_5CLPEonZGarvaXU3Uwwx-nczElf5td3iKLRfQOVYU'
const SCRIPT_URL       = 'https://script.google.com/macros/s/AKfycbwmiLdRPyx6IU65p8nW7A3lEncOBr74XIsP-9nsRkxZe2-GF6sqZgvfeS82EK_cTnve/exec'

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

const csvUrl = (sheetId, sheet) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`

function parseCSV(text) {
  return text.trim().split('\n').map(row => {
    const result=[]; let current=''; let inQuotes=false
    for(let i=0;i<row.length;i++){if(row[i]==='"'){inQuotes=!inQuotes;continue}if(row[i]===','&&!inQuotes){result.push(current.trim());current='';continue}current+=row[i]}
    result.push(current.trim()); return result
  })
}
async function fetchSheet(sheetId,name){const res=await fetch(csvUrl(sheetId,name));const text=await res.text();return parseCSV(text)}
const safeInt=(val)=>parseInt((val||'').toString().replace(/,/g,''))||0

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
  return localStorage.getItem('pulse_user_photo') || null
}

const E = {
  medal1:'/emojis/medal1.webp', medal2:'/emojis/medal2.webp', medal3:'/emojis/web3.webp',
  goal:'/emojis/goal.webp', goal1:'/emojis/goal1.webp', zero:'/emojis/zero.webp', firework:'/emojis/firework.webp',
}
const Img=({src,size=20})=><img src={src} width={size} height={size} style={{display:'inline-block',verticalAlign:'middle',objectFit:'contain'}}/>
const MedalImg=({rank})=>{if(rank===1)return<Img src={E.medal1} size={22}/>;if(rank===2)return<Img src={E.medal2} size={22}/>;if(rank===3)return<Img src={E.medal3} size={22}/>;return<span style={{color:'#6b7280',fontSize:12}}>#{rank}</span>}

// Detect team from ext prefix
const getTeamFromExt = (ext) => {
  const e = String(ext)
  if (e.startsWith('1')) return { id:'philippines', name:'Philippines', flag:'ph', hasSp:false, goal:10 }
  if (e.startsWith('2')) return { id:'colombia',    name:'Colombia',    flag:'co', hasSp:true,  goal:10 }
  if (e.startsWith('3')) return { id:'asia',        name:'Asia',        flag:'cn', hasSp:true,  goal:20 }
  if (e.startsWith('4')) return { id:'central',     name:'Central America', flag:'hn', hasSp:true, goal:10 }
  if (e.startsWith('5')) return { id:'mexico',      name:'Mexico Baja', flag:'mx', hasSp:false, goal:10 }
  if (e.startsWith('6')) return { id:'venezuela',   name:'Venezuela',   flag:'ve', hasSp:true,  goal:10 }
  return { id:'unknown', name:'Unknown', flag:'un', hasSp:false, goal:10 }
}

function findAgentInHistoryRows(rows, ext) {
  const agents=[]
  for(let i=0;i<rows.length;i++){
    const row=rows[i], cell0=(row[0]||'').trim(), cell0U=cell0.toUpperCase()
    if(cell0U.includes('AGENT')&&cell0U.includes('LOGGED'))break
    if(cell0U.includes('MANAGEMENT')||cell0U.includes('CALL')||cell0U.includes('TRANSFER')||cell0U.includes('LEXNER')||cell0U.includes('GENERAL')||cell0.length<=1)continue
    const extNum=safeInt(row[1]); if(extNum<1000||extNum>9999)continue
    agents.push({ext:String(extNum),rank:agents.length})
  }
  agents.sort((a,b)=>{
    // get english from rows
    const rowA=rows.find(r=>safeInt(r[1])===parseInt(a.ext))
    const rowB=rows.find(r=>safeInt(r[1])===parseInt(b.ext))
    return safeInt(rowB?.[3]||0)-safeInt(rowA?.[3]||0)
  })
  for(let i=0;i<rows.length;i++){
    const row=rows[i],cell0=(row[0]||'').trim(),cell0U=cell0.toUpperCase()
    if(cell0U.includes('AGENT')&&cell0U.includes('LOGGED'))break
    if(safeInt(row[1])!==parseInt(ext))continue
    if(cell0.length<=1)continue
    const sp=safeInt(row[2]),en=safeInt(row[3])
    const rankIdx=agents.findIndex(a=>a.ext===String(ext))
    return{name:cell0,ext:String(ext),english:en,spanish:sp,total:sp+en,rank:rankIdx>=0?rankIdx+1:null}
  }
  return null
}

async function loadAgentData(ext) {
  const records = []
  const teamInfo = getTeamFromExt(ext)

  // 1. Try Apps Script AGENT_SNAPSHOTS first
  try {
    const url = `${SCRIPT_URL}?action=getAgentSnapshots&ext=${encodeURIComponent(ext)}`
    const res  = await fetch(url)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(d => {
        records.push({
          date: d.date, name: d.name,
          english: d.english||0, spanish: d.spanish||0,
          total: d.total||0, rank: d.rank||null,
          source: 'sheets'
        })
      })
    }
  } catch(e) { console.warn('AGENT_SNAPSHOTS fetch failed:', e) }

  // 2. Fall back to localStorage snapshots
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i)
    if(!k?.startsWith('pulse_snap_'))continue
    try{
      const date=k.replace('pulse_snap_','')
      if(records.find(r=>r.date===date))continue // already have from Sheets
      const data=JSON.parse(localStorage.getItem(k))
      let sourceRows=[]
      if(teamInfo.id==='asia')sourceRows=Array.isArray(data.asiaData)?data.asiaData:[]
      else sourceRows=Array.isArray(data.teams?.[teamInfo.id])?data.teams[teamInfo.id]:[]
      if(sourceRows.length===0)continue
      // Find agent
      for(const row of sourceRows){
        const extNum=safeInt(row[1])
        if(String(extNum)!==String(ext))continue
        const name=(row[0]||'').trim()
        if(name.length<=1)continue
        const nameU=name.toUpperCase()
        if(nameU.includes('AGENT')&&nameU.includes('LOGGED'))break
        // Detect columns
        const col2=safeInt(row[2]),col3=safeInt(row[3])
        let en,sp
        if(teamInfo.hasSp&&teamInfo.id==='asia'){sp=col2;en=col3}
        else if(teamInfo.hasSp){en=col3;sp=safeInt(row[4])}
        else{en=col2;sp=0}
        records.push({date,name,english:en,spanish:sp,total:en+sp,rank:null,source:'local'})
        break
      }
    }catch(e){}
  }

  // 3. For Asia: also load from history sheets
  if(teamInfo.id==='asia'){
    for(const hd of HISTORY_DATES){
      if(records.find(r=>r.date===hd.isoDate))continue
      try{
        const rows=await fetchSheet(HISTORY_SHEET_ID,hd.tab)
        const agent=findAgentInHistoryRows(rows,ext)
        if(agent)records.push({date:hd.isoDate,...agent,source:'history'})
      }catch(e){}
    }
  }

  return records.filter((r,i,arr)=>arr.findIndex(x=>x.date===r.date)===i).sort((a,b)=>a.date.localeCompare(b.date))
}

const formatDate=(d)=>{const[y,m,dd]=d.split('-');const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];return`${days[new Date(`${d}T12:00:00`).getDay()]} ${dd}/${m}`}

export default function Profile() {
  const { ext }   = useParams()
  const navigate  = useNavigate()
  const canvasRef = useRef(null)
  const user      = JSON.parse(localStorage.getItem('pulse_user')||'null')
  const userPhoto = localStorage.getItem('pulse_user_photo')
  const isOwnProfile = String(user?.agentExt) === String(ext)
  const teamInfo  = getTeamFromExt(ext)

  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [agentName, setAgentName] = useState(`Agent #${ext}`)

  // Particles
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
    if(!user){return} // will show login screen
    // Sync photo from Sheets
    loadUserPhotoFromSheets(user.name).then(p => { if(p) setUserPhoto(p) })
    setLoading(true)
    loadAgentData(ext).then(recs=>{
      setRecords(recs)
      const named=recs.filter(r=>r.name&&r.name.length>1)
      if(named.length>0)setAgentName(named[named.length-1].name)
      setLoading(false)
    })
  },[ext])

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="profile-root">
        <canvas ref={canvasRef} className="profile-trail-canvas"/>
        <nav className="profile-nav">
          <div className="profile-nav-brand" onClick={()=>navigate('/')} style={{cursor:'pointer'}}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#f97316"/><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Pulse</span>
          </div>
        </nav>
        <div className="profile-gate">
          <div className="profile-gate-card">
            <div style={{fontSize:52,marginBottom:16}}>🔒</div>
            <h2 className="profile-gate-title">Sign in to view profiles</h2>
            <p className="profile-gate-sub">You need a Pulse account to view agent profiles.<br/>Profiles are only visible to Kampaign Kings members.</p>
            <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:24}}>
              <button className="profile-nav-btn accent" onClick={()=>navigate('/signin')}>Sign In</button>
              <button className="profile-nav-btn" onClick={()=>navigate('/register')}>Register</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = (() => {
    if(records.length===0)return null
    const withData=records.filter(r=>r.total>0)
    if(withData.length===0)return null
    const totalEn=records.reduce((s,r)=>s+r.english,0)
    const totalSp=records.reduce((s,r)=>s+r.spanish,0)
    const avgEn=Math.round(totalEn/records.length)
    const bestDay=[...withData].sort((a,b)=>b.english-a.english)[0]
    const worstDay=[...withData].sort((a,b)=>a.english-b.english)[0]
    const top3Days=records.filter(r=>r.rank&&r.rank<=3)
    const top1Days=records.filter(r=>r.rank===1)
    return{totalEn,totalSp,avgEn,bestDay,worstDay,activeDays:withData.length,zeroDays:records.length-withData.length,daysTracked:records.length,top3Days:top3Days.length,top1Days:top1Days.length}
  })()

  const maxEnglish=Math.max(...records.map(r=>r.english),1)

  return (
    <div className="profile-root">
      <canvas ref={canvasRef} className="profile-trail-canvas"/>
      <nav className="profile-nav">
        <div className="profile-nav-brand" onClick={()=>navigate('/dashboard')} style={{cursor:'pointer'}}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#f97316"/><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Pulse</span>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button className="profile-nav-btn" onClick={()=>navigate('/dashboard')}>← Dashboard</button>
          {isOwnProfile&&<button className="profile-nav-btn accent" onClick={()=>navigate('/settings')}>✏️ Edit Profile</button>}
        </div>
      </nav>

      {loading?(
        <div className="profile-loading"><div className="profile-spinner"/><p>Loading agent history...</p></div>
      ):(
        <div className="profile-body">
          <div className="profile-hero">
            <div className="profile-hero-inner">
              <div className="profile-avatar-ring">
                {isOwnProfile&&userPhoto?<img src={userPhoto} alt="" className="profile-avatar-photo"/>:<div className="profile-avatar-letter">{agentName?.[0]?.toUpperCase()}</div>}
              </div>
              <div className="profile-hero-info">
                <h1 className="profile-hero-name">{agentName}</h1>
                <div className="profile-hero-meta">
                  <img src={`https://flagcdn.com/w20/${teamInfo.flag}.png`} alt="" style={{borderRadius:2}}/>
                  <span style={{fontSize:13,color:'#9ca3af'}}>{teamInfo.name}</span>
                  <span className="profile-ext-tag">#{ext}</span>
                  {isOwnProfile&&<span className="profile-own-tag">✓ You</span>}
                </div>
                {records.length===0&&<p style={{color:'#6b7280',marginTop:8,fontSize:12}}>No data yet. Appears as days are recorded.</p>}
              </div>
            </div>
            <div className="profile-share">
              <div className="profile-share-url">pulse-kk.com/profile/{ext}</div>
              <button className="profile-share-btn" onClick={()=>{navigator.clipboard.writeText(`https://pulse-kk.com/profile/${ext}`);alert('Link copied!')}}>Copy Link</button>
            </div>
          </div>

          {stats&&(
            <>
              <div className="profile-stats-row">
                <div className="pstat blue"><div className="pstat-val">{stats.totalEn.toLocaleString()}</div><div className="pstat-lbl">Total English Xfers</div></div>
                {stats.totalSp>0&&<div className="pstat green"><div className="pstat-val">{stats.totalSp.toLocaleString()}</div><div className="pstat-lbl">Total Spanish Xfers</div></div>}
                <div className="pstat orange"><div className="pstat-val">{stats.avgEn}</div><div className="pstat-lbl">Avg English / Day</div></div>
                <div className="pstat purple"><div className="pstat-val">{stats.activeDays}</div><div className="pstat-lbl">Active Days</div></div>
                <div className="pstat gold"><div className="pstat-val" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Img src={E.goal1} size={26}/>{stats.top3Days}</div><div className="pstat-lbl">Top 3 Appearances</div></div>
                <div className="pstat teal"><div className="pstat-val" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Img src={E.medal1} size={24}/>{stats.top1Days}</div><div className="pstat-lbl">#1 Days</div></div>
              </div>

              <div className="profile-highlights">
                <div className="phighlight">
                  <div className="phighlight-left"><Img src={E.goal} size={26}/><div><div className="phighlight-title">Best Day</div><div className="phighlight-date">{formatDate(stats.bestDay.date)}</div></div></div>
                  <div className="phighlight-val" style={{color:'#34d399'}}>{stats.bestDay.english} EN</div>
                </div>
                <div className="phighlight">
                  <div className="phighlight-left"><Img src={E.zero} size={26}/><div><div className="phighlight-title">Lowest Active Day</div><div className="phighlight-date">{formatDate(stats.worstDay.date)}</div></div></div>
                  <div className="phighlight-val" style={{color:'#f87171'}}>{stats.worstDay.english} EN</div>
                </div>
                <div className="phighlight">
                  <div className="phighlight-left"><span style={{fontSize:24}}>📅</span><div><div className="phighlight-title">Days Tracked</div><div className="phighlight-date">{stats.zeroDays} zero days</div></div></div>
                  <div className="phighlight-val" style={{color:'#60a5fa'}}>{stats.daysTracked}</div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section-title">📈 Performance Timeline</h2>
                <div className="profile-chart">
                  {records.map((r,i)=>(
                    <div key={i} className="ptl-col" title={`${formatDate(r.date)}: ${r.english} EN${r.rank?` · Rank #${r.rank}`:''}`}>
                      <div className="ptl-bar-outer">
                        <div className="ptl-bar" style={{height:`${(r.english/maxEnglish)*100}%`,background:r.rank===1?'#fbbf24':r.rank===2?'#9ca3af':r.rank===3?'#cd7f32':r.english>=teamInfo.goal?'#34d399':r.english>0?'#60a5fa':'#2a2d38'}}/>
                      </div>
                      <div className="ptl-rank">{r.rank&&r.rank<=3?<MedalImg rank={r.rank}/>:null}</div>
                      <div className="ptl-val" style={{color:r.english===stats.bestDay.english?'#34d399':r.english===0?'#4b5563':'#9ca3af'}}>{r.english>0?r.english:'—'}</div>
                      <div className="ptl-date">{formatDate(r.date)}</div>
                    </div>
                  ))}
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
                    <thead><tr><th>Date</th><th>English</th>{teamInfo.hasSp&&<th>Spanish</th>}<th>Total</th><th>Rank</th></tr></thead>
                    <tbody>
                      {[...records].reverse().map((r,i)=>(
                        <tr key={i} className={r.rank===1?'ptr-gold':r.rank===2?'ptr-silver':r.rank===3?'ptr-bronze':r.total===0?'ptr-zero':''}>
                          <td style={{color:'#9ca3af'}}>{formatDate(r.date)}</td>
                          <td style={{color:'#60a5fa',fontWeight:600}}>{r.english}</td>
                          {teamInfo.hasSp&&<td style={{color:'#34d399',fontWeight:600}}>{r.spanish}</td>}
                          <td style={{color:'#f97316',fontWeight:600}}>{r.total}</td>
                          <td>{r.rank?<MedalImg rank={r.rank}/>:<span style={{color:'#4b5563'}}>—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {records.length===0&&(
            <div className="profile-empty">
              <Img src={E.zero} size={54}/>
              <p style={{fontSize:18,fontWeight:700,color:'#e5e7eb',marginTop:16}}>No data found for #{ext}</p>
              <p style={{color:'#6b7280',fontSize:13,marginTop:8}}>Data appears as days are recorded in the dashboard.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}