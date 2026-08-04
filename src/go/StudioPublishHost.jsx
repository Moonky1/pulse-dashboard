import {
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  createStudioHostRoom,
  publishStudioGame,
  unpublishStudioGame,
} from './studioGamesApi'

import './StudioPublishHost.css'

function formatPublishedDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ''
  }

  return new Intl.DateTimeFormat(
    'en',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  ).format(date)
}

function getAbsoluteUrl(path) {
  return new URL(
    path,
    window.location.origin
  ).toString()
}

export default function StudioPublishHost({
  game,
  settings,
  questions,
  user,
  role,
  teamLabel,
  onBack,
  onPublished,
}) {
  const navigate =
    useNavigate()

  const [
    publishedState,
    setPublishedState,
  ] = useState(() => ({
    status:
      game?.status || 'draft',

    publishedAt:
      game?.publishedAt || null,
  }))

  const [
    publishing,
    setPublishing,
  ] = useState(false)

  const [
    hosting,
    setHosting,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    messageType,
    setMessageType,
  ] = useState('')

  const [
    room,
    setRoom,
  ] = useState(null)

  const isPublished =
    publishedState.status ===
    'published'

  const readiness = useMemo(
    () => [
      {
        id: 'details',

        label:
          'Game details complete',

        ready:
          Boolean(
            game?.title?.trim()
          ),
      },

      {
        id: 'settings',

        label:
          'Game settings saved',

        ready:
          Boolean(
            game?.id
          ),
      },

      {
        id: 'questions',

        label:
          '10 questions complete',

        ready:
          Array.isArray(
            questions
          ) &&
          questions.length === 10 &&
          questions.every(
            (question) => {
              const expectedAnswers =
                question.questionType ===
                'true-false'
                  ? 2
                  : 4

              return (
                Boolean(
                  question.prompt?.trim()
                ) &&
                Array.isArray(
                  question.options
                ) &&
                question.options.length ===
                  expectedAnswers &&
                question.options.every(
                  (option) =>
                    Boolean(
                      String(
                        option || ''
                      ).trim()
                    )
                )
              )
            }
          ),
      },

      {
        id: 'preview',

        label:
          'Preview reviewed',

        ready:
          Number(
            game?.currentStep || 0
          ) >= 4,
      },
    ],
    [
      game,
      questions,
    ]
  )

  const readyToPublish =
    readiness.every(
      (item) =>
        item.ready
    )

  const hostQuery = room?.code
    ? new URLSearchParams({
        host: 'true',

        studio: 'true',

        team:
          game?.team ||
          'global',

        lang:
          game?.language ||
          'mixed',

        game:
          'classic',

        topic:
          'all',

        qstyle:
          'mixed',

        difficulty:
          'all',
      }).toString()
    : ''

  const hostPath =
    room?.code
      ? `/go/quiz/${room.code}?${hostQuery}`
      : ''

  const joinPath =
    room?.code
      ? `/go/quiz/${room.code}`
      : ''

  const resultsPath =
    room?.code
      ? `/go/results/${room.code}`
      : ''

  const copyText = async (
    value,
    successMessage
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      )

      setMessage(
        successMessage
      )

      setMessageType(
        'success'
      )
    } catch {
      window.prompt(
        'Copy this link:',
        value
      )
    }
  }

  const handlePublish =
    async () => {
      if (
        publishing ||
        !readyToPublish
      ) {
        return
      }

      setPublishing(true)
      setMessage('')
      setMessageType('')

      try {
        const published =
          await publishStudioGame({
            gameId:
              game.id,

            user,

            role,
          })

        const nextState = {
          status:
            published?.status ||
            'published',

          publishedAt:
            published?.published_at ||
            new Date().toISOString(),
        }

        setPublishedState(
          nextState
        )

        setMessage(
          'Game published successfully. It can now create live Pulse GO rooms.'
        )

        setMessageType(
          'success'
        )

        onPublished?.({
          ...game,

          status:
            nextState.status,

          publishedAt:
            nextState.publishedAt,

          currentStep:
            5,

          updatedAt:
            published?.updated_at ||
            new Date().toISOString(),
        })
      } catch (error) {
        console.error(error)

        setMessage(
          error?.message ||
            'Could not publish this game.'
        )

        setMessageType(
          'error'
        )
      } finally {
        setPublishing(false)
      }
    }

  const handleUnpublish =
    async () => {
      if (publishing) {
        return
      }

      const confirmed =
        window.confirm(
          'Return this game to Draft? Existing rooms and results will remain available.'
        )

      if (!confirmed) {
        return
      }

      setPublishing(true)
      setMessage('')
      setMessageType('')

      try {
        const draft =
          await unpublishStudioGame({
            gameId:
              game.id,

            user,

            role,
          })

        setPublishedState({
          status:
            draft?.status ||
            'draft',

          publishedAt:
            null,
        })

        setRoom(null)

        setMessage(
          'The game is back in Draft.'
        )

        setMessageType(
          'success'
        )

        onPublished?.({
          ...game,

          status:
            'draft',

          publishedAt:
            null,

          currentStep:
            4,

          updatedAt:
            draft?.updated_at ||
            new Date().toISOString(),
        })
      } catch (error) {
        console.error(error)

        setMessage(
          error?.message ||
            'Could not return this game to Draft.'
        )

        setMessageType(
          'error'
        )
      } finally {
        setPublishing(false)
      }
    }

  const handleCreateRoom =
    async () => {
      if (
        hosting ||
        !isPublished
      ) {
        return
      }

      setHosting(true)
      setMessage('')
      setMessageType('')

      try {
        const createdRoom =
          await createStudioHostRoom({
            gameId:
              game.id,

            user,

            role,
          })

        setRoom(
          createdRoom
        )

        setMessage(
          `Live room ${createdRoom.code} is ready.`
        )

        setMessageType(
          'success'
        )
      } catch (error) {
        console.error(error)

        setMessage(
          error?.message ||
            'Could not create the live room.'
        )

        setMessageType(
          'error'
        )
      } finally {
        setHosting(false)
      }
    }

  return (
    <div className="studio-publish-host">
      <section className="studio-publish-hero">
        <div>
          <span className="studio-section-eyebrow">
            Final Step
          </span>

          <h2>
            Publish your game
          </h2>

          <p>
            Lock in this version, make it
            available according to its
            visibility and create a real
            Pulse GO room.
          </p>
        </div>

        <div
          className={`studio-publish-status ${
            isPublished
              ? 'published'
              : ''
          }`}
        >
          <i />

          <div>
            <span>
              Current status
            </span>

            <strong>
              {isPublished
                ? 'Published'
                : 'Draft'}
            </strong>

            {isPublished &&
              publishedState.publishedAt && (
                <small>
                  Published{' '}
                  {formatPublishedDate(
                    publishedState.publishedAt
                  )}
                </small>
              )}
          </div>
        </div>
      </section>

      <div className="studio-publish-grid">
        <section className="studio-publish-card">
          <header>
            <span>
              01
            </span>

            <div>
              <h3>
                Publication Readiness
              </h3>

              <p>
                Every requirement must be
                complete before the game
                can be published.
              </p>
            </div>
          </header>

          <div className="studio-publish-checklist">
            {readiness.map(
              (item) => (
                <div
                  key={item.id}
                  className={
                    item.ready
                      ? 'ready'
                      : ''
                  }
                >
                  <span>
                    {item.ready
                      ? '✓'
                      : '•'}
                  </span>

                  <strong>
                    {item.label}
                  </strong>
                </div>
              )
            )}
          </div>

          <div className="studio-publish-summary">
            <article>
              <span>
                Game
              </span>

              <strong>
                Classic Quiz
              </strong>
            </article>

            <article>
              <span>
                Questions
              </span>

              <strong>
                10
              </strong>
            </article>

            <article>
              <span>
                Team
              </span>

              <strong>
                {teamLabel ||
                  game?.team ||
                  'Global'}
              </strong>
            </article>

            <article>
              <span>
                Visibility
              </span>

              <strong>
                {game?.visibility ||
                  'private'}
              </strong>
            </article>
          </div>

          {!isPublished ? (
            <button
              type="button"
              className="studio-publish-primary"
              disabled={
                !readyToPublish ||
                publishing
              }
              onClick={
                handlePublish
              }
            >
              {publishing
                ? 'Publishing...'
                : 'Publish Game'}
            </button>
          ) : (
            <button
              type="button"
              className="studio-publish-secondary"
              disabled={
                publishing
              }
              onClick={
                handleUnpublish
              }
            >
              {publishing
                ? 'Updating...'
                : 'Return to Draft'}
            </button>
          )}
        </section>

        <section className="studio-publish-card studio-host-card">
          <header>
            <span>
              02
            </span>

            <div>
              <h3>
                Host a Live Game
              </h3>

              <p>
                Generate a unique room
                code and open the normal
                Pulse GO multiplayer
                lobby.
              </p>
            </div>
          </header>

          <div className="studio-host-configuration">
            <div>
              <span>
                Timer
              </span>

              <strong>
                {settings.defaultTimer}s
              </strong>
            </div>

            <div>
              <span>
                Base points
              </span>

              <strong>
                {Number(
                  settings.pointsPerQuestion ||
                    0
                ).toLocaleString(
                  'en-US'
                )}
              </strong>
            </div>

            <div>
              <span>
                Random order
              </span>

              <strong>
                {settings.randomizeQuestions
                  ? 'On'
                  : 'Off'}
              </strong>
            </div>

            <div>
              <span>
                Lives Mode
              </span>

              <strong>
                {settings.livesEnabled
                  ? `${settings.livesCount} ${
                      settings.livesCount ===
                      1
                        ? 'life'
                        : 'lives'
                    }`
                  : 'Off'}
              </strong>
            </div>
          </div>

          {!room ? (
            <div className="studio-host-empty">
              <span>
                🎮
              </span>

              <strong>
                Ready for a room
              </strong>

              <p>
                Publishing unlocks room
                creation. Each room gets a
                fresh KK code and its own
                results URL.
              </p>

              <button
                type="button"
                className="studio-publish-primary"
                disabled={
                  !isPublished ||
                  hosting
                }
                onClick={
                  handleCreateRoom
                }
              >
                {hosting
                  ? 'Creating Room...'
                  : 'Create Live Room'}
              </button>
            </div>
          ) : (
            <div className="studio-host-room">
              <span>
                Live room ready
              </span>

              <strong>
                {room.code}
              </strong>

              <small>
                Share this code with
                agents from Pulse GO.
              </small>

              <div className="studio-host-links">
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      room.code,
                      'Room code copied.'
                    )
                  }
                >
                  Copy Code
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      getAbsoluteUrl(
                        joinPath
                      ),
                      'Join link copied.'
                    )
                  }
                >
                  Copy Join Link
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      getAbsoluteUrl(
                        resultsPath
                      ),
                      'Results link copied.'
                    )
                  }
                >
                  Copy Results
                </button>
              </div>

              <button
                type="button"
                className="studio-host-open"
                onClick={() =>
                  navigate(
                    hostPath
                  )
                }
              >
                Open Host Lobby →
              </button>

              <button
                type="button"
                className="studio-host-new"
                disabled={
                  hosting
                }
                onClick={
                  handleCreateRoom
                }
              >
                {hosting
                  ? 'Creating...'
                  : 'Create Another Room'}
              </button>
            </div>
          )}
        </section>
      </div>

      {message && (
        <div
          className={`studio-builder-message ${
            messageType ===
            'success'
              ? 'studio-builder-message--success'
              : 'studio-builder-message--error'
          }`}
        >
          <span>
            {messageType ===
            'success'
              ? '✓'
              : '!'}
          </span>

          {message}
        </div>
      )}

      <footer className="studio-builder-form-footer">
        <div>
          <span>
            Builder complete
          </span>

          <strong>
            Publish, host and collect
            results
          </strong>
        </div>

        <div>
          <button
            type="button"
            className="studio-builder-footer-secondary"
            onClick={
              onBack
            }
          >
            Back to Preview
          </button>

          {room && (
            <button
              type="button"
              className="studio-builder-footer-primary"
              onClick={() =>
                navigate(
                  hostPath
                )
              }
            >
              Open Host Lobby
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}