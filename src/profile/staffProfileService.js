export const PROFILE_PRESENCE_OPTIONS = Object.freeze([
  { value: '', label: 'No status' },
  { value: 'available', label: 'Available' },
  { value: 'focused', label: 'Focusing' },
  { value: 'away', label: 'Away' },
])

export function normalizeStaffProfileDraft(draft) {
  return {
    displayName: String(draft.displayName ?? '').trim(),
    bio: String(draft.bio ?? '').trim(),
    presence: String(draft.presence ?? '').trim(),
    visibleToStaff: Boolean(draft.visibleToStaff),
  }
}

export function validateStaffProfileDraft(draft) {
  const values = normalizeStaffProfileDraft(draft)
  if (values.displayName && (values.displayName.length < 2 || values.displayName.length > 80)) return 'Use 2–80 characters for your display name.'
  if (values.bio.length > 280) return 'Keep your bio within 280 characters.'
  if (!PROFILE_PRESENCE_OPTIONS.some((option) => option.value === values.presence)) return 'Choose a valid profile status.'
  return null
}

export function updateOwnStaffProfile(client, draft) {
  const values = normalizeStaffProfileDraft(draft)
  return client.rpc('update_own_staff_profile', {
    requested_display_name: values.displayName || null,
    requested_bio: values.bio || null,
    requested_presence: values.presence || null,
    requested_visible_to_staff: values.visibleToStaff,
  })
}

export async function getStaffPublicProfile(client, profileId) {
  const { data, error } = await client.rpc('get_staff_public_profile', { target_profile_id: profileId })
  return { data: Array.isArray(data) ? (data[0] ?? null) : data, error }
}
