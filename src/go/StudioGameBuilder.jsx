import { useMemo, useState } from 'react'
import { saveStudioGameDraft } from './studioGamesApi'
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

function getInitials(name) {
  const parts = String(name || 'Pulse Creator')
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

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
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
    const savedTeam = String(
      user?.team || ''
    ).toLowerCase()

    const exists = TEAM_OPTIONS.some(
      (item) => item.value === savedTeam
    )

    return exists ? savedTeam : 'global'
  }, [user])

const [form, setForm] = useState(() => ({
  title: initialGame?.title || '',

  description:
    initialGame?.description || '',

  language:
    initialGame?.language || 'en',

  team:
    initialGame?.team || initialTeam,

  visibility:
    initialGame?.visibility ||
    (role?.id === 'global'
      ? 'global'
      : 'team'),

  coverEmoji:
    initialGame?.coverEmoji || '🎮',
}))

const [gameId, setGameId] = useState(
  initialGame?.id || null
)

const [saving, setSaving] = useState(false)
const [dirty, setDirty] = useState(false)
const [error, setError] = useState('')

const [savedAt, setSavedAt] = useState(
  () =>
    initialGame?.updatedAt
      ? new Date(initialGame.updatedAt)
      : null
)

  const selectedLanguage =
    LANGUAGE_OPTIONS.find(
      (item) => item.value === form.language
    ) || LANGUAGE_OPTIONS[0]

  const selectedTeam =
    TEAM_OPTIONS.find(
      (item) => item.value === form.team
    ) || TEAM_OPTIONS[0]

  const selectedVisibility =
    VISIBILITY_OPTIONS.find(
      (item) =>
        item.value === form.visibility
    ) || VISIBILITY_OPTIONS[0]

  const previewTitle =
    form.title.trim() || 'Untitled Game'

  const previewDescription =
    form.description.trim() ||
    'Your game description will appear here.'

  const canSave =
    form.title.trim().length >= 3 &&
    !saving

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setDirty(true)
    setError('')
  }

  const handleSaveDraft = async (event) => {
    event?.preventDefault()

    if (form.title.trim().length < 3) {
      setError(
        'Add a game title with at least 3 characters.'
      )
      return
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

const savedDate = new Date()

const savedGame = {
  ...initialGame,

  id: savedGameId,

  title: form.title.trim(),
  description: form.description.trim(),

  language: form.language,
  team: form.team,
  visibility: form.visibility,
  coverEmoji: form.coverEmoji,

  status:
    initialGame?.status || 'draft',

  currentStep:
    initialGame?.currentStep || 1,

  playCount:
    initialGame?.playCount || 0,

  ownerName:
    user?.name || 'Pulse Creator',

  ownerRole:
    role?.id || user?.role,

  ownerTeam:
    user?.team || 'global',

  updatedAt: savedDate.toISOString(),
}

setGameId(savedGameId)
setSavedAt(savedDate)
setDirty(false)

onSaved?.(savedGame)
    } catch (saveError) {
      console.error(saveError)

      setError(
        saveError?.message ||
          'Could not save this draft.'
      )
    } finally {
      setSaving(false)
    }
  }

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
            Game Builder · Step 1 of 5
          </span>

          <h1>Game Details</h1>

          <p>
            Create the identity of your game before
            adding settings and questions.
          </p>
        </div>

        <div className="studio-game-builder-header-actions">
          <div
            className={`studio-draft-state ${
              dirty
                ? 'studio-draft-state--unsaved'
                : ''
            }`}
          >
            <i />

            {saving
              ? 'Saving...'
              : dirty
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
            disabled={!canSave}
            onClick={handleSaveDraft}
          >
            {saving
              ? 'Saving...'
              : gameId
                ? 'Save Changes'
                : 'Save Draft'}
          </button>
        </div>
      </header>

      <nav className="studio-builder-progress">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`studio-builder-progress-step ${
              index === 0
                ? 'studio-builder-progress-step--active'
                : 'studio-builder-progress-step--locked'
            }`}
          >
            <span>{step.number}</span>

            <div>
              <strong>{step.title}</strong>
              <small>
                {index === 0
                  ? 'In progress'
                  : 'Coming next'}
              </small>
            </div>
          </div>
        ))}
      </nav>

      <div className="studio-game-builder-layout">
        <form
          className="studio-game-details-form"
          onSubmit={handleSaveDraft}
        >
          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>01</span>

              <div>
                <h2>Basic Information</h2>
                <p>
                  Give the game a recognizable name
                  and explain what agents will practice.
                </p>
              </div>
            </div>

            <label className="studio-builder-field">
              <span>
                Game Title
                <small>
                  {form.title.length}/90
                </small>
              </span>

              <input
                type="text"
                value={form.title}
                maxLength={90}
                placeholder="Example: Asia Invalid XFER Challenge"
                onChange={(event) =>
                  updateField(
                    'title',
                    event.target.value
                  )
                }
              />
            </label>

            <label className="studio-builder-field">
              <span>
                Description
                <small>
                  {form.description.length}/280
                </small>
              </span>

              <textarea
                value={form.description}
                maxLength={280}
                rows={5}
                placeholder="Explain what this game teaches and what agents should focus on."
                onChange={(event) =>
                  updateField(
                    'description',
                    event.target.value
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
                  Choose how questions and answers
                  will be presented.
                </p>
              </div>
            </div>

            <div className="studio-builder-choice-grid studio-builder-language-grid">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    form.language === option.value
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
                  <span>{option.icon}</span>

                  <strong>{option.label}</strong>
                  <small>
                    {option.description}
                  </small>
                </button>
              ))}
            </div>
          </section>

          <section className="studio-builder-form-section">
            <div className="studio-builder-form-heading">
              <span>03</span>

              <div>
                <h2>Audience</h2>
                <p>
                  Select the team and decide who can
                  find the game.
                </p>
              </div>
            </div>

            <label className="studio-builder-field">
              <span>Target Team</span>

              <div className="studio-builder-select-wrap">
                <select
                  value={form.team}
                  onChange={(event) =>
                    updateField(
                      'team',
                      event.target.value
                    )
                  }
                >
                  {TEAM_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
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
                    form.visibility === option.value
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
                  <span>{option.icon}</span>

                  <div>
                    <strong>
                      {option.label}
                    </strong>

                    <small>
                      {option.description}
                    </small>
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
                <p>
                  Choose a temporary identity for the
                  library card.
                </p>
              </div>
            </div>

            <div className="studio-builder-cover-grid">
              {COVER_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={
                    form.coverEmoji === emoji
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
              ))}
            </div>
          </section>

          {error && (
            <div className="studio-builder-message studio-builder-message--error">
              <span>!</span>
              {error}
            </div>
          )}

          {savedAt && !dirty && !error && (
            <div className="studio-builder-message studio-builder-message--success">
              <span>✓</span>

              <div>
                <strong>Draft saved</strong>

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
                disabled={!canSave}
              >
                {saving
                  ? 'Saving...'
                  : gameId
                    ? 'Save Changes'
                    : 'Save Draft'}
              </button>
            </div>
          </footer>
        </form>

        <aside className="studio-game-preview-column">
          <div className="studio-game-preview-sticky">
            <span className="studio-section-eyebrow">
              Live Preview
            </span>

            <h2>Library Card</h2>

            <article className="studio-game-preview-card">
              <div className="studio-game-preview-cover">
                <span>{form.coverEmoji}</span>
                <i>Draft</i>
              </div>

              <div className="studio-game-preview-body">
                <div className="studio-game-preview-chips">
                  <span>
                    {selectedLanguage.icon}{' '}
                    {selectedLanguage.label}
                  </span>

                  <span>
                    {selectedTeam.label}
                  </span>
                </div>

                <h3>{previewTitle}</h3>

                <p>{previewDescription}</p>

                <div className="studio-game-preview-visibility">
                  <span>
                    {selectedVisibility.icon}
                  </span>

                  <div>
                    <strong>
                      {selectedVisibility.label}
                    </strong>

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
                    <span>
                      {getInitials(user?.name)}
                    </span>
                    <i />
                  </div>

                  <div>
                    <span>Created by</span>

                    <strong>
                      {user?.name ||
                        'Pulse Creator'}
                    </strong>

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
                Questions, timer and scoring will be
                added during the next Builder steps.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}