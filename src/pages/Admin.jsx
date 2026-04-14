import React, { useEffect, useState, useRef } from 'react'
import { generateToken, secondsUntilNext } from '../utils/token'

const ADMIN_PASSWORD = 'pulse2026kk'
const SCRIPT_URL     = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const ADMIN_AUTH_KEY = 'pulse_admin_auth'

const TEAMS      = ['Global', 'Philippines', 'Venezuela', 'Colombia', 'Mexico BJ', 'Central America', 'Asia']
const ROLES      = ['Supervisor', 'QA', 'Team Leader']
const ROLES_ADMIN= ['Global', 'Supervisor', 'QA', 'Team Leader']

const ROLE_CFG = {
  Global:        { bg:'rgba(147,51,234,0.12)', border:'rgba(147,51,234,0.4)',  color:'#e879f9', glow:'0 0 14px rgba(232,121,249,0.3)' },
  Supervisor:    { bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.3)', color:'#60a5fa' },
  QA:            { bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.3)', color:'#fbbf24' },
  'Team Leader': { bg:'rgba(52,211,153,0.08)',  border:'rgba(52,211,153,0.3)', color:'#34d399' },
}

/* ── helpers ────────────────────────────────────────────────────────────────── */
function fmtDate(raw) {
  if (!raw) return '—'
  const s = String(raw).trim()
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s
  try { const d = new Date(s); if (!isNaN(d)) return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}` } catch(e){}
  return s.slice(0,10)
}

function fmtTime(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  // normalize a.m./p.m. → AM/PM
  const norm = s.replace(/\s*a\.m\./gi,' AM').replace(/\s*p\.m\./gi,' PM')
  try {
    const d = new Date(`2000/01/01 ${norm}`)
    if (!isNaN(d)) {
      const h = d.getHours(), m = d.getMinutes().toString().padStart(2,'0')
      const period = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${m} ${period}`
    }
  } catch(e){}
  // fallback: extract HH:MM + AM/PM
  const match = norm.match(/(\d{1,2}):(\d{2})/)
  if (match) {
    let h = parseInt(match[1]), m = match[2]
    const isPM = /pm/i.test(norm), isAM = /am/i.test(norm)
    if (isPM && h < 12) h += 12
    if (isAM && h === 12) h = 0
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m} ${period}`
  }
  return ''
}

function parseSortKey(u) {
  // build a sortable timestamp from date + time fields
  try {
    const ds = String(u.date||'').trim()
    const ts = String(u.time||'').trim()
    // already ISO-like
    if (/^\d{4}/.test(ds)) return new Date(ds).getTime() || 0
    // d/M/yyyy
    const dm = ds.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (dm) {
      const norm = `${dm[3]}-${dm[2].padStart(2,'0')}-${dm[1].padStart(2,'0')}`
      const tn = ts.replace(/\s*a\.m\./gi,' AM').replace(/\s*p\.m\./gi,' PM')
      return new Date(`${norm}T${tn}`).getTime() || new Date(norm).getTime() || 0
    }
    return new Date(ds).getTime() || 0
  } catch(e){ return 0 }
}

async function callScript(params) {
  const url = `${SCRIPT_URL}?${new URLSearchParams(params)}&t=${Date.now()}`
  const res = await fetch(url, { cache:'no-store' })
  return res.json()
}

/* ── CustomSelect (fixed-position dropdown, no clip issues) ─────────────────── */
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const btnRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (listRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleToggle = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen(o => !o)
  }

  const cfg = ROLE_CFG[value]
  const label = value || 'Select...'

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleToggle}
        style={{ width:'100%', padding:'10px 14px', background:'#0d0f14', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color: cfg ? cfg.color : '#f5f5f5', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:"'DM Sans',sans-serif", textAlign:'left', boxSizing:'border-box' }}>
        <span style={{ display:'flex', alignItems:'center', gap:8 }}>
          {value === 'Global' && <span style={{ color:'#e879f9', fontSize:10 }}>✦</span>}
          {label}
        </span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform:open?'rotate(180deg)':'none', transition:'transform .2s', flexShrink:0 }}>
          <path d="M2 4l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && rect && (
        <div ref={listRef}
          style={{ position:'fixed', top:rect.bottom+6, left:rect.left, width:rect.width, background:'rgba(8,10,18,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, zIndex:99999, overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,0.8)', backdropFilter:'blur(18px)' }}>
          {options.map(o => {
            const val = typeof o === 'string' ? o : o.value
            const lbl = typeof o === 'string' ? o : o.label
            const c   = ROLE_CFG[val]
            const sel = val === value
            const isGlob = val === 'Global'
            return (
              <button key={val} type="button"
                onClick={() => { onChange(val); setOpen(false) }}
                style={{ width:'100%', padding:'11px 16px', background:sel?'rgba(249,115,22,0.1)':'transparent', border:'none', color: isGlob ? '#e879f9' : (c ? c.color : '#e5e7eb'), fontSize:13, cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:8, transition:'background .1s' }}
                onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
                onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background='transparent' }}>
                {isGlob && <span style={{ fontSize:10, opacity:.8 }}>✦</span>}
                {lbl}
                {sel && <span style={{ marginLeft:'auto', color:'#f97316', fontSize:12 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ── RoleBadge ───────────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const c = ROLE_CFG[role] || { bg:'transparent', border:'rgba(255,255,255,0.08)', color:'#9ca3af' }
  return (
    <span style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color, padding:'3px 11px', borderRadius:7, fontSize:11, fontWeight:700, whiteSpace:'nowrap', boxShadow:c.glow||'none', fontFamily:"'DM Sans',sans-serif" }}>
      {role === 'Global' && <span style={{ marginRight:4, fontSize:9 }}>✦</span>}
      {role}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   ADMIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function Admin() {
  const [auth, setAuth]     = useState(false)  // always ask on load
  const [pw, setPw]         = useState('')
  const [pwErr, setPwErr]   = useState('')
  const [token, setToken]   = useState(generateToken())
  const [secs, setSecs]     = useState(secondsUntilNext())
  const [copied, setCopied] = useState(false)

  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefresh]= useState(false)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')

  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPos, setMenuPos]   = useState({ x:0, y:0 })
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ name:'', team:'', role:'' })
  const [saving, setSaving]     = useState(false)
  const [busy, setBusy]         = useState(false)

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuth(true); setPwErr('') }
    else { setPwErr('Wrong password'); setPw('') }
  }
  const lock = () => { setAuth(false); setPw('') }

  useEffect(() => {
    if (!auth) return
    const iv = setInterval(() => { setToken(generateToken()); setSecs(secondsUntilNext()) }, 1000)
    return () => clearInterval(iv)
  }, [auth])

  const fetchUsers = async (isRef = false) => {
    if (isRef) setRefresh(true); else setLoading(true)
    try {
      const d = await callScript({ action:'getUsers' })
      if (!d?.ok || !Array.isArray(d.users)) throw new Error(d?.error||'Failed')
      setUsers(d.users)
    } catch(e) { setUsers([]) }
    finally { setLoading(false); setRefresh(false) }
  }

  useEffect(() => {
    if (!auth) return
    fetchUsers(false)
    const iv = setInterval(() => fetchUsers(true), 30000)
    return () => clearInterval(iv)
  }, [auth])

  const copy = () => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  const pct  = ((300 - secs) / 300) * 100

  // Sort: Global role first, then by registration date desc
  const filtered = users
    .filter(u => {
      const mf = filter==='all' || u.role?.toLowerCase().includes(filter)
      const ms = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.team?.toLowerCase().includes(search.toLowerCase())
      return mf && ms
    })
    .sort((a, b) => {
      // Pure registration date sort (newest first)
      // Global role users still float to top
      const aGlob = a.role === 'Global' ? 1 : 0
      const bGlob = b.role === 'Global' ? 1 : 0
      if (aGlob !== bGlob) return bGlob - aGlob
      return parseSortKey(b) - parseSortKey(a)
    })

  const cnt = (role) => users.filter(u => u.role===role).length

  const openMenu = (e, i) => {
    e.stopPropagation()
    if (menuOpen===i) { setMenuOpen(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    setMenuPos({ x:r.right, y:r.bottom })
    setMenuOpen(i)
  }
  const openEdit = (u) => { setEditUser(u); setEditForm({name:u.name,team:u.team,role:u.role}); setMenuOpen(null) }

  const saveEdit = async () => {
    if (!editUser) return; setSaving(true)
    try {
      const d = await callScript({ action:'edit', bookId:editUser.bookId||'', rowIndex:editUser.rowIndex||'', oldName:editUser.name, oldTeam:editUser.team, oldRole:editUser.role, oldDate:editUser.date, oldTime:editUser.time, name:editForm.name, team:editForm.team, role:editForm.role })
      if (!d?.ok) throw new Error(d?.error)
      await fetchUsers(true); setEditUser(null)
    } catch(e) { alert('Could not save.') } finally { setSaving(false) }
  }

  const expelUser = async (u) => {
    setMenuOpen(null); if (!window.confirm(`¿Expulsar a ${u.name}?`)) return; setBusy(true)
    try { const d = await callScript({action:'removeUser',bookId:u.bookId||'',rowIndex:u.rowIndex||'',name:u.name,team:u.team,role:u.role,date:u.date,time:u.time}); if(!d?.ok) throw new Error(); await fetchUsers(true) }
    catch(e){alert('Error.')} finally{setBusy(false)}
  }
  const banUser = async (u) => {
    setMenuOpen(null); if(!window.confirm(`¿Banear a ${u.name}?`)) return
    const reason = window.prompt('Motivo:','Blocked from admin')||''
    setBusy(true)
    try { const d = await callScript({action:'banUser',bookId:u.bookId||'',rowIndex:u.rowIndex||'',name:u.name,team:u.team,role:u.role,date:u.date,time:u.time,reason}); if(!d?.ok) throw new Error(); await fetchUsers(true) }
    catch(e){alert('Error.')} finally{setBusy(false)}
  }

  /* ── Login ── */
  if (!auth) return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 50% -10%, rgba(249,115,22,0.22) 0%, rgba(249,115,22,0.08) 28%, transparent 60%), #020409', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:'rgba(14,17,26,0.94)', backdropFilter:'blur(18px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:'2.5rem 2rem', width:'100%', maxWidth:360, textAlign:'center', boxShadow:'0 30px 70px rgba(0,0,0,0.5)' }}>
        <div style={{ width:52,height:52,background:'linear-gradient(180deg,#fb923c,#ea580c)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.25rem',boxShadow:'0 12px 32px rgba(249,115,22,0.3)' }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:'#f8fafc',marginBottom:4 }}>Pulse Admin</div>
        <p style={{ fontSize:12,color:'#6b7280',marginBottom:22 }}>Enter your password to continue</p>
        <input type="password" placeholder="Password" value={pw}
          onChange={e=>{setPw(e.target.value);setPwErr('')}}
          onKeyDown={e=>e.key==='Enter'&&login()}
          style={{ width:'100%',padding:'11px 16px',background:'#0d0f14',border:`1px solid ${pwErr?'#f87171':'rgba(255,255,255,0.08)'}`,borderRadius:12,color:'#f5f5f5',fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}
          autoFocus/>
        {pwErr && <p style={{ color:'#f87171',fontSize:12,marginBottom:10 }}>{pwErr}</p>}
        <button onClick={login} style={{ width:'100%',padding:12,background:'linear-gradient(180deg,#f97316,#ea580c)',border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 10px 28px rgba(249,115,22,0.28)' }}>Enter →</button>
      </div>
    </div>
  )

  /* ── Main ── */
  return (
    <div style={{ minHeight:'100vh', fontFamily:"'DM Sans',sans-serif", color:'#f5f5f5', position:'relative', overflow:'hidden' }}
      onClick={()=>setMenuOpen(null)}>

      {/* Background — same as dashboard */}
      <div style={{ position:'fixed',inset:0,zIndex:0,background:'linear-gradient(180deg,#020409 0%,#03050a 48%,#020409 100%)',pointerEvents:'none' }}/>
      <div style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
        backgroundSize:'64px 64px',opacity:.2,
        maskImage:'radial-gradient(circle at 50% 26%,black 35%,rgba(0,0,0,0.72) 68%,transparent 100%)'
      }}/>
      <div style={{ position:'fixed',left:'50%',top:-140,width:720,height:420,transform:'translateX(-50%)',pointerEvents:'none',zIndex:0,
        background:'radial-gradient(circle,rgba(249,115,22,0.22) 0%,rgba(249,115,22,0.1) 28%,rgba(249,115,22,0.03) 55%,transparent 75%)',
        filter:'blur(28px)'
      }}/>

      {/* Edit modal */}
      {editUser && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,backdropFilter:'blur(4px)' }}>
          <div style={{ background:'rgba(12,15,22,0.98)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:22,padding:'2rem',width:'100%',maxWidth:420,boxShadow:'0 30px 60px rgba(0,0,0,0.8)' }}
            onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Sora',sans-serif",marginBottom:'1.5rem',fontSize:16,fontWeight:700 }}>Editar usuario</h3>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6 }}>Name</label>
                <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
                  style={{ width:'100%',padding:'10px 14px',background:'#0d0f14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,color:'#f5f5f5',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:"'DM Sans',sans-serif" }}/>
              </div>
              {/* Team */}
              <div>
                <label style={{ fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6 }}>Team</label>
                <CustomSelect value={editForm.team} onChange={v=>setEditForm(f=>({...f,team:v}))} options={TEAMS}/>
              </div>
              {/* Role */}
              <div>
                <label style={{ fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:6 }}>Role</label>
                <CustomSelect value={editForm.role} onChange={v=>setEditForm(f=>({...f,role:v}))} options={ROLES_ADMIN}/>
              </div>
              {editForm.role==='Global' && (
                <div style={{ background:'rgba(147,51,234,0.08)',border:'1px solid rgba(147,51,234,0.25)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#c084fc',display:'flex',gap:8,alignItems:'center' }}>
                  <span>✦</span> Global solo puede asignarse desde aquí.
                </div>
              )}
            </div>
            <div style={{ display:'flex',gap:10,marginTop:'1.5rem' }}>
              <button onClick={()=>setEditUser(null)} style={{ flex:1,padding:11,background:'transparent',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,color:'#6b7280',fontSize:13,cursor:'pointer' }}>Cancelar</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex:1,padding:11,background:'linear-gradient(180deg,#f97316,#ea580c)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?.7:1 }}>
                {saving?'Saving...':'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {menuOpen!==null && (
        <div onClick={e=>e.stopPropagation()}
          style={{ position:'fixed',top:menuPos.y+4,left:menuPos.x-192,background:'rgba(8,10,18,0.97)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,zIndex:9000,minWidth:192,overflow:'hidden',boxShadow:'0 14px 40px rgba(0,0,0,0.8)',backdropFilter:'blur(18px)' }}>
          {[
            { label:'✏️ Editar',  color:'#e5e7eb', fn:()=>openEdit(filtered[menuOpen]) },
            { label:'⛔ Expulsar',color:'#fbbf24', fn:()=>expelUser(filtered[menuOpen]) },
            { label:'🚫 Banear',  color:'#f87171', fn:()=>banUser(filtered[menuOpen])  },
          ].map((item,i)=>(
            <button key={i} onClick={item.fn} disabled={busy&&i>0}
              style={{ width:'100%',padding:'12px 18px',background:'transparent',border:'none',color:item.color,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Navbar */}
      <header style={{ position:'relative',zIndex:100,background:'rgba(4,6,11,0.85)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 2rem',height:64,display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:38,height:38,background:'linear-gradient(180deg,#fb923c,#ea580c)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 22px rgba(249,115,22,0.22)' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:17,color:'#f97316' }}>Pulse</span>
        <span style={{ fontSize:11,color:'#6b7280',background:'rgba(255,255,255,0.04)',padding:'3px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.07)',fontWeight:600 }}>Admin</span>
        <div style={{ marginLeft:'auto',display:'flex',gap:10 }}>
          <button onClick={()=>window.location.href='/dashboard'} style={{ padding:'7px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,color:'#9ca3af',fontSize:12,cursor:'pointer' }}>← Dashboard</button>
          <button onClick={lock} style={{ padding:'7px 16px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,color:'#9ca3af',fontSize:12,cursor:'pointer' }}>🔒 Lock</button>
        </div>
      </header>

      <div style={{ maxWidth:1120,margin:'0 auto',padding:'2rem',position:'relative',zIndex:1 }}>

        {/* Token card */}
        <div style={{ background:'linear-gradient(180deg,rgba(18,22,31,0.9),rgba(11,14,22,0.9))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:22,padding:'1.75rem 2rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'2rem',flexWrap:'wrap',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.03),0 24px 50px rgba(0,0,0,0.3)' }}>
          <div style={{ flex:1,minWidth:200 }}>
            <p style={{ fontSize:10,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,fontWeight:600 }}>Current Access Token</p>
            <div style={{ fontSize:52,fontFamily:"'Sora',sans-serif",fontWeight:800,letterSpacing:'0.18em',color:'#f97316',lineHeight:1 }}>{token}</div>
            <div style={{ background:'rgba(255,255,255,0.06)',borderRadius:999,height:4,marginTop:14,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${pct}%`,background:secs<30?'#f87171':'linear-gradient(90deg,#f97316,#fb923c)',borderRadius:999,transition:'width 1s linear,background .3s' }}/>
            </div>
            <p style={{ fontSize:12,color:secs<30?'#f87171':'#6b7280',marginTop:8 }}>Changes in {secs}s</p>
          </div>
          <button onClick={copy} style={{ padding:'11px 24px',background:copied?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${copied?'#1a4a2e':'rgba(255,255,255,0.08)'}`,borderRadius:12,color:copied?'#34d399':'#9ca3af',fontSize:14,cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>
            {copied?'✓ Copied!':'Copy token'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:'1.5rem' }}>
          {[
            { label:'✦ Global',     value:cnt('Global'),       color:'#e879f9', bg:'rgba(147,51,234,0.08)',  border:'rgba(147,51,234,0.35)', glow:'0 0 24px rgba(232,121,249,0.15)' },
            { label:'Supervisors',  value:cnt('Supervisor'),   color:'#60a5fa', bg:'rgba(96,165,250,0.06)',  border:'rgba(96,165,250,0.18)' },
            { label:'QA',           value:cnt('QA'),           color:'#fbbf24', bg:'rgba(251,191,36,0.06)',  border:'rgba(251,191,36,0.18)' },
            { label:'Team Leaders', value:cnt('Team Leader'),  color:'#34d399', bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.18)' },
            { label:'Total',        value:users.length,        color:'#f97316', bg:'rgba(249,115,22,0.08)',  border:'rgba(249,115,22,0.2)'  },
          ].map((s,i)=>(
            <div key={i} style={{ background:s.bg,border:`1px solid ${s.border}`,borderRadius:18,padding:'1.1rem',textAlign:'center',boxShadow:s.glow||'none' }}>
              <div style={{ fontFamily:"'Sora',sans-serif",fontSize:30,fontWeight:800,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11,color:'#6b7280',marginTop:4,fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'linear-gradient(180deg,rgba(18,22,31,0.9),rgba(11,14,22,0.9))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:22,overflow:'hidden',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.03),0 24px 50px rgba(0,0,0,0.28)' }}>
          {/* Table toolbar */}
          <div style={{ padding:'1rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontFamily:"'Sora',sans-serif",fontSize:14,fontWeight:700 }}>Registered Users</span>
              <span style={{ color:'#f97316',fontSize:12,fontWeight:700 }}>({users.length})</span>
              {refreshing && <span style={{ fontSize:11,color:'#6b7280' }}>↻ syncing...</span>}
            </div>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ padding:'6px 12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,color:'#e5e7eb',fontSize:12,outline:'none',width:140 }}/>
              {[{k:'all',l:'All'},{k:'global',l:'✦ Global'},{k:'supervisor',l:'Supervisor'},{k:'qa',l:'QA'},{k:'leader',l:'Leader'}].map(f=>(
                <button key={f.k} onClick={()=>setFilter(f.k)}
                  style={{ padding:'6px 13px',background:filter===f.k?'rgba(249,115,22,0.1)':'transparent',border:`1px solid ${filter===f.k?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:10,color:filter===f.k?'#f97316':'#6b7280',fontSize:11,cursor:'pointer',fontWeight:filter===f.k?700:400 }}>
                  {f.l}
                </button>
              ))}
              <button onClick={()=>fetchUsers(true)} disabled={refreshing}
                style={{ padding:'6px 13px',background:'transparent',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,color:'#6b7280',fontSize:11,cursor:'pointer',opacity:refreshing?.5:1 }}>
                ↺ Refresh
              </button>
            </div>
          </div>

          {loading && users.length===0
            ? <div style={{ padding:'3rem',textAlign:'center',color:'#6b7280' }}><div style={{ fontSize:24,marginBottom:8 }}>⏳</div>Loading users...</div>
            : filtered.length===0
            ? <div style={{ padding:'3rem',textAlign:'center',color:'#6b7280' }}>No users found.</div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'rgba(0,0,0,0.3)' }}>
                      {['#','Name','Team','Role','Registered',''].map((h,i)=>(
                        <th key={i} style={{ padding:'11px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.07em',borderBottom:'1px solid rgba(255,255,255,0.06)',whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u,i) => {
                      const isGlob = u.role==='Global'
                      const isNew  = i===0 && !isGlob
                      const dateStr= fmtDate(u.date)
                      const timeStr= fmtTime(u.time||u.date)
                      return (
                        <tr key={`${u.bookId||'x'}-${u.rowIndex||i}`}
                          style={{ borderBottom:'1px solid rgba(255,255,255,0.04)',background:isGlob?'rgba(147,51,234,0.04)':isNew?'rgba(249,115,22,0.025)':'transparent',transition:'background .15s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=isGlob?'rgba(147,51,234,0.07)':'rgba(255,255,255,0.02)'}
                          onMouseLeave={e=>e.currentTarget.style.background=isGlob?'rgba(147,51,234,0.04)':isNew?'rgba(249,115,22,0.025)':'transparent'}>
                          <td style={{ padding:'13px 16px',color:'#4b5563',fontSize:12 }}>{i+1}</td>
                          <td style={{ padding:'13px 16px' }}>
                            <span style={{ fontWeight:600,color:'#f1f5f9' }}>{u.name}</span>
                            {isNew && <span style={{ marginLeft:8,fontSize:9,background:'rgba(249,115,22,0.1)',color:'#f97316',border:'1px solid rgba(249,115,22,0.3)',borderRadius:4,padding:'1px 6px',fontWeight:700 }}>NEW</span>}
                          </td>
                          <td style={{ padding:'13px 16px',color:'#9ca3af',fontSize:13 }}>
                            {u.team==='Global'
                              ? <span style={{ color:'#e879f9',fontWeight:600,fontSize:12 }}>✦ Global</span>
                              : u.team}
                          </td>
                          <td style={{ padding:'13px 16px' }}><RoleBadge role={u.role}/></td>
                          <td style={{ padding:'13px 16px',color:'#6b7280',fontSize:12,whiteSpace:'nowrap' }}>
                            {dateStr}
                            {timeStr && <span style={{ color:'#4b5563',marginLeft:6 }}>{timeStr}</span>}
                          </td>
                          <td style={{ padding:'13px 16px',textAlign:'right' }}>
                            <button onClick={e=>openMenu(e,i)}
                              style={{ background:'transparent',border:'none',color:'#4b5563',fontSize:18,cursor:'pointer',padding:'0 4px',letterSpacing:2,lineHeight:1 }}
                              onMouseEnter={e=>e.currentTarget.style.color='#f97316'}
                              onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>···</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}