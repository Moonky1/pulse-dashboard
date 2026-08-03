import { supabase } from '../utils/supabase'

function normalizeOwnerPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function getStudioOwnerKey(user, role) {
  const name = normalizeOwnerPart(user?.name)
  const team = normalizeOwnerPart(user?.team)
  const roleId = normalizeOwnerPart(
    role?.id || user?.role
  )

  return [name, team, roleId]
    .filter(Boolean)
    .join('::')
}

export async function saveStudioGameDraft({
  gameId,
  user,
  role,
  form,
}) {
  const ownerKey = getStudioOwnerKey(user, role)

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const { data, error } = await supabase.rpc(
    'save_pulse_studio_game_draft',
    {
      p_id: gameId || null,
      p_title: form.title.trim(),
      p_description: form.description.trim(),
      p_language: form.language,
      p_team: form.team,
      p_visibility: form.visibility,
      p_cover_emoji: form.coverEmoji,
      p_owner_key: ownerKey,
      p_owner_name: user?.name || 'Pulse Creator',
      p_owner_role: role?.id || user?.role,
      p_owner_team: user?.team || 'global',
    }
  )

  if (error) {
    console.error(
      'Could not save Studio game:',
      error
    )

    throw new Error(
      error.message ||
        'Could not save the Studio game.'
    )
  }

  return String(data)
}