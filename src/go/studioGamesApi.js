import { supabase } from '../utils/supabase'

function normalizeOwnerPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function mapStudioGame(row) {
  return {
    id: row.id,

    title: row.title || 'Untitled Game',
    description: row.description || '',

    language: row.language || 'en',
    team: row.team || 'global',
    visibility: row.visibility || 'private',
    status: row.status || 'draft',

    coverEmoji: row.cover_emoji || '🎮',

    ownerKey: row.owner_key || '',
    ownerName:
      row.owner_name || 'Pulse Creator',

    ownerRole:
      row.owner_role || 'leader',

    ownerTeam:
      row.owner_team ||
      row.team ||
      'global',

    currentStep: Number(
      row.current_step || 1
    ),

    defaultTimer: Number(
      row.default_timer || 30
    ),

    pointsPerQuestion: Number(
      row.points_per_question || 1000
    ),

    randomizeQuestions: Boolean(
      row.randomize_questions
    ),

    randomizeAnswers: Boolean(
      row.randomize_answers
    ),

    showExplanations:
      row.show_explanations !== false,

    playCount: Number(
      row.play_count || 0
    ),

    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    publishedAt:
      row.published_at || null,
  }
}

export function getStudioOwnerKey(
  user,
  role
) {
  const name = normalizeOwnerPart(
    user?.name
  )

  const team = normalizeOwnerPart(
    user?.team
  )

  const roleId = normalizeOwnerPart(
    role?.id || user?.role
  )

  return [name, team, roleId]
    .filter(Boolean)
    .join('::')
}

export async function getStudioMyGames({
  user,
  role,
}) {
  const ownerKey = getStudioOwnerKey(
    user,
    role
  )

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const { data, error } =
    await supabase.rpc(
      'get_pulse_studio_my_games',
      {
        p_owner_key: ownerKey,
      }
    )

  if (error) {
    console.error(
      'Could not load Studio games:',
      error
    )

    throw new Error(
      error.message ||
        'Could not load your Studio games.'
    )
  }

  return Array.isArray(data)
    ? data.map(mapStudioGame)
    : []
}

export async function saveStudioGameDraft({
  gameId,
  user,
  role,
  form,
}) {
  const ownerKey = getStudioOwnerKey(
    user,
    role
  )

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const { data, error } =
    await supabase.rpc(
      'save_pulse_studio_game_draft',
      {
        p_id: gameId || null,

        p_title: form.title.trim(),

        p_description:
          form.description.trim(),

        p_language: form.language,
        p_team: form.team,

        p_visibility:
          form.visibility,

        p_cover_emoji:
          form.coverEmoji,

        p_owner_key: ownerKey,

        p_owner_name:
          user?.name ||
          'Pulse Creator',

        p_owner_role:
          role?.id ||
          user?.role,

        p_owner_team:
          user?.team ||
          'global',
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

export async function saveStudioGameSettings({
  gameId,
  user,
  role,
  settings,
}) {
  const ownerKey = getStudioOwnerKey(
    user,
    role
  )

  if (!gameId) {
    throw new Error(
      'Save Game Details before saving Game Settings.'
    )
  }

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const { data, error } =
    await supabase.rpc(
      'save_pulse_studio_game_settings',
      {
        p_id: gameId,

        p_owner_key:
          ownerKey,

        p_default_timer:
          Number(
            settings.defaultTimer
          ),

        p_points_per_question:
          Number(
            settings.pointsPerQuestion
          ),

        p_randomize_questions:
          Boolean(
            settings.randomizeQuestions
          ),

        p_randomize_answers:
          Boolean(
            settings.randomizeAnswers
          ),

        p_show_explanations:
          Boolean(
            settings.showExplanations
          ),
      }
    )

  if (error) {
    console.error(
      'Could not save Studio settings:',
      error
    )

    throw new Error(
      error.message ||
        'Could not save the game settings.'
    )
  }

  return String(data)
}