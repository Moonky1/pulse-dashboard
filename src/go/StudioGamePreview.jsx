import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import './StudioGamePreview.css'

const OPTION_META = [
  {
    letter: 'A',
    shape: '▲',
  },
  {
    letter: 'B',
    shape: '◆',
  },
  {
    letter: 'C',
    shape: '●',
  },
  {
    letter: 'D',
    shape: '■',
  },
]

function seededShuffle(items, seed) {
  const next = [...items]

  let state =
    Number(seed || 1) + 1

  for (
    let index = next.length - 1;
    index > 0;
    index -= 1
  ) {
    state =
      (state * 9301 + 49297) %
      233280

    const random =
      state / 233280

    const swapIndex =
      Math.floor(
        random * (index + 1)
      )

    const current =
      next[index]

    next[index] =
      next[swapIndex]

    next[swapIndex] =
      current
  }

  return next
}

function PreviewMedia({
  question,
}) {
  const source =
    question.mediaUrl ||
    question.mediaPreviewUrl

  if (
    question.questionType ===
      'image' &&
    source
  ) {
    return (
      <div className="studio-preview-media studio-preview-media--image">
        <img
          src={source}
          alt="Question media"
        />
      </div>
    )
  }

  if (
    question.questionType ===
      'audio' &&
    source
  ) {
    return (
      <div className="studio-preview-media studio-preview-media--audio">
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

export default function StudioGamePreview({
  game,
  settings,
  questions,
  onBack,
  onMarkPreview,
  onContinuePublish,
}) {
  const [started, setStarted] =
    useState(false)

  const [finished, setFinished] =
    useState(false)

  const [currentIndex, setCurrentIndex] =
    useState(0)

  const [selectedIndex, setSelectedIndex] =
    useState(null)

  const [answered, setAnswered] =
    useState(false)

  const [timedOut, setTimedOut] =
    useState(false)

  const [timeLeft, setTimeLeft] =
    useState(
      Number(
        settings.defaultTimer || 30
      )
    )

  const [score, setScore] =
    useState(0)

  const [correctCount, setCorrectCount] =
    useState(0)

  const [lives, setLives] =
    useState(
      Number(
        settings.livesCount || 3
      )
    )

  const [previewSeed, setPreviewSeed] =
    useState(1)

  const markedRef = useRef(false)
  const answerRef = useRef(null)

  useEffect(() => {
    if (markedRef.current) return

    markedRef.current = true
    onMarkPreview?.()
  }, [onMarkPreview])

  const orderedQuestions = useMemo(
    () => {
      const sorted = [...questions].sort(
        (first, second) =>
          first.position -
          second.position
      )

      return settings.randomizeQuestions
        ? seededShuffle(
            sorted,
            previewSeed * 37
          )
        : sorted
    },
    [
      previewSeed,
      questions,
      settings.randomizeQuestions,
    ]
  )

  const currentQuestion =
    orderedQuestions[currentIndex]

  const optionEntries = useMemo(
    () => {
      if (!currentQuestion) return []

      const entries =
        currentQuestion.options.map(
          (text, originalIndex) => ({
            text,
            originalIndex,
          })
        )

      return settings.randomizeAnswers
        ? seededShuffle(
            entries,
            previewSeed * 101 +
              currentQuestion.position
          )
        : entries
    },
    [
      currentQuestion,
      previewSeed,
      settings.randomizeAnswers,
    ]
  )

  const total =
    orderedQuestions.length

  const timer =
    Number(
      currentQuestion?.timerOverride ||
        settings.defaultTimer ||
        30
    )

  const points =
    Number(
      currentQuestion?.pointsOverride ||
        settings.pointsPerQuestion ||
        1000
    )

  const correctIndex =
    Number(
      currentQuestion?.correctIndex
    )

  const isCorrect =
    answered &&
    selectedIndex === correctIndex

  const isOutOfLives =
    settings.livesEnabled &&
    lives <= 0

  const handleAnswer = (
    originalIndex,
    timeout = false
  ) => {
    if (
      answered ||
      !currentQuestion
    ) {
      return
    }

    const correct =
      originalIndex ===
      correctIndex

    setSelectedIndex(
      originalIndex
    )

    setTimedOut(timeout)
    setAnswered(true)

    if (correct) {
      setCorrectCount(
        (current) =>
          current + 1
      )

      setScore(
        (current) =>
          current + points
      )
    } else if (
      settings.livesEnabled
    ) {
      setLives(
        (current) =>
          Math.max(
            0,
            current - 1
          )
      )
    }
  }

  answerRef.current =
    handleAnswer

  useEffect(() => {
    if (
      !started ||
      finished ||
      answered ||
      !currentQuestion
    ) {
      return
    }

    setTimeLeft(timer)

    const deadline =
      Date.now() +
      timer * 1000

    const interval =
      window.setInterval(() => {
        const remaining =
          Math.max(
            0,
            Math.ceil(
              (deadline -
                Date.now()) /
                1000
            )
          )

        setTimeLeft(
          remaining
        )

        if (
          remaining <= 0
        ) {
          window.clearInterval(
            interval
          )

          answerRef.current?.(
            null,
            true
          )
        }
      }, 150)

    return () => {
      window.clearInterval(
        interval
      )
    }
  }, [
    answered,
    currentQuestion,
    currentIndex,
    finished,
    started,
    timer,
  ])

  const startPreview = () => {
    setStarted(true)
    setFinished(false)
    setCurrentIndex(0)
    setSelectedIndex(null)
    setAnswered(false)
    setTimedOut(false)
    setTimeLeft(
      Number(
        settings.defaultTimer ||
          30
      )
    )
    setScore(0)
    setCorrectCount(0)
    setLives(
      Number(
        settings.livesCount ||
          3
      )
    )
  }

  const restartPreview = () => {
    setPreviewSeed(
      (current) =>
        current + 1
    )

    startPreview()
  }

  const goNext = () => {
    const noLivesAfterAnswer =
      settings.livesEnabled &&
      !isCorrect &&
      lives <= 0

    if (
      noLivesAfterAnswer ||
      currentIndex + 1 >= total
    ) {
      setFinished(true)
      return
    }

    setCurrentIndex(
      (current) =>
        current + 1
    )

    setSelectedIndex(null)
    setAnswered(false)
    setTimedOut(false)
  }

  const timerPercent =
    timer > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (timeLeft /
              timer) *
              100
          )
        )
      : 0

  if (!started) {
    return (
      <section className="studio-preview-start">
        <div className="studio-preview-start-visual">
          <span>
            {game.coverEmoji ||
              '🎮'}
          </span>
        </div>

        <span className="studio-section-eyebrow">
          Step 4 · Preview
        </span>

        <h2>
          {game.title ||
            'Untitled Game'}
        </h2>

        <p>
          Play the complete Classic Quiz
          before publishing it. Preview
          results are not saved.
        </p>

        <div className="studio-preview-start-metrics">
          <article>
            <span>
              Questions
            </span>
            <strong>
              {total}
            </strong>
          </article>

          <article>
            <span>
              Timer
            </span>
            <strong>
              {
                settings.defaultTimer
              }
              s
            </strong>
          </article>

          <article>
            <span>
              Points
            </span>
            <strong>
              {
                settings.pointsPerQuestion
              }
            </strong>
          </article>

          <article>
            <span>
              Lives
            </span>
            <strong>
              {settings.livesEnabled
                ? settings.livesCount
                : 'Off'}
            </strong>
          </article>
        </div>

        <div className="studio-preview-start-actions">
          <button
            type="button"
            className="studio-builder-footer-secondary"
            onClick={onBack}
          >
            Back to Questions
          </button>

          <button
            type="button"
            className="studio-builder-footer-primary"
            onClick={
              startPreview
            }
          >
            Start Preview
          </button>
        </div>
      </section>
    )
  }

  if (finished) {
    const percent =
      total > 0
        ? Math.round(
            (correctCount /
              total) *
              100
          )
        : 0

    const result =
      percent >= 80
        ? {
            emoji: '🏆',
            title:
              'Ready to publish',
            description:
              'The game played correctly and the question flow is ready.',
          }
        : percent >= 60
          ? {
              emoji: '👍',
              title:
                'Preview complete',
              description:
                'Review any questions that felt unclear before publishing.',
            }
          : {
              emoji: '🛠️',
              title:
                'Review recommended',
              description:
                'Return to Questions and improve the answer clarity or difficulty.',
            }

    return (
      <section className="studio-preview-results">
        <span className="studio-preview-results-emoji">
          {result.emoji}
        </span>

        <span className="studio-section-eyebrow">
          Preview Complete
        </span>

        <h2>
          {result.title}
        </h2>

        <p>
          {result.description}
        </p>

        <div className="studio-preview-results-score">
          <strong>
            {correctCount}/
            {total}
          </strong>

          <span>
            {percent}% correct
          </span>
        </div>

        <div className="studio-preview-results-grid">
          <article>
            <span>
              Score
            </span>

            <strong>
              {score.toLocaleString(
                'en-US'
              )}
            </strong>
          </article>

          <article>
            <span>
              Remaining lives
            </span>

            <strong>
              {settings.livesEnabled
                ? lives
                : '—'}
            </strong>
          </article>
        </div>

        <div className="studio-preview-results-actions">
          <button
            type="button"
            className="studio-builder-footer-secondary"
            onClick={onBack}
          >
            Edit Questions
          </button>

          <button
            type="button"
            className="studio-builder-footer-secondary"
            onClick={
              restartPreview
            }
          >
            Play Again
          </button>

          <button
            type="button"
            className="studio-builder-footer-primary"
            onClick={
              onContinuePublish
            }
          >
            Continue to Publish →
          </button>
        </div>

        <div className="studio-game-preview-note">
          <span>05</span>

          <p>
            Preview is complete. Continue to publish this version and create a live Pulse GO room.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="studio-preview-player">
      <header className="studio-preview-player-topbar">
        <button
          type="button"
          onClick={onBack}
        >
          ← Questions
        </button>

        <div>
          <span>
            Question{' '}
            {currentIndex + 1}{' '}
            of {total}
          </span>

          <strong>
            {score.toLocaleString(
              'en-US'
            )}{' '}
            pts
          </strong>
        </div>

        <div className="studio-preview-player-lives">
          {settings.livesEnabled
            ? Array.from(
                {
                  length:
                    settings.livesCount,
                },
                (_, index) => (
                  <span
                    key={index}
                    className={
                      index < lives
                        ? 'active'
                        : ''
                    }
                  >
                    ♥
                  </span>
                )
              )
            : (
              <span className="studio-preview-classic-label">
                Classic
              </span>
            )}
        </div>
      </header>

      <div className="studio-preview-timer">
        <i
          style={{
            width: `${timerPercent}%`,
          }}
        />

        <span>
          {timeLeft}s
        </span>
      </div>

      <main className="studio-preview-question-card">
        <div className="studio-preview-question-meta">
          <span>
            Question{' '}
            {
              currentQuestion.position
            }
          </span>

          <strong>
            {points.toLocaleString(
              'en-US'
            )}{' '}
            points
          </strong>
        </div>

        <PreviewMedia
          question={
            currentQuestion
          }
        />

        <h2>
          {
            currentQuestion.prompt
          }
        </h2>

        <div
          className={`studio-preview-options ${
            currentQuestion.questionType ===
            'true-false'
              ? 'studio-preview-options--two'
              : ''
          }`}
        >
          {optionEntries.map(
            (
              option,
              displayIndex
            ) => {
              const selected =
                selectedIndex ===
                option.originalIndex

              const correct =
                option.originalIndex ===
                correctIndex

              const classNames = []

              if (
                answered &&
                correct
              ) {
                classNames.push(
                  'correct'
                )
              }

              if (
                answered &&
                selected &&
                !correct
              ) {
                classNames.push(
                  'wrong'
                )
              }

              if (
                selected &&
                !answered
              ) {
                classNames.push(
                  'selected'
                )
              }

              return (
                <button
                  key={
                    option.originalIndex
                  }
                  type="button"
                  className={classNames.join(
                    ' '
                  )}
                  disabled={answered}
                  onClick={() =>
                    handleAnswer(
                      option.originalIndex
                    )
                  }
                >
                  <span>
                    {
                      OPTION_META[
                        displayIndex
                      ]?.shape
                    }
                  </span>

                  <div>
                    <small>
                      {
                        OPTION_META[
                          displayIndex
                        ]?.letter
                      }
                    </small>

                    <strong>
                      {option.text}
                    </strong>
                  </div>

                  {answered &&
                    correct && (
                      <i>✓</i>
                    )}

                  {answered &&
                    selected &&
                    !correct && (
                      <i>×</i>
                    )}
                </button>
              )
            }
          )}
        </div>

        {answered && (
          <div
            className={`studio-preview-feedback ${
              isCorrect
                ? 'correct'
                : 'wrong'
            }`}
          >
            <div>
              <span>
                {isCorrect
                  ? '✓'
                  : timedOut
                    ? '⌛'
                    : '×'}
              </span>

              <div>
                <strong>
                  {isCorrect
                    ? 'Correct!'
                    : timedOut
                      ? 'Time is up'
                      : 'Not quite'}
                </strong>

                <small>
                  {isCorrect
                    ? `+${points.toLocaleString(
                        'en-US'
                      )} points`
                    : settings.livesEnabled
                      ? lives > 0
                        ? `${lives} ${
                            lives === 1
                              ? 'life'
                              : 'lives'
                          } remaining`
                        : 'No lives remaining'
                      : 'The correct answer is highlighted.'}
                </small>
              </div>
            </div>

            {settings.showExplanations &&
              currentQuestion.explanation && (
                <p>
                  {
                    currentQuestion.explanation
                  }
                </p>
              )}

            <button
              type="button"
              onClick={goNext}
            >
              {isOutOfLives ||
              currentIndex + 1 >= total
                ? 'View Results'
                : 'Next Question →'}
            </button>
          </div>
        )}
      </main>
    </section>
  )
}
