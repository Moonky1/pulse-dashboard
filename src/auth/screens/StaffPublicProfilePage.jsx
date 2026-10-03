import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ProductHeader } from '../../components/ProductHeader.jsx'
import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { getStaffPublicProfile, PROFILE_PRESENCE_OPTIONS } from '../../profile/staffProfileService.js'
import { supabase } from '../../utils/supabase.js'
import './AccountSettingsPage.css'

export function StaffPublicProfilePage() {
  const { profileId } = useParams()
  const [result, setResult] = useState({ loading: true, profile: null, error: false })
  useEffect(() => {
    let current = true
    void getStaffPublicProfile(supabase, profileId).then(({ data, error }) => {
      if (current) setResult({ loading: false, profile: data, error: Boolean(error) })
    })
    return () => { current = false }
  }, [profileId])
  const profile = result.profile
  const presence = PROFILE_PRESENCE_OPTIONS.find((option) => option.value === profile?.presence)?.label
  return <div className="pulse-product-surface pulse-account-page">
    <ProductHeader />
    <main className="pulse-account-page__main pulse-account-page__main--public">
      {result.loading ? <p className="pulse-account-page__message" role="status">Loading profile…</p> : profile ? <section className="pulse-account-card pulse-account-card--public">
        <StaffAvatar name={profile.name} customAvatarPath={profile.custom_avatar_path} googleAvatarUrl={profile.google_avatar_url} avatarUpdatedAt={profile.avatar_updated_at} size="lg" />
        <p className="pulse-account-card__eyebrow">PULSE STAFF</p><h1>{profile.name}</h1>
        {presence && <span className={`pulse-account-card__presence pulse-account-card__presence--${profile.presence}`}>{presence}</span>}
        {profile.bio && <p className="pulse-account-card__bio">{profile.bio}</p>}
        <p className="pulse-account-card__privacy">Visible only to signed-in Staff.</p>
      </section> : <section className="pulse-account-card pulse-account-card--public"><h1>Profile unavailable</h1><p>{result.error ? 'Pulse could not load this profile right now.' : 'This Staff profile is private or does not exist.'}</p></section>}
      <Link className="pulse-account-page__back" to="/workspace">Back to Pulse ↗</Link>
    </main>
  </div>
}
