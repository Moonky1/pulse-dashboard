import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './Navbar.css'

export default function Navbar({ lastUpdate }) {
  const navigate    = useNavigate()
  const location    = useLocation()
  const profileRef  = useRef(null)

  const user       = JSON.parse(localStorage.getItem('pulse_user') || 'null')
  const [userPhoto]    = useState(localStorage.getItem('pulse_user_photo') || '')
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [navScrolled,  setNavScrolled]  = useState(false)
  const [academyOpen,  setAcademyOpen]  = useState(false)

  const team      = APP_CONFIG.teams.find(t => t.id === user?.team)
  const roleLabel = user?.role === 'supervisor' ? 'Supervisor'
                  : user?.role === 'qa'         ? 'QA'
                  : user?.role === 'leader'      ? 'Team Leader'
                  : 'Member'

  const isActive = (path) =>
    path === '/dashboard' ? location.pathname === '/dashboard'
                          : location.pathname.startsWith(path)

  useEffect(() => {
    const h = () => setNavScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const logout = () => {
    localStorage.removeItem('pulse_user')
    window.location.href = '/'
  }

  return (
    <>
      <header className={`pnav ${navScrolled ? 'pnav-scrolled' : ''}`}>

        {/* ── Left: logo ── */}
        <div className="pnav-left">
          <button className="pnav-brand" onClick={() => navigate('/dashboard')}>
            <div className="pnav-logo">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <polyline
                  points="4,16 9,16 11,9 14,23 17,12 20,16 28,16"
                  stroke="white" strokeWidth="2.4" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="pnav-appname">Pulse</span>
          </button>
        </div>

        {/* ── Center: tabs ── */}
        <nav className="pnav-center">
          <div className="pnav-tabs">
            <button
              className={`pnav-tab ${isActive('/dashboard') ? 'pnav-tab-active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              Home
            </button>
            <button
              className={`pnav-tab ${isActive('/go') ? 'pnav-tab-active' : ''}`}
              onClick={() => navigate('/go')}
            >
              Pulse GO
            </button>
            <button
              className="pnav-tab"
              onClick={() => setAcademyOpen(true)}
            >
              Academy
            </button>
          </div>
        </nav>

        {/* ── Right: update time + profile ── */}
        <div className="pnav-right">
          {lastUpdate && (
            <span className="pnav-update">
              Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <div className="pnav-profile-wrap" ref={profileRef} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className={`pnav-user ${profileOpen ? 'pnav-user-open' : ''}`}
              onClick={() => setProfileOpen(o => !o)}
            >
              <div className="pnav-avatar">
                {userPhoto
                  ? <img src={userPhoto} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
                  : user?.name?.[0]?.toUpperCase()
                }
              </div>
              <div className="pnav-info">
                <span className="pnav-name">{user?.name}</span>
                <span className="pnav-role">{team?.name} · {roleLabel}</span>
              </div>
              <svg className="pnav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {profileOpen && (
              <div className="pnav-dropdown">
                <div className="pnd-header">
                  <div className="pnd-avatar">
                    {userPhoto
                      ? <img src={userPhoto} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
                      : user?.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div>
                    <div className="pnd-name">{user?.name}</div>
                    <div className="pnd-meta">{team?.name} · {roleLabel}</div>
                  </div>
                </div>

                <div className="pnd-divider"/>

                {user?.agentExt && (
                  <button className="pnd-item" onClick={() => { setProfileOpen(false); navigate(`/profile/${user.agentExt}`) }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    My Profile
                    <span className="pnd-ext">#{user.agentExt}</span>
                  </button>
                )}

                <button className="pnd-item" onClick={() => { setProfileOpen(false); navigate('/settings') }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  Settings
                </button>

                <div className="pnd-divider"/>

                <button className="pnd-item pnd-logout" onClick={() => { setProfileOpen(false); logout() }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Academy modal ── */}
      {academyOpen && (
        <div className="pnav-academy-overlay" onClick={() => setAcademyOpen(false)}>
          <div className="pnav-academy-modal" onClick={e => e.stopPropagation()}>
            <div className="pnav-academy-badge">Academy</div>
            <h3 className="pnav-academy-title">We're working on it.</h3>
            <p className="pnav-academy-copy">
              Pulse Academy will be available very soon with learning, guidance and internal training content.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
              <button className="pnav-academy-btn" onClick={() => setAcademyOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}