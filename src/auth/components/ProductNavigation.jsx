import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { useAuth } from '../AuthProvider.jsx'
import './productNavigation.css'

const APPLICATIONS = [
  { label: 'Dashboard', to: '/dashboard', match: '/dashboard' },
  { label: 'Pulse GO', to: '/go', match: '/go' },
  { label: 'Studio', to: '/studio', match: '/studio' },
  { label: 'Administration', to: '/admin', match: '/admin' },
]

export function ProductMark({ small = false }) {
  return <span className={`product-mark${small ? ' product-mark--small' : ''}`} aria-hidden="true"><i /></span>
}

export function AppNavigation({ confirmLeave = () => true }) {
  const { pathname } = useLocation()
  return <nav className="product-app-nav" aria-label="Pulse applications">
    {APPLICATIONS.map((app) => <Link key={app.to} to={app.to} aria-current={pathname.startsWith(app.match) ? 'page' : undefined} onClick={(event) => { if (!confirmLeave()) event.preventDefault() }}>{app.label}</Link>)}
  </nav>
}

export function AccountMenu({ confirmLeave = () => true }) {
  const { profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [openedAt, setOpenedAt] = useState(null)
  const open = openedAt === pathname
  const menuRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !menuRef.current?.contains(event.target))) setOpenedAt(null)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  const name = profile?.display_name || profile?.full_name || 'Account'
  const leave = (event) => { if (!confirmLeave()) event.preventDefault() }
  const signOutAndLeave = async () => {
    if (!confirmLeave()) return
    const { error } = await signOut()
    if (!error) navigate('/signin', { replace: true })
  }
  return <div className="product-account" ref={menuRef}>
    <button className="product-account__trigger" type="button" aria-label={`Account menu for ${name}`} aria-expanded={open} aria-controls="pulse-account-menu" onClick={() => setOpenedAt((current) => current === pathname ? null : pathname)}>
      <StaffAvatar name={name} customAvatarPath={profile?.custom_avatar_path} googleAvatarUrl={profile?.google_avatar_url} avatarUpdatedAt={profile?.avatar_updated_at} size="sm" eager />
      <span>{name}</span>
      <svg className="product-account__chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
    {open && <nav className="product-account__menu" id="pulse-account-menu" aria-label="Account">
      <div className="product-account__identity"><strong>{name}</strong><small>{profile?.email}</small></div>
      <Link to="/profile" onClick={(event) => { leave(event); if (!event.defaultPrevented) setOpenedAt(null) }}>Profile</Link>
      <Link to="/settings" onClick={(event) => { leave(event); if (!event.defaultPrevented) setOpenedAt(null) }}>Settings</Link>
      <button type="button" onClick={() => void signOutAndLeave()}>Sign out</button>
    </nav>}
  </div>
}

export function ProductTopbar({ confirmLeave = () => true }) {
  return <header className="product-topbar">
    <Link className="product-topbar__brand" to="/workspace" onClick={(event) => { if (!confirmLeave()) event.preventDefault() }} aria-label="Pulse workspace"><ProductMark small /><span>Pulse</span></Link>
    <AppNavigation confirmLeave={confirmLeave} />
    <AccountMenu confirmLeave={confirmLeave} />
  </header>
}
