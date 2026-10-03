import { Link, useLocation } from 'react-router-dom'

import { useAdminAccess } from '../admin/hooks/useAdminAccess.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { StaffAvatar } from './StaffAvatar.jsx'
import { Button } from './ui/Button.jsx'
import { PulseOrb } from './ui/PulseOrb.jsx'
import './ProductHeader.css'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/go', label: 'GO' },
  { to: '/studio', label: 'Studio' },
  { to: '/academy', label: 'Academy' },
]

export function ProductHeader({ confirmLeave = () => true }) {
  const { profile, signOut } = useAuth()
  const adminAccess = useAdminAccess()
  const { pathname } = useLocation()
  const fullName = profile?.display_name || profile?.full_name || 'Account'
  const avatarProps = {
    name: fullName,
    customAvatarPath: profile?.custom_avatar_path,
    googleAvatarUrl: profile?.google_avatar_url,
    avatarUpdatedAt: profile?.avatar_updated_at,
  }

  function guardNavigation(event) {
    if (!confirmLeave()) event.preventDefault()
  }

  function productLink({ to, label }) {
    const current = pathname === to || pathname.startsWith(`${to}/`)
    return <Link key={to} to={to} onClick={guardNavigation} aria-current={current ? 'page' : undefined}>{label}</Link>
  }

  return <header className="pulse-product-header">
    <nav className="pulse-product-header__inner" aria-label="Pulse products">
      <div className="pulse-product-header__links pulse-product-header__links--left">{links.slice(0, 2).map(productLink)}</div>
      <Link className="pulse-product-header__brand" to="/workspace" onClick={guardNavigation} aria-label="Pulse Workspace"><PulseOrb size="sm" active /><span>Pulse</span></Link>
      <div className="pulse-product-header__links pulse-product-header__links--right">{links.slice(2).map(productLink)}</div>
    </nav>
    <details className="pulse-product-account">
      <summary aria-label={`Account menu for ${fullName}`}><StaffAvatar {...avatarProps} size="sm" /><span className="pulse-product-account__name">{fullName}</span></summary>
      <div className="pulse-product-account__menu">
        <p className="pulse-product-account__label">Account</p>
        <div className="pulse-product-account__identity"><StaffAvatar {...avatarProps} size="md" /><span><strong>{fullName}</strong><small>Manage your Pulse account</small></span></div>
        <nav className="pulse-product-account__items" aria-label="Account menu">
          <Link to="/settings/profile" onClick={guardNavigation}>Profile <span aria-hidden="true">↗</span></Link>
          <Link to="/settings" onClick={guardNavigation}>Settings <span aria-hidden="true">↗</span></Link>
          {adminAccess.state === 'allowed' && <Link to="/admin/users" onClick={guardNavigation}>Administration <span aria-hidden="true">↗</span></Link>}
        </nav>
        <Button type="button" variant="ghost" onClick={() => { if (confirmLeave()) void signOut() }}>Sign out</Button>
      </div>
    </details>
  </header>
}
