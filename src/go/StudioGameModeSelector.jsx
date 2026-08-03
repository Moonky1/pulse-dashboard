import {
  STUDIO_GAME_MODES,
} from './studioGameModes'
import './StudioGameModeSelector.css'

export default function StudioGameModeSelector({
  onSelect,
  onExit,
}) {
  return (
    <section className="studio-mode-selector">
      <header className="studio-mode-selector-header">
        <div>
          <button
            type="button"
            className="studio-mode-selector-back"
            onClick={onExit}
          >
            ← Overview
          </button>

          <span className="studio-section-eyebrow">
            Create a Game
          </span>

          <h1>Choose a Game Mode</h1>

          <p>
            Select how agents will play. Classic Quiz is
            available now and keeps the original Pulse GO
            format with exactly 10 questions.
          </p>
        </div>

        <div className="studio-mode-selector-summary">
          <span>Available now</span>
          <strong>Classic Quiz</strong>
          <small>
            10 questions · Optional Lives Mode
          </small>
        </div>
      </header>

      <div className="studio-mode-selector-grid">
        {STUDIO_GAME_MODES.map((gameMode) => (
          <article
            key={gameMode.id}
            className={`studio-mode-card ${
              gameMode.enabled
                ? 'studio-mode-card--available'
                : 'studio-mode-card--locked'
            }`}
          >
            <div className="studio-mode-card-top">
              <div className="studio-mode-card-visual">
                {gameMode.image ? (
                  <img
                    src={gameMode.image}
                    alt=""
                    aria-hidden="true"
                  />
                ) : (
                  <span>{gameMode.icon}</span>
                )}
              </div>

              <span
                className={`studio-mode-card-badge ${
                  gameMode.enabled
                    ? 'studio-mode-card-badge--available'
                    : ''
                }`}
              >
                {gameMode.badge}
              </span>
            </div>

            <div className="studio-mode-card-copy">
              <h2>{gameMode.title}</h2>
              <p>{gameMode.description}</p>
            </div>

            {gameMode.features && (
              <div className="studio-mode-card-features">
                {gameMode.features.map((feature) => (
                  <span key={feature}>
                    <i>✓</i>
                    {feature}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={!gameMode.enabled}
              onClick={() => onSelect(gameMode.id)}
            >
              {gameMode.enabled
                ? 'Create Classic Quiz →'
                : 'Coming Soon'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
