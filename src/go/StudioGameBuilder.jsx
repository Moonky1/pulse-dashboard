import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  getStudioQuestions,
  markStudioGameStep,
  saveStudioGameDraft,
  saveStudioGameSettings,
} from './studioGamesApi'
import {
  createClassicQuestionSet,
  validateClassicQuestions,
} from './studioQuestionUtils'
import StudioQuestionsEditor from './StudioQuestionsEditor'
import StudioGamePreview from './StudioGamePreview'
import './StudioGameBuilder.css'

const LANGUAGE_OPTIONS = [
  {
    value: 'en',
    label: 'English',
    description:
      'Questions and answers in English.',
    icon: '🇺🇸',
  },
  {
    value: 'es',
    label: 'Spanish',
    description:
      'Preguntas y respuestas en español.',
    icon: '🇲🇽',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description:
      'English and Spanish questions.',
    icon: '🔀',
  },
]

const TEAM_OPTIONS = [
  {
    value: 'global',
    label: 'All Teams',
  },
  {
    value: 'philippines',
    label: 'Philippines',
  },
  {
    value: 'venezuela',
    label: 'Venezuela',
  },
  {
    value: 'colombia',
    label: 'Colombia',
  },
  {
    value: 'mexico',
    label: 'Mexico BJ',
  },
  {
    value: 'central',
    label: 'Central America',
  },
  {
    value: 'asia',
    label: 'Asia',
  },
]

const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    description:
      'Only you can access and continue editing it.',
    icon: '🔒',
  },
  {
    value: 'team',
    label: 'My Team',
    description:
      'Visible to authorized creators from the selected team.',
    icon: '👥',
  },
  {
    value: 'global',
    label: 'All Kampaign Kings',
    description:
      'Available in the shared Studio library.',
    icon: '🌐',
  },
]

const COVER_OPTIONS = [
  '🎮',
  '🧠',
  '🎧',
  '🛡️',
  '🚗',
  '🏆',
]

const TIMER_OPTIONS = [
  10,
  15,
  20,
  30,
  45,
  60,
]

const POINT_OPTIONS = [
  500,
  750,
  1000,
  1500,
  2000,
]

const STEP_CONTENT = {
  1: {
    title: 'Game Details',
    description:
      'Create the identity of your game before adding settings and questions.',
  },
  2: {
    title: 'Game Settings',
    description:
      'Control timing, scoring and game behavior before adding questions.',
  },
  3: {
    title: 'Questions',
    description:
      'Build the 10 questions used by this Classic Quiz.',
  },
  4: {
    title: 'Preview',
    description:
      'Play through the complete game before publishing it.',
  },
}

function getInitials(name) {
  const parts = String(
    name || 'Pulse Creator'
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'P'

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase()
}

function formatSavedTime(date) {
  if (!date) return ''

  return new Intl.DateTimeFormat(
    'en',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  ).format(date)
}

function ToggleSetting({
  active,
  title,
  description,
  label,
  onToggle,
}) {
  return (
    <button
      type="button"
      className={`studio-builder-setting-row ${
        active ? 'active' : ''
      }`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>

      <div className="studio-builder-setting-control">
        <span>
          {active ? label : 'Off'}
        </span>

        <i className="studio-builder-switch">
          <b />
        </i>
      </div>
    </button>
  )
}

export default function StudioGameBuilder({
  user,
  role,
  teamLabel,
  steps,
  initialGame = null,
  onSaved,
  onExit,
}) {
  const questionsEditorRef =
    useRef(null)

  const initialTeam = useMemo(() => {
    const savedTeam = String(
      user?.team || ''
    ).toLowerCase()

    return TEAM_OPTIONS.some(
      (item) =>
        item.value === savedTeam
    )
      ? savedTeam
      : 'global'
  }, [user])

  const initialStep = Math.min(
    4,
    Math.max(
      1,
      Number(
        initialGame?.currentStep ||
          1
      )
    )
  )

  const [activeStep, setActiveStep] =
    useState(initialStep)

  const [
    furthestStep,
    setFurthestStep,
  ] = useState(initialStep)

  const [form, setForm] =
    useState(() => ({
      gameMode:
        initialGame?.gameMode ||
        'classic',

      title:
        initialGame?.title || '',

      description:
        initialGame?.description ||
        '',

      language:
        initialGame?.language ||
        'en',

      team:
        initialGame?.team ||
        initialTeam,

      visibility:
        initialGame?.visibility ||
        (role?.id === 'global'
          ? 'global'
          : 'team'),

      coverEmoji:
        initialGame?.coverEmoji ||
        '🎮',
    }))

  const [settings, setSettings] =
    useState(() => ({
      defaultTimer: Number(
        initialGame?.defaultTimer ||
          30
      ),

      pointsPerQuestion: Number(
        initialGame?.pointsPerQuestion ||
          1000
      ),

      randomizeQuestions:
        Boolean(
          initialGame?.randomizeQuestions
        ),

      randomizeAnswers:
        Boolean(
          initialGame?.randomizeAnswers
        ),

      showExplanations:
        initialGame?.showExplanations !==
        false,

      livesEnabled:
        Boolean(
          initialGame?.livesEnabled
        ),

      livesCount: Number(
        initialGame?.livesCount ||
          3
      ),
    }))

  const [gameId, setGameId] =
    useState(
      initialGame?.id || null
    )

  const [saving, setSaving] =
    useState(false)

  const [
    detailsDirty,
    setDetailsDirty,
  ] = useState(false)

  const [
    settingsDirty,
    setSettingsDirty,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [
    questionsLoading,
    setQuestionsLoading,
  ] = useState(
    Boolean(initialGame?.id)
  )

  const [
    questionsLoadError,
    setQuestionsLoadError,
  ] = useState('')

  const [questions, setQuestions] =
    useState(() =>
      createClassicQuestionSet(
        [],
        initialGame?.language ||
          'en'
      )
    )

  const [
    questionsStatus,
    setQuestionsStatus,
  ] = useState({
    dirty: false,
    saving: false,
    complete: false,
    completedCount: 0,
  })

  const [savedAt, setSavedAt] =
    useState(() =>
      initialGame?.updatedAt
        ? new Date(
            initialGame.updatedAt
          )
        : null
    )

  useEffect(() => {
    let cancelled = false

    if (!gameId) {
      setQuestions(
        createClassicQuestionSet(
          [],
          form.language
        )
      )
      setQuestionsLoading(false)
      setQuestionsLoadError('')
      return undefined
    }

    setQuestionsLoading(true)
    setQuestionsLoadError('')

    getStudioQuestions({
      gameId,
      user,
      role,
    })
      .then((rows) => {
        if (cancelled) return

        const nextQuestions =
          createClassicQuestionSet(
            rows,
            form.language
          )

        const validation =
          validateClassicQuestions(
            nextQuestions
          )

        setQuestions(
          nextQuestions
        )

        setQuestionsStatus({
          dirty: false,
          saving: false,
          complete:
            validation.valid,
          completedCount:
            validation.valid
              ? 10
              : 0,
        })

        if (
          rows.length === 10 &&
          validation.valid
        ) {
          setFurthestStep(
            (current) =>
              Math.max(
                current,
                3
              )
          )
        }
      })
      .catch(
        (loadError) => {
          if (cancelled) return

          console.error(
            loadError
          )

          setQuestionsLoadError(
            loadError?.message ||
              'Could not load the questions.'
          )

          setQuestions(
            createClassicQuestionSet(
              [],
              form.language
            )
          )
        }
      )
      .finally(() => {
        if (!cancelled) {
          setQuestionsLoading(
            false
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    gameId,
    role,
    user,
  ])

  const selectedLanguage =
    LANGUAGE_OPTIONS.find(
      (item) =>
        item.value ===
        form.language
    ) ||
    LANGUAGE_OPTIONS[0]

  const selectedTeam =
    TEAM_OPTIONS.find(
      (item) =>
        item.value === form.team
    ) ||
    TEAM_OPTIONS[0]

  const selectedVisibility =
    VISIBILITY_OPTIONS.find(
      (item) =>
        item.value ===
        form.visibility
    ) ||
    VISIBILITY_OPTIONS[0]

  const previewTitle =
    form.title.trim() ||
    'Untitled Game'

  const previewDescription =
    form.description.trim() ||
    'Your game description will appear here.'

  const questionValidation =
    useMemo(
      () =>
        validateClassicQuestions(
          questions
        ),
      [questions]
    )

  const activeDirty =
    activeStep === 1
      ? detailsDirty
      : activeStep === 2
        ? settingsDirty
        : activeStep === 3
          ? questionsStatus.dirty
          : false

  const activeSaving =
    saving ||
    (activeStep === 3 &&
      questionsStatus.saving)

  const canSaveDetails =
    form.title.trim().length >=
      3 &&
    !saving

  const canSaveSettings =
    Boolean(gameId) &&
    !saving

  const handleQuestionsStatus =
    useCallback((nextStatus) => {
      setQuestionsStatus(
        (current) => {
          if (
            current.dirty ===
              nextStatus.dirty &&
            current.saving ===
              nextStatus.saving &&
            current.complete ===
              nextStatus.complete &&
            current.completedCount ===
              nextStatus.completedCount
          ) {
            return current
          }

          return nextStatus
        }
      )
    }, [])

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setDetailsDirty(true)
    setError('')
  }

  const updateSetting = (
    field,
    value
  ) => {
    setSettings(
      (current) => ({
        ...current,
        [field]: value,
      })
    )

    setSettingsDirty(true)
    setError('')
  }

  const createSavedGame = ({
    savedGameId = gameId,
    savedDate = new Date(),
    currentStep =
      furthestStep,
  } = {}) => ({
    ...initialGame,

    id:
      savedGameId,

    gameMode:
      form.gameMode,

    title:
      form.title.trim(),

    description:
      form.description.trim(),

    language:
      form.language,

    team:
      form.team,

    visibility:
      form.visibility,

    coverEmoji:
      form.coverEmoji,

    status:
      initialGame?.status ||
      'draft',

    currentStep,

    defaultTimer:
      settings.defaultTimer,

    pointsPerQuestion:
      settings.pointsPerQuestion,

    randomizeQuestions:
      settings.randomizeQuestions,

    randomizeAnswers:
      settings.randomizeAnswers,

    showExplanations:
      settings.showExplanations,

    livesEnabled:
      settings.livesEnabled,

    livesCount:
      settings.livesCount,

    questionCount:
      questions.filter(
        (question) =>
          question.prompt.trim()
      ).length,

    playCount:
      initialGame?.playCount ||
      0,

    ownerName:
      user?.name ||
      'Pulse Creator',

    ownerRole:
      role?.id ||
      user?.role,

    ownerTeam:
      user?.team ||
      'global',

    updatedAt:
      savedDate.toISOString(),
  })

  const saveDetails = async ({
    continueToSettings = false,
  } = {}) => {
    if (
      form.title.trim().length <
      3
    ) {
      setError(
        'Add a game title with at least 3 characters.'
      )
      return null
    }

    setSaving(true)
    setError('')

    try {
      const savedGameId =
        await saveStudioGameDraft({
          gameId,
          user,
          role,
          form,
        })

      const savedDate =
        new Date()

      const savedStep =
        continueToSettings
          ? Math.max(
              furthestStep,
              2
            )
          : Math.max(
              furthestStep,
              1
            )

      const savedGame =
        createSavedGame({
          savedGameId,
          savedDate,
          currentStep:
            savedStep,
        })

      setGameId(
        savedGameId
      )

      setSavedAt(
        savedDate
      )

      setDetailsDirty(
        false
      )

      setFurthestStep(
        savedStep
      )

      if (
        continueToSettings
      ) {
        setActiveStep(2)
      }

      onSaved?.(
        savedGame
      )

      return savedGame
    } catch (saveError) {
      console.error(saveError)

      setError(
        saveError?.message ||
          'Could not save this draft.'
      )

      return null
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async ({
    continueToQuestions = false,
  } = {}) => {
    if (!gameId) {
      setError(
        'Save Game Details before saving Game Settings.'
      )
      return null
    }

    setSaving(true)
    setError('')

    try {
      const savedGameId =
        await saveStudioGameSettings({
          gameId,
          user,
          role,
          settings,
        })

      const savedDate =
        new Date()

      const savedStep =
        Math.max(
          furthestStep,
          2
        )

      const savedGame =
        createSavedGame({
          savedGameId,
          savedDate,
          currentStep:
            savedStep,
        })

      setSavedAt(
        savedDate
      )

      setSettingsDirty(
        false
      )

      setFurthestStep(
        savedStep
      )

      if (
        continueToQuestions
      ) {
        setActiveStep(3)
      }

      onSaved?.(
        savedGame
      )

      return savedGame
    } catch (saveError) {
      console.error(saveError)

      setError(
        saveError?.message ||
          'Could not save the game settings.'
      )

      return null
    } finally {
      setSaving(false)
    }
  }

  const handleQuestionsSaved =
    useCallback(
      (
        savedQuestions
      ) => {
        const savedDate =
          new Date()

        setQuestions(
          savedQuestions
        )

        setSavedAt(
          savedDate
        )

        setFurthestStep(
          (current) =>
            Math.max(
              current,
              3
            )
        )

        const savedGame =
          createSavedGame({
            savedDate,
            currentStep:
              Math.max(
                furthestStep,
                3
              ),
          })

        onSaved?.(
          savedGame
        )
      },
      [
        createSavedGame,
        furthestStep,
        onSaved,
      ]
    )

  const openPreview =
    useCallback(
      async (
        savedQuestions =
          questions
      ) => {
        if (
          !questionValidation.valid
        ) {
          setError(
            'Complete and save all 10 questions before opening Preview.'
          )
          return
        }

        try {
          await markStudioGameStep({
            gameId,
            user,
            role,
            step: 4,
          })

          const savedDate =
            new Date()

          setQuestions(
            savedQuestions
          )

          setSavedAt(
            savedDate
          )

          setFurthestStep(
            (current) =>
              Math.max(
                current,
                4
              )
          )

          setActiveStep(4)
          setError('')

          onSaved?.(
            createSavedGame({
              savedDate,
              currentStep: 4,
            })
          )
        } catch (
          previewError
        ) {
          console.error(
            previewError
          )

          setError(
            previewError?.message ||
              'Could not open Preview.'
          )
        }
      },
      [
        createSavedGame,
        gameId,
        onSaved,
        questionValidation.valid,
        questions,
        role,
        user,
      ]
    )

  const handleDetailsSubmit =
    async (event) => {
      event.preventDefault()

      await saveDetails({
        continueToSettings: true,
      })
    }

  const handleSettingsSubmit =
    async (event) => {
      event.preventDefault()

      await saveSettings({
        continueToQuestions: true,
      })
    }

  const isStepAvailable = (
    stepNumber
  ) => {
    if (stepNumber === 1) {
      return true
    }

    if (
      stepNumber === 2
    ) {
      return Boolean(gameId)
    }

    if (
      stepNumber === 3
    ) {
      return (
        Boolean(gameId) &&
        furthestStep >= 2
      )
    }

    if (
      stepNumber === 4
    ) {
      return (
        Boolean(gameId) &&
        furthestStep >= 3 &&
        questionValidation.valid
      )
    }

    return false
  }

  const openBuilderStep =
    async (stepNumber) => {
      if (
        !isStepAvailable(
          stepNumber
        )
      ) {
        return
      }

      if (
        stepNumber > 1 &&
        detailsDirty
      ) {
        setError(
          'Save your Game Details before continuing.'
        )
        return
      }

      if (
        stepNumber > 2 &&
        settingsDirty
      ) {
        setError(
          'Save your Game Settings before continuing.'
        )
        return
      }

      if (
        stepNumber === 4
      ) {
        if (
          questionsStatus.dirty
        ) {
          setError(
            'Save your Questions before opening Preview.'
          )
          return
        }

        await openPreview(
          questions
        )
        return
      }

      setActiveStep(
        stepNumber
      )

      setError('')
    }

  const getStepClassName = (
    stepNumber
  ) => {
    const classes = [
      'studio-builder-progress-step',
    ]

    if (
      stepNumber === activeStep
    ) {
      classes.push(
        'studio-builder-progress-step--active'
      )
    } else if (
      stepNumber === 3 &&
      furthestStep >= 3 &&
      !questionValidation.valid
    ) {
      classes.push(
        'studio-builder-progress-step--available'
      )
    } else if (
      stepNumber <=
      furthestStep
    ) {
      classes.push(
        'studio-builder-progress-step--complete'
      )
    } else if (
      isStepAvailable(
        stepNumber
      )
    ) {
      classes.push(
        'studio-builder-progress-step--available'
      )
    } else {
      classes.push(
        'studio-builder-progress-step--locked'
      )
    }

    return classes.join(' ')
  }

  const getStepStatus = (
    stepNumber
  ) => {
    if (
      stepNumber === activeStep
    ) {
      return 'In progress'
    }

    if (
      stepNumber <=
      furthestStep
    ) {
      if (
        stepNumber === 3 &&
        !questionValidation.valid
      ) {
        return 'Draft saved'
      }

      return stepNumber === 4
        ? 'Preview ready'
        : 'Completed'
    }

    if (
      isStepAvailable(
        stepNumber
      )
    ) {
      return 'Available'
    }

    if (
      stepNumber === 2
    ) {
      return 'Save details first'
    }

    if (
      stepNumber === 3
    ) {
      return 'Save settings first'
    }

    if (
      stepNumber === 4
    ) {
      return 'Save 10 questions'
    }

    return 'Coming next'
  }

  const handleTopSave =
    async () => {
      if (
        activeStep === 1
      ) {
        await saveDetails()
        return
      }

      if (
        activeStep === 2
      ) {
        await saveSettings()
        return
      }

      if (
        activeStep === 3
      ) {
        await questionsEditorRef.current?.save(
          false
        )
      }
    }

  const topButtonDisabled =
    activeStep === 1
      ? !canSaveDetails
      : activeStep === 2
        ? !canSaveSettings
        : activeStep === 3
          ? questionsStatus.saving
          : true

  const topButtonLabel =
    activeSaving
      ? 'Saving...'
      : activeStep === 1
        ? gameId
          ? 'Save Changes'
          : 'Save Draft'
        : activeStep === 2
          ? 'Save Settings'
          : activeStep === 3
            ? 'Save Questions'
            : 'Preview Mode'

  const renderDetailsStep =
    () => (
      <div className="studio-game-builder-layout">
        <form
          className="studio-game-details-form"
          onSubmit={
            handleDetailsSubmit
          }
        >
          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>01</span>

              <div>
                <h2>
                  Basic Information
                </h2>

                <p>
                  Give the game a
                  recognizable name and
                  explain what agents will
                  practice.
                </p>
              </div>
            </div>

            <label className="studio-builder-field">
              <span>
                Game Title

                <small>
                  {form.title.length}
                  /90
                </small>
              </span>

              <input
                type="text"
                value={
                  form.title
                }
                maxLength={90}
                placeholder="Example: Asia Invalid XFER Challenge"
                onChange={(
                  event
                ) =>
                  updateField(
                    'title',
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label className="studio-builder-field">
              <span>
                Description

                <small>
                  {
                    form.description
                      .length
                  }
                  /280
                </small>
              </span>

              <textarea
                value={
                  form.description
                }
                maxLength={280}
                rows={5}
                placeholder="Explain what this game teaches and what agents should focus on."
                onChange={(
                  event
                ) =>
                  updateField(
                    'description',
                    event.target
                      .value
                  )
                }
              />
            </label>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>02</span>

              <div>
                <h2>Language</h2>

                <p>
                  Choose how questions
                  and answers will be
                  presented.
                </p>
              </div>
            </div>

            <div className="studio-builder-choice-grid studio-builder-language-grid">
              {LANGUAGE_OPTIONS.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    className={
                      form.language ===
                      option.value
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      updateField(
                        'language',
                        option.value
                      )
                    }
                  >
                    <span>
                      {
                        option.icon
                      }
                    </span>

                    <strong>
                      {
                        option.label
                      }
                    </strong>

                    <small>
                      {
                        option.description
                      }
                    </small>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>03</span>

              <div>
                <h2>Audience</h2>

                <p>
                  Select the team and
                  decide who can find the
                  game.
                </p>
              </div>
            </div>

            <label className="studio-builder-field">
              <span>
                Target Team
              </span>

              <div className="studio-builder-select-wrap">
                <select
                  value={
                    form.team
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      'team',
                      event.target
                        .value
                    )
                  }
                >
                  {TEAM_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>

                <i>⌄</i>
              </div>
            </label>

            <div className="studio-builder-visibility-grid">
              {VISIBILITY_OPTIONS.map(
                (option) => (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    className={
                      form.visibility ===
                      option.value
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      updateField(
                        'visibility',
                        option.value
                      )
                    }
                  >
                    <span>
                      {
                        option.icon
                      }
                    </span>

                    <div>
                      <strong>
                        {
                          option.label
                        }
                      </strong>

                      <small>
                        {
                          option.description
                        }
                      </small>
                    </div>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>04</span>

              <div>
                <h2>
                  Game Icon
                </h2>

                <p>
                  Choose a temporary
                  identity for the library
                  card.
                </p>
              </div>
            </div>

            <div className="studio-builder-cover-grid">
              {COVER_OPTIONS.map(
                (emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={
                      form.coverEmoji ===
                      emoji
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      updateField(
                        'coverEmoji',
                        emoji
                      )
                    }
                  >
                    {emoji}
                  </button>
                )
              )}
            </div>
          </section>

          {error && (
            <div className="studio-builder-message studio-builder-message--error">
              <span>!</span>
              {error}
            </div>
          )}

          {savedAt &&
            !detailsDirty &&
            !error && (
              <div className="studio-builder-message studio-builder-message--success">
                <span>✓</span>

                <div>
                  <strong>
                    Draft saved
                  </strong>

                  <small>
                    Game ID:{' '}
                    {gameId
                      ?.slice(0, 8)
                      .toUpperCase()}
                  </small>
                </div>
              </div>
            )}

          <footer className="studio-builder-form-footer">
            <div>
              <span>
                Next step
              </span>

              <strong>
                Game Settings
              </strong>
            </div>

            <div>
              <button
                type="button"
                className="studio-builder-footer-secondary"
                onClick={onExit}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="studio-builder-footer-primary"
                disabled={
                  !canSaveDetails
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save & Continue'}
              </button>
            </div>
          </footer>
        </form>

        <aside className="studio-game-preview-column">
          <div className="studio-game-preview-sticky">
            <span className="studio-section-eyebrow">
              Live Preview
            </span>

            <h2>
              Library Card
            </h2>

            <article className="studio-game-preview-card">
              <div className="studio-game-preview-cover">
                <span>
                  {
                    form.coverEmoji
                  }
                </span>

                <i>Draft</i>
              </div>

              <div className="studio-game-preview-body">
                <div className="studio-game-preview-chips">
                  <span>
                    {
                      selectedLanguage.icon
                    }{' '}
                    {
                      selectedLanguage.label
                    }
                  </span>

                  <span>
                    {
                      selectedTeam.label
                    }
                  </span>
                </div>

                <h3>
                  {
                    previewTitle
                  }
                </h3>

                <p>
                  {
                    previewDescription
                  }
                </p>

                <div className="studio-game-preview-visibility">
                  <span>
                    {
                      selectedVisibility.icon
                    }
                  </span>

                  <div>
                    <strong>
                      {
                        selectedVisibility.label
                      }
                    </strong>

                    <small>
                      {form.visibility ===
                      'team'
                        ? selectedTeam.label
                        : selectedVisibility.description}
                    </small>
                  </div>
                </div>

                <div className="studio-game-preview-author">
                  <div
                    className={`studio-author-avatar studio-author-avatar--${role.id}`}
                  >
                    <span>
                      {getInitials(
                        user?.name
                      )}
                    </span>

                    <i />
                  </div>

                  <div>
                    <span>
                      Created by
                    </span>

                    <strong>
                      {user?.name ||
                        'Pulse Creator'}
                    </strong>

                    <small>
                      {teamLabel}
                    </small>
                  </div>

                  <span
                    className={`studio-role-badge studio-role-badge--${role.id}`}
                  >
                    {role.label}
                  </span>
                </div>
              </div>
            </article>

            <div className="studio-game-preview-note">
              <span>✦</span>

              <p>
                Save the game details to
                unlock timer, scoring and
                behavior settings.
              </p>
            </div>
          </div>
        </aside>
      </div>
    )

  const renderSettingsStep =
    () => (
      <div className="studio-game-builder-layout">
        <form
          className="studio-game-details-form"
          onSubmit={
            handleSettingsSubmit
          }
        >
          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>01</span>

              <div>
                <h2>
                  Default Timer
                </h2>

                <p>
                  Choose how many seconds
                  agents receive for each
                  question.
                </p>
              </div>
            </div>

            <div className="studio-builder-number-grid studio-builder-timer-grid">
              {TIMER_OPTIONS.map(
                (seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    className={
                      settings.defaultTimer ===
                      seconds
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      updateSetting(
                        'defaultTimer',
                        seconds
                      )
                    }
                  >
                    <strong>
                      {seconds}
                    </strong>

                    <small>
                      seconds
                    </small>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>02</span>

              <div>
                <h2>
                  Points per Question
                </h2>

                <p>
                  Set the base score
                  awarded for every
                  correct answer.
                </p>
              </div>
            </div>

            <div className="studio-builder-number-grid studio-builder-points-grid">
              {POINT_OPTIONS.map(
                (points) => (
                  <button
                    key={points}
                    type="button"
                    className={
                      settings.pointsPerQuestion ===
                      points
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      updateSetting(
                        'pointsPerQuestion',
                        points
                      )
                    }
                  >
                    <strong>
                      {points.toLocaleString(
                        'en-US'
                      )}
                    </strong>

                    <small>
                      points
                    </small>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>03</span>

              <div>
                <h2>
                  Game Behavior
                </h2>

                <p>
                  Control how questions,
                  answers and explanations
                  appear during a live
                  game.
                </p>
              </div>
            </div>

            <div className="studio-builder-settings-list">
              <ToggleSetting
                active={
                  settings.randomizeQuestions
                }
                title="Randomize Questions"
                description="Show questions in a different order for every game."
                label="On"
                onToggle={() =>
                  updateSetting(
                    'randomizeQuestions',
                    !settings.randomizeQuestions
                  )
                }
              />

              <ToggleSetting
                active={
                  settings.randomizeAnswers
                }
                title="Randomize Answers"
                description="Shuffle the answer positions for every question."
                label="On"
                onToggle={() =>
                  updateSetting(
                    'randomizeAnswers',
                    !settings.randomizeAnswers
                  )
                }
              />

              <ToggleSetting
                active={
                  settings.showExplanations
                }
                title="Show Explanations"
                description="Display the explanation after agents answer a question."
                label="On"
                onToggle={() =>
                  updateSetting(
                    'showExplanations',
                    !settings.showExplanations
                  )
                }
              />
            </div>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>04</span>

              <div>
                <h2>
                  Classic Quiz Rules
                </h2>

                <p>
                  Classic always uses
                  exactly 10 questions.
                  Lives Mode is optional.
                </p>
              </div>
            </div>

            <div className="studio-builder-settings-list">
              <div className="studio-builder-setting-row active">
                <div>
                  <strong>
                    10 Questions
                  </strong>

                  <small>
                    Fixed to match the
                    original Pulse GO
                    Classic Quiz.
                  </small>
                </div>

                <div className="studio-builder-setting-control">
                  <span>
                    Fixed
                  </span>
                </div>
              </div>

              <ToggleSetting
                active={
                  settings.livesEnabled
                }
                title="Lives Mode"
                description="A wrong answer removes one life. The game can end before Question 10 when no lives remain."
                label={`${
                  settings.livesCount
                } ${
                  settings.livesCount ===
                  1
                    ? 'Life'
                    : 'Lives'
                }`}
                onToggle={() =>
                  updateSetting(
                    'livesEnabled',
                    !settings.livesEnabled
                  )
                }
              />
            </div>

            {settings.livesEnabled && (
              <div className="studio-builder-number-grid studio-builder-points-grid">
                {[1, 2, 3, 4, 5].map(
                  (lives) => (
                    <button
                      key={lives}
                      type="button"
                      className={
                        settings.livesCount ===
                        lives
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        updateSetting(
                          'livesCount',
                          lives
                        )
                      }
                    >
                      <strong>
                        {lives}
                      </strong>

                      <small>
                        {lives === 1
                          ? 'life'
                          : 'lives'}
                      </small>
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {error && (
            <div className="studio-builder-message studio-builder-message--error">
              <span>!</span>
              {error}
            </div>
          )}

          {savedAt &&
            !settingsDirty &&
            !error && (
              <div className="studio-builder-message studio-builder-message--success">
                <span>✓</span>

                <div>
                  <strong>
                    Game settings saved
                  </strong>

                  <small>
                    Questions are now
                    available.
                  </small>
                </div>
              </div>
            )}

          <footer className="studio-builder-form-footer">
            <div>
              <span>
                Next step
              </span>

              <strong>
                Build 10 Questions
              </strong>
            </div>

            <div>
              <button
                type="button"
                className="studio-builder-footer-secondary"
                onClick={() =>
                  openBuilderStep(1)
                }
              >
                Back to Details
              </button>

              <button
                type="submit"
                className="studio-builder-footer-primary"
                disabled={
                  !canSaveSettings
                }
              >
                {saving
                  ? 'Saving...'
                  : 'Save & Continue'}
              </button>
            </div>
          </footer>
        </form>

        <aside className="studio-game-preview-column">
          <div className="studio-game-preview-sticky">
            <span className="studio-section-eyebrow">
              Live Configuration
            </span>

            <h2>
              Game Setup
            </h2>

            <article className="studio-settings-preview-card">
              <header>
                <div>
                  {
                    form.coverEmoji
                  }
                </div>

                <div>
                  <span>
                    Draft configuration
                  </span>

                  <h3>
                    {
                      previewTitle
                    }
                  </h3>

                  <small>
                    {
                      selectedTeam.label
                    }
                  </small>
                </div>
              </header>

              <div className="studio-settings-preview-metrics">
                <article>
                  <span>
                    Default timer
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
                    Correct answer
                  </span>

                  <strong>
                    {settings.pointsPerQuestion.toLocaleString(
                      'en-US'
                    )}
                  </strong>
                </article>
              </div>

              <div className="studio-settings-preview-behavior">
                <div>
                  <span>
                    Game mode
                  </span>

                  <strong>
                    Classic Quiz
                  </strong>
                </div>

                <div>
                  <span>
                    Questions
                  </span>

                  <strong>
                    10 · Fixed
                  </strong>
                </div>

                <div>
                  <span>
                    Random questions
                  </span>

                  <strong>
                    {settings.randomizeQuestions
                      ? 'Enabled'
                      : 'Disabled'}
                  </strong>
                </div>

                <div>
                  <span>
                    Random answers
                  </span>

                  <strong>
                    {settings.randomizeAnswers
                      ? 'Enabled'
                      : 'Disabled'}
                  </strong>
                </div>

                <div>
                  <span>
                    Answer explanations
                  </span>

                  <strong>
                    {settings.showExplanations
                      ? 'Enabled'
                      : 'Disabled'}
                  </strong>
                </div>

                <div>
                  <span>
                    Lives Mode
                  </span>

                  <strong>
                    {settings.livesEnabled
                      ? `${
                          settings.livesCount
                        } ${
                          settings.livesCount ===
                          1
                            ? 'Life'
                            : 'Lives'
                        }`
                      : 'Disabled'}
                  </strong>
                </div>
              </div>
            </article>

            <div className="studio-game-preview-note">
              <span>02</span>

              <p>
                Saving these settings
                unlocks the editor for all
                10 Classic Quiz questions.
              </p>
            </div>
          </div>
        </aside>
      </div>
    )

  const renderQuestionsStep =
    () => (
      <>
        {questionsLoadError && (
          <div className="studio-builder-message studio-builder-message--error">
            <span>!</span>
            {questionsLoadError}
          </div>
        )}

        {error && (
          <div className="studio-builder-message studio-builder-message--error">
            <span>!</span>
            {error}
          </div>
        )}

        <StudioQuestionsEditor
          ref={
            questionsEditorRef
          }
          gameId={gameId}
          user={user}
          role={role}
          language={
            form.language
          }
          settings={
            settings
          }
          questions={
            questions
          }
          loading={
            questionsLoading
          }
          onQuestionsChange={
            setQuestions
          }
          onStatusChange={
            handleQuestionsStatus
          }
          onSaved={
            handleQuestionsSaved
          }
          onBack={() =>
            openBuilderStep(2)
          }
          onContinuePreview={
            openPreview
          }
        />
      </>
    )

  const renderPreviewStep =
    () => {
      if (questionsLoading) {
        return (
          <div className="studio-questions-loading">
            <span />
            <strong>
              Loading Preview...
            </strong>
            <small>
              Preparing all 10 questions.
            </small>
          </div>
        )
      }

      if (!questionValidation.valid) {
        return (
          <div className="studio-builder-message studio-builder-message--error">
            <span>!</span>

            <div>
              <strong>
                Preview is not ready
              </strong>

              <small>
                Return to Questions and complete all 10 slots.
              </small>
            </div>
          </div>
        )
      }

      return (
        <>
          {error && (
            <div className="studio-builder-message studio-builder-message--error">
              <span>!</span>
              {error}
            </div>
          )}

          <StudioGamePreview
            game={
              createSavedGame({
                currentStep: 4,
              })
            }
            settings={
              settings
            }
            questions={
              questions
            }
            onBack={() =>
              setActiveStep(3)
            }
          />
        </>
      )
    }

  const activeContent =
    STEP_CONTENT[activeStep] ||
    STEP_CONTENT[1]

  return (
    <section className="studio-game-builder">
      <header className="studio-game-builder-header">
        <div>
          <button
            type="button"
            className="studio-game-builder-back"
            onClick={onExit}
          >
            ← Overview
          </button>

          <span className="studio-section-eyebrow">
            Game Builder · Step{' '}
            {activeStep} of 5
          </span>

          <h1>
            {
              activeContent.title
            }
          </h1>

          <p>
            {
              activeContent.description
            }
          </p>
        </div>

        <div className="studio-game-builder-header-actions">
          <div
            className={`studio-draft-state ${
              activeDirty
                ? 'studio-draft-state--unsaved'
                : ''
            }`}
          >
            <i />

            {activeSaving
              ? 'Saving...'
              : activeDirty
                ? 'Unsaved changes'
                : savedAt
                  ? `Saved ${formatSavedTime(
                      savedAt
                    )}`
                  : 'New draft'}
          </div>

          <button
            type="button"
            className="studio-builder-save-top"
            disabled={
              topButtonDisabled
            }
            onClick={
              handleTopSave
            }
          >
            {
              topButtonLabel
            }
          </button>
        </div>
      </header>

      <nav className="studio-builder-progress">
        {steps.map(
          (step, index) => {
            const stepNumber =
              index + 1

            const clickable =
              isStepAvailable(
                stepNumber
              )

            return (
              <button
                key={
                  step.number
                }
                type="button"
                className={getStepClassName(
                  stepNumber
                )}
                disabled={
                  !clickable
                }
                onClick={() =>
                  openBuilderStep(
                    stepNumber
                  )
                }
              >
                <span>
                  {
                    step.number
                  }
                </span>

                <div>
                  <strong>
                    {
                      step.title
                    }
                  </strong>

                  <small>
                    {getStepStatus(
                      stepNumber
                    )}
                  </small>
                </div>
              </button>
            )
          }
        )}
      </nav>

      {activeStep === 1 &&
        renderDetailsStep()}

      {activeStep === 2 &&
        renderSettingsStep()}

      {activeStep === 3 &&
        renderQuestionsStep()}

      {activeStep === 4 &&
        renderPreviewStep()}
    </section>
  )
}
