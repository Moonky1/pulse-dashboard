import {
  getQuestionById as getQuizQuestionById,
} from './quizPools'

import './StudioRoomSupport.css'

export function isStudioRoom(room) {
  return (
    room?.source_type === 'studio' &&
    Boolean(
      room?.studio_game_snapshot
    )
  )
}

export function getStudioRoomSettings(
  room
) {
  const settings =
    room?.studio_game_snapshot
      ?.settings || {}

  return {
    defaultTimer: Number(
      settings.default_timer || 30
    ),

    pointsPerQuestion: Number(
      settings.points_per_question ||
        1000
    ),

    randomizeQuestions:
      Boolean(
        settings.randomize_questions
      ),

    randomizeAnswers:
      Boolean(
        settings.randomize_answers
      ),

    showExplanations:
      settings.show_explanations !==
      false,

    livesEnabled:
      Boolean(
        settings.lives_enabled
      ),

    livesCount: Number(
      settings.lives_count || 3
    ),
  }
}

export function getStudioRoomGame(
  room
) {
  return (
    room?.studio_game_snapshot?.game ||
    null
  )
}

function normalizeStudioQuestion(
  question
) {
  if (
    !question ||
    typeof question !== 'object'
  ) {
    return null
  }

  return {
    ...question,

    id:
      String(
        question.id || ''
      ),

    question:
      question.question ||
      question.prompt ||
      '',

    options:
      Array.isArray(
        question.options
      )
        ? question.options
        : [],

    correct:
      Number(
        question.correct ?? 0
      ),

    explanation:
      question.explanation || '',

    question_type:
      question.question_type ||
      'text',

    media_url:
      question.media_url || '',

    timer_override:
      question.timer_override ??
      null,

    points_override:
      question.points_override ??
      null,
  }
}

export function getStudioRoomQuestions(
  room
) {
  if (!isStudioRoom(room)) {
    return []
  }

  const questions =
    room?.studio_game_snapshot
      ?.questions

  if (!Array.isArray(questions)) {
    return []
  }

  return questions
    .map(
      normalizeStudioQuestion
    )
    .filter(Boolean)
}

export function getStudioRoomOrderedQuestions(
  room
) {
  const questions =
    getStudioRoomQuestions(room)

  if (!questions.length) {
    return []
  }

  const ids =
    Array.isArray(
      room?.question_ids
    )
      ? room.question_ids
      : []

  if (!ids.length) {
    return questions
  }

  const byId =
    new Map(
      questions.map(
        (question) => [
          String(question.id),
          question,
        ]
      )
    )

  const ordered =
    ids
      .map(
        (questionId) =>
          byId.get(
            String(questionId)
          ) || null
      )
      .filter(Boolean)

  if (
    ordered.length ===
    questions.length
  ) {
    return ordered
  }

  return questions
}

export function getStudioRoomQuestionAt(
  room,
  index
) {
  const questions =
    getStudioRoomOrderedQuestions(
      room
    )

  return (
    questions[
      Number(index || 0)
    ] || null
  )
}

export function getStudioRoomQuestionIds(
  room
) {
  return getStudioRoomOrderedQuestions(
    room
  )
    .map(
      (question) =>
        String(
          question.id || ''
        ).trim()
    )
    .filter(Boolean)
}

export function getRoomQuestionById(
  room,
  questionId
) {
  if (isStudioRoom(room)) {
    const questions =
      getStudioRoomQuestions(room)

    return (
      questions.find(
        (question) =>
          String(question.id) ===
          String(questionId)
      ) || null
    )
  }

  return getQuizQuestionById(
    questionId
  )
}

export function shouldShuffleRoomAnswers(
  room
) {
  if (!isStudioRoom(room)) {
    return true
  }

  return getStudioRoomSettings(
    room
  ).randomizeAnswers
}

export function getRoomQuestionSeconds(
  room,
  question,
  fallback = 30
) {
  if (!isStudioRoom(room)) {
    return Number(
      fallback || 30
    )
  }

  const settings =
    getStudioRoomSettings(room)

  return Number(
    question?.timer_override ||
      settings.defaultTimer ||
      fallback ||
      30
  )
}

export function getRoomQuestionPoints(
  room,
  question,
  fallback = 1000
) {
  if (!isStudioRoom(room)) {
    return Number(
      fallback || 1000
    )
  }

  const settings =
    getStudioRoomSettings(room)

  return Number(
    question?.points_override ||
      settings.pointsPerQuestion ||
      fallback ||
      1000
  )
}

export function getRoomGameTitle(
  room
) {
  if (!isStudioRoom(room)) {
    return ''
  }

  return (
    getStudioRoomGame(room)?.title ||
    'Studio Classic Quiz'
  )
}

export function StudioRoomQuestionMedia({
  question,
}) {
  const source =
    question?.media_url ||
    question?.mediaUrl ||
    ''

  if (
    question?.question_type ===
      'image' &&
    source
  ) {
    return (
      <div className="studio-room-media studio-room-media--image">
        <img
          src={source}
          alt="Question media"
        />
      </div>
    )
  }

  if (
    question?.question_type ===
      'audio' &&
    source
  ) {
    return (
      <div className="studio-room-media studio-room-media--audio">
        <span>🎧</span>

        <div>
          <strong>
            Listen before answering
          </strong>

          <audio
            controls
            preload="metadata"
            src={source}
          />
        </div>
      </div>
    )
  }

  return null
}
