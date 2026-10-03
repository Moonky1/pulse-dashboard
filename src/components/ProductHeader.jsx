import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAdminAccess } from '../admin/hooks/useAdminAccess.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { PROFILE_PRESENCE_OPTIONS, updateOwnStaffProfile } from '../profile/staffProfileService.js'
import { supabase } from '../utils/supabase.js'
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
  const { authUser, profile, refreshProfile, signOut } = useAuth()
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState(false)
  const adminAccess = useAdminAccess()
  const { pathname } = useLocation()
  const fullName = profile?.display_name || profile?.full_name || 'Account'
  const presence = PROFILE_PRESENCE_OPTIONS.find((option) => option.value === profile?.profile_presence)?.value || ''
  const email = profile?.email || authUser?.email || 'Email unavailable'
  const avatarProps = {
    name: fullName,
    customAvatarPath: profile?.custom_avatar_path,
    googleAvatarUrl: profile?.google_avatar_url,
    avatarUpdatedAt: profile?.avatar_updated_at,
  }

  function guardNavigation(event) {
    if (!confirmLeave(event.currentTarget.getAttribute('href'))) event.preventDefault()
  }

  function productLink({ to, label }) {
    const current = pathname === to || pathname.startsWith(`${to}/`)
    return <Link key={to} to={to} onClick={guardNavigation} aria-current={current ? 'page' : undefined}>{label}</Link>
  }

  async function changeStatus(event) {
    const nextPresence = event.target.value
    setSavingStatus(true)
    setStatusError(false)
    try {
      const { error } = await updateOwnStaffProfile(supabase, {
        displayName: profile?.display_name || '',
        bio: profile?.profile_bio || '',
        presence: nextPresence,
        visibleToStaff: Boolean(profile?.profile_visible_to_staff),
      })
      if (error) throw error
      await refreshProfile()
    } catch {
      setStatusError(true)
    } finally {
      setSavingStatus(false)
    }
  }

  return <header className="pulse-product-header">
    <nav className="pulse-product-header__inner" aria-label="Pulse products">
      <div className="pulse-product-header__links pulse-product-header__links--left">{links.slice(0, 2).map(productLink)}</div>
      <Link className="pulse-product-header__brand" to="/workspace" onClick={guardNavigation} aria-label="Pulse Workspace"><PulseOrb size="sm" active /><span>Pulse</span></Link>
      <div className="pulse-product-header__links pulse-product-header__links--right">{links.slice(2).map(productLink)}</div>
    </nav>
    <details className="pulse-product-account">
      <summary aria-label={`Account menu for ${fullName}`}><span className="pulse-product-account__avatar"><StaffAvatar {...avatarProps} size="sm" />{presence && <i className={`pulse-product-account__dot pulse-product-account__dot--${presence}`} aria-hidden="true" />}</span><span className="pulse-product-account__name">{fullName}</span></summary>
      <div className="pulse-product-account__menu">
        <p className="pulse-product-account__label">Account</p>
        <div className="pulse-product-account__identity"><StaffAvatar {...avatarProps} size="md" /><span><strong>{fullName}</strong><small>{email}</small></span></div>
        <label className="pulse-product-account__status"><span className={`pulse-product-account__dot pulse-product-account__dot--${presence || 'none'}`} aria-hidden="true" /><span className="pulse-product-account__status-label">Status</span><select aria-label="Profile status" value={presence} disabled={savingStatus} onChange={(event) => { void changeStatus(event) }}>{PROFILE_PRESENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.value ? option.label : 'Set a status'}</option>)}</select></label>
        {statusError && <p className="pulse-product-account__error" role="alert">Status could not be saved. Try again.</p>}
        <nav className="pulse-product-account__items" aria-label="Account menu">
          <Link to="/settings/profile" onClick={guardNavigation}>Profile <span aria-hidden="true">↗</span></Link>
          <Link to="/settings" onClick={guardNavigation}>Settings <span aria-hidden="true">↗</span></Link>
          {adminAccess.state === 'allowed' && <Link to="/admin/users" onClick={guardNavigation}>Administration <span aria-hidden="true">↗</span></Link>}
        </nav>
        <Button type="button" variant="ghost" onClick={() => { if (confirmLeave('signout')) void signOut() }}>Sign out</Button>
      </div>
    </details>
  </header>
}
