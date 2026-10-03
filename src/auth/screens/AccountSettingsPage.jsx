import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { useAdminAccess } from '../../admin/hooks/useAdminAccess.js'
import { AvatarControls } from '../../components/AvatarControls.jsx'
import { ProductHeader } from '../../components/ProductHeader.jsx'
import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { normalizeStaffProfileDraft, PROFILE_PRESENCE_OPTIONS, updateOwnStaffProfile, validateStaffProfileDraft } from '../../profile/staffProfileService.js'
import { supabase } from '../../utils/supabase.js'
import { useAuth } from '../AuthProvider.jsx'
import './AccountSettingsPage.css'

function draftFromProfile(profile) {
  return {
    displayName: profile?.display_name || '',
    bio: profile?.profile_bio || '',
    presence: profile?.profile_presence || '',
    visibleToStaff: Boolean(profile?.profile_visible_to_staff),
  }
}

function AccountLayout({ children, confirmLeave }) {
  const { pathname } = useLocation()
  return <div className="pulse-product-surface pulse-account-page">
    <ProductHeader confirmLeave={confirmLeave} />
    <main className="pulse-account-page__main">
      <div className="pulse-account-page__hero"><p>KAMPAIGN KINGS · PULSE</p><h1>Your account</h1><span>Make Pulse feel like yours.</span></div>
      <nav className="pulse-account-page__tabs" aria-label="Settings sections">
        <Link to="/settings" onClick={(event) => { if (!confirmLeave()) event.preventDefault() }} aria-current={pathname === '/settings' ? 'page' : undefined}>Overview</Link>
        <Link to="/settings/profile" onClick={(event) => { if (!confirmLeave()) event.preventDefault() }} aria-current={pathname === '/settings/profile' ? 'page' : undefined}>Profile</Link>
      </nav>
      {children}
    </main>
  </div>
}

function AccountOverview() {
  const { profile } = useAuth()
  const adminAccess = useAdminAccess()
  const name = profile?.display_name || profile?.full_name || 'Account'
  return <div className="pulse-account-page__overview">
    <section className="pulse-account-card pulse-account-card--intro">
      <StaffAvatar name={name} customAvatarPath={profile?.custom_avatar_path} googleAvatarUrl={profile?.google_avatar_url} avatarUpdatedAt={profile?.avatar_updated_at} size="lg" />
      <div><p className="pulse-account-card__eyebrow">PROFILE</p><h2>{name}</h2><p>Choose how your name, photo and optional details appear in Pulse.</p><Link to="/settings/profile">Edit profile <span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="pulse-account-card pulse-account-card--details">
      <p className="pulse-account-card__eyebrow">ACCOUNT DETAILS</p>
      <h2>Signed in to Pulse</h2>
      <dl><div><dt>Work email</dt><dd>{profile?.email}</dd></div><div><dt>Profile visibility</dt><dd>{profile?.profile_visible_to_staff ? 'Signed-in Staff' : 'Only you'}</dd></div></dl>
      {adminAccess.state === 'allowed' && <Link to="/admin/users">Administration <span aria-hidden="true">↗</span></Link>}
    </section>
  </div>
}

function AccountProfileEditor() {
  const { profile, refreshProfile } = useAuth()
  const [draft, setDraft] = useState(() => draftFromProfile(profile))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const current = normalizeStaffProfileDraft(draftFromProfile(profile))
  const proposed = normalizeStaffProfileDraft(draft)
  const dirty = JSON.stringify(current) !== JSON.stringify(proposed)
  const name = profile?.display_name || profile?.full_name || 'Account'
  const confirmLeave = () => !dirty || window.confirm('Leave without saving your profile changes?')

  function change(values) {
    setDraft((old) => ({ ...old, ...values }))
    setSaved(false)
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    const validation = validateStaffProfileDraft(draft)
    if (validation) { setError(validation); return }
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: mutationError } = await updateOwnStaffProfile(supabase, draft)
    if (mutationError) {
      setError('Your changes could not be saved. Please try again.')
      setSaving(false)
      return
    }
    await refreshProfile()
    setSaved(true)
    setSaving(false)
  }

  return <AccountLayout confirmLeave={confirmLeave}>
    <section className="pulse-account-card pulse-account-card--editor">
      <div className="pulse-account-card__heading"><p className="pulse-account-card__eyebrow">YOUR PROFILE</p><h2>A little more you</h2><p>Your full Staff record stays unchanged. Your display name is what people see in Pulse.</p></div>
      <div className="pulse-account-photo"><StaffAvatar name={name} customAvatarPath={profile?.custom_avatar_path} googleAvatarUrl={profile?.google_avatar_url} avatarUpdatedAt={profile?.avatar_updated_at} size="lg" /><div><h3>Profile photo</h3><p>Choose a photo or keep the one from Google.</p><AvatarControls /></div></div>
      <form className="pulse-account-form" onSubmit={(event) => { void save(event) }}>
        <label><span>Display name</span><input maxLength={80} value={draft.displayName} onChange={(event) => change({ displayName: event.target.value })} placeholder={profile?.full_name || 'Your name'} /><small>Leave blank to use your full Staff name.</small></label>
        <label><span>About you <em>optional</em></span><textarea rows={4} maxLength={280} value={draft.bio} onChange={(event) => change({ bio: event.target.value })} placeholder="A short introduction to your teammates" /><small>{draft.bio.length}/280 characters</small></label>
        <label><span>Profile status <em>optional</em></span><select value={draft.presence} onChange={(event) => change({ presence: event.target.value })}>{PROFILE_PRESENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>A label you choose, not a live availability indicator.</small></label>
        <label className="pulse-account-form__visibility"><input type="checkbox" checked={draft.visibleToStaff} onChange={(event) => change({ visibleToStaff: event.target.checked })} /><span><strong>Visible to signed-in Staff</strong><small>Only Staff with an active Pulse account can view your photo, name, bio and status. Off by default.</small></span></label>
        {profile?.profile_visible_to_staff && <Link className="pulse-account-form__view" to={`/staff/${profile.id}`} onClick={(event) => { if (!confirmLeave()) event.preventDefault() }}>View your Staff profile ↗</Link>}
        {error && <p className="pulse-account-form__error" role="alert">{error}</p>}
        {saved && <p className="pulse-account-form__saved" role="status">Profile saved.</p>}
        <div className="pulse-account-form__actions"><Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button></div>
      </form>
    </section>
  </AccountLayout>
}

export function AccountSettingsPage({ section = 'overview' }) {
  if (section === 'profile') return <AccountProfileEditor />
  return <AccountLayout confirmLeave={() => true}><AccountOverview /></AccountLayout>
}
