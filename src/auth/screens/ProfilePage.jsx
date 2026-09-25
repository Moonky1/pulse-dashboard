import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatPulseDate } from '../../admin/adminViewModel.js'
import { AvatarControls } from '../../components/AvatarControls.jsx'
import { StaffAvatar } from '../../components/StaffAvatar.jsx'
import { supabase } from '../../utils/supabase.js'
import { useAuth } from '../AuthProvider.jsx'
import { ProductTopbar } from '../components/ProductNavigation.jsx'
import './productSurface.css'

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [placement, setPlacement] = useState({ key: null, department: null, team: null, error: false })
  const placementKey = `${profile?.department_id ?? ''}:${profile?.team_id ?? ''}`
  useEffect(() => {
    let current = true
    const department = profile?.department_id
      ? supabase.from('departments').select('name').eq('id', profile.department_id).maybeSingle()
      : Promise.resolve({ data: null })
    const team = profile?.team_id
      ? supabase.from('teams').select('name').eq('id', profile.team_id).maybeSingle()
      : Promise.resolve({ data: null })
    void Promise.all([department, team]).then(([departmentResult, teamResult]) => {
      if (current) setPlacement({ key: placementKey, department: departmentResult.data?.name ?? null, team: teamResult.data?.name ?? null, error: Boolean(departmentResult.error || teamResult.error) })
    }).catch(() => { if (current) setPlacement({ key: placementKey, department: null, team: null, error: true }) })
    return () => { current = false }
  }, [profile?.department_id, profile?.team_id, placementKey])
  const name = profile?.display_name || profile?.full_name
  const placementLabel = placement.key !== placementKey ? 'Loading work details…' : placement.error ? 'Work details unavailable' : [placement.team, placement.department].filter(Boolean).join(' · ') || 'Work placement not assigned'
  const value = (field) => placement.key !== placementKey ? 'Loading…' : placement.error ? 'Unavailable' : placement[field] || 'Not assigned'
  return <div className="product-surface"><ProductTopbar /><main className="product-content product-profile">
    <Link className="product-back" to="/workspace">← Workspace</Link>
    <section className="product-profile__hero"><div className="product-profile__avatar"><StaffAvatar name={name} customAvatarPath={profile?.custom_avatar_path} googleAvatarUrl={profile?.google_avatar_url} avatarUpdatedAt={profile?.avatar_updated_at} size="lg" eager /><AvatarControls compact onChanged={refreshProfile} /></div><div><p className="product-kicker">Staff profile</p><h1>{name}</h1>{profile?.display_name && profile.display_name !== profile.full_name && <p className="product-profile__legal">{profile.full_name}</p>}<p className="product-profile__placement">{placementLabel}</p><span className="product-status product-status--connected">Active</span></div><span className="product-profile__employee">{profile?.employee_id}</span></section>
    <div className="product-profile__grid"><section className="product-panel"><p className="product-kicker">At Pulse</p><h2>Work profile</h2><dl><div><dt>Department</dt><dd>{value('department')}</dd></div><div><dt>Team</dt><dd>{value('team')}</dd></div><div><dt>Joined Pulse</dt><dd>{formatPulseDate(profile?.pulse_joined_on)}</dd></div></dl></section><section className="product-panel"><p className="product-kicker">Identity</p><h2>Contact</h2><dl><div><dt>Full name</dt><dd>{profile?.full_name}</dd></div><div><dt>Email</dt><dd>{profile?.email}</dd></div><div><dt>Employee ID</dt><dd>{profile?.employee_id || 'Pending'}</dd></div></dl><Link className="product-text-link" to="/settings">Account settings <span aria-hidden="true">↗</span></Link></section></div>
  </main></div>
}
