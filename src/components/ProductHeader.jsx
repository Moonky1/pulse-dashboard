import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider.jsx'
import { AvatarControls } from './AvatarControls.jsx'
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
      <summary><StaffAvatar {...avatarProps} size="sm" /><span className="pulse-product-account__name">{fullName}</span><span className="pulse-product-account__chevron" aria-hidden="true">⌄</span></summary>
      <div className="pulse-product-account__menu">
        <p className="pulse-product-account__label">Account</p>
        <div className="pulse-product-account__identity"><StaffAvatar {...avatarProps} size="md" /><strong>{fullName}</strong></div>
        <AvatarControls compact />
        <Button type="button" variant="ghost" onClick={() => { if (confirmLeave()) void signOut() }}>Sign out</Button>
      </div>
    </details>
  </header>
}
