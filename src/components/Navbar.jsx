import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../config'
import './navbar.css'

export default function Navbar({ lastUpdate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)

  const user = JSON.parse(localStorage.getItem('pulse_user') || 'null')

  const [userPhoto] = useState(localStorage.getItem('pulse_user_photo') || '')
  const [profileOpen, setProfileOpen] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)

  const team = APP_CONFIG.teams.find((t) => t.id === user?.team)

  const roleLabel =
    user?.role === 'supervisor'
      ? 'Supervisor'
      : user?.role === 'qa'
        ? 'QA'
        : user?.role === 'leader'
          ? 'Team Leader'
          : 'Member'

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 10)

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const logout = () => {
    localStorage.removeItem('pulse_user')
    window.location.href = '/'
  }

  return (
    <header className={`pnav ${navScrolled ? 'pnav-scrolled' : ''}`}>
      <div className="pnav-left">
        <button type="button" className="pnav-brand" onClick={() => navigate('/dashboard')}>
          <div className="pnav-logo" aria-hidden="true">
            <span className="pnav-logo-ring pnav-logo-ring-1" />
            <span className="pnav-logo-ring pnav-logo-ring-2" />
            <span className="pnav-logo-ring pnav-logo-ring-3" />
          </div>

          <span className="pnav-appname">Pulse</span>
        </button>
      </div>

      <nav className="pnav-center" aria-label="Pulse navigation">
        <div className="pnav-tabs">
          <button
            type="button"
            className={`pnav-tab ${isActive('/dashboard') ? 'pnav-tab-active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            Home
          </button>

          <button
            type="button"
            className={`pnav-tab ${isActive('/go') ? 'pnav-tab-active' : ''}`}
            onClick={() => navigate('/go')}
          >
            Pulse GO
          </button>

          <button
            type="button"
            className={`pnav-tab ${isActive('/academy') ? 'pnav-tab-active' : ''}`}
            onClick={() => navigate('/academy')}
          >
            Academy
          </button>
        </div>
      </nav>

      <div className="pnav-right">
        {lastUpdate && (
          <span className="pnav-update">
            Updated{' '}
            {lastUpdate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}

        <div className="pnav-profile-wrap" ref={profileRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`pnav-user ${profileOpen ? 'pnav-user-open' : ''}`}
            onClick={() => setProfileOpen((open) => !open)}
          >
            <div className="pnav-avatar">
              {userPhoto ? (
                <img src={userPhoto} alt="" />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'P'
              )}
            </div>

            <div className="pnav-info">
              <span className="pnav-name">{user?.name || 'Pulse'}</span>
              <span className="pnav-role">
                {team?.name || 'Team'} · {roleLabel}
              </span>
            </div>

            <svg className="pnav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {profileOpen && (
            <div className="pnav-dropdown">
              <div className="pnd-header">
                <div className="pnd-avatar">
                  {userPhoto ? (
                    <img src={userPhoto} alt="" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() || 'P'
                  )}
                </div>

                <div>
                  <div className="pnd-name">{user?.name || 'Pulse'}</div>
                  <div className="pnd-meta">
                    {team?.name || 'Team'} · {roleLabel}
                  </div>
                </div>
              </div>

              <div className="pnd-divider" />

              {user?.agentExt && (
                <button
                  type="button"
                  className="pnd-item"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate(`/profile/${user.agentExt}`)
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>

                  My Profile
                  <span className="pnd-ext">#{user.agentExt}</span>
                </button>
              )}

              <button
                type="button"
                className="pnd-item"
                onClick={() => {
                  setProfileOpen(false)
                  navigate('/settings')
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>

                Settings
              </button>

              <div className="pnd-divider" />

              <button
                type="button"
                className="pnd-item pnd-logout"
                onClick={() => {
                  setProfileOpen(false)
                  logout()
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>

                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}