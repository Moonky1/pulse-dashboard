import { createCompatibilityProfile } from './compatibilityProfile.js'

export async function loadLinkedStaffProfile(supabase) {
  const { data, error } = await supabase.functions.invoke('pulse-link-current-user', {
    body: {},
  })
  if (error || !data?.ok || !data.profile) {
    throw new Error('PROFILE_LINK_FAILED')
  }
  return createCompatibilityProfile(data.profile)
}

export async function authenticateLinkedStaff(supabase, email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, code: 'INVALID_CREDENTIALS' }

  try {
    return { ok: true, profile: await loadLinkedStaffProfile(supabase) }
  } catch {
    await supabase.auth.signOut()
    return { ok: false, code: 'PROFILE_NOT_LINKED' }
  }
}

