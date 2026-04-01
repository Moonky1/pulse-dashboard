import { useEffect, useState } from 'react'
import { generateToken, secondsUntilNext } from '../utils/token'

const ADMIN_PASSWORD = 'pulse2026kk'
const SHEET_ID = '1d6j3FEPnFzE-fAl0K6O43apdbNvB0NzbLSJLEJF-TxI'
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyapspKt5ImZnXuGneBlVSftTjYfRzXLEPeSTCWMnhmY_mcx9i1Cl0y4oQv5Q9KmtRE/exec'
const ADMIN_AUTH_KEY = 'pulse_admin_auth'

const ROLE_COLORS = {
  'Supervisor':  { bg: '#0d1a2a', border: '#1a3a5a', color: '#60a5fa' },
  'QA':          { bg: '#1a1a0d', border: '#4a4a1a', color: '#fbbf24' },
  'Team Leader': { bg: '#0d2018', border: '#1a4a2e', color: '#34d399' },
}

const TEAMS = ['Philippines', 'Venezuela', 'Colombia', 'Mexico Baja', 'Central America', 'Asia']
const ROLES = ['Supervisor', 'QA', 'Team Leader']

export default function Admin() {
  // Persist auth in sessionStorage so it survives page refresh within the session
  const [auth, setAuth]         = useState(() => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true')
  const [pw, setPw]             = useState('')
  const [pwError, setPwError]   = useState('')
  const [token, setToken]       = useState(generateToken())
  const [seconds, setSeconds]   = useState(secondsUntilNext())
  const [copied, setCopied]     = useState(false)
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPos, setMenuPos]   = useState({ x: 0, y: 0 })
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({ name:'', team:'', role:'' })
  const [saving, setSaving]     = useState(false)

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuth(true)
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
      setPwError('')
    } else {
      setPwError('Wrong password')
      setPw('')
    }
  }

  const handleLock = () => {
    setAuth(false)
    sessionStorage.removeItem(ADMIN_AUTH_KEY)
    setPw('')
  }

  useEffect(() => {
    if (!auth) return
    const iv = setInterval(() => { setToken(generateToken()); setSeconds(secondsUntilNext()) }, 1000)
    return () => clearInterval(iv)
  }, [auth])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Fetch via Apps Script to bypass sheet protection
      const url = `${SCRIPT_URL}?sheetName=Sheet1&sheetId=${SHEET_ID}&t=${Date.now()}`
      const res  = await fetch(url)
      const data = await res.json()
      if (!Array.isArray(data) || data.length < 2) throw new Error('No data')
      const rows = data.slice(1)
        .map(row => ({
          name: String(row[0]||'').trim(),
          team: String(row[1]||'').trim(),
          role: String(row[2]||'').trim(),
          date: String(row[3]||'').trim(),
          time: String(row[4]||'').trim(),
        }))
        .filter(r => r.name && r.name !== 'Name' && r.name !== '')
      setUsers(rows.reverse())
    } catch(e) {
      console.error('fetchUsers error:', e)
      // Fallback to direct CSV
      try {
        const url2 = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1&t=${Date.now()}`
        const res2 = await fetch(url2)
        const text = await res2.text()
        const rows2 = text.trim().split('\n').slice(1)
          .map(row => {
            const cols = row.split(',').map(c => c.replace(/"/g,'').trim())
            return { name: cols[0], team: cols[1], role: cols[2], date: cols[3], time: cols[4] }
          })
          .filter(r => r.name && r.name !== 'Name' && r.name !== '')
        setUsers(rows2.reverse())
      } catch(e2) { console.error(e2) }
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!auth) return
    fetchUsers()
    const iv = setInterval(fetchUsers, 30000)
    return () => clearInterval(iv)
  }, [auth])

  const copy = () => { navigator.clipboard.writeText(token); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  const pct = ((300 - seconds) / 300) * 100
  const filtered = filter === 'all' ? users : users.filter(u => u.role?.toLowerCase().includes(filter))
  const roleCount = (role) => users.filter(u => u.role === role).length

  const openMenu = (e, i) => {
    e.stopPropagation()
    if (menuOpen === i) { setMenuOpen(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ x: rect.right, y: rect.bottom })
    setMenuOpen(i)
  }

  const openEdit = (user) => {
    setEditUser(user)
    setEditForm({ name: user.name, team: user.team, role: user.role })
    setMenuOpen(null)
  }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const url = `${SCRIPT_URL}?action=edit&oldName=${encodeURIComponent(editUser.name)}&name=${encodeURIComponent(editForm.name)}&team=${encodeURIComponent(editForm.team)}&role=${encodeURIComponent(editForm.role)}`
      await fetch(url, { mode: 'no-cors' })
      await fetchUsers()
      setEditUser(null)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  if (!auth) {
    return (
      <div style={{ minHeight:'100vh', background:'#080a0f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ background:'#181b23', border:'0.5px solid #2a2d38', borderRadius:16, padding:'2.5rem 2rem', width:'100%', maxWidth:340, textAlign:'center' }}>
          <div style={{ width:52, height:52, background:'#f97316', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:18, color:'#f5f5f5', marginBottom:4 }}>Pulse Admin</div>
          <p style={{ fontSize:12, color:'#6b7280', marginBottom:24 }}>Enter your password to continue</p>
          <input type="password" placeholder="Password" value={pw}
            onChange={e => { setPw(e.target.value); setPwError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width:'100%', padding:'12px 16px', background:'#0d0f14', border:`0.5px solid ${pwError?'#f87171':'#2a2d38'}`, borderRadius:10, color:'#f5f5f5', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}
            autoFocus/>
          {pwError && <p style={{ color:'#f87171', fontSize:12, marginBottom:12 }}>{pwError}</p>}
          <button onClick={handleLogin} style={{ width:'100%', padding:12, background:'#f97316', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Enter →</button>
          <p style={{ marginTop:'1.5rem', fontSize:11, color:'#374151' }}>/admin — keep this URL private</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080a0f', fontFamily:"'DM Sans',sans-serif", color:'#f5f5f5' }}
      onClick={() => setMenuOpen(null)}>

      {editUser && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }}>
          <div style={{ background:'#181b23', border:'0.5px solid #2a2d38', borderRadius:16, padding:'2rem', width:'100%', maxWidth:380, boxShadow:'0 24px 48px rgba(0,0,0,0.8)' }}
            onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Sora',sans-serif", marginBottom:'1.5rem', fontSize:16, color:'#f5f5f5' }}>Edit User</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Name</label>
                <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
                  style={{ width:'100%', marginTop:6, padding:'10px 14px', background:'#0d0f14', border:'0.5px solid #2a2d38', borderRadius:8, color:'#f5f5f5', fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Team</label>
                <select value={editForm.team} onChange={e=>setEditForm(f=>({...f,team:e.target.value}))}
                  style={{ width:'100%', marginTop:6, padding:'10px 14px', background:'#0d0f14', border:'0.5px solid #2a2d38', borderRadius:8, color:'#f5f5f5', fontSize:14, outline:'none', boxSizing:'border-box' }}>
                  {TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Role</label>
                <select value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}
                  style={{ width:'100%', marginTop:6, padding:'10px 14px', background:'#0d0f14', border:'0.5px solid #2a2d38', borderRadius:8, color:'#f5f5f5', fontSize:14, outline:'none', boxSizing:'border-box' }}>
                  {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:'1.5rem' }}>
              <button onClick={()=>setEditUser(null)}
                style={{ flex:1, padding:10, background:'transparent', border:'0.5px solid #2a2d38', borderRadius:8, color:'#6b7280', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving}
                style={{ flex:1, padding:10, background:'#f97316', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.7:1 }}>
                {saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && (
        <div onClick={e=>e.stopPropagation()}
          style={{ position:'fixed', top:menuPos.y+4, left:menuPos.x-130, background:'#1e2230', border:'0.5px solid #2a2d38', borderRadius:8, zIndex:500, minWidth:130, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.7)' }}>
          <button onClick={() => openEdit(filtered[menuOpen])}
            style={{ width:'100%', padding:'10px 16px', background:'transparent', border:'none', color:'#f5f5f5', fontSize:13, cursor:'pointer', textAlign:'left' }}>✏️ Edit</button>
        </div>
      )}

      <div style={{ background:'#181b23', borderBottom:'0.5px solid #2a2d38', padding:'0 2rem', height:60, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:32, height:32, background:'#f97316', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'#f97316' }}>Pulse</span>
        <span style={{ fontSize:12, color:'#6b7280', background:'#1e2230', padding:'2px 10px', borderRadius:4, border:'0.5px solid #2a2d38' }}>Admin</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={()=>window.location.href='/dashboard'} style={{ padding:'6px 14px', background:'transparent', border:'0.5px solid #2a2d38', borderRadius:6, color:'#6b7280', fontSize:12, cursor:'pointer' }}>Dashboard</button>
          <button onClick={handleLock} style={{ padding:'6px 14px', background:'transparent', border:'0.5px solid #2a2d38', borderRadius:6, color:'#6b7280', fontSize:12, cursor:'pointer' }}>🔒 Lock</button>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'2rem' }}>
        <div style={{ background:'#181b23', border:'0.5px solid #2a2d38', borderRadius:16, padding:'1.5rem 2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'2rem', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <p style={{ fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Current Access Token</p>
            <div style={{ fontSize:44, fontFamily:"'Sora',sans-serif", fontWeight:800, letterSpacing:'0.2em', color:'#f97316' }}>{token}</div>
            <div style={{ background:'#2a2d38', borderRadius:4, height:4, marginTop:12, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:seconds<30?'#f87171':'#f97316', borderRadius:4, transition:'width 1s linear, background 0.3s' }}/>
            </div>
            <p style={{ fontSize:12, color:seconds<30?'#f87171':'#6b7280', marginTop:6 }}>Changes in {seconds}s</p>
          </div>
          <button onClick={copy}
            style={{ padding:'10px 24px', background:copied?'#0d2018':'transparent', border:`0.5px solid ${copied?'#1a4a2e':'#2a2d38'}`, borderRadius:10, color:copied?'#34d399':'#9ca3af', fontSize:14, cursor:'pointer', transition:'all 0.2s' }}>
            {copied ? '✓ Copied!' : 'Copy token'}</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'1.5rem' }}>
          {[
            { label:'Total',        value:users.length,            color:'#f97316', bg:'#1a1310', border:'#4a2e1a' },
            { label:'Supervisors',  value:roleCount('Supervisor'),  color:'#60a5fa', bg:'#0d1a2a', border:'#1a3a5a' },
            { label:'QA',           value:roleCount('QA'),          color:'#fbbf24', bg:'#1a1a0d', border:'#4a4a1a' },
            { label:'Team Leaders', value:roleCount('Team Leader'), color:'#34d399', bg:'#0d2018', border:'#1a4a2e' },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, border:`0.5px solid ${s.border}`, borderRadius:10, padding:'1rem', textAlign:'center' }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#181b23', border:'0.5px solid #2a2d38', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'0.5px solid #2a2d38', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontFamily:"'Sora',sans-serif", fontSize:14, fontWeight:600 }}>
              Registered Users <span style={{ color:'#f97316', fontSize:12 }}>({users.length})</span>
            </span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[{key:'all',label:'All'},{key:'supervisor',label:'Supervisor'},{key:'qa',label:'QA'},{key:'leader',label:'Team Leader'}].map(f => (
                <button key={f.key} onClick={()=>setFilter(f.key)}
                  style={{ padding:'4px 12px', background:filter===f.key?'#1a1310':'transparent', border:`0.5px solid ${filter===f.key?'#f97316':'#2a2d38'}`, borderRadius:6, color:filter===f.key?'#f97316':'#6b7280', fontSize:11, cursor:'pointer' }}>
                  {f.label}
                </button>
              ))}
              <button onClick={fetchUsers} style={{ padding:'4px 12px', background:'transparent', border:'0.5px solid #2a2d38', borderRadius:6, color:'#6b7280', fontSize:11, cursor:'pointer' }}>↺ Refresh</button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'#6b7280' }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'#6b7280' }}>No users registered yet.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#0d0f14' }}>
                  {['#','Name','Team','Role','Date',''].map((h,i) => (
                    <th key={i} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'0.5px solid #2a2d38' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u,i) => {
                  const rc = ROLE_COLORS[u.role] || { bg:'transparent', border:'#2a2d38', color:'#9ca3af' }
                  return (
                    <tr key={i} style={{ borderBottom:'0.5px solid #1e2230' }}>
                      <td style={{ padding:'10px 16px', color:'#6b7280' }}>{i+1}</td>
                      <td style={{ padding:'10px 16px', fontWeight:500, color:'#f5f5f5' }}>{u.name}</td>
                      <td style={{ padding:'10px 16px', color:'#9ca3af' }}>{u.team}</td>
                      <td style={{ padding:'10px 16px' }}>
                        <span style={{ background:rc.bg, border:`0.5px solid ${rc.border}`, color:rc.color, padding:'2px 10px', borderRadius:4, fontSize:11, fontWeight:600 }}>{u.role}</span>
                      </td>
                      <td style={{ padding:'10px 16px', color:'#6b7280', fontSize:12 }}>{u.date}</td>
                      <td style={{ padding:'10px 16px', textAlign:'right' }}>
                        <button onClick={(e) => openMenu(e, i)}
                          style={{ background:'transparent', border:'none', color:'#6b7280', fontSize:18, cursor:'pointer', padding:'0 4px', letterSpacing:2, lineHeight:1 }}>···</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <p style={{ marginTop:'1.5rem', fontSize:11, color:'#374151', textAlign:'center' }}>/admin — keep this URL private</p>
      </div>
    </div>
  )
}