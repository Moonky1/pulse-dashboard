import { useMemo, useState } from 'react'
import {
  saveStudioGameDraft,
  saveStudioGameSettings,
} from './studioGamesApi'
import './StudioGameBuilder.css'

const LANGUAGE_OPTIONS = [
  {
    value: 'en',
    label: 'English',
    description: 'Questions and answers in English.',
    icon: '🇺🇸',
  },
  {
    value: 'es',
    label: 'Spanish',
    description: 'Preguntas y respuestas en español.',
    icon: '🇲🇽',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'English and Spanish questions.',
    icon: '🔀',
  },
]

const TEAM_OPTIONS = [
  { value: 'global', label: 'All Teams' },
  { value: 'philippines', label: 'Philippines' },
  { value: 'venezuela', label: 'Venezuela' },
  { value: 'colombia', label: 'Colombia' },
  { value: 'mexico', label: 'Mexico BJ' },
  { value: 'central', label: 'Central America' },
  { value: 'asia', label: 'Asia' },
]

const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can access and continue editing it.',
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
    description: 'Available in the shared Studio library.',
    icon: '🌐',
  },
]

const COVER_OPTIONS = ['🎮', '🧠', '🎧', '🛡️', '🚗', '🏆']
const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60]
const POINT_OPTIONS = [500, 750, 1000, 1500, 2000]

function getInitials(name) {
  const parts = String(name || 'Pulse Creator')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'P'

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function formatSavedTime(date) {
  if (!date) return ''

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
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
        <span>{active ? label : 'Off'}</span>

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
  const initialTeam = useMemo(() => {
    const savedTeam = String(user?.team || '').toLowerCase()

    return TEAM_OPTIONS.some((item) => item.value === savedTeam)
      ? savedTeam
      : 'global'
  }, [user])

  const [activeStep, setActiveStep] = useState(() => {
    const savedStep = Number(initialGame?.currentStep || 1)
    return Math.min(2, Math.max(1, savedStep))
  })

  const [form, setForm] = useState(() => ({
    title: initialGame?.title || '',
    description: initialGame?.description || '',
    language: initialGame?.language || 'en',
    team: initialGame?.team || initialTeam,
    visibility:
      initialGame?.visibility ||
      (role?.id === 'global' ? 'global' : 'team'),
    coverEmoji: initialGame?.coverEmoji || '🎮',
  }))

  const [settings, setSettings] = useState(() => ({
    defaultTimer: Number(initialGame?.defaultTimer || 30),
    pointsPerQuestion: Number(
      initialGame?.pointsPerQuestion || 1000
    ),
    randomizeQuestions: Boolean(
      initialGame?.randomizeQuestions
    ),
    randomizeAnswers: Boolean(initialGame?.randomizeAnswers),
    showExplanations: initialGame?.showExplanations !== false,
  }))

  const [gameId, setGameId] = useState(initialGame?.id || null)
  const [saving, setSaving] = useState(false)
  const [detailsDirty, setDetailsDirty] = useState(false)
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [error, setError] = useState('')

  const [savedAt, setSavedAt] = useState(() =>
    initialGame?.updatedAt
      ? new Date(initialGame.updatedAt)
      : null
  )

  const selectedLanguage =
    LANGUAGE_OPTIONS.find((item) => item.value === form.language) ||
    LANGUAGE_OPTIONS[0]

  const selectedTeam =
    TEAM_OPTIONS.find((item) => item.value === form.team) ||
    TEAM_OPTIONS[0]

  const selectedVisibility =
    VISIBILITY_OPTIONS.find(
      (item) => item.value === form.visibility
    ) || VISIBILITY_OPTIONS[0]

  const previewTitle = form.title.trim() || 'Untitled Game'
  const previewDescription =
    form.description.trim() ||
    'Your game description will appear here.'

  const activeDirty =
    activeStep === 1 ? detailsDirty : settingsDirty

  const canSaveDetails =
    form.title.trim().length >= 3 && !saving

  const canSaveSettings = Boolean(gameId) && !saving

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setDetailsDirty(true)
    setError('')
  }

  const updateSetting = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }))

    setSettingsDirty(true)
    setError('')
  }

  const createSavedGame = ({
    savedGameId,
    savedDate,
    currentStep,
  }) => ({
    ...initialGame,
    id: savedGameId,
    title: form.title.trim(),
    description: form.description.trim(),
    language: form.language,
    team: form.team,
    visibility: form.visibility,
    coverEmoji: form.coverEmoji,
    status: initialGame?.status || 'draft',
    currentStep,
    defaultTimer: settings.defaultTimer,
    pointsPerQuestion: settings.pointsPerQuestion,
    randomizeQuestions: settings.randomizeQuestions,
    randomizeAnswers: settings.randomizeAnswers,
    showExplanations: settings.showExplanations,
    playCount: initialGame?.playCount || 0,
    ownerName: user?.name || 'Pulse Creator',
    ownerRole: role?.id || user?.role,
    ownerTeam: user?.team || 'global',
    updatedAt: savedDate.toISOString(),
  })

  const saveDetails = async ({ continueToSettings = false } = {}) => {
    if (form.title.trim().length < 3) {
      setError('Add a game title with at least 3 characters.')
      return null
    }

    setSaving(true)
    setError('')

    try {
      const savedGameId = await saveStudioGameDraft({
        gameId,
        user,
        role,
        form,
      })

      const savedDate = new Date()
      const savedStep = continueToSettings
        ? 2
        : Math.max(Number(initialGame?.currentStep || 1), 1)

      const savedGame = createSavedGame({
        savedGameId,
        savedDate,
        currentStep: savedStep,
      })

      setGameId(savedGameId)
      setSavedAt(savedDate)
      setDetailsDirty(false)

      if (continueToSettings) {
        setActiveStep(2)
      }

      onSaved?.(savedGame)
      return savedGame
    } catch (saveError) {
      console.error(saveError)

      setError(
        saveError?.message || 'Could not save this draft.'
      )
      return null
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    if (!gameId) {
      setError('Save Game Details before saving Game Settings.')
      return null
    }

    setSaving(true)
    setError('')

    try {
      const savedGameId = await saveStudioGameSettings({
        gameId,
        user,
        role,
        settings,
      })

      const savedDate = new Date()
      const savedGame = createSavedGame({
        savedGameId,
        savedDate,
        currentStep: 2,
      })

      setSavedAt(savedDate)
      setSettingsDirty(false)
      onSaved?.(savedGame)

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

  const handleDetailsSubmit = async (event) => {
    event.preventDefault()
    await saveDetails({ continueToSettings: true })
  }

  const handleSettingsSubmit = async (event) => {
    event.preventDefault()
    await saveSettings()
  }

  const handleTopSave = async () => {
    if (activeStep === 1) {
      await saveDetails()
      return
    }

    await saveSettings()
  }

  const openBuilderStep = (stepNumber) => {
    if (stepNumber === 1) {
      setActiveStep(1)
      setError('')
      return
    }

    if (stepNumber === 2 && gameId) {
      if (detailsDirty) {
        setError(
          'Save your Game Details before opening Game Settings.'
        )
        return
      }

      setActiveStep(2)
      setError('')
    }
  }

  const getStepClassName = (stepNumber) => {
    const classes = ['studio-builder-progress-step']

    if (stepNumber === activeStep) {
      classes.push('studio-builder-progress-step--active')
    } else if (stepNumber < activeStep) {
      classes.push('studio-builder-progress-step--complete')
    } else if (stepNumber === 2 && gameId) {
      classes.push('studio-builder-progress-step--available')
    } else {
      classes.push('studio-builder-progress-step--locked')
    }

    return classes.join(' ')
  }

  const getStepStatus = (stepNumber) => {
    if (stepNumber === activeStep) return 'In progress'
    if (stepNumber < activeStep) return 'Completed'
    if (stepNumber === 2 && gameId) return 'Available'
    if (stepNumber === 2) return 'Save details first'
    return 'Coming next'
  }

  const renderDetailsStep = () => (
    <div className="studio-game-builder-layout">
      <form
        className="studio-game-details-form"
        onSubmit={handleDetailsSubmit}
      >
        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>01</span>

            <div>
              <h2>Basic Information</h2>
              <p>
                Give the game a recognizable name and explain what
                agents will practice.
              </p>
            </div>
          </div>

          <label className="studio-builder-field">
            <span>
              Game Title
              <small>{form.title.length}/90</small>
            </span>

            <input
              type="text"
              value={form.title}
              maxLength={90}
              placeholder="Example: Asia Invalid XFER Challenge"
              onChange={(event) =>
                updateField('title', event.target.value)
              }
            />
          </label>

          <label className="studio-builder-field">
            <span>
              Description
              <small>{form.description.length}/280</small>
            </span>

            <textarea
              value={form.description}
              maxLength={280}
              rows={5}
              placeholder="Explain what this game teaches and what agents should focus on."
              onChange={(event) =>
                updateField('description', event.target.value)
              }
            />
          </label>
        </section>

        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>02</span>

            <div>
              <h2>Language</h2>
              <p>Choose how questions and answers will be presented.</p>
            </div>
          </div>

          <div className="studio-builder-choice-grid studio-builder-language-grid">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  form.language === option.value ? 'active' : ''
                }
                onClick={() =>
                  updateField('language', option.value)
                }
              >
                <span>{option.icon}</span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>03</span>

            <div>
              <h2>Audience</h2>
              <p>Select the team and decide who can find the game.</p>
            </div>
          </div>

          <label className="studio-builder-field">
            <span>Target Team</span>

            <div className="studio-builder-select-wrap">
              <select
                value={form.team}
                onChange={(event) =>
                  updateField('team', event.target.value)
                }
              >
                {TEAM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <i>⌄</i>
            </div>
          </label>

          <div className="studio-builder-visibility-grid">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  form.visibility === option.value ? 'active' : ''
                }
                onClick={() =>
                  updateField('visibility', option.value)
                }
              >
                <span>{option.icon}</span>

                <div>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>04</span>

            <div>
              <h2>Game Icon</h2>
              <p>Choose a temporary identity for the library card.</p>
            </div>
          </div>

          <div className="studio-builder-cover-grid">
            {COVER_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={
                  form.coverEmoji === emoji ? 'active' : ''
                }
                onClick={() => updateField('coverEmoji', emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="studio-builder-message studio-builder-message--error">
            <span>!</span>
            {error}
          </div>
        )}

        {savedAt && !detailsDirty && !error && (
          <div className="studio-builder-message studio-builder-message--success">
            <span>✓</span>

            <div>
              <strong>Draft saved</strong>
              <small>
                Game ID: {gameId?.slice(0, 8).toUpperCase()}
              </small>
            </div>
          </div>
        )}

        <footer className="studio-builder-form-footer">
          <div>
            <span>Next step</span>
            <strong>Game Settings</strong>
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
              disabled={!canSaveDetails}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </footer>
      </form>

      <aside className="studio-game-preview-column">
        <div className="studio-game-preview-sticky">
          <span className="studio-section-eyebrow">Live Preview</span>
          <h2>Library Card</h2>

          <article className="studio-game-preview-card">
            <div className="studio-game-preview-cover">
              <span>{form.coverEmoji}</span>
              <i>Draft</i>
            </div>

            <div className="studio-game-preview-body">
              <div className="studio-game-preview-chips">
                <span>
                  {selectedLanguage.icon} {selectedLanguage.label}
                </span>
                <span>{selectedTeam.label}</span>
              </div>

              <h3>{previewTitle}</h3>
              <p>{previewDescription}</p>

              <div className="studio-game-preview-visibility">
                <span>{selectedVisibility.icon}</span>

                <div>
                  <strong>{selectedVisibility.label}</strong>
                  <small>
                    {form.visibility === 'team'
                      ? selectedTeam.label
                      : selectedVisibility.description}
                  </small>
                </div>
              </div>

              <div className="studio-game-preview-author">
                <div
                  className={`studio-author-avatar studio-author-avatar--${role.id}`}
                >
                  <span>{getInitials(user?.name)}</span>
                  <i />
                </div>

                <div>
                  <span>Created by</span>
                  <strong>{user?.name || 'Pulse Creator'}</strong>
                  <small>{teamLabel}</small>
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
              Save the game details to unlock timer, scoring and
              behavior settings.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )

  const renderSettingsStep = () => (
    <div className="studio-game-builder-layout">
      <form
        className="studio-game-details-form"
        onSubmit={handleSettingsSubmit}
      >
        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>01</span>

            <div>
              <h2>Default Timer</h2>
              <p>
                Choose how many seconds agents receive for each
                question.
              </p>
            </div>
          </div>

          <div className="studio-builder-number-grid studio-builder-timer-grid">
            {TIMER_OPTIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                className={
                  settings.defaultTimer === seconds ? 'active' : ''
                }
                onClick={() =>
                  updateSetting('defaultTimer', seconds)
                }
              >
                <strong>{seconds}</strong>
                <small>seconds</small>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>02</span>

            <div>
              <h2>Points per Question</h2>
              <p>
                Set the base score awarded for every correct answer.
              </p>
            </div>
          </div>

          <div className="studio-builder-number-grid studio-builder-points-grid">
            {POINT_OPTIONS.map((points) => (
              <button
                key={points}
                type="button"
                className={
                  settings.pointsPerQuestion === points
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  updateSetting('pointsPerQuestion', points)
                }
              >
                <strong>{points.toLocaleString('en-US')}</strong>
                <small>points</small>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-builder-form-section">
          <div className="studio-builder-form-heading">
            <span>03</span>

            <div>
              <h2>Game Behavior</h2>
              <p>
                Control how questions, answers and explanations appear
                during a live game.
              </p>
            </div>
          </div>

          <div className="studio-builder-settings-list">
            <ToggleSetting
              active={settings.randomizeQuestions}
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
              active={settings.randomizeAnswers}
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
              active={settings.showExplanations}
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

        {error && (
          <div className="studio-builder-message studio-builder-message--error">
            <span>!</span>
            {error}
          </div>
        )}

        {savedAt && !settingsDirty && !error && (
          <div className="studio-builder-message studio-builder-message--success">
            <span>✓</span>

            <div>
              <strong>Game settings saved</strong>
              <small>
                This draft is now at Step 2 of 5.
              </small>
            </div>
          </div>
        )}

        <footer className="studio-builder-form-footer">
          <div>
            <span>Next step</span>
            <strong>Questions — coming next</strong>
          </div>

          <div>
            <button
              type="button"
              className="studio-builder-footer-secondary"
              onClick={() => openBuilderStep(1)}
            >
              Back to Details
            </button>

            <button
              type="submit"
              className="studio-builder-footer-primary"
              disabled={!canSaveSettings}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </footer>
      </form>

      <aside className="studio-game-preview-column">
        <div className="studio-game-preview-sticky">
          <span className="studio-section-eyebrow">
            Live Configuration
          </span>
          <h2>Game Setup</h2>

          <article className="studio-settings-preview-card">
            <header>
              <div>{form.coverEmoji}</div>

              <div>
                <span>Draft configuration</span>
                <h3>{previewTitle}</h3>
                <small>{selectedTeam.label}</small>
              </div>
            </header>

            <div className="studio-settings-preview-metrics">
              <article>
                <span>Default timer</span>
                <strong>{settings.defaultTimer}s</strong>
              </article>

              <article>
                <span>Correct answer</span>
                <strong>
                  {settings.pointsPerQuestion.toLocaleString('en-US')}
                </strong>
              </article>
            </div>

            <div className="studio-settings-preview-behavior">
              <div>
                <span>Random questions</span>
                <strong>
                  {settings.randomizeQuestions ? 'Enabled' : 'Disabled'}
                </strong>
              </div>

              <div>
                <span>Random answers</span>
                <strong>
                  {settings.randomizeAnswers ? 'Enabled' : 'Disabled'}
                </strong>
              </div>

              <div>
                <span>Answer explanations</span>
                <strong>
                  {settings.showExplanations ? 'Enabled' : 'Disabled'}
                </strong>
              </div>
            </div>
          </article>

          <div className="studio-game-preview-note">
            <span>02</span>
            <p>
              Saving these settings updates the same Studio game and
              moves its progress to Step 2 of 5.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )

  const headerTitle =
    activeStep === 1 ? 'Game Details' : 'Game Settings'

  const headerDescription =
    activeStep === 1
      ? 'Create the identity of your game before adding settings and questions.'
      : 'Control timing, scoring and game behavior before adding questions.'

  const topButtonDisabled =
    activeStep === 1 ? !canSaveDetails : !canSaveSettings

  const topButtonLabel = saving
    ? 'Saving...'
    : activeStep === 1
      ? gameId
        ? 'Save Changes'
        : 'Save Draft'
      : 'Save Settings'

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
            Game Builder · Step {activeStep} of 5
          </span>

          <h1>{headerTitle}</h1>
          <p>{headerDescription}</p>
        </div>

        <div className="studio-game-builder-header-actions">
          <div
            className={`studio-draft-state ${
              activeDirty ? 'studio-draft-state--unsaved' : ''
            }`}
          >
            <i />

            {saving
              ? 'Saving...'
              : activeDirty
                ? 'Unsaved changes'
                : savedAt
                  ? `Saved ${formatSavedTime(savedAt)}`
                  : 'New draft'}
          </div>

          <button
            type="button"
            className="studio-builder-save-top"
            disabled={topButtonDisabled}
            onClick={handleTopSave}
          >
            {topButtonLabel}
          </button>
        </div>
      </header>

      <nav className="studio-builder-progress">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isClickable =
            stepNumber === 1 || (stepNumber === 2 && Boolean(gameId))

          return (
            <button
              key={step.number}
              type="button"
              className={getStepClassName(stepNumber)}
              disabled={!isClickable}
              onClick={() => openBuilderStep(stepNumber)}
            >
              <span>{step.number}</span>

              <div>
                <strong>{step.title}</strong>
                <small>{getStepStatus(stepNumber)}</small>
              </div>
            </button>
          )
        })}
      </nav>

      {activeStep === 1
        ? renderDetailsStep()
        : renderSettingsStep()}
    </section>
  )
}

