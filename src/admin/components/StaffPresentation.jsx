import { useEffect, useState } from 'react'
import { PROFILE_PRESENCE_OPTIONS } from '../../profile/staffProfileService.js'
import { loadStaffPresentation } from '../api/admin2Api.js'
import { supabase } from '../../utils/supabase.js'

export function StaffPresentation({ userId }) {
  const [state, setState] = useState(null)
  useEffect(() => {
    let active = true
    void loadStaffPresentation(supabase,userId).then(result => { if (active && !result.error) setState({ id: userId, ...result.data }) })
    return () => { active = false }
  }, [userId])
  if (state?.id !== userId) return null
  const presence = PROFILE_PRESENCE_OPTIONS.find(option => option.value === state.presence)
  return <>{presence?.value && <span className={`pulse-account-card__presence pulse-account-card__presence--${presence.value}`}>{presence.label}</span>}{state.bio && <p className="admin-profile-bio">{state.bio}</p>}</>
}
