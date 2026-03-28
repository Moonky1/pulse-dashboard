import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const user     = JSON.parse(localStorage.getItem('pulse_user')||'null')
  const fileRef  = useRef(null)

  const [photo, setPhoto]         = useState(localStorage.getItem('pulse_user_photo')||'')
  const [agentExt, setAgentExt]   = useState(user?.agentExt||'')
  const [extInput, setExtInput]   = useState(user?.agentExt||'')
  const [extSaved, setExtSaved]   = useState(!!user?.agentExt)
  const [saveMsg, setSaveMsg]     = useState('')
  const [confirmReg, setConfirmReg] = useState(false)

  useEffect(() => {
    if (!user) navigate('/signin')
  }, [])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Photo too large. Max 2MB.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result
      setPhoto(b64)
      localStorage.setItem('pulse_user_photo', b64)
      setSaveMsg('✅ Photo updated!')
      setTimeout(()=>setSaveMsg(''),2500)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhoto('')
    localStorage.removeItem('pulse_user_photo')
    setSaveMsg('Photo removed.')
    setTimeout(()=>setSaveMsg(''),2000)
  }

  const registerExt = () => {
    const val = extInput.trim()
    if (!val || isNaN(parseInt(val))) { alert('Enter a valid extension number.'); return }
    const updated = { ...user, agentExt: val }
    localStorage.setItem('pulse_user', JSON.stringify(updated))
    setAgentExt(val)
    setExtSaved(true)
    setConfirmReg(false)
    setSaveMsg(`✅ Agent ID #${val} registered!`)
    setTimeout(()=>setSaveMsg(''),3000)
  }

  const unregisterExt = () => {
    if (!confirm('Remove your agent ID? You can re-register any time.')) return
    const updated = { ...user }
    delete updated.agentExt
    localStorage.setItem('pulse_user', JSON.stringify(updated))
    setAgentExt('')
    setExtInput('')
    setExtSaved(false)
    setSaveMsg('Agent ID removed.')
    setTimeout(()=>setSaveMsg(''),2000)
  }

  return (
    <div className="settings-root">
      <nav className="settings-nav">
        <div className="settings-nav-brand" onClick={()=>navigate('/dashboard')} style={{cursor:'pointer'}}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="#f97316"/>
            <polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Pulse</span>
        </div>
        <button className="settings-back-btn" onClick={()=>navigate('/dashboard')}>← Dashboard</button>
      </nav>

      <div className="settings-body">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Manage your profile, photo and agent identity.</p>
        </div>

        {saveMsg && <div className="settings-toast">{saveMsg}</div>}

        {/* Profile photo */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🖼️</div>
            <div>
              <div className="settings-card-title">Profile Photo</div>
              <div className="settings-card-sub">This photo appears in the nav and on your profile page.</div>
            </div>
          </div>
          <div className="settings-photo-row">
            <div className="settings-photo-preview">
              {photo
                ? <img src={photo} alt="avatar" className="settings-photo-img"/>
                : <div className="settings-photo-placeholder">{user?.name?.[0]?.toUpperCase()}</div>}
            </div>
            <div className="settings-photo-actions">
              <button className="settings-btn primary" onClick={()=>fileRef.current?.click()}>
                {photo ? '🔄 Change Photo' : '📷 Upload Photo'}
              </button>
              {photo && <button className="settings-btn danger" onClick={removePhoto}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange}/>
            </div>
            <div style={{fontSize:11,color:'#4b5563',marginTop:4}}>Max 2MB · JPG, PNG, GIF, WEBP</div>
          </div>
        </div>

        {/* Agent ID */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🎯</div>
            <div>
              <div className="settings-card-title">Agent ID</div>
              <div className="settings-card-sub">Link your extension number to see your personal stats and share your profile.</div>
            </div>
          </div>

          {extSaved ? (
            <div className="settings-ext-registered">
              <div className="settings-ext-badge">#{agentExt}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:'#e5e7eb',fontWeight:600}}>Registered as Agent #{agentExt}</div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>Your personal stats are available at your profile page.</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="settings-btn primary" onClick={()=>navigate(`/profile/${agentExt}`)}>
                  👤 View Profile
                </button>
                <button className="settings-btn ghost" onClick={unregisterExt}>Change</button>
              </div>
            </div>
          ) : (
            <div className="settings-ext-form">
              <div className="settings-ext-info">
                <span style={{fontSize:20}}>💡</span>
                <p>Enter the 4-digit extension number you use as an agent (e.g., <strong>1005</strong> or <strong>2034</strong>). This links your account to your performance data.</p>
              </div>
              <div className="settings-ext-input-row">
                <span className="settings-ext-hash">#</span>
                <input
                  type="number"
                  className="settings-ext-input"
                  placeholder="Your ext (e.g. 1005)"
                  value={extInput}
                  onChange={e=>setExtInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') setConfirmReg(true) }}
                />
                <button className="settings-btn primary" onClick={()=>setConfirmReg(true)} disabled={!extInput.trim()}>
                  Register
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">👤</div>
            <div>
              <div className="settings-card-title">Account</div>
              <div className="settings-card-sub">Your Pulse account details.</div>
            </div>
          </div>
          <div className="settings-account-info">
            <div className="settings-info-row"><span>Name</span><span>{user?.name}</span></div>
            <div className="settings-info-row"><span>Team</span><span>{user?.team}</span></div>
            <div className="settings-info-row"><span>Role</span><span>{user?.role}</span></div>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmReg && (
        <div className="settings-overlay" onClick={()=>setConfirmReg(false)}>
          <div className="settings-confirm-modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:40,marginBottom:12}}>🎯</div>
            <h3>Register as Agent #{extInput}?</h3>
            <p>This will link your account to agent extension <strong>#{extInput}</strong>. You can change this anytime.</p>
            <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:20}}>
              <button className="settings-btn ghost" onClick={()=>setConfirmReg(false)}>Cancel</button>
              <button className="settings-btn primary" onClick={registerExt}>Yes, register me</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}