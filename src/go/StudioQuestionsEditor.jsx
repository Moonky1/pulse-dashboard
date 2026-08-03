import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'

import {
  removeStudioQuestionMedia,
  saveStudioQuestions,
  uploadStudioQuestionMedia,
} from './studioGamesApi'

import {
  CLASSIC_QUESTION_COUNT,
  STUDIO_QUESTION_TYPES,
  getStudioQuestionErrors,
  getTrueFalseOptions,
  isStudioQuestionComplete,
  validateClassicQuestions,
} from './studioQuestionUtils'

import './StudioQuestionsEditor.css'

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

function QuestionMedia({
  question,
  compact = false,
}) {
  const source =
    question.mediaPreviewUrl ||
    question.mediaUrl

  if (!source) {
    return null
  }

  if (question.questionType === 'image') {
    return (
      <div
        className={`studio-question-media-preview ${
          compact
            ? 'studio-question-media-preview--compact'
            : ''
        }`}
      >
        <img
          src={source}
          alt="Question media"
        />
      </div>
    )
  }

  if (question.questionType === 'audio') {
    return (
      <div
        className={`studio-question-audio-preview ${
          compact
            ? 'studio-question-audio-preview--compact'
            : ''
        }`}
      >
        <span>🎧</span>

        <audio
          controls
          preload="metadata"
          src={source}
        />
      </div>
    )
  }

  return null
}

const StudioQuestionsEditor = forwardRef(
  function StudioQuestionsEditor(
    {
      gameId,
      user,
      role,
      language,
      settings,
      questions,
      loading,
      onQuestionsChange,
      onStatusChange,
      onSaved,
      onBack,
      onContinuePreview,
    },
    ref
  ) {
    const [
      selectedPosition,
      setSelectedPosition,
    ] = useState(1)

    const [dirty, setDirty] =
      useState(false)

    const [saving, setSaving] =
      useState(false)

    const [message, setMessage] =
      useState('')

    const [messageType, setMessageType] =
      useState('')

    const validation = useMemo(
      () =>
        validateClassicQuestions(
          questions
        ),
      [questions]
    )

    const completedCount = useMemo(
      () =>
        questions.filter(
          isStudioQuestionComplete
        ).length,
      [questions]
    )

    const selectedQuestion =
      questions.find(
        (question) =>
          question.position ===
          selectedPosition
      ) || questions[0]

    const selectedErrors =
      selectedQuestion
        ? getStudioQuestionErrors(
            selectedQuestion
          )
        : []

    const reportStatus = useCallback(
      (
        nextDirty,
        nextSaving
      ) => {
        onStatusChange?.({
          dirty:
            nextDirty,

          saving:
            nextSaving,

          complete:
            validation.valid,

          completedCount,
        })
      },
      [
        completedCount,
        onStatusChange,
        validation.valid,
      ]
    )

    useEffect(() => {
      reportStatus(
        dirty,
        saving
      )
    }, [
      dirty,
      reportStatus,
      saving,
    ])

    const setQuestions = useCallback(
      (nextQuestions) => {
        onQuestionsChange(
          nextQuestions
        )

        setDirty(true)
        setMessage('')
        setMessageType('')

        reportStatus(
          true,
          saving
        )
      },
      [
        onQuestionsChange,
        reportStatus,
        saving,
      ]
    )

    const updateQuestion = useCallback(
      (
        position,
        updater
      ) => {
        const nextQuestions =
          questions.map(
            (question) => {
              if (
                question.position !==
                position
              ) {
                return question
              }

              return typeof updater ===
                'function'
                ? updater(question)
                : {
                    ...question,
                    ...updater,
                  }
            }
          )

        setQuestions(
          nextQuestions
        )
      },
      [
        questions,
        setQuestions,
      ]
    )

    const changeQuestionType = (
      nextType
    ) => {
      updateQuestion(
        selectedPosition,
        (question) => {
          const currentPreview =
            question.mediaPreviewUrl

          if (
            currentPreview?.startsWith(
              'blob:'
            )
          ) {
            URL.revokeObjectURL(
              currentPreview
            )
          }

          const shouldClearMedia =
            question.questionType !==
              nextType &&
            [
              'image',
              'audio',
            ].includes(
              question.questionType
            )

          return {
            ...question,

            questionType:
              nextType,

            mediaFile:
              null,

            mediaUrl:
              shouldClearMedia
                ? ''
                : question.mediaUrl,

            mediaPreviewUrl:
              shouldClearMedia
                ? ''
                : question.mediaUrl,

            removedMediaPath:
              shouldClearMedia
                ? question.mediaPath ||
                  question.removedMediaPath
                : question.removedMediaPath,

            mediaPath:
              shouldClearMedia
                ? ''
                : question.mediaPath,

            options:
              nextType === 'true-false'
                ? getTrueFalseOptions(
                    language
                  )
                : question.questionType ===
                    'true-false'
                  ? [
                      '',
                      '',
                      '',
                      '',
                    ]
                  : Array.from(
                      {
                        length: 4,
                      },
                      (_, index) =>
                        question.options[
                          index
                        ] || ''
                    ),

            correctIndex:
              0,
          }
        }
      )
    }

    const chooseMedia = (file) => {
      if (!file) {
        return
      }

      const fileName = String(
        file.name || ''
      ).toLowerCase()

      const isExpectedType =
        selectedQuestion.questionType ===
        'image'
          ? file.type.startsWith(
              'image/'
            ) ||
            /\.(jpg|jpeg|png|webp|gif)$/.test(
              fileName
            )
          : file.type.startsWith(
              'audio/'
            ) ||
            /\.(mp3|wav|ogg|m4a|mp4|webm|aac)$/.test(
              fileName
            )

      if (!isExpectedType) {
        setMessage(
          selectedQuestion.questionType ===
            'image'
            ? 'Choose an image file.'
            : 'Choose an audio file.'
        )

        setMessageType('error')
        return
      }

      const maxBytes =
        selectedQuestion.questionType ===
        'image'
          ? 8 * 1024 * 1024
          : 20 * 1024 * 1024

      if (file.size > maxBytes) {
        setMessage(
          selectedQuestion.questionType ===
            'image'
            ? 'Images must be 8 MB or smaller.'
            : 'Audio files must be 20 MB or smaller.'
        )

        setMessageType('error')
        return
      }

      updateQuestion(
        selectedPosition,
        (question) => {
          if (
            question.mediaPreviewUrl?.startsWith(
              'blob:'
            )
          ) {
            URL.revokeObjectURL(
              question.mediaPreviewUrl
            )
          }

          return {
            ...question,

            mediaFile:
              file,

            mediaPreviewUrl:
              URL.createObjectURL(file),

            removedMediaPath:
              question.mediaPath ||
              question.removedMediaPath,
          }
        }
      )
    }

    const removeMedia = () => {
      updateQuestion(
        selectedPosition,
        (question) => {
          if (
            question.mediaPreviewUrl?.startsWith(
              'blob:'
            )
          ) {
            URL.revokeObjectURL(
              question.mediaPreviewUrl
            )
          }

          return {
            ...question,

            mediaFile:
              null,

            mediaUrl:
              '',

            mediaPreviewUrl:
              '',

            removedMediaPath:
              question.mediaPath ||
              question.removedMediaPath,

            mediaPath:
              '',
          }
        }
      )
    }

    const handleSave = useCallback(
      async (
        continueToPreview = false
      ) => {
        const result =
          validateClassicQuestions(
            questions
          )

        if (
          continueToPreview &&
          !result.valid
        ) {
          const missingCount =
            result.invalid.length

          setSelectedPosition(
            result.firstInvalidPosition ||
              1
          )

          setMessage(
            `Complete all ${CLASSIC_QUESTION_COUNT} questions before Preview. ${missingCount} ${
              missingCount === 1
                ? 'question still needs attention.'
                : 'questions still need attention.'
            }`
          )

          setMessageType('error')
          return false
        }

        setSaving(true)
        setMessage('')
        setMessageType('')

        reportStatus(
          dirty,
          true
        )

        const pathsToRemove = []

        try {
          const preparedQuestions = []

          for (const question of questions) {
            let nextQuestion = {
              ...question,
            }

            if (question.mediaFile) {
              const uploaded =
                await uploadStudioQuestionMedia(
                  {
                    gameId,

                    position:
                      question.position,

                    questionType:
                      question.questionType,

                    file:
                      question.mediaFile,
                  }
                )

              if (
                question.removedMediaPath
              ) {
                pathsToRemove.push(
                  question.removedMediaPath
                )
              }

              nextQuestion = {
                ...nextQuestion,

                mediaUrl:
                  uploaded.url,

                mediaPath:
                  uploaded.path,

                mediaPreviewUrl:
                  uploaded.url,

                mediaFile:
                  null,

                removedMediaPath:
                  '',
              }
            } else if (
              question.removedMediaPath
            ) {
              pathsToRemove.push(
                question.removedMediaPath
              )

              nextQuestion = {
                ...nextQuestion,

                removedMediaPath:
                  '',
              }
            }

            preparedQuestions.push(
              nextQuestion
            )
          }

          await saveStudioQuestions({
            gameId,
            user,
            role,

            questions:
              preparedQuestions,
          })

          for (
            const oldPath of [
              ...new Set(
                pathsToRemove
              ),
            ]
          ) {
            await removeStudioQuestionMedia(
              oldPath
            )
          }

          onQuestionsChange(
            preparedQuestions
          )

          setDirty(false)

          setMessage(
            continueToPreview
              ? 'Questions saved. Opening Preview...'
              : result.valid
                ? 'All 10 questions were saved.'
                : `Question draft saved. ${completedCount}/${CLASSIC_QUESTION_COUNT} questions are ready.`
          )

          setMessageType(
            'success'
          )

          reportStatus(
            false,
            false
          )

          onSaved?.(
            preparedQuestions
          )

          if (continueToPreview) {
            await onContinuePreview?.(
              preparedQuestions
            )
          }

          return true
        } catch (error) {
          console.error(error)

          setMessage(
            error?.message ||
              'Could not save the questions.'
          )

          setMessageType('error')

          reportStatus(
            true,
            false
          )

          return false
        } finally {
          setSaving(false)
        }
      },
      [
        completedCount,
        dirty,
        gameId,
        onContinuePreview,
        onQuestionsChange,
        onSaved,
        questions,
        reportStatus,
        role,
        user,
      ]
    )

    useImperativeHandle(
      ref,
      () => ({
        save:
          handleSave,
      }),
      [
        handleSave,
      ]
    )

    if (loading) {
      return (
        <div className="studio-questions-loading">
          <span />

          <strong>
            Loading questions...
          </strong>

          <small>
            Preparing the 10 Classic Quiz slots.
          </small>
        </div>
      )
    }

    return (
      <div className="studio-questions-workspace">
        <aside className="studio-question-navigator">
          <header>
            <span>
              Classic Quiz
            </span>

            <strong>
              {completedCount}/
              {CLASSIC_QUESTION_COUNT}
            </strong>

            <small>
              Questions complete
            </small>
          </header>

          <div className="studio-question-progress-track">
            <i
              style={{
                width: `${
                  (
                    completedCount /
                    CLASSIC_QUESTION_COUNT
                  ) * 100
                }%`,
              }}
            />
          </div>

          <div className="studio-question-number-list">
            {questions.map(
              (question) => {
                const complete =
                  isStudioQuestionComplete(
                    question
                  )

                const active =
                  selectedPosition ===
                  question.position

                return (
                  <button
                    key={
                      question.position
                    }
                    type="button"
                    className={[
                      active
                        ? 'active'
                        : '',

                      complete
                        ? 'complete'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      setSelectedPosition(
                        question.position
                      )
                    }
                  >
                    <span>
                      {String(
                        question.position
                      ).padStart(
                        2,
                        '0'
                      )}
                    </span>

                    <div>
                      <strong>
                        Question{' '}
                        {
                          question.position
                        }
                      </strong>

                      <small>
                        {complete
                          ? 'Ready'
                          : 'Incomplete'}
                      </small>
                    </div>

                    <i>
                      {complete
                        ? '✓'
                        : '•'}
                    </i>
                  </button>
                )
              }
            )}
          </div>
        </aside>

        <main className="studio-question-editor-main">
          <section className="studio-question-editor-card">
            <header className="studio-question-editor-heading">
              <div>
                <span>
                  Question{' '}
                  {
                    selectedQuestion.position
                  }{' '}
                  of{' '}
                  {
                    CLASSIC_QUESTION_COUNT
                  }
                </span>

                <h2>
                  Build the question
                </h2>

                <p>
                  Choose the format, add the prompt and mark one correct answer.
                </p>
              </div>

              <div
                className={`studio-question-readiness ${
                  selectedErrors.length
                    ? ''
                    : 'ready'
                }`}
              >
                {selectedErrors.length
                  ? `${
                      selectedErrors.length
                    } ${
                      selectedErrors.length ===
                      1
                        ? 'item'
                        : 'items'
                    } missing`
                  : 'Ready'}
              </div>
            </header>

            <div className="studio-question-section">
              <div className="studio-question-section-title">
                <span>01</span>

                <div>
                  <strong>
                    Question Type
                  </strong>

                  <small>
                    Classic supports text, image, audio and True / False.
                  </small>
                </div>
              </div>

              <div className="studio-question-type-grid">
                {STUDIO_QUESTION_TYPES.map(
                  (type) => (
                    <button
                      key={type.id}
                      type="button"
                      className={
                        selectedQuestion.questionType ===
                        type.id
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        changeQuestionType(
                          type.id
                        )
                      }
                    >
                      <span>
                        {type.icon}
                      </span>

                      <strong>
                        {type.title}
                      </strong>

                      <small>
                        {
                          type.description
                        }
                      </small>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="studio-question-section">
              <div className="studio-question-section-title">
                <span>02</span>

                <div>
                  <strong>
                    Question Prompt
                  </strong>

                  <small>
                    Write a clear question or statement.
                  </small>
                </div>
              </div>

              <label className="studio-question-field">
                <span>
                  Prompt

                  <small>
                    {
                      selectedQuestion
                        .prompt.length
                    }
                    /240
                  </small>
                </span>

                <textarea
                  rows={4}
                  maxLength={240}
                  value={
                    selectedQuestion.prompt
                  }
                  placeholder="Example: What must the agent receive before starting a transfer?"
                  onChange={(event) =>
                    updateQuestion(
                      selectedPosition,
                      {
                        prompt:
                          event.target
                            .value,
                      }
                    )
                  }
                />
              </label>
            </div>

            {[
              'image',
              'audio',
            ].includes(
              selectedQuestion.questionType
            ) && (
              <div className="studio-question-section">
                <div className="studio-question-section-title">
                  <span>03</span>

                  <div>
                    <strong>
                      {selectedQuestion.questionType ===
                      'image'
                        ? 'Question Image'
                        : 'Question Audio'}
                    </strong>

                    <small>
                      {selectedQuestion.questionType ===
                      'image'
                        ? 'PNG, JPG, WEBP or GIF. Maximum 8 MB.'
                        : 'MP3, WAV, OGG, MP4 or WEBM. Maximum 20 MB.'}
                    </small>
                  </div>
                </div>

                <div className="studio-question-media-uploader">
                  {selectedQuestion.mediaPreviewUrl ||
                  selectedQuestion.mediaUrl ? (
                    <>
                      <QuestionMedia
                        question={
                          selectedQuestion
                        }
                      />

                      <div className="studio-question-media-actions">
                        <label>
                          Replace file

                          <input
                            type="file"
                            accept={
                              selectedQuestion.questionType ===
                              'image'
                                ? 'image/*'
                                : 'audio/*'
                            }
                            onChange={(event) =>
                              chooseMedia(
                                event.target
                                  .files?.[0]
                              )
                            }
                          />
                        </label>

                        <button
                          type="button"
                          onClick={
                            removeMedia
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="studio-question-upload-dropzone">
                      <span>
                        {selectedQuestion.questionType ===
                        'image'
                          ? '🖼️'
                          : '🎧'}
                      </span>

                      <strong>
                        Upload{' '}
                        {selectedQuestion.questionType ===
                        'image'
                          ? 'an image'
                          : 'an audio clip'}
                      </strong>

                      <small>
                        Click to choose a file from your computer.
                      </small>

                      <input
                        type="file"
                        accept={
                          selectedQuestion.questionType ===
                          'image'
                            ? 'image/*'
                            : 'audio/*'
                        }
                        onChange={(event) =>
                          chooseMedia(
                            event.target
                              .files?.[0]
                          )
                        }
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="studio-question-section">
              <div className="studio-question-section-title">
                <span>
                  {[
                    'image',
                    'audio',
                  ].includes(
                    selectedQuestion.questionType
                  )
                    ? '04'
                    : '03'}
                </span>

                <div>
                  <strong>
                    Answers
                  </strong>

                  <small>
                    Complete every answer and select the correct one.
                  </small>
                </div>
              </div>

              <div
                className={`studio-question-answer-editor ${
                  selectedQuestion.questionType ===
                  'true-false'
                    ? 'studio-question-answer-editor--two'
                    : ''
                }`}
              >
                {selectedQuestion.options.map(
                  (
                    option,
                    optionIndex
                  ) => (
                    <div
                      key={
                        optionIndex
                      }
                      className={`studio-question-answer-row ${
                        selectedQuestion.correctIndex ===
                        optionIndex
                          ? 'correct'
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Mark answer ${
                          optionIndex + 1
                        } as correct`}
                        onClick={() =>
                          updateQuestion(
                            selectedPosition,
                            {
                              correctIndex:
                                optionIndex,
                            }
                          )
                        }
                      >
                        <span>
                          {OPTION_META[
                            optionIndex
                          ]?.shape ||
                            '●'}
                        </span>

                        <i>
                          {selectedQuestion.correctIndex ===
                          optionIndex
                            ? '✓'
                            : ''}
                        </i>
                      </button>

                      <label>
                        <span>
                          {
                            OPTION_META[
                              optionIndex
                            ]?.letter
                          }
                        </span>

                        <input
                          type="text"
                          maxLength={140}
                          disabled={
                            selectedQuestion.questionType ===
                            'true-false'
                          }
                          value={
                            option
                          }
                          placeholder={`Answer ${
                            optionIndex + 1
                          }`}
                          onChange={(event) => {
                            const nextOptions = [
                              ...selectedQuestion.options,
                            ]

                            nextOptions[
                              optionIndex
                            ] =
                              event.target.value

                            updateQuestion(
                              selectedPosition,
                              {
                                options:
                                  nextOptions,
                              }
                            )
                          }}
                        />
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="studio-question-section">
              <div className="studio-question-section-title">
                <span>
                  {[
                    'image',
                    'audio',
                  ].includes(
                    selectedQuestion.questionType
                  )
                    ? '05'
                    : '04'}
                </span>

                <div>
                  <strong>
                    Explanation
                  </strong>

                  <small>
                    Optional feedback shown after the answer.
                  </small>
                </div>
              </div>

              <label className="studio-question-field">
                <span>
                  Explanation

                  <small>
                    {
                      selectedQuestion
                        .explanation.length
                    }
                    /300
                  </small>
                </span>

                <textarea
                  rows={3}
                  maxLength={300}
                  value={
                    selectedQuestion.explanation
                  }
                  placeholder="Explain why the selected answer is correct."
                  onChange={(event) =>
                    updateQuestion(
                      selectedPosition,
                      {
                        explanation:
                          event.target
                            .value,
                      }
                    )
                  }
                />
              </label>
            </div>

            {selectedErrors.length > 0 && (
              <div className="studio-question-inline-errors">
                <strong>
                  Finish this question:
                </strong>

                {selectedErrors.map(
                  (error) => (
                    <span key={error}>
                      • {error}
                    </span>
                  )
                )}
              </div>
            )}
          </section>

          {message && (
            <div
              className={`studio-builder-message ${
                messageType === 'success'
                  ? 'studio-builder-message--success'
                  : 'studio-builder-message--error'
              }`}
            >
              <span>
                {messageType === 'success'
                  ? '✓'
                  : '!'}
              </span>

              {message}
            </div>
          )}

          <footer className="studio-builder-form-footer">
            <div>
              <span>
                Next step
              </span>

              <strong>
                Preview the complete game
              </strong>
            </div>

            <div>
              <button
                type="button"
                className="studio-builder-footer-secondary"
                onClick={onBack}
              >
                Back to Settings
              </button>

              <button
                type="button"
                className="studio-builder-footer-secondary"
                disabled={saving}
                onClick={() =>
                  handleSave(false)
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save Questions'}
              </button>

              <button
                type="button"
                className="studio-builder-footer-primary"
                disabled={
                  saving ||
                  !validation.valid
                }
                onClick={() =>
                  handleSave(true)
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save & Preview'}
              </button>
            </div>
          </footer>
        </main>

        <aside className="studio-question-live-preview">
          <div>
            <span className="studio-section-eyebrow">
              Live Preview
            </span>

            <h2>
              Question{' '}
              {
                selectedQuestion.position
              }
            </h2>

            <article className="studio-question-mini-card">
              <header>
                <span>
                  {
                    STUDIO_QUESTION_TYPES.find(
                      (type) =>
                        type.id ===
                        selectedQuestion.questionType
                    )?.title
                  }
                </span>

                <strong>
                  {
                    settings.defaultTimer
                  }
                  s
                </strong>
              </header>

              <QuestionMedia
                question={
                  selectedQuestion
                }
                compact
              />

              <h3>
                {selectedQuestion.prompt.trim() ||
                  'Your question will appear here.'}
              </h3>

              <div
                className={`studio-question-mini-options ${
                  selectedQuestion.questionType ===
                  'true-false'
                    ? 'two'
                    : ''
                }`}
              >
                {selectedQuestion.options.map(
                  (
                    option,
                    optionIndex
                  ) => (
                    <div
                      key={
                        optionIndex
                      }
                      className={
                        selectedQuestion.correctIndex ===
                        optionIndex
                          ? 'correct'
                          : ''
                      }
                    >
                      <span>
                        {
                          OPTION_META[
                            optionIndex
                          ]?.shape
                        }
                      </span>

                      <p>
                        {option.trim() ||
                          `Answer ${
                            optionIndex + 1
                          }`}
                      </p>
                    </div>
                  )
                )}
              </div>

              <footer>
                <span>
                  {
                    settings.pointsPerQuestion
                  }{' '}
                  points
                </span>

                <span>
                  {settings.livesEnabled
                    ? `❤️ ${settings.livesCount}`
                    : 'Classic'}
                </span>
              </footer>
            </article>

            <div className="studio-question-preview-note">
              <strong>
                {completedCount}/
                {CLASSIC_QUESTION_COUNT}
              </strong>

              <span>
                questions ready
              </span>
            </div>
          </div>
        </aside>
      </div>
    )
  }
)

export default StudioQuestionsEditor