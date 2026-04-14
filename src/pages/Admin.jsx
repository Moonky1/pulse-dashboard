import React, { useEffect, useState, useRef } from 'react'
import { generateToken, secondsUntilNext } from '../utils/token'

const ADMIN_PASSWORD  = 'pulse2026kk'
const SCRIPT_URL      = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const ADMIN_AUTH_KEY  = 'pulse_admin_auth'

const TEAMS = ['Global', 'Philippines', 'Venezuela', 'Colombia', 'Mexico BJ', 'Central America', 'Asia']
const ROLES = ['Supervisor', 'QA', 'Team Leader']
const ROLES_ADMIN = ['Supervisor', 'QA', 'Team Leader', 'Global'] // Global only via /admin

const ROLE_COLORS = {
  Supervisor:    { bg: '#0d1a2a', border: '#1a3a5a',  color: '#60a5fa' },
  QA:            { bg: '#1a1a0d', border: '#4a4a1a',  color: '#fbbf24' },
  'Team Leader': { bg: '#0d2018', border: '#1a4a2e',  color: '#34d399' },
  Global:        { bg: '#1a0828', border: '#9333ea',  color: '#e879f9', glow: '0 0 14px rgba(233,121,249,0.35)' },
}

// Format Sheets date cells — strips timezone text
function fmtDate(raw) {
  if (!raw) return '—'
  const s = String(raw).trim()
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
  } catch(e) {}
  return s.slice(0, 10)
}
function fmtTime(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  if (!s) return ''

  // Normalize "a.m." / "p.m." to AM/PM
  const norm = s.replace(/\s*a\.m\./gi, ' AM').replace(/\s*p\.m\./gi, ' PM')

  // Try Date parse on normalized string
  try {
    const d = new Date(`2000/01/01 ${norm}`)
    if (!isNaN(d.getTime())) {
      return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
    }
  } catch(e) {}

  // Fallback: extract digits and detect AM/PM
  const match = norm.match(/(\d{1,2}):(\d{2})/)
  if (match) {
    let h = parseInt(match[1]), m = match[2]
    const isPM = /pm/i.test(norm), isAM = /am/i.test(norm)
    if (isPM && h < 12) h += 12
    if (isAM && h === 12) h = 0
    return `${h.toString().padStart(2,'0')}:${m}`
  }
  return ''
}

async function callScript(params) {
  const url = `${SCRIPT_URL}?${new URLSearchParams(params).toString()}&t=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })
  return res.json()
}

function RoleBadge({ role }) {
  const rc = ROLE_COLORS[role] || { bg: 'transparent', border: '#2a2d38', color: '#9ca3af' }
  return (
    <span style={{
      background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color,
      padding: '3px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', letterSpacing: '0.02em',
      boxShadow: rc.glow || 'none',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {role === 'Global' && <span style={{ marginRight: 4 }}>✦</span>}
      {role}
    </span>
  )
}

// ── Custom dropdown (replaces ugly native select) ────────────────────────────
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find(o => (o.value||o) === value)
  const label    = selected ? (selected.label || selected) : placeholder || 'Select...'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '10px 14px', background: '#0d0f14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#f5f5f5', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'DM Sans',sans-serif", textAlign: 'left' }}>
        <span>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M2 4l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'rgba(10,13,20,0.98)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, zIndex: 9999, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(14px)' }}>
          {options.map(o => {
            const val = o.value || o
            const lbl = o.label || o
            const rc  = ROLE_COLORS[val]
            const isSelected = val === value
            return (
              <button key={val} type="button"
                onClick={() => { onChange(val); setOpen(false) }}
                style={{ width: '100%', padding: '10px 14px', background: isSelected ? 'rgba(249,115,22,0.1)' : 'transparent', border: 'none', color: isGlobalTeam ? '#e879f9' : (rc ? rc.color : '#e5e7eb'), fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 8, transition: 'background .1s' }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                {(val === 'Global') && <span style={{ color: '#e879f9', fontSize: 10 }}>✦</span>}
                {lbl}
                {isSelected && <span style={{ marginLeft: 'auto', color: '#f97316', fontSize: 12 }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const [auth, setAuth]       = useState(() => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true')
  const [pw, setPw]           = useState('')
  const [pwError, setPwError] = useState('')
  const [token, setToken]     = useState(generateToken())
  const [seconds, setSeconds] = useState(secondsUntilNext())
  const [copied, setCopied]   = useState(false)

  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')

  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPos, setMenuPos]   = useState({ x: 0, y: 0 })
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', team: '', role: '' })
  const [saving, setSaving]     = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuth(true); sessionStorage.setItem(ADMIN_AUTH_KEY, 'true'); setPwError('')
    } else { setPwError('Wrong password'); setPw('') }
  }
  const handleLock = () => { setAuth(false); sessionStorage.removeItem(ADMIN_AUTH_KEY); setPw('') }

  useEffect(() => {
    if (!auth) return
    const iv = setInterval(() => { setToken(generateToken()); setSeconds(secondsUntilNext()) }, 1000)
    return () => clearInterval(iv)
  }, [auth])

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    try {
      const data = await callScript({ action: 'getUsers' })
      if (!data?.ok || !Array.isArray(data.users)) throw new Error(data?.error || 'Failed')
      setUsers(data.users)
    } catch(e) { setUsers([]) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => {
    if (!auth) return
    fetchUsers(false)
    const iv = setInterval(() => fetchUsers(true), 30000)
    return () => clearInterval(iv)
  }, [auth])

  const copy = () => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const pct  = ((300 - seconds) / 300) * 100

  const filtered = users
    .filter(u => {
      const matchFilter = filter === 'all' || u.role?.toLowerCase().includes(filter)
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.team?.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
    .sort((a, b) => {
      // Global always first
      if (a.role === 'Global' && b.role !== 'Global') return -1
      if (b.role === 'Global' && a.role !== 'Global') return 1
      return 0
    })

  const roleCount = (role) => users.filter(u => u.role === role).length

  const openMenu = (e, i) => {
    e.stopPropagation()
    if (menuOpen === i) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ x: rect.right, y: rect.bottom })
    setMenuOpen(i)
  }

  const openEdit = (user) => {
    setEditUser(user); setEditForm({ name: user.name, team: user.team, role: user.role }); setMenuOpen(null)
  }

  const saveEdit = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const data = await callScript({
        action: 'edit', bookId: editUser.bookId||'', rowIndex: editUser.rowIndex||'',
        oldName: editUser.name, oldTeam: editUser.team, oldRole: editUser.role,
        oldDate: editUser.date, oldTime: editUser.time,
        name: editForm.name, team: editForm.team, role: editForm.role,
      })
      if (!data?.ok) throw new Error(data?.error || 'Could not edit')
      await fetchUsers(true); setEditUser(null)
    } catch(e) { alert('Could not save changes.') }
    finally { setSaving(false) }
  }

  const expelUser = async (user) => {
    setMenuOpen(null)
    if (!window.confirm(`¿Expulsar a ${user.name}?`)) return
    setActionBusy(true)
    try {
      const data = await callScript({ action: 'removeUser', bookId: user.bookId||'', rowIndex: user.rowIndex||'', name: user.name, team: user.team, role: user.role, date: user.date, time: user.time })
      if (!data?.ok) throw new Error(data?.error)
      await fetchUsers(true)
    } catch(e) { alert('Could not expel user.') }
    finally { setActionBusy(false) }
  }

  const banUser = async (user) => {
    setMenuOpen(null)
    if (!window.confirm(`¿Banear a ${user.name}? Esto lo sacará y bloqueará futuros registros.`)) return
    const reason = window.prompt('Motivo del baneo:', 'Blocked from admin panel') || ''
    setActionBusy(true)
    try {
      const data = await callScript({ action: 'banUser', bookId: user.bookId||'', rowIndex: user.rowIndex||'', name: user.name, team: user.team, role: user.role, date: user.date, time: user.time, reason })
      if (!data?.ok) throw new Error(data?.error)
      await fetchUsers(true)
    } catch(e) { alert('Could not ban user.') }
    finally { setActionBusy(false) }
  }

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <div style={{ minHeight:'100vh', background:'radial-gradient(circle at top, rgba(249,115,22,0.12), transparent 35%), #020409', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ background:'rgba(14,17,26,0.94)', backdropFilter:'blur(18px)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:24, padding:'2.5rem 2rem', width:'100%', maxWidth:360, textAlign:'center', boxShadow:'0 30px 70px rgba(0,0,0,0.5)' }}>
          <div style={{ width:52, height:52, background:'linear-gradient(180deg,#fb923c,#ea580c)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', boxShadow:'0 12px 32px rgba(249,115,22,0.3)' }}>
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none"><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:20, color:'#f8fafc', marginBottom:4 }}>Pulse Admin</div>
          <p style={{ fontSize:12, color:'#6b7280', marginBottom:22 }}>Enter your password to continue</p>
          <input type="password" placeholder="Password" value={pw}
            onChange={e=>{ setPw(e.target.value); setPwError('') }}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            style={{ width:'100%', padding:'11px 16px', background:'#0d0f14', border:`1px solid ${pwError?'#f87171':'rgba(255,255,255,0.08)'}`, borderRadius:12, color:'#f5f5f5', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}
            autoFocus
          />
          {pwError && <p style={{ color:'#f87171', fontSize:12, marginBottom:10 }}>{pwError}</p>}
          <button onClick={handleLogin} style={{ width:'100%', padding:12, background:'linear-gradient(180deg,#f97316,#ea580c)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 10px 28px rgba(249,115,22,0.28)' }}>
            Enter →
          </button>
        </div>
      </div>
    )
  }

  // ── Main admin ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(circle at top, rgba(249,115,22,0.07), transparent 32%), #020409', fontFamily:"'DM Sans',sans-serif", color:'#f5f5f5' }} onClick={()=>setMenuOpen(null)}>

      {/* Edit modal */}
      {editUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'rgba(12,15,22,0.98)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:22, padding:'2rem', width:'100%', maxWidth:420, boxShadow:'0 30px 60px rgba(0,0,0,0.8)' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", marginBottom:'1.5rem', fontSize:16, fontWeight:700, color:'#f5f5f5' }}>Editar usuario</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[{label:'Name',key:'name',type:'input'},{label:'Team',key:'team',type:'select',opts:TEAMS},{label:'Role',key:'role',type:'select',opts:ROLES_ADMIN}].map(({label,key,type,opts})=>(
                <div key={key}>
                  <label style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>{label}</label>
                  {type==='input'
                    ? <input value={editForm[key]} onChange={e=>setEditForm(f=>({...f,[key]:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'#0d0f14', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#f5f5f5', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif" }}/>
                    : <CustomSelect value={editForm[key]} onChange={v=>setEditForm(f=>({...f,[key]:v}))} options={opts}/>
                  }
                </div>
              ))}
              {editForm.role === 'Global' && (
                <div style={{ background:'rgba(147,51,234,0.08)', border:'1px solid rgba(147,51,234,0.25)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#c084fc', display:'flex', gap:8, alignItems:'center' }}>
                  <span>✦</span> Global es un rol especial que solo puede asignarse desde aquí.
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
              <button onClick={()=>setEditUser(null)} style={{ flex:1, padding:11, background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#6b7280', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={saveEdit} disabled={saving} style={{ flex:1, padding:11, background:'linear-gradient(180deg,#f97316,#ea580c)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity:saving?0.7:1 }}>
                {saving ? 'Saving...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {menuOpen !== null && (
        <div onClick={e=>e.stopPropagation()} style={{ position:'fixed', top:menuPos.y+6, left:menuPos.x-190, background:'rgba(12,15,22,0.97)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, zIndex:500, minWidth:190, overflow:'hidden', boxShadow:'0 12px 36px rgba(0,0,0,0.7)', backdropFilter:'blur(14px)' }}>
          {[
            { label:'✏️ Editar', color:'#e5e7eb', fn:()=>openEdit(filtered[menuOpen]) },
            { label:'⛔ Expulsar', color:'#fbbf24', fn:()=>expelUser(filtered[menuOpen]) },
            { label:'🚫 Banear', color:'#f87171', fn:()=>banUser(filtered[menuOpen]) },
          ].map((item,i)=>(
            <button key={i} onClick={item.fn} disabled={actionBusy&&i>0}
              style={{ width:'100%', padding:'12px 18px', background:'transparent', border:'none', color:item.color, fontSize:13, cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif", transition:'background .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >{item.label}</button>
          ))}
        </div>
      )}

      {/* Top nav */}
      <header style={{ background:'rgba(4,6,11,0.85)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 2rem', height:64, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ width:38, height:38, background:'linear-gradient(180deg,#fb923c,#ea580c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 22px rgba(249,115,22,0.22)' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:17, color:'#f97316' }}>Pulse</span>
        <span style={{ fontSize:11, color:'#6b7280', background:'rgba(255,255,255,0.04)', padding:'3px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.07)', fontWeight:600 }}>Admin</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          <button onClick={()=>window.location.href='/dashboard'} style={{ padding:'7px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#9ca3af', fontSize:12, cursor:'pointer' }}>← Dashboard</button>
          <button onClick={handleLock} style={{ padding:'7px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#9ca3af', fontSize:12, cursor:'pointer' }}>🔒 Lock</button>
        </div>
      </header>

      <div style={{ maxWidth:1120, margin:'0 auto', padding:'2rem' }}>

        {/* Token card */}
        <div style={{ background:'linear-gradient(180deg,rgba(18,22,31,0.92),rgba(11,14,22,0.92))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:'1.75rem 2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'2rem', flexWrap:'wrap', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.03), 0 24px 50px rgba(0,0,0,0.3)' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <p style={{ fontSize:10, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, fontWeight:600 }}>Current Access Token</p>
            <div style={{ fontSize:52, fontFamily:"'Sora',sans-serif", fontWeight:800, letterSpacing:'0.18em', color:'#f97316', lineHeight:1 }}>{token}</div>
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:999, height:4, marginTop:14, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:seconds<30?'#f87171':'linear-gradient(90deg,#f97316,#fb923c)', borderRadius:999, transition:'width 1s linear, background .3s' }}/>
            </div>
            <p style={{ fontSize:12, color:seconds<30?'#f87171':'#6b7280', marginTop:8 }}>Changes in {seconds}s</p>
          </div>
          <button onClick={copy} style={{ padding:'11px 24px', background:copied?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${copied?'#1a4a2e':'rgba(255,255,255,0.08)'}`, borderRadius:12, color:copied?'#34d399':'#9ca3af', fontSize:14, cursor:'pointer', transition:'all .2s', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
            {copied ? '✓ Copied!' : 'Copy token'}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:'1.5rem' }}>
          {[
            { label:'Global',       value:roleCount('Global'),       color:'#e879f9', bg:'rgba(147,51,234,0.08)',  border:'rgba(147,51,234,0.35)', glow:'0 0 24px rgba(232,121,249,0.15)', icon:'✦' },
            { label:'Supervisors',  value:roleCount('Supervisor'),   color:'#60a5fa', bg:'rgba(96,165,250,0.06)',  border:'rgba(96,165,250,0.18)' },
            { label:'QA',           value:roleCount('QA'),           color:'#fbbf24', bg:'rgba(251,191,36,0.06)',  border:'rgba(251,191,36,0.18)' },
            { label:'Team Leaders', value:roleCount('Team Leader'),  color:'#34d399', bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.18)' },
            { label:'Total',        value:users.length,              color:'#f97316', bg:'rgba(249,115,22,0.08)',  border:'rgba(249,115,22,0.2)' },
          ].map((s,i)=>(
            <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:18, padding:'1.1rem', textAlign:'center', boxShadow:s.glow||'none', position:'relative', overflow:'hidden' }}>
              {s.icon && <div style={{ position:'absolute', top:8, right:10, fontSize:10, color:s.color, opacity:0.5 }}>{s.icon}</div>}
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:30, fontWeight:800, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {s.icon && <span style={{ fontSize:14, opacity:0.8 }}>{s.icon}</span>}
                {s.value}
              </div>
              <div style={{ fontSize:11, color:'#6b7280', marginTop:4, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div style={{ background:'linear-gradient(180deg,rgba(18,22,31,0.92),rgba(11,14,22,0.92))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, overflow:'hidden', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.03), 0 24px 50px rgba(0,0,0,0.28)' }}>

          {/* Table header */}
          <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:700 }}>Registered Users</span>
              <span style={{ color:'#f97316', fontSize:12, fontWeight:700 }}>({users.length})</span>
              {refreshing && <span style={{ fontSize:11, color:'#6b7280' }}>↻ syncing...</span>}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {/* Search */}
              <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ padding:'6px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#e5e7eb', fontSize:12, outline:'none', width:140 }}/>
              {/* Filters */}
              {[{key:'all',label:'All'},{key:'supervisor',label:'Supervisor'},{key:'qa',label:'QA'},{key:'leader',label:'Leader'},{key:'global',label:'✦ Global'}].map(f=>(
                <button key={f.key} onClick={()=>setFilter(f.key)} style={{ padding:'6px 13px', background:filter===f.key?'rgba(249,115,22,0.1)':'transparent', border:`1px solid ${filter===f.key?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.07)'}`, borderRadius:10, color:filter===f.key?'#f97316':'#6b7280', fontSize:11, cursor:'pointer', fontWeight:filter===f.key?700:400 }}>
                  {f.label}
                </button>
              ))}
              <button onClick={()=>fetchUsers(true)} disabled={refreshing} style={{ padding:'6px 13px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#6b7280', fontSize:11, cursor:'pointer', opacity:refreshing?0.5:1 }}>↺ Refresh</button>
            </div>
          </div>

          {loading && users.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'#6b7280' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'#6b7280' }}>No users found.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'rgba(0,0,0,0.3)' }}>
                    {['#','Name','Team','Role','Registered',''].map((h,i)=>(
                      <th key={i} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u,i)=>{
                    const isGlobal = u.role === 'Global'
                    const isNew    = i === 0
                    const dateStr  = fmtDate(u.date)
                    const timeStr  = fmtTime(u.time)
                    return (
                      <tr key={`${u.bookId||'x'}-${u.rowIndex||i}-${u.name}`}
                        style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background:isGlobal?'rgba(147,51,234,0.04)':isNew?'rgba(249,115,22,0.025)':'transparent', transition:'background .15s' }}
                        onMouseEnter={e=>!isGlobal&&(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                        onMouseLeave={e=>e.currentTarget.style.background=isGlobal?'rgba(147,51,234,0.04)':isNew?'rgba(249,115,22,0.025)':'transparent'}
                      >
                        <td style={{ padding:'13px 16px', color:'#4b5563', fontSize:12 }}>{i+1}</td>
                        <td style={{ padding:'13px 16px' }}>
                          <span style={{ fontWeight:600, color:isGlobal?'#e879f9':'#f1f5f9' }}>{u.name}</span>
                          {isNew && <span style={{ marginLeft:8, fontSize:9, background:'rgba(249,115,22,0.1)', color:'#f97316', border:'1px solid rgba(249,115,22,0.3)', borderRadius:4, padding:'1px 6px', fontWeight:700, letterSpacing:'0.05em' }}>NEW</span>}
                          {isGlobal && <span style={{ marginLeft:6, fontSize:10, color:'#9333ea' }}>✦</span>}
                        </td>
                        <td style={{ padding:'13px 16px', color:'#9ca3af', fontSize:13 }}>{u.team}</td>
                        <td style={{ padding:'13px 16px' }}><RoleBadge role={u.role}/></td>
                        <td style={{ padding:'13px 16px', color:'#6b7280', fontSize:12, whiteSpace:'nowrap' }}>
                          {dateStr}
                          {timeStr && <span style={{ color:'#4b5563', marginLeft:6 }}>{timeStr}</span>}
                        </td>
                        <td style={{ padding:'13px 16px', textAlign:'right' }}>
                          <button onClick={e=>openMenu(e,i)} style={{ background:'transparent', border:'none', color:'#4b5563', fontSize:18, cursor:'pointer', padding:'0 4px', letterSpacing:2, lineHeight:1, transition:'color .15s' }}
                            onMouseEnter={e=>e.currentTarget.style.color='#f97316'}
                            onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}
                          >···</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}