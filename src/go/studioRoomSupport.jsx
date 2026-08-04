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

export function getRoomQuestionById(
  room,
  questionId
) {
  if (isStudioRoom(room)) {
    const questions =
      room.studio_game_snapshot
        ?.questions

    const found =
      Array.isArray(questions)
        ? questions.find(
            (question) =>
              String(question.id) ===
              String(questionId)
          )
        : null

    if (found) {
      return {
        ...found,

        id:
          String(found.id),

        question:
          found.question ||
          found.prompt ||
          '',

        options:
          Array.isArray(
            found.options
          )
            ? found.options
            : [],

        correct:
          Number(
            found.correct ?? 0
          ),

        explanation:
          found.explanation || '',

        question_type:
          found.question_type ||
          'text',

        media_url:
          found.media_url || '',

        timer_override:
          found.timer_override ??
          null,

        points_override:
          found.points_override ??
          null,
      }
    }
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
