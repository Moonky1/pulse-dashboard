import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './settings.css'

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwmiLdRPyx6IU65p8nW7A3lEncOBr74XIsP-9nsRkxZe2-GF6sqZgvfeS82EK_cTnve/exec'

// Compress image to max 200px and ~80% quality before storing
function compressImage(file, maxPx = 80, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale  = Math.min(maxPx / img.width, maxPx / img.height, 1)
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function savePhotoToSheets(userName, photoB64) {
  try {
    const params = new URLSearchParams()
    params.append('action', 'saveUserPhoto')
    params.append('userName', userName)
    params.append('photo', photoB64)
    await fetch(SCRIPT_URL, { method:'POST', body: params, mode:'no-cors' })
  } catch(e) { console.warn('savePhotoToSheets failed:', e) }
}

async function loadPhotoFromSheets(userName) {
  try {
    const url  = `${SCRIPT_URL}?action=getUserPhoto&userName=${encodeURIComponent(userName)}`
    const res  = await fetch(url)
    const data = await res.json()
    return data.photo || null
  } catch(e) { return null }
}

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/signin'); return }
    // Load photo from Sheets on mount (sync across devices)
    loadPhotoFromSheets(user.name).then(p => {
      if (p && p !== localStorage.getItem('pulse_user_photo')) {
        setPhoto(p)
        localStorage.setItem('pulse_user_photo', p)
      }
    })
  }, [])

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Photo too large. Max 5MB.'); return }
    setUploadingPhoto(true)
    setSaveMsg('⏳ Uploading photo...')
    try {
      const compressed = await compressImage(file, 80, 0.75)
      setPhoto(compressed)
      localStorage.setItem('pulse_user_photo', compressed)
      await savePhotoToSheets(user.name, compressed)
      setSaveMsg('✅ Photo updated on all your devices!')
    } catch(err) {
      setSaveMsg('❌ Upload failed. Try a smaller image.')
    }
    setUploadingPhoto(false)
    setTimeout(() => setSaveMsg(''), 3500)
  }

  const removePhoto = async () => {
    setPhoto('')
    localStorage.removeItem('pulse_user_photo')
    await savePhotoToSheets(user.name, '')
    setSaveMsg('Photo removed.')
    setTimeout(() => setSaveMsg(''), 2000)
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
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const unregisterExt = () => {
    if (!confirm('Remove your agent ID?')) return
    const updated = { ...user }
    delete updated.agentExt
    localStorage.setItem('pulse_user', JSON.stringify(updated))
    setAgentExt(''); setExtInput(''); setExtSaved(false)
    setSaveMsg('Agent ID removed.')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  return (
    <div className="settings-root">
      <nav className="settings-nav">
        <div className="settings-nav-brand" onClick={() => navigate('/dashboard')} style={{cursor:'pointer'}}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="#f97316"/>
            <polyline points="4,16 9,16 11,9 14,23 17,12 20,16 28,16" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Pulse</span>
        </div>
        <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </nav>

      <div className="settings-body">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Your photo syncs across all devices automatically.</p>
        </div>

        {saveMsg && <div className="settings-toast">{saveMsg}</div>}

        {/* Profile photo */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🖼️</div>
            <div>
              <div className="settings-card-title">Profile Photo</div>
              <div className="settings-card-sub">Syncs across all devices. Compressed automatically.</div>
            </div>
          </div>
          <div className="settings-photo-row">
            <div className="settings-photo-preview">
              {photo
                ? <img src={photo} alt="avatar" className="settings-photo-img"/>
                : <div className="settings-photo-placeholder">{user?.name?.[0]?.toUpperCase()}</div>}
            </div>
            <div className="settings-photo-actions">
              <button className="settings-btn primary" onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}>
                {uploadingPhoto ? '⏳ Uploading...' : photo ? '🔄 Change Photo' : '📷 Upload Photo'}
              </button>
              {photo && !uploadingPhoto && <button className="settings-btn danger" onClick={removePhoto}>Remove</button>}
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange}/>
            </div>
            <div style={{fontSize:11,color:'#4b5563',marginTop:4}}>Max 5MB · Auto-compressed to 200px</div>
          </div>
        </div>

        {/* Agent ID */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">🎯</div>
            <div>
              <div className="settings-card-title">Agent ID</div>
              <div className="settings-card-sub">Link your extension to see your personal stats and share your profile.</div>
            </div>
          </div>

          {extSaved ? (
            <div className="settings-ext-registered">
              <div className="settings-ext-badge">#{agentExt}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:'#e5e7eb',fontWeight:600}}>Registered as Agent #{agentExt}</div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>Your profile is available at pulse-kk.com/profile/{agentExt}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="settings-btn primary" onClick={() => navigate(`/profile/${agentExt}`)}>👤 View Profile</button>
                <button className="settings-btn ghost" onClick={unregisterExt}>Change</button>
              </div>
            </div>
          ) : (
            <div className="settings-ext-form">
              <div className="settings-ext-info">
                <span style={{fontSize:20}}>💡</span>
                <p>Enter your 4-digit extension (e.g. <strong>1005</strong> or <strong>3024</strong>) to link your account to your performance data.</p>
              </div>
              <div className="settings-ext-input-row">
                <span className="settings-ext-hash">#</span>
                <input type="number" className="settings-ext-input" placeholder="Your ext"
                  value={extInput} onChange={e => setExtInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') setConfirmReg(true) }}/>
                <button className="settings-btn primary" onClick={() => setConfirmReg(true)} disabled={!extInput.trim()}>Register</button>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
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

      {confirmReg && (
        <div className="settings-overlay" onClick={() => setConfirmReg(false)}>
          <div className="settings-confirm-modal" onClick={e => e.stopPropagation()}>
            <div style={{fontSize:40,marginBottom:12}}>🎯</div>
            <h3>Register as Agent #{extInput}?</h3>
            <p>This links your account to extension <strong>#{extInput}</strong>. You can change this anytime.</p>
            <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:20}}>
              <button className="settings-btn ghost" onClick={() => setConfirmReg(false)}>Cancel</button>
              <button className="settings-btn primary" onClick={registerExt}>Yes, register me</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}