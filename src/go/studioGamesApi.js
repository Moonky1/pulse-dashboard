import { supabase } from '../utils/supabase'

const STUDIO_MEDIA_BUCKET = 'pulse-studio-media'

function normalizeOwnerPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function sanitizeFileName(fileName) {
  const raw = String(fileName || 'media-file').trim()
  const lastDot = raw.lastIndexOf('.')

  const name =
    lastDot > 0
      ? raw.slice(0, lastDot)
      : raw

  const extension =
    lastDot > 0
      ? raw.slice(lastDot).toLowerCase()
      : ''

  const safeName =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'media'

  return `${safeName}${extension}`
}

function inferMediaContentType(file, questionType) {
  if (file?.type) {
    return file.type
  }

  const extension = String(file?.name || '')
    .toLowerCase()
    .split('.')
    .pop()

  const imageTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  }

  const audioTypes = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    webm: 'audio/webm',
    aac: 'audio/aac',
  }

  return questionType === 'image'
    ? imageTypes[extension] || ''
    : audioTypes[extension] || ''
}

function validateMediaFile(file, questionType) {
  if (!(file instanceof File)) {
    throw new Error('Choose a valid media file.')
  }

  const isImage = questionType === 'image'
  const isAudio = questionType === 'audio'

  if (!isImage && !isAudio) {
    throw new Error(
      'This question type does not accept media.'
    )
  }

  const contentType = inferMediaContentType(
    file,
    questionType
  )

  if (
    isImage &&
    !contentType.startsWith('image/')
  ) {
    throw new Error(
      'Image questions require an image file.'
    )
  }

  if (
    isAudio &&
    !contentType.startsWith('audio/')
  ) {
    throw new Error(
      'Audio questions require an audio file.'
    )
  }

  const maxBytes = isImage
    ? 8 * 1024 * 1024
    : 20 * 1024 * 1024

  if (file.size > maxBytes) {
    throw new Error(
      isImage
        ? 'Images must be 8 MB or smaller.'
        : 'Audio files must be 20 MB or smaller.'
    )
  }
}

export function mapStudioGame(row) {
  return {
    id: row.id,

    gameMode:
      row.game_mode || 'classic',

    title:
      row.title || 'Untitled Game',

    description:
      row.description || '',

    language:
      row.language || 'en',

    team:
      row.team || 'global',

    visibility:
      row.visibility || 'private',

    status:
      row.status || 'draft',

    coverEmoji:
      row.cover_emoji || '🎮',

    ownerKey:
      row.owner_key || '',

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

    livesEnabled: Boolean(
      row.lives_enabled
    ),

    livesCount: Number(
      row.lives_count || 3
    ),

    playCount: Number(
      row.play_count || 0
    ),

    createdAt:
      row.created_at || null,

    updatedAt:
      row.updated_at || null,

    publishedAt:
      row.published_at || null,
  }
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

  const { data, error } = await supabase.rpc(
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

  const { data, error } = await supabase.rpc(
    'save_pulse_studio_game_draft',
    {
      p_id: gameId || null,

      p_game_mode:
        form.gameMode || 'classic',

      p_title:
        form.title.trim(),

      p_description:
        form.description.trim(),

      p_language:
        form.language,

      p_team:
        form.team,

      p_visibility:
        form.visibility,

      p_cover_emoji:
        form.coverEmoji,

      p_owner_key:
        ownerKey,

      p_owner_name:
        user?.name || 'Pulse Creator',

      p_owner_role:
        role?.id || user?.role,

      p_owner_team:
        user?.team || 'global',
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

  const { data, error } = await supabase.rpc(
    'save_pulse_studio_game_settings',
    {
      p_id:
        gameId,

      p_owner_key:
        ownerKey,

      p_default_timer:
        Number(settings.defaultTimer),

      p_points_per_question:
        Number(settings.pointsPerQuestion),

      p_randomize_questions:
        Boolean(settings.randomizeQuestions),

      p_randomize_answers:
        Boolean(settings.randomizeAnswers),

      p_show_explanations:
        Boolean(settings.showExplanations),

      p_lives_enabled:
        Boolean(settings.livesEnabled),

      p_lives_count:
        Number(settings.livesCount || 3),
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

export async function getStudioQuestions({
  gameId,
  user,
  role,
}) {
  const ownerKey = getStudioOwnerKey(
    user,
    role
  )

  if (!gameId) {
    return []
  }

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const { data, error } = await supabase.rpc(
    'get_pulse_studio_questions',
    {
      p_game_id:
        gameId,

      p_owner_key:
        ownerKey,
    }
  )

  if (error) {
    console.error(
      'Could not load Studio questions:',
      error
    )

    throw new Error(
      error.message ||
        'Could not load the questions.'
    )
  }

  return Array.isArray(data)
    ? data
    : []
}

export async function saveStudioQuestions({
  gameId,
  user,
  role,
  questions,
}) {
  const ownerKey = getStudioOwnerKey(
    user,
    role
  )

  if (!gameId) {
    throw new Error(
      'A saved Studio game is required.'
    )
  }

  if (!ownerKey) {
    throw new Error(
      'Could not identify the Studio creator.'
    )
  }

  const payload = questions.map(
    (question) => ({
      position:
        Number(question.position),

      question_type:
        question.questionType,

      prompt:
        String(
          question.prompt || ''
        ).trim(),

      media_url:
        String(
          question.mediaUrl || ''
        ).trim(),

      media_path:
        String(
          question.mediaPath || ''
        ).trim(),

      options:
        question.options.map((option) =>
          String(option || '').trim()
        ),

      correct_index:
        Number(question.correctIndex),

      explanation:
        String(
          question.explanation || ''
        ).trim(),

      timer_override:
        question.timerOverride ?? null,

      points_override:
        question.pointsOverride ?? null,
    })
  )

  const { data, error } = await supabase.rpc(
    'save_pulse_studio_questions',
    {
      p_game_id:
        gameId,

      p_owner_key:
        ownerKey,

      p_questions:
        payload,
    }
  )

  if (error) {
    console.error(
      'Could not save Studio questions:',
      error
    )

    throw new Error(
      error.message ||
        'Could not save the questions.'
    )
  }

  return String(data)
}

export async function markStudioGameStep({
  gameId,
  user,
  role,
  step,
}) {
  const ownerKey = getStudioOwnerKey(
    user,
    role
  )

  if (!gameId || !ownerKey) {
    throw new Error(
      'Could not update Studio progress.'
    )
  }

  const { data, error } = await supabase.rpc(
    'mark_pulse_studio_game_step',
    {
      p_game_id:
        gameId,

      p_owner_key:
        ownerKey,

      p_step:
        Number(step),
    }
  )

  if (error) {
    console.error(
      'Could not update Studio step:',
      error
    )

    throw new Error(
      error.message ||
        'Could not update Studio progress.'
    )
  }

  return String(data)
}

export async function uploadStudioQuestionMedia({
  gameId,
  position,
  questionType,
  file,
}) {
  validateMediaFile(
    file,
    questionType
  )

  const safeName = sanitizeFileName(
    file.name
  )

  const uniquePart =
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`

  const filePath = [
    gameId,
    `question-${position}`,
    `${uniquePart}-${safeName}`,
  ].join('/')

  const { error: uploadError } =
    await supabase.storage
      .from(STUDIO_MEDIA_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,

        contentType:
          inferMediaContentType(
            file,
            questionType
          ) || undefined,
      })

  if (uploadError) {
    console.error(
      'Could not upload Studio media:',
      uploadError
    )

    throw new Error(
      uploadError.message ||
        'Could not upload the media file.'
    )
  }

  const { data } = supabase.storage
    .from(STUDIO_MEDIA_BUCKET)
    .getPublicUrl(filePath)

  const publicUrl =
    data?.publicUrl || ''

  if (!publicUrl) {
    throw new Error(
      'The media uploaded, but its public URL could not be created.'
    )
  }

  return {
    path: filePath,
    url: publicUrl,
  }
}

export async function removeStudioQuestionMedia(
  filePath
) {
  const cleanPath = String(
    filePath || ''
  ).trim()

  if (!cleanPath) {
    return
  }

  const { error } = await supabase.storage
    .from(STUDIO_MEDIA_BUCKET)
    .remove([cleanPath])

  if (error) {
    console.warn(
      'Could not remove old Studio media:',
      error
    )
  }
}